// app/(auth)/signup/oauth-handler.ts
// This script should run before OAuth redirect to set cookie from localStorage

export function setupOAuthStateHandler() {
  // Check if there's a pending user type in localStorage
  const pendingUserType = localStorage.getItem("pending_user_type");

  if (pendingUserType) {
    // Set it as a cookie so the server can read it
    document.cookie = `pending_user_type=${pendingUserType}; path=/; max-age=600; SameSite=Lax`;
  }
}

// Call this before initiating OAuth
// Usage in signup page: setupOAuthStateHandler() before the OAuth redirect
