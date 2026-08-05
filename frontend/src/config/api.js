/* ============================================
   APILens — Frontend API Configuration
   ============================================ */

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // Fallback auto-detection when VITE_API_URL environment variable is omitted
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    const origin = window.location.origin;
    if (origin.includes('api-lens')) {
      return origin.replace('api-lens', 'apilens-backend').replace(/\/$/, '');
    }
  }

  return 'http://localhost:5000';
}

export const API_BASE_URL = getApiBaseUrl();
