import { apiRequest } from './api.js';

// ======================
// Estado global
// ======================
let currentUsersPage = 1;
let totalUsersPages = 1;
let currentTransactionsPage = 1;
let totalTransactionsPages = 1;
let charts = {}; // Para gerenciar os gráficos

// ======================
// Carregar estatísticas do dashboard
// ======================
async function loadStats() {
  try {
    const stats = await apiRequest('/admin/stats');
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeToday').textContent = stats.activeToday || 0;
    document.getElementById('messagesToday').textContent = stats.messagesToday || 0;
    document.getElementById('totalTransactions').textContent = stats.totalTransactions;
    document.getElementById('totalRevenue').textContent = `R$ ${stats.totalRevenue.toFixed(2)}`;
    document.getElementById('activePlans').textContent = stats.activePlans || 0;

    // Gráfico de receita mensal
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(ctxRevenue, {
      type: 'line',
      data: {
        labels: stats.revenueLabels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Receita (R$)',
          data: stats.revenueData || [1200, 1900, 3000, 5000, 2300, 3400],
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108,92,231,0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico de distribuição de planos
    const ctxPlans = document.getElementById('plansChart').getContext('2d');
    if (charts.plans) charts.plans.destroy();
    charts.plans = new Chart(ctxPlans, {
      type: 'doughnut',
      data: {
        labels: stats.planLabels || ['Gratuito', 'Básico', 'Pro', 'Empresarial'],
        datasets: [{
          data: stats.planData || [45, 25, 20, 10],
          backgroundColor: ['#a0a0a0', '#6c5ce7', '#a29bfe', '#00b894']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico de mensagens por dia (últimos 7 dias)
    const ctxMessages = document.getElementById('messagesChart').getContext('2d');
    if (charts.messages) charts.messages.destroy();
    charts.messages = new Chart(ctxMessages, {
      type: 'bar',
      data: {
        labels: stats.messageLabels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Mensagens',
          data: stats.messageData || [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: '#fd79a8'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico de crescimento de usuários (últimos 6 meses)
    const ctxGrowth = document.getElementById('usersGrowthChart').getContext('2d');
    if (charts.growth) charts.growth.destroy();
    charts.growth = new Chart(ctxGrowth, {
      type: 'line',
      data: {
        labels: stats.growthLabels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Novos usuários',
          data: stats.growthData || [10, 25, 30, 45, 60, 80],
          borderColor: '#00b894',
          backgroundColor: 'rgba(0,184,148,0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// ======================
// Carregar usuários com filtros e paginação
// ======================
async function loadUsers(page = 1, search = '', filterPlan = '') {
  try {
    const url = new URL('/admin/users', window.location.origin);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', '10');
    if (search) url.searchParams.append('search', search);
    if (filterPlan) url.searchParams.append('plan', filterPlan);

    const data = await apiRequest(url.pathname + url.search);
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    data.users.forEach(user => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${user._id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.plan?.type || 'gratuito'}</td>
        <td class="status-${user.status || 'active'}">${user.status || 'ativo'}</td>
        <td>${user.plan?.expiresAt ? new Date(user.plan.expiresAt).toLocaleDateString() : '—'}</td>
        <td>${user.messageCount || 0}</td>
        <td>${user.lastActive ? new Date(user.lastActive).toLocaleString() : '—'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="view-user" data-id="${user._id}"><i class="fas fa-eye"></i></button>
          <button class="edit-user" data-id="${user._id}"><i class="fas fa-edit"></i></button>
          <button class="toggle-user" data-id="${user._id}" data-active="${user.isActive}">${user.isActive ? '🔴' : '🟢'}</button>
        </td>
      `;
    });
    currentUsersPage = data.page;
    totalUsersPages = data.pages;
    document.getElementById('pageUsers').textContent = currentUsersPage;
    document.getElementById('prevUsers').disabled = currentUsersPage <= 1;
    document.getElementById('nextUsers').disabled = currentUsersPage >= totalUsersPages;
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
}

// ======================
// Carregar transações com filtros
// ======================
async function loadTransactions(page = 1, search = '', filterStatus = '') {
  try {
    const url = new URL('/admin/transactions', window.location.origin);
    url.searchParams.append('page', page);
    url.searchParams.append('limit', '10');
    if (search) url.searchParams.append('search', search);
    if (filterStatus) url.searchParams.append('status', filterStatus);

    const data = await apiRequest(url.pathname + url.search);
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    data.transactions.forEach(t => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${t._id}</td>
        <td>${t.user?.name || 'N/A'}</td>
        <td>${t.plan}</td>
        <td>R$ ${t.amount.toFixed(2)}</td>
        <td class="status-${t.status}">${t.status}</td>
        <td>${t.paymentMethod || '—'}</td>
        <td>${new Date(t.createdAt).toLocaleString()}</td>
      `;
    });
    currentTransactionsPage = data.page;
    totalTransactionsPages = data.pages;
    document.getElementById('pageTransactions').textContent = currentTransactionsPage;
    document.getElementById('prevTransactions').disabled = currentTransactionsPage <= 1;
    document.getElementById('nextTransactions').disabled = currentTransactionsPage >= totalTransactionsPages;
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
  }
}

// ======================
// Carregar mensagens recentes
// ======================
async function loadMessages() {
  try {
    const data = await apiRequest('/admin/messages?limit=10');
    const tbody = document.querySelector('#messagesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.messages.forEach(msg => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${msg.user?.name || 'N/A'}</td>
        <td>${msg.content.substring(0, 50)}...</td>
        <td>${msg.response?.substring(0, 50) || '...'}</td>
        <td>${new Date(msg.createdAt).toLocaleString()}</td>
        <td><button class="view-message" data-id="${msg._id}">Ver</button></td>
      `;
    });
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
  }
}

// ======================
// Carregar logs de atividades
// ======================
async function loadLogs(search = '', filterType = '') {
  try {
    const url = new URL('/admin/logs', window.location.origin);
    if (search) url.searchParams.append('search', search);
    if (filterType) url.searchParams.append('type', filterType);
    const data = await apiRequest(url.pathname + url.search);
    const tbody = document.querySelector('#logsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.logs.forEach(log => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.user?.name || 'Sistema'}</td>
        <td>${log.action}</td>
        <td>${log.details || '—'}</td>
        <td>${log.ip || '—'}</td>
      `;
    });
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
  }
}

// ======================
// Configurações do sistema
// ======================
async function loadConfig() {
  try {
    const config = await apiRequest('/admin/config');
    document.getElementById('freeLimit').value = config.freeMessageLimit || 20;
    document.getElementById('priceBasic').value = config.prices?.basic || 29.90;
    document.getElementById('pricePro').value = config.prices?.pro || 79.90;
    document.getElementById('priceEnterprise').value = config.prices?.enterprise || 199.90;
    document.getElementById('maintenanceMode').checked = config.maintenanceMode || false;
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

// ======================
// Salvamento de configurações
// ======================
document.getElementById('saveFreeLimit')?.addEventListener('click', async () => {
  const value = document.getElementById('freeLimit').value;
  try {
    await apiRequest('/admin/config/freeLimit', 'POST', { limit: value });
    alert('Limite atualizado');
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('savePrices')?.addEventListener('click', async () => {
  const prices = {
    basic: parseFloat(document.getElementById('priceBasic').value),
    pro: parseFloat(document.getElementById('pricePro').value),
    enterprise: parseFloat(document.getElementById('priceEnterprise').value)
  };
  try {
    await apiRequest('/admin/config/prices', 'POST', prices);
    alert('Preços atualizados');
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('maintenanceMode')?.addEventListener('change', async (e) => {
  try {
    await apiRequest('/admin/config/maintenance', 'POST', { enabled: e.target.checked });
    alert('Modo de manutenção ' + (e.target.checked ? 'ativado' : 'desativado'));
  } catch (error) {
    alert(error.message);
  }
});

// ======================
// Exportação CSV (simulação)
// ======================
function exportToCSV(data, filename) {
  const csv = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

document.getElementById('exportUsers')?.addEventListener('click', async () => {
  try {
    const data = await apiRequest('/admin/users/export');
    exportToCSV(data, 'usuarios.csv');
  } catch (error) {
    alert('Erro ao exportar: ' + error.message);
  }
});

document.getElementById('exportTransactions')?.addEventListener('click', async () => {
  try {
    const data = await apiRequest('/admin/transactions/export');
    exportToCSV(data, 'transacoes.csv');
  } catch (error) {
    alert('Erro ao exportar: ' + error.message);
  }
});

// ======================
// Filtros e buscas
// ======================
document.getElementById('searchUser')?.addEventListener('input', debounce((e) => {
  const search = e.target.value;
  const filterPlan = document.getElementById('filterPlan').value;
  loadUsers(1, search, filterPlan);
}, 500));

document.getElementById('filterPlan')?.addEventListener('change', (e) => {
  const search = document.getElementById('searchUser').value;
  loadUsers(1, search, e.target.value);
});

document.getElementById('searchTransaction')?.addEventListener('input', debounce((e) => {
  const search = e.target.value;
  const filterStatus = document.getElementById('filterStatus').value;
  loadTransactions(1, search, filterStatus);
}, 500));

document.getElementById('filterStatus')?.addEventListener('change', (e) => {
  const search = document.getElementById('searchTransaction').value;
  loadTransactions(1, search, e.target.value);
});

document.getElementById('searchLog')?.addEventListener('input', debounce((e) => {
  const search = e.target.value;
  const filterType = document.getElementById('filterLogType').value;
  loadLogs(search, filterType);
}, 500));

document.getElementById('filterLogType')?.addEventListener('change', (e) => {
  const search = document.getElementById('searchLog').value;
  loadLogs(search, e.target.value);
});

// ======================
// Paginação
// ======================
document.getElementById('prevUsers')?.addEventListener('click', () => {
  if (currentUsersPage > 1) loadUsers(currentUsersPage - 1);
});
document.getElementById('nextUsers')?.addEventListener('click', () => {
  if (currentUsersPage < totalUsersPages) loadUsers(currentUsersPage + 1);
});
document.getElementById('prevTransactions')?.addEventListener('click', () => {
  if (currentTransactionsPage > 1) loadTransactions(currentTransactionsPage - 1);
});
document.getElementById('nextTransactions')?.addEventListener('click', () => {
  if (currentTransactionsPage < totalTransactionsPages) loadTransactions(currentTransactionsPage + 1);
});

// ======================
// Modais
// ======================
const userModal = document.getElementById('userModal');
const editUserModal = document.getElementById('editUserModal');
const closeButtons = document.querySelectorAll('.modal .close');

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    userModal.style.display = 'none';
    editUserModal.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target === userModal) userModal.style.display = 'none';
  if (e.target === editUserModal) editUserModal.style.display = 'none';
});

// ======================
// Ações em usuários (delegação)
// ======================
document.querySelector('#usersTable')?.addEventListener('click', async (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  const userId = target.dataset.id;
  if (target.classList.contains('view-user')) {
    try {
      const user = await apiRequest(`/admin/users/${userId}`);
      document.getElementById('userDetails').innerHTML = `
        <p><strong>ID:</strong> ${user._id}</p>
        <p><strong>Nome:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Plano:</strong> ${user.plan?.type}</p>
        <p><strong>Expiração:</strong> ${user.plan?.expiresAt ? new Date(user.plan.expiresAt).toLocaleDateString() : '—'}</p>
        <p><strong>Mensagens:</strong> ${user.messageCount}</p>
        <p><strong>Cadastro:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
        <p><strong>Último acesso:</strong> ${user.lastActive ? new Date(user.lastActive).toLocaleString() : '—'}</p>
        <p><strong>Status:</strong> ${user.isActive ? 'Ativo' : 'Inativo'}</p>
      `;
      userModal.style.display = 'block';
    } catch (error) {
      alert('Erro ao carregar detalhes: ' + error.message);
    }
  } else if (target.classList.contains('edit-user')) {
    try {
      const user = await apiRequest(`/admin/users/${userId}`);
      document.getElementById('editUserId').value = user._id;
      document.getElementById('editName').value = user.name;
      document.getElementById('editEmail').value = user.email;
      document.getElementById('editPlan').value = user.plan?.type || 'free';
      document.getElementById('editStatus').value = user.isActive ? 'active' : 'inactive';
      editUserModal.style.display = 'block';
    } catch (error) {
      alert('Erro ao carregar usuário: ' + error.message);
    }
  } else if (target.classList.contains('toggle-user')) {
    const isActive = target.dataset.active === 'true';
    try {
      await apiRequest(`/admin/users/${userId}/status`, 'PUT', { isActive: !isActive });
      loadUsers(currentUsersPage);
    } catch (error) {
      alert(error.message);
    }
  }
});

// ======================
// Envio do formulário de edição
// ======================
document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('editUserId').value;
  const data = {
    name: document.getElementById('editName').value,
    email: document.getElementById('editEmail').value,
    planType: document.getElementById('editPlan').value,
    isActive: document.getElementById('editStatus').value === 'active'
  };
  try {
    await apiRequest(`/admin/users/${userId}`, 'PUT', data);
    editUserModal.style.display = 'none';
    loadUsers(currentUsersPage);
    alert('Usuário atualizado');
  } catch (error) {
    alert('Erro: ' + error.message);
  }
});

// ======================
// Utilitários
// ======================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ======================
// Inicialização
// ======================
async function init() {
  // Carregar todas as seções
  loadStats();
  loadUsers();
  loadTransactions();
  loadMessages();
  loadLogs();
  loadConfig();
}

// Verificar login (se necessário)
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
} else {
  init();
}
