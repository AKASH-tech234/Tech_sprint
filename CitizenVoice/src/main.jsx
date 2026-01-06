import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// One-time cleanup of old localStorage data to prevent QuotaExceededError
// Only remove issue-related keys, preserve auth data
try {
  const keysToRemove = ['userIssues', 'issues', 'issueCache', 'issueDraft'];
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🧹 Cleaned up localStorage key: ${key}`);
    }
  });
} catch (e) {
  console.warn('localStorage cleanup failed:', e);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
