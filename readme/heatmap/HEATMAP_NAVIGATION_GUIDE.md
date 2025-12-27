# 🧭 Heatmap Navigation Guide

## Quick Access Routes

### Citizen Users 👥
**Route**: `/dashboard/citizen/heatmap`

**Full URL**: `http://localhost:5173/dashboard/citizen/heatmap`

**From Dashboard**:
1. Login as Citizen
2. You'll land on `/dashboard/citizen` (home)
3. Navigate to `/dashboard/citizen/heatmap` in the address bar
4. Or add a "Heatmap" link to the Sidebar navigation

---

### Official Users 🏛️
**Route**: `/dashboard/official/map` or `/dashboard/official/heatmap`

**Full URL**: `http://localhost:5173/dashboard/official/map`

**From Dashboard**:
1. Login as Official
2. You'll land on `/dashboard/official` (home)
3. Navigate to `/dashboard/official/map` in the address bar
4. The heatmap replaces the old placeholder map

---

### Community Users 🏘️
**Route**: `/dashboard/community/map` or `/dashboard/community/heatmap`

**Full URL**: `http://localhost:5173/dashboard/community/map`

**From Dashboard**:
1. Login as Community Member
2. You'll land on `/dashboard/community` (home)
3. Navigate to `/dashboard/community/map` in the address bar
4. The heatmap replaces the old placeholder map

---

## Adding Navigation Links (Optional)

If you want to add heatmap links to the sidebar navigation, here's how:

### Update Sidebar Component

File: `CitizenVoice/src/components/Dashboard/Shared/Sidebar.jsx`

Add this to the navigation items:

```jsx
// For Citizen
{
  label: 'Heatmap',
  icon: MapIcon, // or any icon you prefer
  path: '/dashboard/citizen/heatmap'
}

// For Official
{
  label: 'Area Map',
  icon: MapIcon,
  path: '/dashboard/official/map'
}

// For Community
{
  label: 'Heatmap',
  icon: MapIcon,
  path: '/dashboard/community/map'
}
```

---

## Direct Links from Home Dashboard

### Citizen Dashboard Home
You can add a button in the home view:

```jsx
// In CitizenDashboard.jsx - DashboardHome component
<button
  onClick={() => navigate('/dashboard/citizen/heatmap')}
  className="btn-primary"
>
  View Issues Heatmap
</button>
```

### Official Dashboard Home
Already has "Open full map" link that navigates to the heatmap.

### Community Dashboard Home
Already has "Open full map" link that navigates to the heatmap.

---

## What You'll See

### Upon Landing on Heatmap Page:

1. **Loading State** (2-3 seconds)
   - Spinner animation
   - "Loading map data..." message

2. **Loaded State**
   - Interactive map centered on default location
   - Three view mode buttons (Heatmap/Markers/Clusters)
   - Filter controls (Status, Category, Priority)
   - "Locate Me" button
   - Statistics cards showing issue counts
   - Legend at bottom

3. **Default View**
   - Starts in "Heatmap" mode
   - Shows all issues (no filters applied)
   - Heat overlay visible with color gradient
   - Statistics showing total counts by status

---

## First Time User Flow

```
1. Login → Dashboard Home
           ↓
2. Click Sidebar Link (if added) OR Type URL directly
           ↓
3. Heatmap Page Loads
           ↓
4. Map displays with default center
           ↓
5. Try "Locate Me" to center on your location
           ↓
6. Switch between view modes to see different visualizations
           ↓
7. Apply filters to focus on specific issues
           ↓
8. Click markers (in Markers/Clusters mode) to see details
```

---

## URL Structure

```
Base: http://localhost:5173

Routes:
├── /dashboard/citizen/heatmap      → Citizen Heatmap
├── /dashboard/official/map         → Official Map (Heatmap)
├── /dashboard/official/heatmap     → Official Heatmap (same as /map)
├── /dashboard/community/map        → Community Map (Heatmap)
└── /dashboard/community/heatmap    → Community Heatmap (same as /map)
```

---

## Tips for Navigation

### Browser Bookmarks
Create bookmarks for quick access:
- Bookmark: "CitizenVoice - Heatmap"
- URL: `http://localhost:5173/dashboard/citizen/heatmap`

### Browser History
After visiting once, you can use browser back/forward buttons or type in the address bar and it will autocomplete.

### Keyboard Shortcuts
If you add keyboard shortcuts to your app:
- `Ctrl/Cmd + M` could open the map
- `Ctrl/Cmd + H` could open the heatmap

---

## For Developers: Adding Menu Items

### Example: Add to Sidebar Navigation

```jsx
// CitizenVoice/src/components/Dashboard/Shared/Sidebar.jsx

const navigationItems = {
  citizen: [
    { label: 'Dashboard', icon: Home, path: '/dashboard/citizen' },
    { label: 'My Issues', icon: FileText, path: '/dashboard/citizen/issues' },
    { label: 'Report Issue', icon: Plus, path: '/dashboard/citizen/report' },
    { label: 'Issue Map', icon: MapPin, path: '/dashboard/citizen/map' },
    { label: 'Heatmap', icon: Flame, path: '/dashboard/citizen/heatmap' }, // NEW
    { label: 'Notifications', icon: Bell, path: '/dashboard/citizen/notifications' },
    { label: 'Profile', icon: User, path: '/dashboard/citizen/profile' },
    { label: 'Settings', icon: Settings, path: '/dashboard/citizen/settings' },
  ],
  official: [
    { label: 'Dashboard', icon: Home, path: '/dashboard/official' },
    { label: 'Assigned Issues', icon: Inbox, path: '/dashboard/official/assigned' },
    { label: 'Team', icon: Users, path: '/dashboard/official/team' },
    { label: 'Analytics', icon: BarChart, path: '/dashboard/official/analytics' },
    { label: 'Area Map', icon: MapPin, path: '/dashboard/official/map' }, // UPDATED
    { label: 'Settings', icon: Settings, path: '/dashboard/official/settings' },
  ],
  community: [
    { label: 'Dashboard', icon: Home, path: '/dashboard/community' },
    { label: 'Area Issues', icon: FileText, path: '/dashboard/community/area' },
    { label: 'Verification', icon: CheckCircle, path: '/dashboard/community/verify' },
    { label: 'Statistics', icon: BarChart, path: '/dashboard/community/stats' },
    { label: 'Community Map', icon: MapPin, path: '/dashboard/community/map' }, // UPDATED
    { label: 'Settings', icon: Settings, path: '/dashboard/community/settings' },
  ],
};
```

---

## Testing Navigation

### Test Checklist:
- [ ] Can access heatmap URL directly
- [ ] Heatmap loads without errors
- [ ] Can navigate back to dashboard home
- [ ] Browser back button works correctly
- [ ] Refreshing page maintains state
- [ ] Deep linking works (sharing URL with others)

---

## Common Questions

**Q: Why two routes for Official/Community (/map and /heatmap)?**
A: Both point to the same component for flexibility. Use `/map` for consistency with existing UI, or `/heatmap` for clarity.

**Q: Can I change the default route?**
A: Yes, edit the Route components in the respective Dashboard files.

**Q: Will the heatmap work in production?**
A: Yes, but update the URLs from localhost to your production domain.

**Q: Can I make heatmap the default view?**
A: Yes, change the `index` route to render `<HeatmapPage />` instead of `<DashboardHome />`.

---

## Production Deployment URLs

When deployed, URLs will be:
```
https://yourdomain.com/dashboard/citizen/heatmap
https://yourdomain.com/dashboard/official/map
https://yourdomain.com/dashboard/community/map
```

Make sure to:
1. Update API base URL in environment variables
2. Configure proper redirects for SPA routing
3. Enable HTTPS for geolocation to work

---

## Summary

✅ **Citizen**: Navigate to `/dashboard/citizen/heatmap`
✅ **Official**: Navigate to `/dashboard/official/map`
✅ **Community**: Navigate to `/dashboard/community/map`

**All three routes are working and ready to use!** 🗺️
