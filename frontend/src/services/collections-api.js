/* ============================================
   APILens — Collections API Service
   ============================================ */

import { apiRequest } from './auth.js';
import { API_BASE_URL } from '../config/api.js';

const BASE_URL = `${API_BASE_URL}/api/collections`;

export async function fetchCollections() {
  const res = await apiRequest(BASE_URL);
  if (!res.ok) throw new Error('Failed to load collections');
  return res.json();
}

export async function createCollection(name, description = '') {
  const res = await apiRequest(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create collection');
  }
  return res.json();
}

export async function updateCollection(id, name, description) {
  const res = await apiRequest(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to update collection');
  return res.json();
}

export async function deleteCollection(id) {
  const res = await apiRequest(`${BASE_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete collection');
  return res.json();
}

export async function addCollectionRequest(collectionId, requestData) {
  const res = await apiRequest(`${BASE_URL}/${collectionId}/requests`, {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
  if (!res.ok) throw new Error('Failed to save request to collection');
  return res.json();
}

export async function updateCollectionRequest(collectionId, requestId, requestData) {
  const res = await apiRequest(`${BASE_URL}/${collectionId}/requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(requestData)
  });
  if (!res.ok) throw new Error('Failed to update request');
  return res.json();
}

export async function deleteCollectionRequest(collectionId, requestId) {
  const res = await apiRequest(`${BASE_URL}/${collectionId}/requests/${requestId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete request');
  return res.json();
}

export async function createCollectionFolder(collectionId, folderName) {
  const res = await apiRequest(`${BASE_URL}/${collectionId}/folders`, {
    method: 'POST',
    body: JSON.stringify({ name: folderName })
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return res.json();
}

export async function deleteCollectionFolder(collectionId, folderId) {
  const res = await apiRequest(`${BASE_URL}/${collectionId}/folders/${folderId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete folder');
  return res.json();
}
