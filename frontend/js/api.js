// frontend/js/api.js

// Define a base da API: prioriza a variável global (injetada pelo Render) ou fallback para localhost
const API_BASE = window.API_BASE || 'http://localhost:5000/api';

/**
 * Função genérica para requisições à API.
 * @param {string} endpoint - Caminho do endpoint (ex: '/auth/login')
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {object|FormData} data - Dados a serem enviados (opcional)
 * @param {boolean} isFormData - Indica se os dados são FormData (para upload de arquivos)
 * @returns {Promise<any>} - Resposta da API em JSON
 */
export async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  // Se não for FormData, define o Content-Type como JSON
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Adiciona o token de autenticação se existir
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  // Adiciona o corpo da requisição se houver dados
  if (data) {
    if (isFormData) {
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }

  // Faz a requisição
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const responseData = await response.json();

  // Se a resposta não for OK, lança um erro com a mensagem da API
  if (!response.ok) {
    throw new Error(responseData.message || 'Erro na requisição');
  }

  return responseData;
}

/**
 * Função de logout: remove token e dados do usuário e redireciona para a página inicial.
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}
