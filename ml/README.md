# Urban Issues ML Classifier

AI-powered image classification for civic issues using TensorFlow and FastAPI.

## Categories

The model classifies images into 9 urban issue categories:

| Category        | Description                 | Department                      |
| --------------- | --------------------------- | ------------------------------- |
| ROAD_POTHOLE    | Potholes and road cracks    | Public Works Department (PWD)   |
| GARBAGE         | Waste and litter            | Sanitation Department           |
| STREETLIGHT     | Damaged electrical poles    | Electrical Department           |
| INFRASTRUCTURE  | Damaged concrete structures | Public Works Department (PWD)   |
| ROAD_SIGNS      | Damaged road signs          | Traffic Department              |
| POLLUTION       | Environmental pollution     | Environmental Health Department |
| FALLEN_TREES    | Fallen trees                | Parks & Recreation Department   |
| GRAFFITI        | Unauthorized graffiti       | Municipal Cleaning Department   |
| ILLEGAL_PARKING | Illegal parking             | Traffic Police Department       |

## Quick Start

### 1. Install Dependencies

```bash
cd ml
pip install -r requirements.txt
```

### 2. Train the Model

The training script automatically downloads the dataset from Kaggle:

```bash
python train.py
```

This will:

- Download the [Urban Issues Dataset](https://www.kaggle.com/datasets/akinduhiman/urban-issues-dataset) (~4.5GB)
- Train a CNN classifier (approximately 30 epochs)
- Save the model to `model/civic_classifier.h5`
- Save class mappings to `model/class_mappings.json`

### 3. Start the API Server

```bash
python run_server.py
```

Or directly with uvicorn:

```bash
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at:

- **API**: http://localhost:8001
- **Docs**: http://localhost:8001/docs
- **Health**: http://localhost:8001/health

## API Endpoints

### POST /predict

Classify an uploaded image.

**Request:**

```bash
curl -X POST "http://localhost:8001/predict" \
  -F "file=@path/to/image.jpg"
```

**Response:**

```json
{
  "success": true,
  "class_index": 0,
  "category": "ROAD_POTHOLE",
  "category_name": "Potholes and RoadCracks",
  "description": "Road damage including potholes and cracks",
  "confidence": 95.5,
  "department": "Public Works Department (PWD)",
  "priority": "high",
  "legacy_category": "pothole",
  "all_predictions": [
    {"category": "ROAD_POTHOLE", "confidence": 95.5},
    {"category": "INFRASTRUCTURE", "confidence": 3.2},
    ...
  ]
}
```

### GET /health

Check API health and model status.

### GET /categories

Get all available categories with their information.

### POST /reload

Reload the model (useful after retraining).

## Integration with Backend

The Node.js backend automatically calls this ML service when:

1. A user uploads an image while reporting an issue
2. The `/api/classification/classify` endpoint is called

Set the environment variable in the backend:

```
ML_API_URL=http://localhost:8001
```

## Model Architecture

- **Input**: 224x224 RGB images
- **Architecture**: 4-layer CNN with BatchNormalization and Dropout
- **Output**: Softmax probabilities for 9 classes

## Dataset

Uses the [Urban Issues Dataset](https://www.kaggle.com/datasets/akinduhiman/urban-issues-dataset) from Kaggle:

- ~4.5GB of labeled images
- 9 categories of urban/civic issues
- Automatically downloaded during training

## Files

```
ml/
├── api.py              # FastAPI server
├── train.py            # Training script
├── run_server.py       # Quick start server
├── requirements.txt    # Python dependencies
├── model/
│   ├── civic_classifier.h5       # Trained model
│   ├── civic_classifier_best.h5  # Best model checkpoint
│   └── class_mappings.json       # Category mappings
└── README.md
```
