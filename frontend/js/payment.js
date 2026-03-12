import { apiRequest } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const botoes = document.querySelectorAll('.btn-plan');
  console.log('Botões de plano encontrados:', botoes.length);

  botoes.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const plan = e.currentTarget.dataset.plan;
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login.html';
        return;
      }

      try {
        const data = await apiRequest('/payments/create-pix', 'POST', { planId: plan });
        abrirModalPix(data);
      } catch (error) {
        alert('Erro ao gerar pagamento: ' + error.message);
        console.error(error);
      }
    });
  });
});

function abrirModalPix(dados) {
  const modal = document.getElementById('pix-modal');
  if (!modal) {
    alert('Modal Pix não encontrado no HTML.');
    return;
  }

  const qrDiv = document.getElementById('qr-code');
  const copyPaste = document.getElementById('copy-paste');
  const statusDiv = document.getElementById('payment-status');

  // Limpa conteúdo anterior
  qrDiv.innerHTML = '';
  copyPaste.innerHTML = '';
  statusDiv.textContent = 'Aguardando pagamento...';

  // Adiciona QR Code
  const qrImg = document.createElement('img');
  qrImg.src = `data:image/png;base64,${dados.qrCodeBase64}`;
  qrImg.alt = 'QR Code Pix';
  qrDiv.appendChild(qrImg);

  // Container para código e botão
  const codeContainer = document.createElement('div');
  codeContainer.style.display = 'flex';
  codeContainer.style.alignItems = 'center';
  codeContainer.style.gap = '0.5rem';
  codeContainer.style.marginTop = '1rem';

  const codeInput = document.createElement('input');
  codeInput.type = 'text';
  codeInput.value = dados.copyPaste;
  codeInput.readOnly = true;
  codeInput.style.flex = '1';
  codeInput.style.padding = '0.5rem';
  codeInput.style.border = '1px solid #ccc';
  codeInput.style.borderRadius = '4px';
  codeInput.style.backgroundColor = '#f9f9f9';

  const copyBtn = document.createElement('button');
  copyBtn.innerHTML = '📋 Copiar';
  copyBtn.style.padding = '0.5rem 1rem';
  copyBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
  copyBtn.style.color = 'white';
  copyBtn.style.border = 'none';
  copyBtn.style.borderRadius = '4px';
  copyBtn.style.cursor = 'pointer';
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(dados.copyPaste);
      copyBtn.innerHTML = '✅ Copiado!';
      setTimeout(() => copyBtn.innerHTML = '📋 Copiar', 2000);
    } catch (err) {
      alert('Erro ao copiar');
    }
  };

  codeContainer.appendChild(codeInput);
  codeContainer.appendChild(copyBtn);
  copyPaste.appendChild(codeContainer);

  modal.style.display = 'flex';

  // Polling de status
  const interval = setInterval(async () => {
    try {
      const statusData = await apiRequest(`/payments/status/${dados.transactionId}`);
      if (statusData.status === 'paid') {
        statusDiv.innerHTML = '<span style="color: green; font-weight: bold;">✅ Pagamento confirmado! Redirecionando...</span>';
        clearInterval(interval);
        setTimeout(() => {
          modal.style.display = 'none';
          window.location.href = '/dashboard.html';
        }, 2000);
      }
    } catch (error) {
      console.error('Erro no polling:', error);
    }
  }, 3000);

  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
      clearInterval(interval);
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
      clearInterval(interval);
    }
  };
}
