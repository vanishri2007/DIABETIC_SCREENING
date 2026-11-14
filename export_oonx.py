"""PyTorch -> ONNX (+ optional INT8) for Raspberry Pi."""
import torch
import config as C

# TODO: import and build YOUR architecture here
# from model_def import YourModel
# model = YourModel(num_classes=len(C.CLASS_NAMES))
raise SystemExit("Edit export_onnx.py: import your model class first.")

model.load_state_dict(torch.load(C.TORCH_WEIGHTS, map_location="cpu"))
model.eval()

dummy = torch.randn(1, 3, C.IMG_SIZE, C.IMG_SIZE)
torch.onnx.export(
    model, dummy, C.ONNX_MODEL,
    input_names=["input"], output_names=["logits"],
    dynamic_axes={"input": {0: "batch"}},
    opset_version=17,
)
print(f"Saved {C.ONNX_MODEL}")

try:
    from onnxruntime.quantization import quantize_dynamic, QuantType
    quantize_dynamic(C.ONNX_MODEL, C.ONNX_INT8_MODEL, weight_type=QuantType.QUInt8)
    print(f"Saved {C.ONNX_INT8_MODEL}")
except Exception as e:
    print("Skipped INT8 quantization:", e)
