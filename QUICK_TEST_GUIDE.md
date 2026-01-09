# Quick Testing Guide - Community Features

## 🚀 Quick Start

### Prerequisites
```bash
# Backend
cd Backend
npm install
npm start  # Runs on http://localhost:3000

# Frontend
cd CitizenVoice
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## ✅ Feature Testing Checklist

### 1. Voting System ⬆️
- [ ] Navigate to: `/dashboard/community/area`
- [ ] Click any issue card
- [ ] Click "Upvote" button
  - ✓ Count increases
  - ✓ Button fills with color
  - ✓ Shows "Upvoted" text
- [ ] Click "Upvote" again
  - ✓ Count decreases
  - ✓ Button returns to outline
  - ✓ Shows "Upvote" text

**Expected API Call:**
```
POST /api/issues/:issueId/upvote
Response: { upvotes: 5, hasUpvoted: true, action: "added" }
```

---

### 2. Commenting System 💬
- [ ] Open issue detail modal
- [ ] Type: "Test comment from community"
- [ ] Click Send button
  - ✓ Comment appears immediately
  - ✓ Shows your username
  - ✓ Shows "Just now" timestamp
  - ✓ Avatar displays first letter
- [ ] Add another comment
  - ✓ Both comments visible
  - ✓ Newest at bottom

**Expected API Calls:**
```
POST /api/issues/:issueId/comments
Body: { "text": "Test comment from community" }

GET /api/issues/:issueId/comments
Response: { comments: [...], total: 2 }
```

---

### 3. District Filtering 🗺️

#### Test A: State Filter
- [ ] Go to: `/dashboard/community/area`
- [ ] Click "Filters" button
- [ ] Select "Delhi" from State dropdown
  - ✓ Issues refresh automatically
  - ✓ Only Delhi issues shown
  - ✓ Count updates in header

#### Test B: District Filter
- [ ] Keep "Delhi" selected
- [ ] Type "Central" in District field
  - ✓ Issues filtered further
  - ✓ Location badge shows "Central"
  - ✓ URL doesn't change (client-side)

#### Test C: Combined Filters
- [ ] Select State: "Maharashtra"
- [ ] Enter District: "Mumbai"
- [ ] Select Category: "pothole"
- [ ] Select Status: "reported"
  - ✓ All filters apply simultaneously
  - ✓ Results match all criteria

**Expected API Call:**
```
GET /api/issues/all?state=Maharashtra&district=Mumbai&category=pothole&status=reported
```

---

### 4. Community Heatmap 🗺️

#### Test A: Map Loading
- [ ] Navigate to: `/dashboard/community/map`
- [ ] Wait for map to load
  - ✓ Map renders with markers
  - ✓ Stats cards show counts
  - ✓ Legend displays

#### Test B: Stats Cards
- [ ] Check stats display:
  - ✓ Total Issues count
  - ✓ High Priority (red)
  - ✓ Medium Priority (amber)
  - ✓ Low Priority (green)

#### Test C: Heatmap Filtering
- [ ] Click "Show" filters
- [ ] Select State: "Karnataka"
- [ ] Enter District: "Bangalore"
  - ✓ Stats update immediately
  - ✓ Map re-centers (if implemented)
  - ✓ Markers update

**Expected API Call:**
```
GET /api/issues/all?state=Karnataka&district=Bangalore
```

---

### 5. Dashboard Integration 🏠

#### Test A: Home Dashboard
- [ ] Navigate to: `/dashboard/community`
- [ ] Check display:
  - ✓ Stats cards show numbers
  - ✓ Heatmap preview visible
  - ✓ Priority breakdown shows
  - ✓ Recent activity populated

#### Test B: Navigation
- [ ] Click "View all" on Pending Verifications
  - ✓ Routes to `/dashboard/community/verify`
- [ ] Click "View all" on Top Issues
  - ✓ Routes to `/dashboard/community/area`
- [ ] Click "Open full map"
  - ✓ Routes to `/dashboard/community/map`

---

## 🧪 Integration Tests

### Test Scenario 1: Complete User Flow
1. Login as community user
2. Go to Area Issues
3. Apply filters: State = "Delhi", Category = "streetlight"
4. Click on an issue
5. Upvote the issue
6. Add comment: "Working on this issue"
7. Close modal
8. Navigate to Heatmap
9. Apply same filters
10. Verify issue appears on map

**Expected Result:** ✅ All operations successful, data consistent across views

---

### Test Scenario 2: Concurrent Actions
1. Open issue A in modal
2. Upvote issue A
3. Keep modal open
4. In new tab, upvote same issue A
5. Check both tabs

**Expected Result:** ✅ Upvote count syncs (manual refresh may be needed)

---

### Test Scenario 3: Error Handling
1. Disconnect internet
2. Try to upvote
   - ✓ Shows error message
   - ✓ Button disabled
3. Try to comment
   - ✓ Shows error message
   - ✓ Input blocked

**Expected Result:** ✅ Graceful error handling, no crashes

---

## 🐛 Common Issues & Solutions

### Issue: Comments not appearing
**Solution:**
```bash
# Check backend console for errors
# Verify token in localStorage
console.log(localStorage.getItem('token'))

# Check API endpoint
curl http://localhost:3000/api/issues/:issueId/comments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: Upvote doesn't persist
**Solution:**
- Clear browser cache
- Check MongoDB connection
- Verify user is authenticated
- Check browser console for errors

### Issue: Map not loading
**Solution:**
```javascript
// Check if HeatmapViewer component exists
// Verify map library imports
// Check console for Leaflet/MapBox errors
```

### Issue: District filter not working
**Solution:**
```bash
# Check backend logs
# Verify query params in Network tab
# Check if location.district exists in database

# Add district to existing issues:
db.issues.updateMany(
  {},
  { $set: { "location.district": "Test District" } }
)
```

---

## 📊 Performance Testing

### Load Test: Area Issues
- [ ] Load page with 100+ issues
  - ✓ Renders in < 2 seconds
  - ✓ Smooth scrolling
  - ✓ No memory leaks

### Load Test: Comments
- [ ] Open issue with 50+ comments
  - ✓ Loads all comments
  - ✓ Scroll works smoothly
  - ✓ New comments append correctly

---

## 🔍 Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (Chrome Mobile, Safari iOS)

---

## 📱 Responsive Testing

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Check:**
- ✓ Modal fits screen
- ✓ Filters stack properly
- ✓ Map is scrollable
- ✓ Buttons are tappable

---

## ✅ Final Verification

Before considering complete:
- [ ] All API endpoints return correct status codes
- [ ] All console errors resolved
- [ ] All components render without warnings
- [ ] Database schema updated
- [ ] Documentation is accurate
- [ ] Code is properly commented
- [ ] No hardcoded values
- [ ] Error boundaries in place

---

## 🎯 Success Criteria

**Backend:**
- ✅ Comment endpoints working
- ✅ Upvote endpoint working
- ✅ District filtering working
- ✅ Proper error handling
- ✅ Data validation

**Frontend:**
- ✅ IssueDetailModal displays correctly
- ✅ Voting updates in real-time
- ✅ Comments post and display
- ✅ Filters apply correctly
- ✅ Heatmap renders with data
- ✅ Navigation works seamlessly

**Integration:**
- ✅ All features work together
- ✅ Data persists correctly
- ✅ No race conditions
- ✅ Smooth user experience

---

## 📞 Need Help?

**Backend Issues:**
- Check `Backend/src/controllers/issueController.js`
- Review routes in `Backend/src/routes/issueRoutes.js`
- Check MongoDB connection

**Frontend Issues:**
- Check component files in `CitizenVoice/src/components/Dashboard/Community/`
- Review service methods in `CitizenVoice/src/services/issueService.js`
- Check browser console for errors

**Documentation:**
- See `COMMUNITY_FEATURES_IMPLEMENTATION.md`
- Review `BACKEND_API_COMPLETE.md`
- Check individual component comments

---

*Happy Testing! 🎉*
