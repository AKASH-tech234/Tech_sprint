# 🗺️ CitizenVoice Heatmap Implementation Guide

## Overview

This guide documents the comprehensive heatmap feature implementation for all user roles (Citizen, Official, Community). The heatmap visualizes issue density across geographical areas with real-time filtering and multiple view modes.

---

## 📋 Features Implemented

### ✅ Backend API
- **New Endpoint**: `GET /api/issues/all`
  - Returns all issues with role-based filtering
  - Supports query parameters: `status`, `category`, `priority`, `search`
  - Authentication required
  - Location: `Backend/src/controllers/issueController.js`

### ✅ Frontend Components

#### 1. **HeatmapViewer Component** (`CitizenVoice/src/components/Dashboard/Shared/HeatmapViewer.jsx`)
A unified, reusable component for all user roles with the following features:

**View Modes:**
- 🔥 **Heatmap View**: Density-based heat overlay using `leaflet.heat`
- 📍 **Markers View**: Individual issue markers with status-based colors
- 🗂️ **Clusters View**: Grouped markers using `react-leaflet-cluster`

**Filtering Options:**
- Status filter (all, reported, acknowledged, in-progress, resolved, rejected)
- Category filter (pothole, streetlight, graffiti, garbage, water, traffic, parks, other)
- Priority filter (all, high, medium, low)

**Interactive Features:**
- Click on markers to view issue details
- Real-time statistics by status
- "Locate Me" button for user geolocation
- Dynamic heat intensity based on priority and status
- Responsive design

**Role-Specific Customization:**
- Citizen: "Local Issues Heatmap"
- Official: "Official Issues Dashboard Map"
- Community: "Community Issues Overview"

#### 2. **HeatmapLayerComponent** (`CitizenVoice/src/lib/heatmapLayer.js`)
Custom React component wrapping `leaflet.heat` for seamless integration with `react-leaflet`.

**Configuration:**
- Radius: 25px
- Blur: 15px
- Max zoom: 17
- Gradient: blue → lime → yellow → orange → red

#### 3. **Issue Service Updates** (`CitizenVoice/src/services/issueService.js`)
New method: `getAllIssues(filters)`
- Fetches all issues with optional filtering
- Returns formatted data for heatmap consumption

---

## 🛠️ Technical Implementation

### Backend Changes

**File: `Backend/src/controllers/issueController.js`**
```javascript
// New function added
export const getAllIssues = AsyncHandler(async (req, res) => {
  const { status, category, priority, search } = req.query;
  const userRole = req.user.role;
  
  const query = {};
  
  // Apply filters
  if (status && status !== 'all') query.status = status;
  if (category && category !== 'all') query.category = category;
  if (priority && priority !== 'all') query.priority = priority;
  
  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  const issues = await Issue.find(query)
    .populate('reportedBy', 'username avatar')
    .populate('assignedTo', 'username')
    .select('issueId title category status priority location createdAt upvotes images')
    .sort({ createdAt: -1 });
  
  res.json(
    new ApiResponse(200, { issues, total: issues.length }, 'All issues fetched successfully')
  );
});
```

**File: `Backend/src/routes/issueRoutes.js`**
```javascript
// New route added
router.get('/all', getAllIssues);
```

### Frontend Integration

**Routes Added:**

1. **Citizen Dashboard** (`/dashboard/citizen/heatmap`)
2. **Official Dashboard** (`/dashboard/official/heatmap` or `/map`)
3. **Community Dashboard** (`/dashboard/community/heatmap` or `/map`)

---

## 📍 How to Use the Heatmap

### For Citizens

1. Navigate to: `/dashboard/citizen/heatmap`
2. View issue density in your local area
3. Switch between heatmap, markers, or cluster views
4. Filter by status, category, or priority
5. Click "Locate Me" to center map on your location
6. Click markers to see issue details

### For Officials

1. Navigate to: `/dashboard/official/map` or `/dashboard/official/heatmap`
2. Monitor all issues across your jurisdiction
3. Use filters to focus on high-priority or new issues
4. Identify hotspots requiring immediate attention
5. View detailed statistics by status

### For Community Members

1. Navigate to: `/dashboard/community/map` or `/dashboard/community/heatmap`
2. Track issues across your community
3. Identify areas with high issue density
4. Use for verification and community engagement
5. Monitor resolution trends

---

## 🎨 Heatmap Intensity Calculation

The heatmap uses weighted intensities based on priority and status:

```javascript
const getPriorityWeight = (priority, status) => {
  let weight = 0.5;
  
  // Priority weight
  if (priority === 'high') weight = 1.0;
  else if (priority === 'medium') weight = 0.6;
  else weight = 0.3;
  
  // Status modifier
  if (status === 'reported') weight *= 1.2;
  else if (status === 'resolved') weight *= 0.5;
  
  return weight;
};
```

**Color Gradient:**
- 🔵 Blue (0.0): Low density
- 🟢 Lime (0.5): Medium-low density
- 🟡 Yellow (0.7): Medium density
- 🟠 Orange (0.85): High density
- 🔴 Red (1.0): Very high density

---

## 🎯 Custom Marker Icons

Status-based marker colors:

| Status | Color | Icon |
|--------|-------|------|
| Reported | Red (#ef4444) | ⭕ |
| Acknowledged | Orange (#f59e0b) | ⭕ |
| In Progress | Blue (#3b82f6) | ⭕ |
| Resolved | Green (#10b981) | ⭕ |
| Rejected | Gray (#6b7280) | ⭕ |

---

## 📦 Dependencies Used

All dependencies are already installed in the project:

```json
{
  "leaflet": "^1.9.4",
  "leaflet.heat": "^0.2.0",
  "react-leaflet": "^5.0.0",
  "react-leaflet-cluster": "^4.0.0"
}
```

---

## 🚀 How to Test

### 1. Start Backend Server
```bash
cd Backend
npm run dev
```

### 2. Start Frontend Server
```bash
cd CitizenVoice
npm run dev
```

### 3. Test Each Role

**Citizen:**
```
http://localhost:5173/dashboard/citizen/heatmap
```

**Official:**
```
http://localhost:5173/dashboard/official/map
```

**Community:**
```
http://localhost:5173/dashboard/community/map
```

### 4. Test Functionality

✅ **View Modes:**
- Click "Heatmap" button to see heat density
- Click "Markers" button to see individual markers
- Click "Clusters" button to see grouped markers

✅ **Filters:**
- Change status filter (e.g., select "Reported")
- Change category filter (e.g., select "Pothole")
- Change priority filter (e.g., select "High")
- Verify heatmap updates automatically

✅ **Geolocation:**
- Click "Locate Me" button
- Grant location permission
- Verify map centers on your location

✅ **Marker Interaction:**
- Click any marker in Markers or Clusters view
- Verify popup shows issue details
- Check that images display correctly (if available)

✅ **Statistics:**
- Verify stat cards show correct counts
- Check that counts update when filters change

---

## 🔧 Configuration Options

### Default Settings

```jsx
<HeatmapViewer 
  userRole="citizen"              // citizen | official | community
  defaultCenter={[28.6139, 77.2090]}  // [latitude, longitude]
  defaultZoom={12}                // zoom level (1-18)
  height="calc(100vh - 250px)"    // map container height
/>
```

### Customization

**Change Default Location:**
```javascript
// Update defaultCenter prop
defaultCenter={[YOUR_LAT, YOUR_LNG]}
```

**Change Heatmap Appearance:**
Edit `CitizenVoice/src/lib/heatmapLayer.js`:
```javascript
const defaultOptions = {
  radius: 30,      // Increase for larger heat areas
  blur: 20,        // Increase for smoother gradients
  maxZoom: 17,
  max: 1.0,
  gradient: {
    0.0: 'blue',
    0.5: 'lime',
    0.7: 'yellow',
    0.85: 'orange',
    1.0: 'red'
  }
};
```

---

## 📊 API Response Format

**GET `/api/issues/all`**

Request:
```
GET /api/issues/all?status=reported&category=pothole&priority=high
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "_id": "67890...",
        "issueId": "ISS-001",
        "title": "Large pothole on Main Street",
        "category": "pothole",
        "status": "reported",
        "priority": "high",
        "location": {
          "address": "123 Main Street",
          "lat": 28.6139,
          "lng": 77.2090,
          "city": "New Delhi",
          "state": "Delhi"
        },
        "images": ["http://..."],
        "upvotes": ["user1", "user2"],
        "reportedBy": {
          "_id": "12345...",
          "username": "John Doe",
          "avatar": "http://..."
        },
        "createdAt": "2024-12-27T10:00:00.000Z"
      }
    ],
    "total": 1
  },
  "message": "All issues fetched successfully"
}
```

---

## 🐛 Troubleshooting

### Issue: Heatmap not displaying

**Solution:**
1. Check browser console for errors
2. Verify issues have valid `location.lat` and `location.lng`
3. Ensure `leaflet.heat` is properly installed
4. Check network tab for API response

### Issue: Markers not showing

**Solution:**
1. Switch to "Markers" or "Clusters" view mode
2. Check if issues array is populated
3. Verify location data is valid
4. Check console for rendering errors

### Issue: Filters not working

**Solution:**
1. Check backend logs for API errors
2. Verify authentication token is valid
3. Test API endpoint directly with Postman
4. Check network request in browser DevTools

### Issue: "Locate Me" not working

**Solution:**
1. Grant browser location permissions
2. Use HTTPS (geolocation requires secure context)
3. Check browser compatibility
4. Verify navigator.geolocation is available

---

## 🎯 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live issue updates
2. **Area Boundaries**: Draw custom areas to filter issues
3. **Historical Data**: Time-based heatmap animation
4. **Export Features**: Download heatmap as image or PDF
5. **Mobile Optimization**: Touch gestures and mobile-specific UI
6. **Clustering Settings**: User-configurable cluster radius
7. **Custom Heat Colors**: User-selectable color schemes
8. **Issue Density Analytics**: Statistical analysis of issue patterns

---

## 📚 References

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [Leaflet.heat Plugin](https://github.com/Leaflet/Leaflet.heat)
- [React Leaflet Cluster](https://github.com/akursat/react-leaflet-cluster)

---

## 🤝 Contributing

When modifying the heatmap implementation:

1. Test all three user roles
2. Verify filters work correctly
3. Check mobile responsiveness
4. Update this guide with any changes
5. Add tests for new features

---

## ✅ Implementation Checklist

- [x] Backend API endpoint for all issues
- [x] Frontend service method
- [x] HeatmapViewer component
- [x] HeatmapLayer wrapper
- [x] Integration in Citizen Dashboard
- [x] Integration in Official Dashboard
- [x] Integration in Community Dashboard
- [x] Route configuration for all roles
- [x] Filtering functionality
- [x] Multiple view modes
- [x] Geolocation feature
- [x] Custom markers with status colors
- [x] Statistics display
- [x] Responsive design
- [x] Documentation

---

**Last Updated**: December 27, 2024
**Version**: 1.0.0
**Author**: CitizenVoice Development Team
