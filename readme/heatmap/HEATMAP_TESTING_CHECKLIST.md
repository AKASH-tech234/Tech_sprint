# 🧪 Heatmap Testing Checklist

## Pre-Testing Setup

### 1. Backend Server
```bash
cd Backend
npm install
npm run dev
```
Expected: Server running on `http://localhost:5000`

### 2. Frontend Server
```bash
cd CitizenVoice
npm install
npm run dev
```
Expected: App running on `http://localhost:5173`

### 3. Database Setup
- Ensure MongoDB is running
- Verify database has test issues with location data
- Each issue should have: `location: { lat, lng, address }`

---

## Testing Scenarios

### ✅ Backend API Testing

#### Test 1: Get All Issues (No Filters)
```bash
# Using curl or Postman
GET http://localhost:5000/api/issues/all
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "issues": [...],
    "total": <number>
  }
}
```

#### Test 2: Get Filtered Issues (Status)
```bash
GET http://localhost:5000/api/issues/all?status=reported
Authorization: Bearer YOUR_TOKEN
```

**Expected:** Only issues with status="reported"

#### Test 3: Get Filtered Issues (Category + Priority)
```bash
GET http://localhost:5000/api/issues/all?category=pothole&priority=high
Authorization: Bearer YOUR_TOKEN
```

**Expected:** Only high-priority pothole issues

#### Test 4: Search Issues
```bash
GET http://localhost:5000/api/issues/all?search=street
Authorization: Bearer YOUR_TOKEN
```

**Expected:** Issues with "street" in title or description

---

### ✅ Frontend Component Testing

### Test Suite A: Citizen Dashboard

#### Navigate to Heatmap
1. Login as citizen user
2. Navigate to: `http://localhost:5173/dashboard/citizen/heatmap`
3. ✅ Verify page loads without errors
4. ✅ Verify map displays with default center
5. ✅ Verify loading state shows initially
6. ✅ Verify header shows "Local Issues Heatmap"

#### View Mode Switching
1. Click "Heatmap" button
   - ✅ Heat overlay appears
   - ✅ Colors range from blue → yellow → red
   - ✅ No individual markers visible

2. Click "Markers" button
   - ✅ Heat overlay disappears
   - ✅ Individual markers appear
   - ✅ Markers colored by status (red/yellow/blue/green)

3. Click "Clusters" button
   - ✅ Markers group into clusters
   - ✅ Cluster shows count badge
   - ✅ Clicking cluster zooms in

#### Filter Testing
1. Status Filter:
   - ✅ Select "Reported" → map updates
   - ✅ Stats cards update
   - ✅ Only reported issues shown

2. Category Filter:
   - ✅ Select "Pothole" → map updates
   - ✅ Only pothole issues shown

3. Priority Filter:
   - ✅ Select "High" → map updates
   - ✅ Only high priority issues shown

4. Combined Filters:
   - ✅ Select multiple filters → results intersect correctly

#### Interactive Features
1. Locate Me:
   - ✅ Click "Locate Me" button
   - ✅ Browser requests location permission
   - ✅ Map centers on user location
   - ✅ Zoom level increases to 14

2. Marker Popups (Markers View):
   - ✅ Click marker → popup opens
   - ✅ Shows issue title
   - ✅ Shows description (truncated)
   - ✅ Shows status badge
   - ✅ Shows category badge
   - ✅ Shows image (if available)

3. Statistics Cards:
   - ✅ Reported count correct
   - ✅ Acknowledged count correct
   - ✅ In Progress count correct
   - ✅ Resolved count correct
   - ✅ Updates when filters change

#### Responsive Design
1. Desktop (1920x1080):
   - ✅ Layout correct
   - ✅ All controls visible
   - ✅ Map fills space

2. Tablet (768x1024):
   - ✅ Controls stack properly
   - ✅ Map responsive
   - ✅ Filters accessible

3. Mobile (375x667):
   - ✅ Single column layout
   - ✅ Touch controls work
   - ✅ Map zoomable

---

### Test Suite B: Official Dashboard

#### Navigate to Heatmap
1. Login as official user
2. Navigate to: `http://localhost:5173/dashboard/official/map`
3. ✅ Verify page loads without errors
4. ✅ Verify header shows "Official Area Management Map"
5. ✅ All same features as citizen work

#### Official-Specific Testing
1. ✅ Can see all issues (not just own)
2. ✅ Filter by assigned status
3. ✅ View high-priority issues in red zones
4. ✅ Statistics show all issues in jurisdiction

---

### Test Suite C: Community Dashboard

#### Navigate to Heatmap
1. Login as community user
2. Navigate to: `http://localhost:5173/dashboard/community/map`
3. ✅ Verify page loads without errors
4. ✅ Verify header shows "Community Issues Heatmap"
5. ✅ All same features as citizen work

#### Community-Specific Testing
1. ✅ Can see all community issues
2. ✅ Filter by area/neighborhood
3. ✅ View verification candidates
4. ✅ Statistics show community metrics

---

## Browser Compatibility Testing

### Chrome
- ✅ Heatmap renders correctly
- ✅ Geolocation works
- ✅ All interactions smooth
- ✅ Console has no errors

### Firefox
- ✅ Heatmap renders correctly
- ✅ Geolocation works
- ✅ All interactions smooth
- ✅ Console has no errors

### Safari
- ✅ Heatmap renders correctly
- ✅ Geolocation works
- ✅ All interactions smooth
- ✅ Console has no errors

### Edge
- ✅ Heatmap renders correctly
- ✅ Geolocation works
- ✅ All interactions smooth
- ✅ Console has no errors

---

## Performance Testing

### Load Time
- ✅ Initial map load < 3 seconds
- ✅ Filter updates < 1 second
- ✅ View mode switching instant
- ✅ No lag when panning/zooming

### Memory Usage
- ✅ No memory leaks after extended use
- ✅ Smooth with 100+ markers
- ✅ Heatmap updates without freezing

### Network
- ✅ API calls debounced
- ✅ No duplicate requests
- ✅ Proper error handling on network failure

---

## Error Handling Testing

### No Issues Scenario
1. Apply filter that returns 0 issues
   - ✅ Shows "No issues found" message
   - ✅ Map still functional
   - ✅ Can remove filters

### Network Error
1. Disconnect network
2. Try to load heatmap
   - ✅ Shows error message
   - ✅ Provides retry option
   - ✅ Graceful degradation

### Invalid Location Data
1. Issue with missing lat/lng
   - ✅ Skipped from map
   - ✅ No console errors
   - ✅ Other issues render correctly

### Authentication Error
1. Token expired
   - ✅ Redirects to login
   - ✅ Shows appropriate message

---

## Security Testing

### Authorization
- ✅ Cannot access without login
- ✅ Protected routes work correctly
- ✅ Role-based access enforced

### Data Validation
- ✅ Backend validates filters
- ✅ SQL injection prevented
- ✅ XSS prevented in popups

---

## Accessibility Testing

### Keyboard Navigation
- ✅ Can tab through controls
- ✅ Enter key activates buttons
- ✅ Escape closes popups
- ✅ Map keyboard controls work

### Screen Reader
- ✅ Controls have proper labels
- ✅ Status updates announced
- ✅ Map has alt text

### Color Contrast
- ✅ Text readable on map
- ✅ Buttons have good contrast
- ✅ Status colors distinguishable

---

## Integration Testing

### End-to-End Flow
1. ✅ User logs in
2. ✅ Navigates to heatmap
3. ✅ Applies filters
4. ✅ Views issue details
5. ✅ Changes view modes
6. ✅ Uses geolocation
7. ✅ Logs out successfully

---

## Known Issues / Limitations

1. **Heatmap Performance**: With 1000+ issues, heatmap may slow down
   - **Mitigation**: Implement pagination or viewport-based loading

2. **Geolocation Accuracy**: Depends on device GPS
   - **Mitigation**: Show accuracy radius on map

3. **Cluster Overlap**: Very dense areas may have overlapping clusters
   - **Mitigation**: Adjust cluster radius dynamically

---

## Test Data Requirements

### Minimum Test Data
- At least 20 issues with valid coordinates
- Issues spread across different locations
- Mix of all statuses (reported, acknowledged, in-progress, resolved)
- Mix of all categories
- Mix of all priorities

### Sample Issue JSON
```json
{
  "title": "Test Pothole",
  "description": "Test description",
  "category": "pothole",
  "priority": "high",
  "status": "reported",
  "location": {
    "address": "123 Test St",
    "lat": 28.6139,
    "lng": 77.2090,
    "city": "Test City",
    "state": "Test State"
  },
  "images": ["http://example.com/image.jpg"]
}
```

---

## Automated Test Commands

```bash
# Run backend tests
cd Backend
npm test

# Run frontend tests
cd CitizenVoice
npm test

# Run linting
npm run lint

# Build production
npm run build
```

---

## Sign-off

### Tester Information
- **Tester Name**: _____________
- **Date**: _____________
- **Browser**: _____________
- **OS**: _____________

### Test Results
- [ ] All tests passed
- [ ] Minor issues found (documented below)
- [ ] Major issues found (requires fixes)

### Notes:
_____________________________________________
_____________________________________________
_____________________________________________

---

**Testing Completed**: ☐
**Ready for Production**: ☐
