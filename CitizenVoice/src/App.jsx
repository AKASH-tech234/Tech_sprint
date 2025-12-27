// src/App.jsx (Updated with Auth & Protected Routes)
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/projectedroute";
import { Landing, SignUp, Login } from "./pages";

// Dashboard imports
import CitizenDashboard from "./pages/Dashboard/CitizenDashboard";
import OfficialDashboard from "./pages/Dashboard/OfficialDashboard";
import CommunityDashboard from "./pages/Dashboard/CommunityDashboard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

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
    </AuthProvider>
  );
}

export default App;
