/* ============================================
   APILens — LocalStorage Service
   ============================================ */

const PREFIX = 'apilens_';

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

/* ---- Auth Token Helpers ---- */

export function getTokens() {
  return {
    accessToken: get('accessToken', null),
    refreshToken: get('refreshToken', null)
  };
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) set('accessToken', accessToken);
  if (refreshToken) set('refreshToken', refreshToken);
}

export function setAccessToken(accessToken) {
  set('accessToken', accessToken);
}

export function clearTokens() {
  remove('accessToken');
  remove('refreshToken');
}

export function getStoredUser() {
  return get('user', null);
}

export function setStoredUser(user) {
  set('user', user);
}

export function clearStoredUser() {
  remove('user');
}

export function clearAuthData() {
  clearTokens();
  clearStoredUser();
}

/* ---- Domain helpers ---- */

export function getHistory() {
  return get('history', []);
}

export function addHistory(entry) {
  const hist = getHistory();
  hist.unshift({ ...entry, id: crypto.randomUUID(), timestamp: Date.now() });
  if (hist.length > 200) hist.length = 200;
  set('history', hist);
  return hist;
}

export function clearHistory() {
  set('history', []);
}

export function getCollections() {
  return get('collections', [
    {
      id: 'default',
      name: 'My Collection',
      requests: [
        { id: 'demo-1', name: 'Get Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts' },
        { id: 'demo-2', name: 'Get User', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users/1' },
        { id: 'demo-3', name: 'Create Post', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts' },
      ]
    }
  ]);
}

export function saveCollections(collections) {
  set('collections', collections);
}

export function getFavorites() {
  return get('favorites', []);
}

export function saveFavorites(favs) {
  set('favorites', favs);
}

export function getEnvironments() {
  return get('environments', [
    { key: 'BASE_URL', value: 'https://jsonplaceholder.typicode.com', enabled: true },
    { key: 'AUTH_TOKEN', value: 'Bearer your-token-here', enabled: true },
  ]);
}

export function saveEnvironments(envs) {
  set('environments', envs);
}

export function getWorkspaces() {
  return get('workspaces', [
    { id: 'default', name: 'Personal Workspace', active: true },
  ]);
}

export function saveWorkspaces(ws) {
  set('workspaces', ws);
}

export function getAnalyticsData() {
  return get('analytics', []);
}

export function addAnalyticsEntry(entry) {
  const data = getAnalyticsData();
  data.push({ ...entry, timestamp: Date.now() });
  if (data.length > 500) data.splice(0, data.length - 500);
  set('analytics', data);
  return data;
}
