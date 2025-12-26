# CitizenVoice - Civic Issue Reporting Platform

A modern, Web3-themed React application for civic issue reporting and community engagement. Built with React, Vite, and Tailwind CSS.

![CitizenVoice](https://img.shields.io/badge/CitizenVoice-Civic%20Tech-rose)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.x-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-cyan)

---

## 📁 Project Structure

```
CitizenVoice/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images, icons, fonts
│   ├── components/
│   │   ├── landing/            # Landing page section components
│   │   │   ├── index.js        # Barrel export for all landing components
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── HowItWorksSection.jsx
│   │   │   ├── CardsSection.jsx
│   │   │   ├── ImpactSection.jsx
│   │   │   ├── CTASection.jsx
│   │   │   └── Footer.jsx
│   │   └── ui/                 # Reusable UI components
│   │       ├── index.js        # Barrel export for UI components
│   │       ├── Logo.jsx
│   │       ├── GlassHeader.jsx
│   │       ├── GradientButton.jsx
│   │       ├── FeatureSteps.jsx
│   │       ├── badge.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── interactive-hover-button.jsx
│   │       └── radial-orbital-timeline.jsx
│   ├── lib/
│   │   └── utils.js            # Utility functions (cn helper for Tailwind)
│   ├── pages/
│   │   ├── index.js            # Barrel export for pages
│   │   ├── Landing.jsx         # Home/Landing page
│   │   └── SignUp.jsx          # User registration page
│   ├── App.jsx                 # Main app with routing
│   ├── App.css                 # App-specific styles
│   ├── index.css               # Global styles & Tailwind imports
│   └── main.jsx                # React entry point
├── index.html                  # HTML template
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
└── eslint.config.js            # ESLint configuration
```

---

## 🛣️ Frontend Routes

| Route     | Component | Description                                                        |
| --------- | --------- | ------------------------------------------------------------------ |
| `/`       | `Landing` | Home page with hero, features, how it works, impact stats, and CTA |
| `/signup` | `SignUp`  | User registration with role selection (Citizen/Official/Community) |
| `/signin` | _TODO_    | User login page (not yet implemented)                              |

### Route Configuration (`src/App.jsx`)

```jsx
<Router>
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/signup" element={<SignUp />} />
  </Routes>
</Router>
```

---

## 🔌 Backend API Endpoints (For Backend Developers)

### Authentication Endpoints

| Method | Endpoint           | Request Body                          | Description               |
| ------ | ------------------ | ------------------------------------- | ------------------------- |
| `POST` | `/api/auth/signup` | `{ username, email, password, role }` | Register new user         |
| `POST` | `/api/auth/signin` | `{ email, password }`                 | Login user                |
| `POST` | `/api/auth/google` | `{ token, role }`                     | Google OAuth signup/login |
| `POST` | `/api/auth/logout` | -                                     | Logout user               |
| `GET`  | `/api/auth/me`     | -                                     | Get current user profile  |

### User Roles

```javascript
const roles = ["citizen", "official", "community"];
```

| Role        | Description               | Permissions                                      |
| ----------- | ------------------------- | ------------------------------------------------ |
| `citizen`   | Regular users             | Report issues, track own reports, upvote         |
| `official`  | Municipal representatives | Manage issues, assign tasks, update status       |
| `community` | Neighborhood/org leaders  | View area reports, moderate, represent community |

### SignUp Form Data Structure

```javascript
// POST /api/auth/signup
{
  "username": "string",      // Required, unique
  "email": "string",         // Required, unique, valid email
  "password": "string",      // Required, min 8 characters
  "role": "citizen" | "official" | "community"  // Required
}
```

### Future API Endpoints (To Be Implemented)

| Method   | Endpoint                 | Description                                |
| -------- | ------------------------ | ------------------------------------------ |
| `POST`   | `/api/issues`            | Create new issue report                    |
| `GET`    | `/api/issues`            | Get all issues (with pagination & filters) |
| `GET`    | `/api/issues/:id`        | Get single issue details                   |
| `PATCH`  | `/api/issues/:id`        | Update issue status                        |
| `DELETE` | `/api/issues/:id`        | Delete issue                               |
| `POST`   | `/api/issues/:id/upvote` | Upvote an issue                            |
| `GET`    | `/api/issues/stats`      | Get dashboard statistics                   |

---

## 📦 Component Documentation

### Pages (`src/pages/`)

| File          | Export    | Imported By | Description                                      |
| ------------- | --------- | ----------- | ------------------------------------------------ |
| `Landing.jsx` | `Landing` | `App.jsx`   | Main landing page, composes all landing sections |
| `SignUp.jsx`  | `SignUp`  | `App.jsx`   | Registration page with role-based signup form    |
| `index.js`    | All pages | `App.jsx`   | Barrel export for clean imports                  |

### Landing Components (`src/components/landing/`)

| File                    | Export              | Imported By   | Description                                       |
| ----------------------- | ------------------- | ------------- | ------------------------------------------------- |
| `HeroSection.jsx`       | `HeroSection`       | `Landing.jsx` | Hero banner with CTA, animated city skyline       |
| `FeaturesSection.jsx`   | `FeaturesSection`   | `Landing.jsx` | Radial orbital timeline showing platform features |
| `HowItWorksSection.jsx` | `HowItWorksSection` | `Landing.jsx` | 4-step process with video placeholder             |
| `CardsSection.jsx`      | `CardsSection`      | `Landing.jsx` | 3D hover cards for Citizens/Officials/Communities |
| `ImpactSection.jsx`     | `ImpactSection`     | `Landing.jsx` | Animated statistics counters                      |
| `CTASection.jsx`        | `CTASection`        | `Landing.jsx` | Call-to-action section with signup links          |
| `Footer.jsx`            | `Footer`            | `Landing.jsx` | Site footer with links, newsletter, socials       |
| `index.js`              | All sections        | `Landing.jsx` | Barrel export for clean imports                   |

### UI Components (`src/components/ui/`)

| File                           | Export                     | Imported By                       | Description                                                     |
| ------------------------------ | -------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `Logo.jsx`                     | `Logo`                     | `GlassHeader`, `SignUp`, `Footer` | Geometric octagon logo with "CITIZEN VOICE" text                |
| `GlassHeader.jsx`              | `GlassHeader`              | `Landing.jsx`                     | Sticky glass-morphism navbar with scroll effects                |
| `GradientButton.jsx`           | `GradientButton`           | _Optional use_                    | Animated gradient button with CVA variants                      |
| `FeatureSteps.jsx`             | `FeatureSteps`             | `Landing.jsx`                     | Auto-playing feature carousel                                   |
| `badge.jsx`                    | `Badge`, `badgeVariants`   | _Optional use_                    | Shadcn-style badge component                                    |
| `button.jsx`                   | `Button`, `buttonVariants` | _Optional use_                    | Shadcn-style button with CVA                                    |
| `card.jsx`                     | `Card`, `CardHeader`, etc. | _Optional use_                    | Shadcn-style card components                                    |
| `interactive-hover-button.jsx` | `InteractiveHoverButton`   | _Optional use_                    | Button with slide hover effect                                  |
| `radial-orbital-timeline.jsx`  | `RadialOrbitalTimeline`    | `FeaturesSection.jsx`             | Animated orbital feature display                                |
| `index.js`                     | Selected exports           | Various                           | Barrel export (Logo, GradientButton, FeatureSteps, GlassHeader) |

### Utilities (`src/lib/`)

| File       | Export | Imported By   | Description                                          |
| ---------- | ------ | ------------- | ---------------------------------------------------- |
| `utils.js` | `cn`   | UI components | Tailwind class merge utility (clsx + tailwind-merge) |

---

## 🎨 Design System

### Color Palette (Web3 Theme)

```css
/* Primary Colors */
--rose-500: #f43f5e; /* Primary accent */
--pink-500: #ec4899; /* Secondary accent */
--violet-500: #8b5cf6; /* Tertiary accent */
--indigo-500: #6366f1; /* Quaternary accent */

/* Background */
--background: #0a0a0a; /* Dark background */

/* Text */
--foreground: #ffffff; /* White text */
--muted: rgba(255, 255, 255, 0.6); /* Muted text */
```

### Typography

- **Display Font**: Playfair Display (headings)
- **Body Font**: Inter (UI, body text)

### Gradient Patterns

```css
/* Primary gradient */
bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500

/* Secondary gradient */
bg-gradient-to-r from-violet-500 to-indigo-500
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd CitizenVoice

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Script    | Command           | Description                                   |
| --------- | ----------------- | --------------------------------------------- |
| `dev`     | `npm run dev`     | Start Vite dev server (http://localhost:5173) |
| `build`   | `npm run build`   | Build for production                          |
| `preview` | `npm run preview` | Preview production build                      |
| `lint`    | `npm run lint`    | Run ESLint                                    |

---

## 📚 Dependencies

### Production

| Package                    | Version  | Purpose                |
| -------------------------- | -------- | ---------------------- |
| `react`                    | ^19.2.0  | UI library             |
| `react-dom`                | ^19.2.0  | React DOM renderer     |
| `react-router-dom`         | ^7.x     | Client-side routing    |
| `lucide-react`             | ^0.562.0 | Icon library           |
| `framer-motion`            | ^12.x    | Animations             |
| `tailwindcss`              | ^4.x     | CSS framework          |
| `clsx`                     | ^2.x     | Conditional classes    |
| `tailwind-merge`           | ^3.x     | Tailwind class merging |
| `class-variance-authority` | ^0.7.x   | Component variants     |
| `@radix-ui/react-slot`     | ^1.x     | Slot composition       |

### Development

| Package                | Purpose                 |
| ---------------------- | ----------------------- |
| `vite`                 | Build tool & dev server |
| `eslint`               | Code linting            |
| `@vitejs/plugin-react` | React plugin for Vite   |

---

## 🔄 Navigation Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Landing Page (/)                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │  GlassHeader                                        ││
│  │  [Logo] [Features] [How It Works] ... [Report Issue]││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  HeroSection                                        ││
│  │  "Report an Issue" button ──────────────────────────┼┼─────┐
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  FeaturesSection (RadialOrbitalTimeline)            ││     │
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  HowItWorksSection                                  ││     │
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  CardsSection                                       ││     │
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  ImpactSection                                      ││     │
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  CTASection                                         ││     │
│  │  "Start Reporting Now" button ──────────────────────┼┼─────┤
│  └─────────────────────────────────────────────────────┘│     │
│  ┌─────────────────────────────────────────────────────┐│     │
│  │  Footer                                             ││     │
│  └─────────────────────────────────────────────────────┘│     │
└─────────────────────────────────────────────────────────┘     │
                                                                │
                               ▼                                │
┌─────────────────────────────────────────────────────────┐     │
│                   SignUp Page (/signup)                  │◄────┘
│  ┌─────────────────────────────────────────────────────┐│
│  │  Left: Branding & Stats (desktop only)              ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  Right: SignUp Card                                 ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │  Role Selection (Citizen/Official/Community)    │││
│  │  └─────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │  Form: Username, Email, Password                │││
│  │  └─────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │  [Create Account] [Sign up with Google]         │││
│  │  └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Integration Guide

### 1. Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. API Integration Points

#### SignUp Page (`src/pages/SignUp.jsx`)

Replace the mock handlers with actual API calls:

```javascript
// Current (mock)
const handleSubmit = (e) => {
  e.preventDefault();
  console.log("Sign Up Data:", { ...formData, role: selectedRole });
  alert(`Sign up attempted with role: ${selectedRole}`);
};

// Backend integration
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/auth/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: selectedRole }),
      }
    );
    const data = await response.json();
    if (response.ok) {
      // Store token, redirect to dashboard
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } else {
      // Handle errors
      setError(data.message);
    }
  } catch (err) {
    setError("Network error");
  }
};
```

#### Google OAuth

```javascript
const handleGoogleSignUp = async () => {
  // Implement Google OAuth flow
  // After getting Google token, send to backend:
  // POST /api/auth/google { token, role: selectedRole }
};
```

### 3. Protected Routes (Future)

```jsx
// Add to App.jsx
import { ProtectedRoute } from "./components/ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

---

## 📝 TODO / Future Pages

- [ ] `/signin` - Login page
- [ ] `/dashboard` - User dashboard (role-based)
- [ ] `/report` - Issue reporting form
- [ ] `/issues` - Issue listing/map view
- [ ] `/issues/:id` - Single issue details
- [ ] `/profile` - User profile settings
- [ ] `/admin` - Admin panel (officials only)

---

## 👥 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run linting: `npm run lint`
4. Commit with descriptive message
5. Push and create PR

---

## 📄 License

MIT License - See LICENSE file for details.
