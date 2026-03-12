// frontend/js/api.js

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://projeto-saas-elx6.onrender.com/api";

export async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data) {
    if (isFormData) {
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || 'Erro na requisição');
  }

  return responseData;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}
