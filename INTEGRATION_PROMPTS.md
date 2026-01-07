# 🎯 BEST PROMPTS FOR AI IMAGE CLASSIFICATION INTEGRATION

## Executive Summary

**What We Integrated:** AI-powered image classification from the SIH repository into your CitizenVoice project using Google Gemini Vision API instead of YOLOv8.

**Why This Approach:** Gemini Vision provides better accuracy, easier integration, and no infrastructure overhead compared to training custom YOLO models.

---

## 🚀 QUICK START COMMANDS

### 1. Install Dependencies

```bash
# Backend - Install Gemini AI
cd Backend
npm install @google/generative-ai

# Frontend - Install Lucide Icons
cd ../CitizenVoice
npm install lucide-react
```

### 2. Verify Environment Variables

Make sure your `Backend/.env` has:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Servers

```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend
cd CitizenVoice
npm run dev
```

---

## 📝 BEST PROMPTS FOR TESTING

### Prompt 1: Test Classification API (Backend)

Use this cURL command to test the classification endpoint:

```bash
curl -X POST http://localhost:3000/api/classification/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: multipart/form-data" \
  -F "images=@/path/to/your/test/image.jpg"
```

Replace:
- `YOUR_JWT_TOKEN_HERE` with a valid token from localStorage
- `/path/to/your/test/image.jpg` with actual image path

**Expected Response:**
```json
{
  "success": true,
  "message": "Test classification completed",
  "classification": {
    "category": "pothole",
    "confidence": 87,
    "priority": "high",
    "description": "Large pothole visible in the road surface causing traffic hazard",
    "department": "Public Works Department (PWD)",
    "alternativeCategories": [
      {"category": "safety", "probability": 10},
      {"category": "other", "probability": 3}
    ]
  }
}
```

---

### Prompt 2: Test Issue Creation with AI (Postman/Thunder Client)

**Endpoint:** `POST http://localhost:3000/api/issues`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Body (form-data):**
```
title: "Large pothole on Main Street"
description: "Deep pothole causing vehicle damage"
location: {"lat": 28.7041, "lng": 77.1025, "address": "Main Street"}
priority: "medium"
useAiClassification: true
images: [select image file]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Issue created successfully with AI classification (87% confidence)",
  "data": {
    "_id": "...",
    "title": "Large pothole on Main Street",
    "category": "pothole",
    "priority": "high",
    "aiSuggestions": {
      "category": "pothole",
      "priority": "high",
      "confidence": 87,
      "description": "Large pothole visible in the road surface"
    }
  }
}
```

---

## 🎨 FRONTEND INTEGRATION PROMPTS

### Option 1: Replace Existing Issue Form (Recommended)

**Step 1:** Find your current issue creation component (likely in `CitizenVoice/src/pages/Dashboard/CitizenDashboard.jsx` or similar)

**Step 2:** Replace the form section with:

```jsx
import AIIssueForm from '../../components/AIIssueForm';

// Inside your component:
const handleIssueSubmit = async (formData) => {
  try {
    const response = await fetch('http://localhost:3000/api/issues', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      alert('✅ Issue created! Category: ' + result.data.category);
      // Refresh issues list or navigate away
    } else {
      alert('❌ Error: ' + result.message);
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Failed to submit issue');
  }
};

return (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold mb-6">Report Civic Issue</h1>
    <AIIssueForm onSubmit={handleIssueSubmit} />
  </div>
);
```

---

### Option 2: Add AI Classification to Existing Form

If you want to keep your current form and just add AI:

```jsx
import { useState } from 'react';
import ClassificationResults from '../../components/ClassificationResults';

function YourExistingForm() {
  const [aiClassification, setAiClassification] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // When user uploads image:
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsClassifying(true);

    try {
      const formData = new FormData();
      formData.append('images', file);

      const response = await fetch('http://localhost:3000/api/classification/classify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setAiClassification(result.data);
      }
    } catch (error) {
      console.error('Classification failed:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  // Accept AI suggestion:
  const handleAcceptAI = () => {
    setFormData({
      ...formData,
      category: aiClassification.category,
      priority: aiClassification.priority
    });
  };

  return (
    <form>
      {/* Your existing form fields */}
      
      <input 
        type="file" 
        onChange={handleImageUpload} 
        accept="image/*"
      />

      {isClassifying && <p>🤖 Analyzing image...</p>}

      {aiClassification && (
        <ClassificationResults 
          classification={aiClassification}
          onAccept={handleAcceptAI}
          onReject={() => setAiClassification(null)}
        />
      )}

      {/* Rest of your form */}
    </form>
  );
}
```

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Pothole Image
1. Upload clear image of a pothole
2. Expected: Category = "pothole", Confidence > 70%
3. Department = "Public Works Department (PWD)"

### Test Case 2: Garbage/Waste
1. Upload image of garbage pile or overflowing bin
2. Expected: Category = "garbage", Confidence > 70%
3. Department = "Sanitation Department"

### Test Case 3: Broken Streetlight
1. Upload image of malfunctioning streetlight
2. Expected: Category = "streetlight", Confidence > 60%
3. Department = "Electricity Board"

### Test Case 4: Ambiguous Image
1. Upload unclear or low-quality image
2. Expected: Lower confidence (<50%), category = "other"
3. User should manually override

### Test Case 5: Manual Override
1. Upload image, get AI suggestion
2. Click "Choose Manually" button
3. Select different category from dropdown
4. Submit - should use user's choice, not AI

---

## 🎯 PROMPTS FOR SPECIFIC USE CASES

### Use Case 1: "I want ONLY AI classification (no manual option)"

Modify `AIIssueForm.jsx`:
```jsx
// Remove the manual category dropdown
// Make category field hidden with AI value
<input 
  type="hidden" 
  name="category" 
  value={aiClassification?.category || 'other'} 
/>

// Disable "Choose Manually" button
<button 
  onClick={onReject}
  disabled={true}
  className="opacity-50 cursor-not-allowed"
>
  Choose Manually (Disabled)
</button>
```

---

### Use Case 2: "Show classification confidence in issue list"

Update your issues list component:
```jsx
// When displaying issues:
<div className="issue-card">
  <h3>{issue.title}</h3>
  <span className="category">{issue.category}</span>
  
  {issue.aiClassification && (
    <span className="ai-badge">
      🤖 AI: {issue.aiClassification.confidence}%
    </span>
  )}
</div>
```

---

### Use Case 3: "Require minimum confidence threshold"

In `issueController.js`, add validation:
```javascript
// After classification:
if (aiClassification && aiClassification.confidence < 60) {
  // Force manual selection if confidence too low
  throw new ApiError(400, 
    `AI confidence too low (${aiClassification.confidence}%). Please select category manually.`
  );
}
```

---

### Use Case 4: "Classify multiple images and use best result"

This is already implemented! The service has:
```javascript
classifyMultipleImages(imagePaths)
```

It returns the classification with highest confidence.

---

## 🔧 CUSTOMIZATION PROMPTS

### Add New Category

**Step 1:** Update `imageClassificationService.js`:
```javascript
const prompt = `...
AVAILABLE CATEGORIES (choose ONE):
- pothole: Road damage, cracks, holes in pavement
- streetlight: Broken/malfunctioning street lights
- garbage: Waste accumulation, overflowing bins
- water: Water supply issues, leakage, waterlogging
- traffic: Traffic signal problems
- noise: Noise pollution sources
- safety: Public safety hazards
- graffiti: Vandalism, unauthorized wall paintings  // NEW CATEGORY
- other: Any other civic issue
...`;

// Update validCategories array:
const validCategories = [
  'pothole', 'streetlight', 'garbage', 'water', 
  'traffic', 'noise', 'safety', 'graffiti', 'other'  // Add 'graffiti'
];

// Update department mapping:
getDepartmentForCategory(category) {
  const departmentMap = {
    // ... existing mappings ...
    graffiti: 'Municipal Anti-Vandalism Squad',
    // ...
  };
}
```

**Step 2:** Update frontend category list in `AIIssueForm.jsx`:
```javascript
const categories = [
  // ... existing categories ...
  { value: 'graffiti', label: 'Graffiti / Vandalism' },
];
```

**Step 3:** Update Issue model enum in `Backend/src/models/Issue.js`:
```javascript
category: {
  type: String,
  required: true,
  enum: ['pothole', 'streetlight', 'garbage', 'water', 'traffic', 
         'noise', 'safety', 'graffiti', 'other']  // Add 'graffiti'
}
```

---

## 🎓 LEARNING PROMPTS (For Future Enhancements)

### If you want to switch to YOLOv8 later:

**Prompt for creating Python microservice:**
```python
# Save as Backend/python_service/yolo_classifier.py
from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
import io

app = Flask(__name__)
model = YOLO("best.pt")  # Your trained model

@app.route('/classify', methods=['POST'])
def classify():
    file = request.files['image']
    img = Image.open(io.BytesIO(file.read()))
    
    results = model(img)
    probs = results[0].probs.data.tolist()
    
    top_class = int(results[0].probs.top1)
    confidence = float(results[0].probs.top1conf) * 100
    
    return jsonify({
        'category': model.names[top_class],
        'confidence': confidence,
        'probabilities': {model.names[i]: p*100 for i, p in enumerate(probs)}
    })

if __name__ == '__main__':
    app.run(port=5000)
```

Then update `imageClassificationService.js` to call:
```javascript
const response = await fetch('http://localhost:5000/classify', {
  method: 'POST',
  body: formData
});
```

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] Gemini API key is set and working
- [ ] Test classification with 5+ different images
- [ ] Verify all 8 categories work correctly
- [ ] Test with poor quality images (should gracefully handle)
- [ ] Test manual override functionality
- [ ] Check confidence thresholds make sense
- [ ] Ensure error messages are user-friendly
- [ ] Test on mobile devices (image upload)
- [ ] Monitor API usage (Gemini free tier limits)
- [ ] Add logging for classification accuracy tracking

---

## 🎉 SUCCESS METRICS

Track these after deployment:
- **AI Usage Rate**: % of issues using AI vs manual
- **AI Accuracy**: User override rate (if high, AI is wrong often)
- **Average Confidence**: Should be >70% for production
- **Category Distribution**: Which categories are most common
- **Time Saved**: Compare avg report time with/without AI

---

## 📞 SUPPORT

**Common Issues:**

1. **"Cannot read property 'data' of undefined"**
   - Check if Gemini API key is valid
   - Verify network connectivity
   - Review backend logs for API errors

2. **"Classification always returns 'other'"**
   - Image quality may be poor
   - Issue not clearly visible
   - Try different angle/lighting

3. **"Frontend not showing AI results"**
   - Check browser console for errors
   - Verify API endpoint URL is correct
   - Ensure token is being sent in headers

---

**INTEGRATION COMPLETE! 🎉**

All files created, prompts provided, and ready to deploy. Just run the Quick Start commands above and you're live!
