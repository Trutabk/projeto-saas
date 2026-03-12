import { apiRequest } from './api.js';

// Área de debug (se existir)
const debugDiv = document.getElementById('debug-info');
function log(msg) {
  if (debugDiv) debugDiv.innerHTML += msg + '<br>';
  console.log(msg);
}

// Carregar nome do usuário
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
  document.getElementById('userName').textContent = user.name;
  log(`Usuário: ${user.name}`);
}

// Função para carregar status
async function loadStatus() {
  try {
    const status = await apiRequest('/user/status');
    const planEl = document.getElementById('currentPlan');
    planEl.textContent = status.plan.charAt(0).toUpperCase() + status.plan.slice(1);
    const statusDiv = document.getElementById('planStatus');
    if (status.isActive) {
      statusDiv.innerHTML = '<span class="success"><i class="fas fa-check-circle"></i> Plano ativo</span>';
    } else {
      const remaining = status.messagesLimit - status.messagesUsed;
      statusDiv.innerHTML = `<span class="warning"><i class="fas fa-exclamation-triangle"></i> ${remaining} mensagens restantes. <a href="/planos.html">Assine um plano</a></span>`;
    }
    log('✅ Status carregado');
  } catch (e) {
    log(`❌ Erro status: ${e.message}`);
  }
}

// Função para carregar contagem de mensagens
async function loadMessageCount() {
  try {
    const data = await apiRequest('/user/messages/count');
    document.getElementById('messageCount').textContent = data.count;
    log(`✅ Mensagens: ${data.count}`);
  } catch (e) {
    log(`❌ Erro mensagens: ${e.message}`);
  }
}

// Função para carregar contagem de arquivos
async function loadFileCount() {
  try {
    const data = await apiRequest('/user/files/count');
    document.getElementById('fileCount').textContent = data.count;
    log(`✅ Arquivos: ${data.count}`);
  } catch (e) {
    log(`❌ Erro arquivos: ${e.message}`);
  }
}

// Função para carregar transações
async function loadTransactions() {
  try {
    const transactions = await apiRequest('/user/transactions');
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma transação</td></tr>';
    } else {
      transactions.forEach(t => {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
          <td>${t.plan}</td>
          <td>R$ ${t.amount.toFixed(2)}</td>
          <td class="status-${t.status}">${t.status === 'paid' ? 'Pago' : 'Pendente'}</td>
        `;
      });
    }
    log(`✅ ${transactions.length} transações`);
  } catch (e) {
    log(`❌ Erro transações: ${e.message}`);
  }
}

// Executar tudo em ordem
(async () => {
  await loadStatus();
  await loadMessageCount();
  await loadFileCount();
  await loadTransactions();
})();
