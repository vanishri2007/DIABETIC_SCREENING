"""Run inference on a retina image with a TFLite or ONNX model.

Usage:
    python infer.py path/to/retina.png            # auto-picks model
    python infer.py path/to/retina.png --backend onnx
"""
import argparse
import os
import numpy as np
from PIL import Image
import config as C


def preprocess(path):
    img = Image.open(path).convert("RGB").resize((C.IMG_SIZE, C.IMG_SIZE))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - np.array(C.MEAN, dtype=np.float32)) / np.array(C.STD, dtype=np.float32)
    return arr[None]  # NHWC


def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


def run_tflite(path):
    try:
        from tflite_runtime.interpreter import Interpreter
    except ImportError:
        from tensorflow.lite import Interpreter
    it = Interpreter(model_path=C.TFLITE_MODEL)
    it.allocate_tensors()
    inp, out = it.get_input_details()[0], it.get_output_details()[0]
    it.set_tensor(inp["index"], preprocess(path))
    it.invoke()
    return it.get_tensor(out["index"])[0]


def run_onnx(path):
    import onnxruntime as ort
    model = C.ONNX_INT8_MODEL if os.path.exists(C.ONNX_INT8_MODEL) else C.ONNX_MODEL
    sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    x = preprocess(path).transpose(0, 3, 1, 2)  # NCHW
    return sess.run(None, {"input": x})[0][0]


def predict(path, backend=None):
    if backend is None:
        backend = "tflite" if os.path.exists(C.TFLITE_MODEL) else "onnx"
    raw = run_tflite(path) if backend == "tflite" else run_onnx(path)
    # If your model already outputs probabilities, skip softmax.
    probs = raw if np.isclose(raw.sum(), 1.0, atol=1e-3) else softmax(raw)
    idx = int(np.argmax(probs))
    return {"label": C.CLASS_NAMES[idx], "class_index": idx,
            "confidence": float(probs[idx]), "backend": backend}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--backend", choices=["tflite", "onnx"])
    args = ap.parse_args()
    print(predict(args.image, args.backend))
