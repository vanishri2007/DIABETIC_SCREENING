from fastapi import APIRouter, HTTPException, Depends
from backend.models import PatientCreate, PatientRecord
from backend.database import db
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel

class MedicineReminder(BaseModel):
    time: str
    medicine: str
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

@router.post("/", response_model=PatientRecord)
async def register_patient(patient: PatientCreate):
    patient_dict = patient.dict()
    patient_dict["registered_at"] = datetime.utcnow()
    patient_dict["triage_status"] = "Pending"
    patient_dict["assigned_doctor_id"] = None
    
    result = await db.patients.insert_one(patient_dict)
    created_patient = await db.patients.find_one({"_id": result.inserted_id})
    created_patient["_id"] = str(created_patient["_id"])
    return created_patient

@router.get("/", response_model=list[PatientRecord])
async def get_patients():
    patients = []
    cursor = db.patients.find({})
    async for document in cursor:
         document["_id"] = str(document["_id"])
         patients.append(document)
    return patients

@router.get("/{patient_id}", response_model=PatientRecord)
async def get_patient(patient_id: str):
    try:
        obj_id = ObjectId(patient_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
        
    patient = await db.patients.find_one({"_id": obj_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient["_id"] = str(patient["_id"])
    return patient

@router.get("/{patient_id}/reminders")
async def get_reminders(patient_id: str):
    obj_id = ObjectId(patient_id)
    pat = await db.patients.find_one({"_id": obj_id})
    if pat:
        return pat.get("reminders", [])
    raise HTTPException(status_code=404, detail="Patient not found")

@router.post("/{patient_id}/reminders")
async def add_reminder(patient_id: str, reminder: MedicineReminder):
    obj_id = ObjectId(patient_id)
    pat = await db.patients.find_one({"_id": obj_id})
    if pat:
        reminders = pat.get("reminders", [])
        new_rem = reminder.dict()
        new_rem["id"] = int(datetime.utcnow().timestamp())
        reminders.append(new_rem)
        await db.patients.update_one({"_id": obj_id}, {"$set": {"reminders": reminders}})
        return {"status": "success", "reminders": reminders}
    raise HTTPException(status_code=404, detail="Patient not found")

