import { apiRequest } from './api.js';

// Verifica se o usuário está logado; se não, redireciona para login
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

const messagesDiv = document.getElementById('chatMessages');
const input = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const filePreview = document.getElementById('filePreview');
const typingIndicator = document.getElementById('typingIndicator');

let selectedFiles = [];

// Função para mostrar indicador de digitação
function showTypingIndicator(show = true) {
    typingIndicator.style.display = show ? 'flex' : 'none';
}

// Função para adicionar botões de cópia aos blocos de código
function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach((pre) => {
        // Evita adicionar múltiplos botões
        if (pre.querySelector('.copy-button')) return;

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '📋 Copiar';
        button.style.position = 'absolute';
        button.style.top = '0.5rem';
        button.style.right = '0.5rem';
        button.style.background = '#333';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.padding = '0.3rem 0.8rem';
        button.style.cursor = 'pointer';
        button.style.fontSize = '0.8rem';
        button.style.zIndex = '10';
        button.style.opacity = '0.7';
        button.style.transition = 'opacity 0.2s';

        pre.style.position = 'relative';
        pre.appendChild(button);

        button.addEventListener('click', async () => {
            const code = pre.querySelector('code').innerText;
            try {
                await navigator.clipboard.writeText(code);
                button.innerHTML = '✅ Copiado!';
                setTimeout(() => {
                    button.innerHTML = '📋 Copiar';
                }, 2000);
            } catch (err) {
                button.innerHTML = '❌ Erro';
            }
        });
    });
}

// Função para exibir mensagem (sem efeito de digitação)
function displayMessage(msg) {
    const div = document.createElement('div');
    div.classList.add('message', msg.role);

    // Se for assistente, interpreta markdown e sanitiza
    if (msg.role === 'assistant' && msg.content) {
        const rawHtml = marked.parse(msg.content);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        div.innerHTML = cleanHtml;
        // Aplica syntax highlighting
        if (window.hljs) {
            div.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
        // Adiciona botões de cópia
        addCopyButtons(div);
    } else {
        div.textContent = msg.content;
    }

    // Adiciona arquivos se houver
    if (msg.files && msg.files.length) {
        const fileList = document.createElement('ul');
        msg.files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${file.url}" target="_blank">${file.originalName}</a>`;
            fileList.appendChild(li);
        });
        div.appendChild(fileList);
    }
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadHistory() {
    try {
        const messages = await apiRequest('/chat/history');
        messages.forEach(msg => displayMessage(msg));
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// Preview de arquivos selecionados
fileInput.addEventListener('change', () => {
    selectedFiles = Array.from(fileInput.files);
    filePreview.innerHTML = '';
    selectedFiles.forEach(file => {
        const preview = document.createElement('div');
        preview.className = 'preview-item';
        preview.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <span class="remove-file" data-name="${file.name}">✖</span>
        `;
        filePreview.appendChild(preview);
    });

    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            selectedFiles = selectedFiles.filter(f => f.name !== name);
            fileInput.value = '';
            filePreview.innerHTML = '';
            selectedFiles.forEach(file => {
                const preview = document.createElement('div');
                preview.className = 'preview-item';
                preview.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                    <span class="remove-file" data-name="${file.name}">✖</span>
                `;
                filePreview.appendChild(preview);
            });
        });
    });
});

sendBtn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text && selectedFiles.length === 0) return;

    const formData = new FormData();
    if (text) formData.append('text', text);
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    // Exibe a mensagem do usuário imediatamente
    displayMessage({ role: 'user', content: text || (selectedFiles.length ? '[Arquivo enviado]' : '') });

    // Limpa input e preview
    input.value = '';
    selectedFiles = [];
    fileInput.value = '';
    filePreview.innerHTML = '';

    // Mostra indicador de digitação
    showTypingIndicator(true);

    try {
        const data = await apiRequest('/chat/message', 'POST', formData, true);
        showTypingIndicator(false);
        displayMessage(data.assistantMessage);
    } catch (error) {
        showTypingIndicator(false);
        // Tratamento do erro de limite de mensagens
        if (error.message.includes('limite de mensagens gratuitas') || error.message === 'LIMIT_EXCEEDED') {
            alert('Você atingiu o limite de mensagens gratuitas. Assine um plano para continuar.');
            window.location.href = '/planos.html';
        } else {
            alert('Erro ao enviar mensagem: ' + error.message);
        }
        console.error(error);
    }
});

// Carrega o histórico ao iniciar
loadHistory();
