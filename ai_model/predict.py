import time
import random
import cv2
import numpy as np
import os

def run_prediction(image_path: str):
    """
    Simulates EfficientNet inference and generates a Grad-CAM heatmap.
    """
    time.sleep(1.0) # Simulate inference
    classes = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "🚨 Proliferative DR"]
    
    prediction_idx = random.choices([0, 1, 2, 3, 4], weights=[0.25, 0.20, 0.20, 0.20, 0.15], k=1)[0]
    prediction = classes[prediction_idx]
    confidence = round(random.uniform(0.75, 0.99), 2)
    
    # Generate Heatmap Overlay
    original = cv2.imread(image_path)
    if original is None:
        raise ValueError("Invalid image file for prediction")
        
    if len(original.shape) == 3 and original.shape[2] == 4:
        original = cv2.cvtColor(original, cv2.COLOR_BGRA2BGR)
    elif len(original.shape) == 2:
        original = cv2.cvtColor(original, cv2.COLOR_GRAY2BGR)
        
    # Create a dummy "activation" map focuses on random spots
    act_map = np.zeros((original.shape[0], original.shape[1]), dtype=np.float32)
    center_x = random.randint(int(original.shape[1]*0.3), int(original.shape[1]*0.7))
    center_y = random.randint(int(original.shape[0]*0.3), int(original.shape[0]*0.7))
    cv2.circle(act_map, (center_x, center_y), radius=int(min(original.shape[:2])*0.2), color=1.0, thickness=-1)
    act_map = cv2.GaussianBlur(act_map, (99, 99), 50)
    
    # Normalize and convert to colored heatmap
    act_map = np.uint8(255 * act_map)
    heatmap = cv2.applyColorMap(act_map, cv2.COLORMAP_JET)
    
    # Superimpose the heatmap onto original image
    superimposed = cv2.addWeighted(heatmap, 0.4, original, 0.6, 0)
    
    basename = os.path.basename(image_path)
    heatmap_filename = f"heatmap_{basename}"
    
    # Ensure directory exists
    os.makedirs(os.path.join("uploads", "heatmaps"), exist_ok=True)
    heatmap_path = os.path.join("uploads", "heatmaps", heatmap_filename)
    
    cv2.imwrite(heatmap_path, superimposed)
    
    return {
        "prediction": prediction,
        "confidence": confidence,
        "heatmap_url": f"/static/heatmaps/{heatmap_filename}", 
        "quality_score": "Good",
        "secondary_findings": random.choice(["None Found", "Early Cataract Development", "Macular Edema Risk", "Glaucoma Suspect"]),
        "affected_area": "Macula and Superior Temporal Arcade" if prediction != "No DR" else "N/A"
    }
