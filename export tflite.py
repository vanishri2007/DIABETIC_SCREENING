"""Keras -> TFLite (INT8-quantized weights) for Raspberry Pi."""
import glob
import numpy as np
import tensorflow as tf
import config as C

model = tf.keras.models.load_model(C.KERAS_MODEL)


def representative_data():
    paths = sorted(glob.glob(f"{C.CALIB_DIR}/*"))[:100]
    for p in paths:
        img = tf.keras.utils.load_img(p, target_size=(C.IMG_SIZE, C.IMG_SIZE))
        arr = tf.keras.utils.img_to_array(img)[None] / 255.0
        yield [arr.astype(np.float32)]


converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data

with open(C.TFLITE_MODEL, "wb") as f:
    f.write(converter.convert())
print(f"Saved {C.TFLITE_MODEL}")
