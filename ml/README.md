# 🤖 ML Image Classification Service

AI-powered civic issue classification using PyTorch CNN with ResNet18 backbone. This service classifies images of civic issues into 9 categories and integrates with the backend API.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Dataset Setup](#dataset-setup)
- [Training the Model](#training-the-model)
- [Running the API Server](#running-the-api-server)
- [API Endpoints](#api-endpoints)
- [Integration with Backend](#integration-with-backend)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### 1. Python Installation

**Required Version:** Python 3.10, 3.11, 3.12, or 3.13 (PyTorch supports these versions)

#### Windows:

1. Download Python from [python.org](https://www.python.org/downloads/)
2. During installation, **check "Add Python to PATH"**
3. Verify installation:
   ```powershell
   python --version
   ```

#### macOS:

```bash
brew install python@3.11
python3 --version
```

#### Linux:

```bash
sudo apt update
sudo apt install python3.11 python3-pip python3-venv
python3 --version
```

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/AKASH-tech234/Tech_sprint.git
cd Tech_sprint/ml
```

### Step 2: Create Virtual Environment

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` in your terminal prompt.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies installed:**

- `torch` - PyTorch deep learning framework
- `torchvision` - Computer vision models and transforms
- `pillow` - Image processing
- `numpy` - Numerical operations
- `fastapi` - API framework
- `uvicorn` - ASGI server
- `python-multipart` - File upload support
- `kagglehub` - Kaggle dataset downloader

---

## 📊 Dataset Setup

The model uses the **Urban Issues Dataset** from Kaggle (~4.5GB, 47,000+ images).

### Automatic Download (Recommended)

The training script automatically downloads and caches the dataset on first run:

```bash
python train.py
```

The dataset will be cached at:

- **Windows:** `C:\Users\<username>\.cache\kagglehub\datasets\akinduhiman\urban-issues-dataset\versions\19`
- **macOS/Linux:** `~/.cache/kagglehub/datasets/akinduhiman/urban-issues-dataset/versions/19`

### Manual Download (Optional)

If automatic download fails:

1. Download from [Kaggle](https://www.kaggle.com/datasets/akinduhiman/urban-issues-dataset)
2. Extract to `ml/data/urban-issues-dataset/`

---

## 🎓 Training the Model

### Full Training (Recommended for first time)

```bash
python train.py
```

**Training Configuration:**

- **Model:** ResNet18 with transfer learning
- **Epochs:** 10
- **Batch Size:** 32
- **Optimizer:** Adam (lr=0.001)
- **Classes:** 9 civic issue categories
- **Output:** `model/civic_classifier_best.pth`

**Expected Output:**

```
📥 Downloading dataset from Kaggle...
✅ Dataset downloaded successfully
📊 Found 9 classes: ROAD_POTHOLE, GARBAGE, STREETLIGHT, ...
🚀 Starting training...
Epoch 1/10: 100%|██████████| Loss: 1.234, Acc: 65.2%
...
✅ Best model saved: model/civic_classifier_best.pth
```

**Training Time:**

- CPU: ~2-3 hours
- GPU: ~30-45 minutes

**Training Time:**

- CPU: ~2-3 hours
- GPU: ~30-45 minutes

### Categories

The model classifies images into these 9 categories:

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

---

## 🚀 Running the API Server

### Start the Server

Make sure you're in the `ml/` directory with virtual environment activated:

**Windows:**

```powershell
cd C:\Users\<username>\path\to\Tech_sprint\ml
.\.venv\Scripts\Activate.ps1
python run_server.py
```

**macOS/Linux:**

```bash
cd /path/to/Tech_sprint/ml
source .venv/bin/activate
python run_server.py
```

**Expected Output:**

```
🚀 Starting Urban Issues Classifier API...
📍 API will be available at http://localhost:8001
📖 API docs at http://localhost:8001/docs

INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
✅ Class mappings loaded successfully
📦 Loading model from model/civic_classifier_best.pth
✅ Model loaded successfully on cpu
INFO:     Application startup complete.
```

The ML API is now running on **port 8001**.

### Keep the Server Running

**Important:** The ML API must keep running in its own terminal window while the backend and frontend are running.

To run in background (Linux/macOS):

```bash
nohup python run_server.py > ml_server.log 2>&1 &
```

---

## 🌐 API Endpoints

### 1. Health Check

```bash
GET http://localhost:8001/health
```

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "mappings_loaded": true,
  "device": "cpu",
  "categories": ["ROAD_POTHOLE", "GARBAGE", ...]
}
```

### 2. Predict/Classify Image

```bash
POST http://localhost:8001/predict
Content-Type: multipart/form-data
Body: file (image file)
```

**Example using curl:**

```bash
curl -X POST "http://localhost:8001/predict" \
  -F "file=@path/to/image.jpg"
```

**Response:**

```json
{
  "success": true,
  "category": "ROAD_POTHOLE",
  "category_name": "Road Pothole",
  "description": "Road damage including potholes and cracks",
  "confidence": 0.92,
  "department": "Public Works Department (PWD)",
  "priority": "high",
  "all_predictions": [
    {
      "category": "ROAD_POTHOLE",
      "confidence": 0.92,
      "department": "Public Works Department (PWD)",
      "priority": "high"
    },
    ...
  ]
}
```

### 3. Get Categories

```bash
GET http://localhost:8001/categories
```

### 4. Interactive API Documentation

Visit: http://localhost:8001/docs

FastAPI provides interactive documentation where you can:

- Test all endpoints
- Upload images directly
- See request/response schemas

---

## 🔗 Integration with Backend

### Backend Configuration

The Node.js backend connects to this ML service. Make sure the backend has:

**File:** `Backend/.env`

```env
ML_API_URL=http://localhost:8001
```

**File:** `Backend/src/services/imageClassificationService.js`

- Calls ML API endpoints
- Handles image uploads
- Maps categories to departments

### Complete System Architecture

```
User uploads image → Frontend (React)
                     ↓
                  Backend (Node.js/Express) → ML API (FastAPI/PyTorch)
                     ↓                          ↓
                  OpenAI API              Returns classification
                  (Generate title/desc)        ↓
                     ↓                    ← Receives result
                  Returns full form data → Frontend auto-fills form
```

### Running the Full Stack

**Terminal 1 - ML API:**

```bash
cd ml
.venv\Scripts\activate  # or source .venv/bin/activate
python run_server.py
```

**Terminal 2 - Backend:**

```bash
cd Backend
npm install
npm run dev
```

**Terminal 3 - Frontend:**

```bash
cd CitizenVoice
npm install
npm run dev
```

---

## 🐛 Troubleshooting

### Issue: Python not found

**Solution:**

```bash
# Check if Python is installed
python --version
# or
python3 --version

# Reinstall Python and add to PATH
```

### Issue: `pip install` fails

**Solution:**

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v
```

### Issue: CUDA/GPU errors

**Solution:** The model works fine on CPU. If you see GPU errors:

```bash
# The model automatically falls back to CPU
# No action needed - it will use CPU
```

### Issue: Port 8001 already in use

**Solution:**

```bash
# Kill process on port 8001 (Windows)
netstat -ano | findstr :8001
taskkill /PID <process_id> /F

# Kill process on port 8001 (Linux/macOS)
lsof -ti:8001 | xargs kill -9
```

### Issue: Model file not found

**Solution:**

```bash
# Retrain the model
python train.py

# Check if model file exists
ls -la model/civic_classifier_best.pth  # Linux/macOS
dir model\civic_classifier_best.pth     # Windows
```

### Issue: Dataset download fails

**Solution:**

```bash
# The dataset is cached automatically
# Check cache location:
# Windows: C:\Users\<username>\.cache\kagglehub\
# Linux/macOS: ~/.cache/kagglehub/

# If still failing, download manually from Kaggle
```

### Issue: Backend can't connect to ML API

**Solution:**

1. Verify ML API is running: `curl http://localhost:8001/health`
2. Check `Backend/.env` has `ML_API_URL=http://localhost:8001`
3. Make sure firewall allows port 8001

---

## 📝 File Structure

```
ml/
├── api.py                          # FastAPI server
├── train.py                        # Training script
├── test.py                         # Testing utilities
├── run_server.py                   # Server startup script
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── model/
│   ├── civic_classifier_best.pth   # Trained model weights
│   └── class_mappings.json         # Category mappings
└── data/                           # Dataset (auto-downloaded)
```

---

## 🤝 Contributing

When contributing ML improvements:

1. **Test locally:**

   ```bash
   python test.py
   ```

2. **Train with your changes:**

   ```bash
   python train.py
   ```

3. **Verify API works:**

   ```bash
   python run_server.py
   curl -X POST http://localhost:8001/predict -F "file=@test_image.jpg"
   ```

4. **Commit only code, not model:**
   ```bash
   git add train.py api.py requirements.txt
   # Don't commit model/*.pth files (too large)
   ```

---

## 📄 License

This project is part of the Tech_sprint CitizenVoice platform.

---

## 🆘 Need Help?

- Check the [main project README](../README.md)
- Open an issue on GitHub
- Check FastAPI docs at http://localhost:8001/docs

---

**Note:** The model file (`civic_classifier_best.pth`) is not included in Git due to size. Contributors must train the model locally using the instructions above.
