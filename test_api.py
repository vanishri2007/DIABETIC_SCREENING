import requests
import json

# 1. Create patient
r1 = requests.post('http://https://diabetic-screening.onrender.com/patients/', json={'name':'Test','age':55,'diabetes_duration_years':1,'contact':'1'})
print("Patient result:", r1.text)
pid = r1.json().get('_id')

# 2. Dummy PNG
img_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x05\x00\x00\x00\x05\x08\x02\x00\x00\x00\x02\r\xb1\xb2\x00\x00\x00\x1fIDAT\x08\x1d\x01\r\x00\xf2\xff\xff\x00\x00\xff\x00\x00\xff\x00\x00\xff\x00\x00\xff\x00\x00\x0b\x0f\x03\xf1&\xa8\xc3\xbc\x00\x00\x00\x00IEND\xaeB`\x82'
with open('test_retina.png', 'wb') as f:
    f.write(img_data)

r2 = requests.post('http://https://diabetic-screening.onrender.com/screening/predict', data={'patient_id': pid}, files={'file': open('test_retina.png', 'rb')})
print("Screening result:", r2.status_code)
print(r2.text)
