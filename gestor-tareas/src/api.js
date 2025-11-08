// src/api.js
const API_URL = "http://127.0.0.1:8000";

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchTasks(status = null) {
  let url = `${API_URL}/tasks`;
  if (status) url += `?status=${encodeURIComponent(status)}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createTask(title, description = "") {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description })
  });
  return handleResponse(res);
}

export async function updateTask(id, title, description, status) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, status })
  });
  return handleResponse(res);
}

export async function updateStatus(id, status) {
  const res = await fetch(`${API_URL}/tasks/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

export async function getSummary() {
  const res = await fetch(`${API_URL}/tasks/summary`);
  return handleResponse(res);
}
