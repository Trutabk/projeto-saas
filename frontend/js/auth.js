import { apiRequest, logout } from './api.js';

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    console.log('Login bem-sucedido, token salvo:', data.token);
    window.location.href = data.role === 'admin' ? '/admin.html' : '/dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});

// Registro
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value;

  try {
    const data = await apiRequest('/auth/register', 'POST', { name, email, password, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    console.log('Registro bem-sucedido, token salvo:', data.token);
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  console.log('Logout clicado');
  try {
    await apiRequest('/auth/logout', 'POST');
    console.log('API logout chamada');
  } catch (error) {
    console.error('Erro no logout API:', error);
  } finally {
    console.log('Chamando logout()...');
    logout();
  }
});

// Páginas públicas (incluindo variações)
const publicPages = [
  '/login.html',
  '/register.html',
  '/forgot-password.html',
  '/reset-password.html',
  '/',
  '/index.html',
  ''
];

const path = window.location.pathname;
const token = localStorage.getItem('token');

console.log('Path atual:', path);
console.log('Token existe?', token ? 'Sim' : 'Não');

if (!publicPages.includes(path)) {
  if (!token) {
    console.log('Redirecionando para login (página protegida sem token)');
    window.location.href = '/login.html';
  } else {
    console.log('Acesso permitido à página protegida');
  }
} else {
  console.log('Página pública, sem verificação de token');
}
