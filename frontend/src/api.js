const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('algospace_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    const message =
      (data && data.error) ||
      (data && data.detail) ||
      (typeof data === 'object' && Object.values(data).flat().join(' ')) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function fetchDocuments() {
  const response = await fetch(`${API_BASE}/documents/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function fetchDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createDocument(payload) {
  const response = await fetch(`${API_BASE}/documents/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateDocument(id, payload) {
  const response = await fetch(`${API_BASE}/documents/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteDocument(id) {
  const response = await fetch(`${API_BASE}/documents/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (response.status === 204) {
    return null;
  }
  return handleResponse(response);
}

export async function analyzeCode(code) {
  const response = await fetch(`${API_BASE}/analyze-code/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ code }),
  });
  return handleResponse(response);
}
