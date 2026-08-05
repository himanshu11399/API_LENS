/* ============================================
   APILens — Auth Service
   Manages authentication state, tokens, and API calls
   ============================================ */

import {
  getTokens,
  setTokens,
  setAccessToken,
  clearTokens,
  getStoredUser,
  setStoredUser,
  clearAuthData,
} from "./storage.js";
import { API_BASE_URL } from "../config/api.js";

const BASE_URL = `${API_BASE_URL}/api/auth`;

// Event listeners for auth state changes
const authListeners = new Set();

export function onAuthChange(callback) {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyAuthChange() {
  const user = getStoredUser();
  authListeners.forEach((cb) => cb(user));
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest(url, options = {}) {
  const { accessToken } = getTokens();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired, attempt refresh and retry once
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.code === "TOKEN_EXPIRED") {
      const refreshed = await silentRefresh();
      if (refreshed) {
        const newTokens = getTokens();
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  return response;
}

/**
 * Silently refresh the access token using the stored refresh token
 */
async function silentRefresh() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid — force logout
      clearAuthData();
      notifyAuthChange();
      return false;
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Register a new user
 */
export async function register(username, email, password) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  setTokens(data.accessToken, data.refreshToken);
  setStoredUser(data.user);
  notifyAuthChange();
  return data;
}

/**
 * Login with email and password
 */
export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  setTokens(data.accessToken, data.refreshToken);
  setStoredUser(data.user);
  notifyAuthChange();
  return data;
}

/**
 * Logout current user
 */
export async function logout() {
  const { refreshToken } = getTokens();

  try {
    if (refreshToken) {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // Ignore network errors during logout
  } finally {
    clearAuthData();
    notifyAuthChange();
  }
}

/**
 * Get current user info — returns null if not authenticated
 */
export function getCurrentUser() {
  return getStoredUser();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const { accessToken } = getTokens();
  return !!accessToken;
}

/**
 * Fetch user profile from server
 */
export async function fetchProfile() {
  const response = await apiRequest(`${BASE_URL}/me`);
  if (!response.ok) return null;
  const data = await response.json();
  setStoredUser(data.user);
  return data.user;
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  const response = await apiRequest(`${BASE_URL}/profile`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Profile update failed");
  }

  setStoredUser(data.user);
  notifyAuthChange();
  return data.user;
}

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword) {
  const response = await apiRequest(`${BASE_URL}/change-password`, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Password change failed");
  }

  // Update tokens after password change
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Password reset failed");
  }

  // Auto-login after reset
  setTokens(data.accessToken, data.refreshToken);
  setStoredUser(data.user);
  notifyAuthChange();
  return data;
}
