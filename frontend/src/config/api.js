/* ============================================
   APILens — Frontend API Configuration
   ============================================ */

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:5000';
}

export const API_BASE_URL = getApiBaseUrl();
