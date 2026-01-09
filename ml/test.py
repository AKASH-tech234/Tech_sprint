import tensorflow as tf
import numpy as np
import cv2

model = tf.keras.models.load_model("model/civic_classifier.h5")

img = cv2.imread("test.jpg")
img = cv2.resize(img, (128,128))
img = img / 255.0
img = np.expand_dims(img, axis=0)

pred = model.predict(img)
print(pred.argmax())
