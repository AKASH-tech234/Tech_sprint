# SIH AI Classification Service

This is a Python Flask service that serves the trained AI model for civic issue classification.

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Add Your Model

Place your trained model file in the `model` directory:
```
Backend/ai-service/model/civic_issues_model.h5
```

**Note:** The model file should be a trained TensorFlow/Keras model (.h5 format).

If you don't have the model yet:
1. Visit: https://github.com/SayemKhan1111/SIH-AI-Issues-Classification-
2. Download the trained model
3. Place it in the `model` directory

### 4. Run the Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### POST /classify
Classify a civic issue from an image.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "pothole",
    "confidence": 94.5,
    "priority": "high",
    "description": "Road damage detected...",
    "department": "Public Works Department (PWD)",
    "alternativeCategories": [
      {"category": "safety", "probability": 3.2},
      {"category": "other", "probability": 1.8}
    ]
  }
}
```

### GET /health
Check service health.

**Response:**
```json
{
  "status": "healthy",
  "service": "SIH AI Classification Service",
  "model_loaded": true,
  "categories": ["pothole", "streetlight", "garbage", ...],
  "version": "1.0.0"
}
```

### GET /categories
Get available categories and mappings.

**Response:**
```json
{
  "success": true,
  "categories": {...},
  "priorities": {...},
  "departments": {...}
}
```

## Troubleshooting

### Model Not Found
If you see "Model file not found", make sure:
1. Your model file is named `civic_issues_model.h5`
2. It's placed in `Backend/ai-service/model/` directory
3. The file path is correct

### Import Errors
If you get import errors:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use
If port 5001 is already in use, you can change it in `app.py`:
```python
app.run(host='0.0.0.0', port=5002, debug=False)  # Change port here
```

Then update `Backend/.env`:
```
PYTHON_AI_SERVICE_URL=http://localhost:5002
```

## Production Deployment

For production, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

This will run 4 worker processes for better performance.

## Performance

- **First request:** ~3 seconds (loads model into memory)
- **Subsequent requests:** ~1-2 seconds (model cached)
- **Memory usage:** ~500MB-1GB (depending on model size)
- **CPU usage:** ~20-40% during inference

## GPU Support (Optional)

If you have a GPU, TensorFlow will automatically use it for faster inference.

To enable GPU:
```bash
pip install tensorflow-gpu==2.15.0
```

## Categories

The model classifies images into these categories:
- **pothole** - Road damage, cracks, holes
- **streetlight** - Broken lights, damaged poles
- **garbage** - Waste accumulation, littering
- **water** - Leakage, waterlogging, flooding
- **traffic** - Signal problems, road markings
- **noise** - Noise pollution sources
- **safety** - Public safety hazards
- **other** - General civic issues
