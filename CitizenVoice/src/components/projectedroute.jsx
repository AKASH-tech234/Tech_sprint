// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DistrictSetup } from "./Dashboard/Shared/DistrictSetup";
import { useState } from "react";

// DEV MODE: Set to true to bypass auth check during development
const DEV_BYPASS_AUTH = false;

// Mock user for development testing
const DEV_MOCK_USER = {
  id: "dev-user-123",
  username: "dev_tester",
  email: "dev@test.com",
  role: "citizen", // Change to "official" or "community" to test other dashboards
  avatar: null,
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, setDistrict } = useAuth();
  const [districtSetupComplete, setDistrictSetupComplete] = useState(false);

  // DEV MODE: Bypass authentication
  if (DEV_BYPASS_AUTH) {
    console.warn(
      "⚠️ DEV MODE: Auth bypass enabled. Disable before production!"
    );
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent"></div>
          <p className="mt-4 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if official or community user needs to set district
  const needsDistrictSetup =
    (user.role === "official" || user.role === "community") &&
    (!user.district || !user.district.isSet) &&
    !districtSetupComplete;

  const handleDistrictSet = async ({ state, district }) => {
    await setDistrict(state, district);
    setDistrictSetupComplete(true);
  };

  return (
    <>
      {needsDistrictSetup && (
        <DistrictSetup onDistrictSet={handleDistrictSet} userRole={user.role} />
      )}
      {children}
    </>
  );
}
