import urllib.request
import urllib.error
import urllib.parse
import json

# 1. Register
req = urllib.request.Request('http://localhost:8000/patients/', data=json.dumps({"name":"x","age":30,"contact":"y","diabetes_duration_years":1}).encode('utf-8'), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
pid = json.loads(res.read())['_id']

# 2. Upload file manually bypassing multipart/form-data complexity (actually multipart in urllib is hard)
# Instead, let's write a python script that imports the app and calls the router directly avoiding HTTP!
import asyncio
from backend.routes.screening import predict_image
from fastapi import UploadFile
from starlette.datastructures import UploadFile as StarletteUploadFile
import io

async def test():
    class DummyFile:
        def __init__(self):
            self.filename = "test.jpg"
            self.file = io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x02\x01\x01\x01\x01\x01\x02\x01\x01\x01\x02\x02\x02\x02\x02\x04\x03\x02\x02\x02\x02\x05\x04\x04\x03\x04\x06\x05\x06\x06\x06\x05\x06\x06\x06\x07\x09\x08\x06\x07\x09\x07\x06\x06\x08\x0b\x08\t\n\n\n\n\n\x06\x08\x0b\x0c\x0b\n\x0c\t\n\n\n\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\\')
    
    file_obj = StarletteUploadFile(filename="test.jpg", file=DummyFile().file)
    try:
        res = await predict_image(patient_id=pid, file=file_obj)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
