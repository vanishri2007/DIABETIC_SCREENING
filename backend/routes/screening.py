from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from backend.database import db
from datetime import datetime
from bson import ObjectId
import shutil
import os
from ai_model.predict import run_prediction
from ai_model.quality import assess_image_quality

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/predict")
async def predict_image(
    patient_id: str = Form(...),
    file: UploadFile = File(...)
):
    # Verify patient exists
    try:
        obj_id = ObjectId(patient_id)
        patient = await db.patients.find_one({"_id": obj_id})
        if not patient:
             raise HTTPException(status_code=404, detail="Patient not found")
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid patient ID")
         
    # Save uploaded image
    file_extension = os.path.splitext(file.filename)[1]
    save_filename = f"{patient_id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, save_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Check image quality using actual module
    quality = assess_image_quality(file_path)
    if not quality.get("acceptable", True):
         raise HTTPException(status_code=400, detail=f"Image Quality Assessment Failed: {quality.get('reason', 'Poor quality')}. Please re-upload.")
         
    # Call actual AI Module here
    prediction_result = run_prediction(file_path)
    
    priority = prediction_result["prediction"]
        
    await db.patients.update_one(
        {"_id": obj_id},
        {"$set": {"triage_status": priority}}
    )
    
    record = {
        "patient_id": patient_id,
        "image_path": file_path,
        "prediction": prediction_result["prediction"],
        "confidence": prediction_result["confidence"],
        "heatmap_url": prediction_result["heatmap_url"],
        "secondary_findings": prediction_result.get("secondary_findings", "None"),
        "affected_area": prediction_result.get("affected_area", "N/A"),
        "status": priority,
        "timestamp": datetime.utcnow()
    }
    await db.screenings.insert_one(record)
    
    # Must convert ObjectId to string for FastAPI to serialize it to JSON
    if "_id" in record:
        record["_id"] = str(record["_id"])
        
    return {"message": "Prediction successful", "result": record}

@router.get("/history/{patient_id}")
async def get_patient_history(patient_id: str):
    history = []
    cursor = db.screenings.find({"patient_id": patient_id})
    async for document in cursor:
         document["_id"] = str(document["_id"])
         history.append(document)
    # Sort history latest first
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return history
