"""
Urban Issues Classification API
FastAPI service for classifying civic issue images using trained PyTorch CNN model
"""

from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import transforms, models
import numpy as np
from PIL import Image
import json
import os
import io
from typing import Optional

app = FastAPI(
    title="Urban Issues Classifier API",
    description="AI-powered classification of civic issues from images",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and mappings
model = None
class_mappings = None
IMG_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Category descriptions for user-friendly output
CATEGORY_DESCRIPTIONS = {
    "ROAD_POTHOLE": "Road damage including potholes and cracks",
    "GARBAGE": "Garbage, waste, or litter accumulation",
    "STREETLIGHT": "Damaged electrical poles or streetlights",
    "INFRASTRUCTURE": "Damaged concrete structures or infrastructure",
    "ROAD_SIGNS": "Damaged or missing road signs",
    "POLLUTION": "Environmental pollution (dead animals, etc.)",
    "FALLEN_TREES": "Fallen trees blocking roads or paths",
    "GRAFFITI": "Unauthorized graffiti on public property",
    "ILLEGAL_PARKING": "Illegal or improper parking"
}

# Legacy category mapping for backend compatibility
LEGACY_CATEGORY_MAP = {
    "ROAD_POTHOLE": "pothole",
    "GARBAGE": "garbage",
    "STREETLIGHT": "streetlight",
    "INFRASTRUCTURE": "infrastructure",
    "ROAD_SIGNS": "traffic",
    "POLLUTION": "pollution",
    "FALLEN_TREES": "other",
    "GRAFFITI": "other",
    "ILLEGAL_PARKING": "traffic"
}


class CivicIssueClassifier(nn.Module):
    """CNN model for civic issue classification using transfer learning"""
    
    def __init__(self, num_classes):
        super(CivicIssueClassifier, self).__init__()
        self.backbone = models.resnet18(weights=None)
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)


def get_transform():
    """Get image transform for inference"""
    return transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


def load_model_and_mappings():
    """Load the trained model and class mappings"""
    global model, class_mappings
    
    model_path = "model/civic_classifier.pth"
    mappings_path = "model/class_mappings.json"
    
    # Check for best model first
    best_model_path = "model/civic_classifier_best.pth"
    if os.path.exists(best_model_path):
        model_path = best_model_path
    
    # Load mappings first to get num_classes
    if os.path.exists(mappings_path):
        with open(mappings_path, "r") as f:
            class_mappings = json.load(f)
        print("✅ Class mappings loaded successfully")
        num_classes = class_mappings.get("num_classes", 9)
    else:
        print("⚠️ Class mappings not found, using defaults")
        class_mappings = None
        num_classes = 9
    
    if os.path.exists(model_path):
        print(f"📦 Loading model from {model_path}")
        model = CivicIssueClassifier(num_classes)
        model.load_state_dict(torch.load(model_path, map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        print(f"✅ Model loaded successfully on {DEVICE}")
    else:
        print(f"⚠️ Model not found at {model_path}")
        model = None


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model_and_mappings()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Urban Issues Classifier API",
        "model_loaded": model is not None,
        "mappings_loaded": class_mappings is not None,
        "device": str(DEVICE)
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model is not None else "degraded",
        "model_loaded": model is not None,
        "mappings_loaded": class_mappings is not None,
        "device": str(DEVICE),
        "categories": list(CATEGORY_DESCRIPTIONS.keys()) if class_mappings else []
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Classify an uploaded image of a civic issue
    
    Returns:
        - class_index: Numeric class index
        - category: Standardized category code
        - category_name: Human-readable category name
        - description: Category description
        - confidence: Confidence score (0-100)
        - department: Suggested department to handle the issue
        - priority: Suggested priority level
        - legacy_category: Backend-compatible category
        - all_predictions: Confidence scores for all categories
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    try:
        # Read and decode image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess image
        transform = get_transform()
        img_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            class_index = int(torch.argmax(probabilities))
            confidence = float(probabilities[class_index]) * 100
        
        # Get category info from mappings
        if class_mappings and "index_to_category" in class_mappings:
            category_info = class_mappings["index_to_category"].get(str(class_index), {})
            category = category_info.get("category", "UNKNOWN")
            original_name = category_info.get("original_name", "Unknown")
            department = category_info.get("department", "General Municipal Department")
            priority = category_info.get("priority", "medium")
        else:
            category = "UNKNOWN"
            original_name = "Unknown"
            department = "General Municipal Department"
            priority = "medium"
        
        # Build all predictions list
        all_predictions = []
        if class_mappings and "index_to_category" in class_mappings:
            for idx, prob in enumerate(probabilities.cpu().numpy()):
                cat_info = class_mappings["index_to_category"].get(str(idx), {})
                all_predictions.append({
                    "category": cat_info.get("category", f"CLASS_{idx}"),
                    "confidence": float(prob) * 100
                })
            all_predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        return {
            "success": True,
            "class_index": class_index,
            "category": category,
            "category_name": original_name,
            "description": CATEGORY_DESCRIPTIONS.get(category, "Civic issue detected"),
            "confidence": round(confidence, 2),
            "department": department,
            "priority": priority,
            "legacy_category": LEGACY_CATEGORY_MAP.get(category, "other"),
            "all_predictions": all_predictions[:5]  # Top 5 predictions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/categories")
async def get_categories():
    """Get all available categories with their info"""
    if class_mappings and "index_to_category" in class_mappings:
        categories = []
        for idx, info in class_mappings["index_to_category"].items():
            cat = info.get("category", "UNKNOWN")
            categories.append({
                "index": int(idx),
                "category": cat,
                "name": info.get("original_name", cat),
                "description": CATEGORY_DESCRIPTIONS.get(cat, ""),
                "department": info.get("department", ""),
                "priority": info.get("priority", "medium"),
                "legacy_category": LEGACY_CATEGORY_MAP.get(cat, "other")
            })
        return {"categories": categories}
    return {"categories": [], "message": "No mappings loaded"}


@app.post("/reload")
async def reload_model():
    """Reload the model and mappings (useful after retraining)"""
    load_model_and_mappings()
    return {
        "status": "reloaded",
        "model_loaded": model is not None,
        "mappings_loaded": class_mappings is not None
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
