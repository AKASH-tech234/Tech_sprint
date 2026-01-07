# 📦 Download Model File

You need to place the trained AI model file here.

## Required File

**Filename:** `civic_issues_model.h5`  
**Format:** TensorFlow/Keras model (.h5)  
**Size:** ~10-50 MB (depending on model architecture)

## Where to Get the Model

### Option 1: Download from SIH Repository

Visit: https://github.com/SayemKhan1111/SIH-AI-Issues-Classification-

Look for:
- `model/` directory
- Release section
- Download links

### Option 2: Contact the Developer

Reach out to the SIH project team for the trained model file.

### Option 3: Train Your Own Model

If you have training data, you can train your own model using the code from the GitHub repository.

## Expected Model Details

The model should be trained to classify these categories:
- **pothole** - Road damage, cracks
- **streetlight** - Broken lights, poles
- **garbage** - Waste accumulation
- **water** - Leaks, waterlogging
- **traffic** - Signal problems
- **noise** - Noise pollution
- **safety** - Safety hazards
- **other** - General issues

## After Downloading

1. Place the file in this directory: `Backend/ai-service/model/civic_issues_model.h5`
2. Restart the Python AI service
3. Test with: `http://localhost:5001/health`

## Verification

Once the model is in place, you should see:
```
📦 Loading AI model from: model/civic_issues_model.h5
✅ Model loaded successfully!
📊 Model input shape: (None, 224, 224, 3)
📊 Model output shape: (None, 8)
```

## Troubleshooting

If you get errors:
- Check file name is exactly: `civic_issues_model.h5`
- Verify file is not corrupted (should be 10-50 MB)
- Ensure it's a TensorFlow/Keras .h5 file
- Try downloading again

## Alternative: Use OpenAI Only

If you can't get the model file, the system will automatically fallback to OpenAI classification. Just add credits to your OpenAI account.
