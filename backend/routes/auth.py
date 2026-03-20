from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.models import UserCreate, User, UserRole
from backend.database import db
from backend.auth import get_password_hash, verify_password, create_access_token
from bson import ObjectId

router = APIRouter()

class LoginData(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

@router.post("/register", response_model=User)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
         raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    result = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    return created_user

@router.post("/login", response_model=Token)
async def login(login_data: LoginData):
    db_user = await db.users.find_one({"username": login_data.username})
    if not db_user:
         raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    if not verify_password(login_data.password, db_user["password"]):
         raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": db_user["username"], "role": db_user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": db_user["role"]}
