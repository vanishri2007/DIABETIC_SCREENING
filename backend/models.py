from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    PATIENT = "patient"

class UserBase(BaseModel):
    username: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")

class PatientData(BaseModel):
    name: str
    age: int
    diabetes_duration_years: int
    contact: str
    symptoms: Optional[str] = None
    vision_test_result: Optional[str] = None
    bp: Optional[str] = None

class PatientCreate(PatientData):
    pass

class PatientRecord(PatientData):
    id: str = Field(alias="_id")
    registered_at: datetime
    triage_status: str = "Pending"
    assigned_doctor_id: Optional[str] = None
