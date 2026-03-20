import cv2
import numpy as np

def assess_image_quality(image_path: str, blur_threshold: float = 100.0) -> dict:
    """
    Assess retinal image quality for blurriness and lighting.
    Returns a dictionary with quality metrics.
    """
    image = cv2.imread(image_path)
    if image is None:
        return {"acceptable": False, "reason": "Failed to load image"}
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Basic check for retina (fundus images usually have a strong red/orange dominance)
    if len(image.shape) >= 3:
        b, g, r = image[:,:,0], image[:,:,1], image[:,:,2]
    else:
        b, g, r = image, image, image
        
    mean_r, mean_g, mean_b = np.mean(r), np.mean(g), np.mean(b)
    # If red isn't significantly higher than blue/green, it's likely not a fundus image (or very poor quality)
    if mean_r < mean_g + 15 and mean_r < mean_b + 15:
        return {"acceptable": False, "reason": "Image does not appear to be a retinal scan. Please upload the right retina image."}
    
    # Blur detection using variance of Laplacian
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Lighting assessment
    mean_brightness = np.mean(gray)
    
    acceptable = True
    reason = "Good quality"
    
    if laplacian_var < blur_threshold:
        acceptable = False
        reason = f"Image is blurry (Laplacian var: {laplacian_var:.2f})"
    elif mean_brightness < 40:
        acceptable = False
        reason = f"Image is too dark (brightness: {mean_brightness:.2f})"
    elif mean_brightness > 220:
        acceptable = False
        reason = f"Image is too bright (brightness: {mean_brightness:.2f})"
        
    return {
        "acceptable": acceptable,
        "reason": reason,
        "laplacian_variance": laplacian_var,
        "brightness": mean_brightness
    }
