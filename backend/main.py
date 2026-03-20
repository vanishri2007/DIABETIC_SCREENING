import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import auth, patients, screening
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="AI Diabetic Retinopathy Screening API")

# Mount static files for heatmaps
os.makedirs("uploads/heatmaps", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(screening.router, prefix="/screening", tags=["screening"])

from pydantic import BaseModel
class ChatMessage(BaseModel):
    message: str
    language: str = "en"

@app.post("/chatbot/")
async def chatbot_response(chat: ChatMessage):
    msg = chat.message.lower()
    
    if chat.language == "ta":
        if any(w in msg for w in ["மருந்து", "மாத்திரை", "சிகிச்சை"]):
            return {"response": "நீரிழிவு விழித்திரை நோய்க்கு (DR) Anti-VEGF ஊசிகள் அல்லது லேசர் சிகிச்சை சிறந்த பரிந்துரையாகும்."}
        elif any(w in msg for w in ["உணவு", "சர்க்கரை", "டயட்"]):
            return {"response": "உங்கள் இரத்த சர்க்கரை அளவை கட்டுக்குள் வைத்திருப்பது மிக முக்கியம். இனிப்புகளை தவிர்த்து, நார்சத்து அதிகம் உள்ள உணவுகளை உண்ணுங்கள்."}
        elif any(w in msg for w in ["பார்வை", "மங்கல்", "கண்"]):
            return {"response": "பார்வை மங்குதல் DR-இன் முக்கிய அறிகுறியாகும். உடனடியாக ஒரு கண் மருத்துவரை அணுகுவது பார்வை இழப்பை தடுக்கும்."}
        elif any(w in msg for w in ["லேசர்", "அறுவை"]):
            return {"response": "லேசர் சிகிச்சை (Photocoagulation) விழித்திரையில் ஏற்படும் ரத்தக்கசிவை தடுத்து பார்வையைக் காப்பாற்றும் பாதுகாப்பான முறையாகும்."}
        else:
            return {"response": "வணக்கம்! நான் உங்கள் AI சுகாதார உதவியாளர். நீரிழிவு மற்றும் கண் சம்பந்தப்பட்ட உங்கள் சந்தேகங்களை என்னிடம் கேட்கலாம்."}
        
    # English responses
    if any(w in msg for w in ["what is", "meaning", "definition", "explain"]):
        return {"response": "Diabetic Retinopathy (DR) is an eye condition that can cause vision loss and blindness in people who have diabetes. It affects blood vessels in the retina."}
    elif any(w in msg for w in ["diet", "food", "eat", "sugar"]):
        return {"response": "Diet plays a critical role. Maintain strict glycemic control by avoiding refined sugars, carbohydrates, and highly processed foods. Eat leafy greens and proteins."}
    elif any(w in msg for w in ["medicine", "suggest", "pill", "treatment", "drug", "cure"]):
        return {"response": "For Diabetic Retinopathy, common clinical treatments include Anti-VEGF injections (like Aflibercept), Corticosteroids, or focal laser photocoagulation to stop vessel bleeding."}
    elif any(w in msg for w in ["laser", "surgery", "operation"]):
        return {"response": "Laser photocoagulation is a highly effective procedure used to seal leaking blood vessels and slow the leakage of fluid, significantly reducing the risk of severe vision loss."}
    elif any(w in msg for w in ["blur", "blind", "vision", "see", "eye"]):
        return {"response": "Blurry vision is a major warning sign of Diabetic Macular Edema (DME) or bleeding. Immediate clinical review is heavily advised to prevent permanent damage."}
    elif any(w in msg for w in ["report", "history", "checkup"]):
        return {"response": "I see you have reports in your history. Depending on your latest AI severity score, make sure you strictly follow the Automated Screening Schedule on your dashboard."}
    elif any(w in msg for w in ["hello", "hi "]):
        return {"response": "Hello there! I am your Voice AI Health Assistant. Ask me anything about diabetic retinopathy guidelines, symptoms, or treatments!"}
        
    return {"response": "I am logging that information. Remember to prioritize regular check-ups based on your AI Screening Schedule. Do you have any specific questions about your DR prognosis?"}

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Diabetic Retinopathy Screening API"}
