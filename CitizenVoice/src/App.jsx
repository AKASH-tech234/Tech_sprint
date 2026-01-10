// src/App.jsx (Updated with Auth & Protected Routes)
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import { NotificationProvider } from "./context/NotificationContext";
import { ProtectedRoute } from "./components/projectedroute";
import { Landing, SignUp, Login, ForgotPassword, ResetPassword } from "./pages";
import Profile from "./pages/Profile";

// Dashboard imports
import CitizenDashboard from "./pages/Dashboard/CitizenDashboard";
import OfficialDashboard from "./pages/Dashboard/OfficialDashboard";
import CommunityDashboard from "./pages/Dashboard/CommunityDashboard";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            \n\n {/* Profile Route - Protected for all authenticated users */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  allowedRoles={["citizen", "official", "community"]}
                >
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Protected Dashboard Routes - Note the /* for nested routes */}
            <Route
              path="/dashboard/citizen/*"
              element={
                <ProtectedRoute allowedRoles={["citizen"]}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/official/*"
              element={
                <ProtectedRoute allowedRoles={["official"]}>
                  <OfficialDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/community/*"
              element={
                <ProtectedRoute allowedRoles={["community"]}>
                  <CommunityDashboard />
                </ProtectedRoute>
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
