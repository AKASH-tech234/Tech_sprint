# 🎮 CitizenVoice Gamification System

## Overview

CitizenVoice uses an **outcome-driven gamification system** that rewards verified civic contributions, not just activity. This prevents gaming and ensures meaningful community engagement.

---

## 🎯 Core Principles

| Principle            | Description                                          |
| -------------------- | ---------------------------------------------------- |
| **Outcome-Based**    | Points only awarded after community verification     |
| **Community-Scoped** | No global leaderboards - all scoring is per-district |
| **Anti-Gaming**      | Penalties for fake issues and spam                   |
| **Role Progression** | Roles unlock responsibility, not authority           |

---

## 💰 Reputation Points (RP) System

### Earning RP (Positive Actions)

| Action                            | Points     | Trigger                                  |
| --------------------------------- | ---------- | ---------------------------------------- |
| Issue verified as resolved        | **+10 RP** | After community confirms resolution      |
| Upload valid after-photo          | **+8 RP**  | After photo is verified                  |
| Accurate issue categorization     | **+5 RP**  | When quorum confirms category is correct |
| Flag false resolution (confirmed) | **+12 RP** | When reopening is justified              |
| Community-confirmed report        | **+15 RP** | When 3+ verifications confirm the issue  |

### Penalties (Negative Actions)

| Action              | Points     | Additional Effect           |
| ------------------- | ---------- | --------------------------- |
| Fake/reopened issue | **-20 RP** | Issue flagged               |
| Spam reporting      | **-10 RP** | 24-hour cooldown + RP decay |

---

## 🏆 Role Progression

Roles are calculated dynamically based on RP:

| Role                    | RP Threshold | Icon | Description                                     |
| ----------------------- | ------------ | ---- | ----------------------------------------------- |
| **Resident**            | 0 RP         | 🏠   | Default role for all community members          |
| **Civic Helper**        | ≥50 RP       | 🤝   | Active contributor with verified outcomes       |
| **Community Validator** | ≥120 RP      | ✅   | Trusted member who can verify issues            |
| **Civic Champion**      | ≥300 RP      | 🏆   | Community leader with exceptional contributions |

> **Important:** Roles unlock responsibility, not authority. No single user can resolve issues alone - community consensus is always required.

---

## 📊 Community Impact Score

Each community/district has an impact score calculated as:

```
ImpactScore = (Verified Resolutions × 2) - (Reopened Issues × 3) - (Avg Resolution Delay / SLA)
```

- **Publicly readable** by all users
- **Cached** and recomputed every 6 hours
- Shows community health at a glance

---

## 🔄 Verification Quorum

- Minimum **3 community verifications** required before RP is awarded
- Prevents single-user manipulation
- Both "correct" and "incorrect" votes count toward quorum
- Consensus (majority) determines the outcome

---

## 🛡️ Anti-Gaming Measures

1. **Idempotency Keys** - Prevents duplicate RP awards for same action
2. **Spam Cooldown** - 24-hour block after spam detection
3. **RP Floor** - RP cannot go below 0
4. **Transaction Safety** - All RP operations use MongoDB transactions
5. **Audit Trail** - Every RP event is logged with full metadata

---

## 📡 API Endpoints

All endpoints require authentication (`Authorization: Bearer <token>`)

### User Profile

```
GET /api/gamification/profile
GET /api/gamification/profile?districtId=maharashtra__mumbai
```

### Community Leaderboard

```
GET /api/gamification/leaderboard/:districtId?limit=20
```

### RP History

```
GET /api/gamification/rp-history?districtId=xxx&limit=20
```

### Community Impact Score

```
GET /api/gamification/impact/:districtId
```

### Role Progression Info

```
GET /api/gamification/roles
```

### Badges & Achievements

```
GET /api/gamification/badges
```

### Activity Timeline

```
GET /api/gamification/activity?limit=20
```

---

## 🗄️ Database Models

### CommunityReputation

Stores per-user, per-community reputation:

- `user` - User reference
- `districtId` - Community identifier
- `totalRP` - Current reputation points
- `role` - Calculated role
- `stats` - Action counters
- `spamCooldown` - Cooldown status

### ReputationEvent

Audit trail for all RP changes:

- `eventType` - Type of action
- `points` - Points awarded/deducted
- `idempotencyKey` - Prevents duplicates
- `quorumMet` - Verification status
- `relatedIssue` - Link to issue

### CommunityImpactScore

Community-level metrics:

- `districtId` - Community identifier
- `impactScore` - Calculated score
- `metrics` - Component values
- `roleDistribution` - Role breakdown

---

## 🎨 Frontend Integration

### Import the Dashboard

```jsx
import GamificationDashboard from "@/components/Gamificationdashboard";

// In your route/page:
<GamificationDashboard districtId="maharashtra__mumbai" />;
```

### Import the Service

```javascript
import { gamificationService } from "@/services/gamificationService";

// Get user profile
const profile = await gamificationService.getUserProfile(districtId);

// Get community leaderboard
const leaderboard = await gamificationService.getCommunityLeaderboard(
  districtId
);

// Get role info
const roleInfo = gamificationService.getRoleInfo("civic_helper");
// Returns: { displayName: "Civic Helper", icon: "🤝", color: "blue", threshold: 50 }
```

---

## 🔧 How It Works (Flow)

### Issue Verification Flow

```
1. User reports issue
   ↓
2. Community members verify (correct/incorrect)
   ↓
3. System checks: Total verifications ≥ 3?
   ↓
4. If YES → Quorum met!
   ↓
5. Determine consensus (more correct than incorrect?)
   ↓
6. If accurate → Award RP to reporter:
   - +15 RP (community confirmed)
   - +5 RP (accurate categorization)
   ↓
7. Update community impact score
```

### Issue Resolution Flow

```
1. Official marks issue as resolved
   ↓
2. Community verifies resolution
   ↓
3. If verified → Award +10 RP to reporter
   ↓
4. If false resolution → Award +12 RP to flagger
   ↓
5. Issue reopened, status changed to "in-progress"
```

---

## 📁 File Structure

```
Backend/
├── src/
│   ├── models/
│   │   ├── CommunityReputation.js   # Per-user reputation
│   │   ├── ReputationEvent.js       # Audit trail
│   │   ├── CommunityImpactScore.js  # Community metrics
│   │   └── ActivityLog.js           # Activity logging
│   ├── services/
│   │   ├── outcomeGamificationService.js  # Core RP logic
│   │   └── gamificationServices.js        # Legacy points
│   ├── controllers/
│   │   └── gamificationController.js
│   └── routes/
│       └── gamificationRoutes.js

CitizenVoice/
├── src/
│   ├── components/
│   │   └── Gamificationdashboard.jsx
│   └── services/
│       └── gamificationService.js
```

---

## ✅ Success Criteria

The system ensures:

- ✅ Never awards RP without verification
- ✅ Prevents gaming and abuse
- ✅ Is explainable and auditable
- ✅ Easy to extend later
- ✅ Community-scoped (no global rankings)
- ✅ Role progression based on outcomes

---

## 🚀 Quick Start

1. **Backend is running** on port 3000
2. **Frontend** imports `GamificationDashboard` component
3. **Pass `districtId`** prop for community-scoped data
4. **User must be authenticated** for API access

```jsx
// Example integration in a page
import GamificationDashboard from "../components/Gamificationdashboard";

function CommunityPage() {
  const userDistrict = "maharashtra__mumbai"; // From user context

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <GamificationDashboard districtId={userDistrict} />
    </div>
  );
}
```

---

## 📞 Support

For issues or questions about the gamification system, check:

- Backend logs for RP award events
- `ReputationEvent` collection for audit trail
- Browser console for frontend API errors
