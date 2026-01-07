"""
Flask API for Civic Issue Classification using SIH AI Model
Serves the trained model for image classification
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

# Global model variable
model = None

# Category mapping - adjust based on your model's output
CATEGORIES = {
    0: 'pothole',
    1: 'streetlight',
    2: 'garbage',
    3: 'water',
    4: 'traffic',
    5: 'noise',
    6: 'safety',
    7: 'other'
}

# Priority mapping based on issue type
PRIORITY_MAP = {
    'pothole': 'high',
    'streetlight': 'medium',
    'garbage': 'medium',
    'water': 'high',
    'traffic': 'high',
    'safety': 'high',
    'noise': 'low',
    'other': 'medium'
}

# Department mapping
DEPARTMENTS = {
    'pothole': 'Public Works Department (PWD)',
    'streetlight': 'Electrical Department',
    'garbage': 'Sanitation Department',
    'water': 'Water Supply Department',
    'traffic': 'Traffic Police Department',
    'noise': 'Pollution Control Board',
    'safety': 'Municipal Corporation',
    'other': 'General Municipal Department'
}

# Detailed descriptions for each category
DESCRIPTIONS = {
    'pothole': 'Road damage detected showing cracks, holes, or deteriorated pavement surface',
    'streetlight': 'Street lighting infrastructure issue detected including broken poles or malfunctioning lights',
    'garbage': 'Waste management issue detected including accumulated trash or overflowing bins',
    'water': 'Water-related issue detected including leakage, waterlogging, or drainage problems',
    'traffic': 'Traffic infrastructure issue detected including signal problems or damaged road markings',
    'noise': 'Noise pollution source detected',
    'safety': 'Public safety hazard detected requiring immediate attention',
    'other': 'General civic issue detected that requires municipal attention'
}

def load_model():
    """Load the TensorFlow model"""
    global model
    
    model_path = os.path.join('model', 'civic_issues_model.h5')
    
    if not os.path.exists(model_path):
        print(f"⚠️  Model file not found at: {model_path}")
        print("Please place your trained model file in Backend/ai-service/model/civic_issues_model.h5")
        return False
    
    try:
        print(f"📦 Loading AI model from: {model_path}")
        model = tf.keras.models.load_model(model_path)
        print("✅ Model loaded successfully!")
        print(f"📊 Model input shape: {model.input_shape}")
        print(f"📊 Model output shape: {model.output_shape}")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return False

def preprocess_image(image_file):
    """Preprocess image for model input"""
    try:
        # Read image
        img = Image.open(io.BytesIO(image_file.read()))
        
        # Convert to RGB
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model input size (adjust if your model uses different size)
        img = img.resize((224, 224))
        
        # Convert to array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

@app.route('/classify', methods=['POST'])
def classify_image():
    """Classify civic issue from image"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please check server logs.'
            }), 503
        
        # Check if image provided
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image provided in request'
            }), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400
        
        # Preprocess image
        print(f"🔍 Processing image: {image_file.filename}")
        img_array = preprocess_image(image_file)
        
        # Make prediction
        print("🤖 Running model inference...")
        predictions = model.predict(img_array, verbose=0)
        
        # Get top prediction
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class]) * 100
        
        # Map to category
        category = CATEGORIES.get(predicted_class, 'other')
        priority = PRIORITY_MAP.get(category, 'medium')
        department = DEPARTMENTS.get(category, 'Municipal Corporation')
        description = DESCRIPTIONS.get(category, 'Civic issue detected')
        
        print(f"✅ Classification complete: {category} ({confidence:.1f}%)")
        
        # Get top 3 alternative predictions
        top_3_indices = np.argsort(predictions[0])[-3:][::-1]
        alternatives = []
        
        for idx in top_3_indices[1:]:  # Skip the top prediction
            alt_category = CATEGORIES.get(idx, 'other')
            alt_probability = round(float(predictions[0][idx]) * 100, 2)
            if alt_probability > 1:  # Only include if > 1%
                alternatives.append({
                    'category': alt_category,
                    'probability': alt_probability
                })
        
        # Prepare response
        result = {
            'success': True,
            'data': {
                'category': category,
                'confidence': round(confidence, 2),
                'priority': priority,
                'description': f"{description}. Detected with {confidence:.0f}% confidence.",
                'department': department,
                'alternativeCategories': alternatives
            }
        }
        
        return jsonify(result)
        
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SIH AI Classification Service',
        'model_loaded': model is not None,
        'categories': list(CATEGORIES.values()),
        'version': '1.0.0'
    })

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get available categories"""
    return jsonify({
        'success': True,
        'categories': CATEGORIES,
        'priorities': PRIORITY_MAP,
        'departments': DEPARTMENTS
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SIH AI Classification Service")
    print("="*60 + "\n")
    
    # Load model on startup
    model_loaded = load_model()
    
    if not model_loaded:
        print("\n⚠️  WARNING: Model not loaded!")
        print("The service will start but classification will fail.")
        print("Please place your model file at: Backend/ai-service/model/civic_issues_model.h5")
        print("\n" + "="*60 + "\n")
    
    # Start Flask server
    print("🌐 Starting Flask server on http://localhost:5001")
    print("📝 Endpoints:")
    print("   POST /classify - Classify civic issue image")
    print("   GET  /health - Health check")
    print("   GET  /categories - Get available categories")
    print("\n" + "="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=False)
