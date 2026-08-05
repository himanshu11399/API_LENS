/* ============================================
   APILens — History API Service
   ============================================ */

import { apiRequest } from './auth.js';
import { API_BASE_URL } from '../config/api.js';

const BASE_URL = `${API_BASE_URL}/api/history`;

export async function fetchHistoryLogs({ page = 1, limit = 20, search = '', method = 'ALL', status = 'ALL' } = {}) {
  const params = new URLSearchParams({
    page,
    limit,
    search,
    method,
    status
  });

  const res = await apiRequest(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load request history');
  return res.json();
}

export async function deleteHistoryItem(id) {
  const res = await apiRequest(`${BASE_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete history item');
  return res.json();
}

export async function clearAllHistory() {
  const res = await apiRequest(BASE_URL, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}

export async function rerunRequestLog(id) {
  const res = await apiRequest(`${BASE_URL}/${id}/rerun`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to rerun request');
  return res.json();
}
