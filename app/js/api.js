/* ==========================================================================
   AI Emailer — API client
   One place that knows the backend's base URL and how to attach the JWT.
   Every real API call in the app should go through apiFetch(), not raw
   fetch(), so auth and error handling stay consistent.
   ========================================================================== */

const API_BASE_URL = "https://localhost:5080"; // change when you deploy
const TOKEN_KEY = "ai-emailer-token";
const SYSTEM_KEY = "U2FsdGVkX19xLv4O2Qxnq7S68uAj9KhS4TJkyW241SI="; // System Key for AiEmailer API
  
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
function logout() {
  clearToken();
  window.location.href = "login.html";
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["X-System-Key"] = SYSTEM_KEY;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Can't reach the server. Is the ASP.NET Core API running?");
  }

  if (response.status === 401) {
    clearToken();
    window.location.href = "login.html";
    throw new Error("Session expired.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }

  return data;
}

// Separate from apiFetch because file uploads use multipart/form-data, not
// JSON — the browser needs to set its own Content-Type (with the multipart
// boundary), so we must NOT set Content-Type manually here.
async function apiUpload(path, file) {
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["X-System-Key"] = SYSTEM_KEY;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (networkErr) {
    throw new Error("Can't reach the server. Is the ASP.NET Core API running?");
  }

  if (response.status === 401) {
    clearToken();
    window.location.href = "login.html";
    throw new Error("Session expired.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }

  return data;
}
