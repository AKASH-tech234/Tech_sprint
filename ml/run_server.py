"""
Quick Start Script for ML Classification Service
Starts the FastAPI server for civic issue image classification
"""

import uvicorn
import os

if __name__ == "__main__":
    # Check if model exists (PyTorch .pth format)
    model_path = "model/civic_classifier.pth"
    best_model_path = "model/civic_classifier_best.pth"
    
    if not os.path.exists(model_path) and not os.path.exists(best_model_path):
        print("⚠️  No trained model found!")
        print("📝 Please run 'python train.py' first to train the model.")
        print("   This will download the dataset and train the classifier.")
        exit(1)
    
    print("🚀 Starting Urban Issues Classifier API...")
    print("📍 API will be available at http://localhost:8001")
    print("📖 API docs at http://localhost:8001/docs")
    print("")
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
