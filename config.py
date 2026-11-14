"""Shared settings. Edit these to match how YOUR model was trained."""

IMG_SIZE = 224                      # input resolution used in training
CLASS_NAMES = [                     # replace with your model's actual classes
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative",
]
# Normalization used in training. Keras "/255" only -> mean 0, std 1 below.
# If you trained with ImageNet normalization, use the commented values.
MEAN = (0.0, 0.0, 0.0)              # (0.485, 0.456, 0.406)
STD = (1.0, 1.0, 1.0)               # (0.229, 0.224, 0.225)

KERAS_MODEL = "model.h5"            # or model.keras
TORCH_WEIGHTS = "model.pth"
TFLITE_MODEL = "model.tflite"
ONNX_MODEL = "model.onnx"
ONNX_INT8_MODEL = "model_int8.onnx"
CALIB_DIR = "calib_images"          # ~100 representative retina images
