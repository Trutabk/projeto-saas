import { apiRequest } from './api.js';

let currentUsersPage = 1;
let totalUsersPages = 1;

// Carregar estatísticas
async function loadStats() {
  try {
    const stats = await apiRequest('/admin/stats');
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalTransactions').textContent = stats.totalTransactions;
    document.getElementById('totalRevenue').textContent = `R$ ${stats.totalRevenue.toFixed(2)}`;

    // Gráfico de receita (exemplo simples)
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Receita (R$)',
          data: [1200, 1900, 3000, 5000, 2300, 3400],
          borderColor: '#6c5ce7',
          tension: 0.1
        }]
      }
    });
  } catch (error) {
    console.error(error);
  }
}

// Carregar usuários
async function loadUsers(page = 1) {
  try {
    const data = await apiRequest(`/admin/users?page=${page}&limit=10`);
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    data.users.forEach(user => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.plan?.type || 'bronze'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="edit-user" data-id="${user._id}">Editar</button>
          <button class="toggle-user" data-id="${user._id}" data-active="${user.isActive}">${user.isActive ? 'Desativar' : 'Ativar'}</button>
        </td>
      `;
    });
    currentUsersPage = data.page;
    totalUsersPages = data.pages;
    document.getElementById('pageUsers').textContent = currentUsersPage;
    document.getElementById('prevUsers').disabled = currentUsersPage <= 1;
    document.getElementById('nextUsers').disabled = currentUsersPage >= totalUsersPages;
  } catch (error) {
    console.error(error);
  }
}

// Carregar transações
async function loadTransactions() {
  try {
    const data = await apiRequest('/admin/transactions?limit=20');
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    data.transactions.forEach(t => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${t.user?.name || 'N/A'}</td>
        <td>${t.plan}</td>
        <td>R$ ${t.amount.toFixed(2)}</td>
        <td class="status-${t.status}">${t.status}</td>
        <td>${new Date(t.createdAt).toLocaleString()}</td>
      `;
    });
  } catch (error) {
    console.error(error);
  }
}

// Eventos de paginação
document.getElementById('prevUsers').addEventListener('click', () => {
  if (currentUsersPage > 1) loadUsers(currentUsersPage - 1);
});
document.getElementById('nextUsers').addEventListener('click', () => {
  if (currentUsersPage < totalUsersPages) loadUsers(currentUsersPage + 1);
});

// Carregar tudo
loadStats();
loadUsers();
loadTransactions();

// Delegar ações (editar/desativar)
document.querySelector('#usersTable').addEventListener('click', async (e) => {
  const target = e.target;
  if (target.classList.contains('edit-user')) {
    const userId = target.dataset.id;
    // Abrir modal para editar plano (simples)
    const newPlan = prompt('Novo plano (bronze, prata, ouro, personalizado):');
    if (newPlan) {
      try {
        await apiRequest(`/admin/users/${userId}/plan`, 'PUT', { planType: newPlan });
        alert('Plano atualizado');
        loadUsers(currentUsersPage);
      } catch (error) {
        alert(error.message);
      }
    }
  } else if (target.classList.contains('toggle-user')) {
    const userId = target.dataset.id;
    const isActive = target.dataset.active === 'true';
    try {
      await apiRequest(`/admin/users/${userId}/status`, 'PUT', { isActive: !isActive });
      loadUsers(currentUsersPage);
    } catch (error) {
      alert(error.message);
    }
  }
});
