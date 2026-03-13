import { apiRequest } from './api.js';

// ======================
// Elementos do DOM
// ======================
const messagesDiv = document.getElementById('chatMessages');
const input = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const filePreview = document.getElementById('filePreview');
const typingIndicator = document.getElementById('typingIndicator');

// Elementos da sidebar de conversas
const conversationList = document.getElementById('conversationList');
const newConversationBtn = document.getElementById('newConversationBtn');
const deleteConversationBtn = document.getElementById('deleteConversationBtn');
const currentConversationTitle = document.getElementById('currentConversationTitle');

// Elementos do toggle da sidebar
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.conversation-sidebar');

let selectedFiles = [];
let currentConversationId = null;

// ======================
// Verifica login
// ======================
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

// ======================
// Utilitários
// ======================
function showTypingIndicator(show = true) {
    if (typingIndicator) typingIndicator.style.display = show ? 'flex' : 'none';
}

function addCopyButtons(container) {
    container.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('.copy-button')) return;

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '📋 Copiar';
        Object.assign(button.style, {
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.3rem 0.8rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
            zIndex: '10',
            opacity: '0.7',
            transition: 'opacity 0.2s'
        });

        pre.style.position = 'relative';
        pre.appendChild(button);

        button.addEventListener('click', async () => {
            const code = pre.querySelector('code').innerText;
            try {
                await navigator.clipboard.writeText(code);
                button.innerHTML = '✅ Copiado!';
                setTimeout(() => (button.innerHTML = '📋 Copiar'), 2000);
            } catch (err) {
                button.innerHTML = '❌ Erro';
            }
        });
    });
}

function displayMessage(msg) {
    const div = document.createElement('div');
    div.classList.add('message', msg.role);

    if (msg.role === 'assistant' && msg.content) {
        const rawHtml = marked.parse(msg.content);
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        div.innerHTML = cleanHtml;
        if (window.hljs) {
            div.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
        }
        addCopyButtons(div);
    } else {
        div.textContent = msg.content;
    }

    if (msg.files?.length) {
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

// ======================
// Gerenciamento de conversas
// ======================
async function loadConversations() {
    if (!conversationList) return;
    try {
        const conversations = await apiRequest('/chat/conversations');
        conversationList.innerHTML = '';
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = `conversation-item ${conv._id === currentConversationId ? 'active' : ''}`;
            item.dataset.id = conv._id;
            item.innerHTML = `
                <span class="title">${conv.title}</span>
                <span class="date">${new Date(conv.updatedAt).toLocaleDateString()}</span>
                <div class="conversation-actions">
                    <button class="rename-conv" data-id="${conv._id}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-conv" data-id="${conv._id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            item.addEventListener('click', (e) => {
                if (e.target.closest('.conversation-actions')) return;
                loadConversation(conv._id);
            });
            conversationList.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

async function loadConversation(convId) {
    currentConversationId = convId;
    try {
        const messages = await apiRequest(`/chat/conversations/${convId}/messages`);
        messagesDiv.innerHTML = '';
        messages.forEach(msg => displayMessage(msg));

        // Atualiza UI da sidebar
        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.conversation-item[data-id="${convId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            if (currentConversationTitle) currentConversationTitle.textContent = activeItem.querySelector('.title').textContent;
        }
        if (deleteConversationBtn) deleteConversationBtn.style.display = 'inline-block';
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// ======================
// Criação de nova conversa
// ======================
if (newConversationBtn) {
    newConversationBtn.addEventListener('click', async () => {
        try {
            const newConv = await apiRequest('/chat/conversations', 'POST', { title: 'Nova conversa' });
            await loadConversations();
            await loadConversation(newConv._id);
        } catch (error) {
            alert('Erro ao criar conversa');
        }
    });
}

// ======================
// Exclusão de conversa
// ======================
if (deleteConversationBtn) {
    deleteConversationBtn.addEventListener('click', async () => {
        if (!currentConversationId) return;
        if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;
        try {
            await apiRequest(`/chat/conversations/${currentConversationId}`, 'DELETE');
            currentConversationId = null;
            messagesDiv.innerHTML = '';
            if (currentConversationTitle) currentConversationTitle.textContent = 'Assistente Virtual';
            deleteConversationBtn.style.display = 'none';
            await loadConversations();
        } catch (error) {
            alert('Erro ao excluir conversa');
        }
    });
}

// ======================
// Renomear conversa (delegação de eventos)
// ======================
document.addEventListener('click', async (e) => {
    const renameBtn = e.target.closest('.rename-conv');
    if (renameBtn) {
        const convId = renameBtn.dataset.id;
        const newTitle = prompt('Novo título:');
        if (newTitle) {
            try {
                await apiRequest(`/chat/conversations/${convId}`, 'PUT', { title: newTitle });
                await loadConversations();
                // Se for a conversa atual, atualiza o título no cabeçalho
                if (convId === currentConversationId && currentConversationTitle) {
                    currentConversationTitle.textContent = newTitle;
                }
            } catch (error) {
                alert('Erro ao renomear');
            }
        }
    }
});

// ======================
// Envio de mensagem
// ======================
sendBtn.addEventListener('click', async () => {
    if (!currentConversationId) {
        alert('Selecione uma conversa primeiro.');
        return;
    }

    const text = input.value.trim();
    if (!text && selectedFiles.length === 0) return;

    const formData = new FormData();
    if (text) formData.append('text', text);
    selectedFiles.forEach(file => formData.append('files', file));

    // Exibe mensagem do usuário imediatamente
    displayMessage({ role: 'user', content: text || '[Arquivo enviado]' });

    // Limpa input e preview
    input.value = '';
    selectedFiles = [];
    fileInput.value = '';
    filePreview.innerHTML = '';

    showTypingIndicator(true);

    try {
        const data = await apiRequest(`/chat/message/${currentConversationId}`, 'POST', formData, true);
        showTypingIndicator(false);
        displayMessage(data.assistantMessage);
        // Atualiza lista de conversas (para refletir a data de atualização)
        await loadConversations();
    } catch (error) {
        showTypingIndicator(false);
        if (error.message.includes('limite de mensagens gratuitas') || error.message === 'LIMIT_EXCEEDED') {
            alert('Você atingiu o limite de mensagens gratuitas. Assine um plano para continuar.');
            window.location.href = '/planos.html';
        } else {
            alert('Erro ao enviar mensagem: ' + error.message);
        }
        console.error(error);
    }
});

// ======================
// Preview de arquivos
// ======================
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

// ======================
// Inicialização
// ======================
(async () => {
    await loadConversations();
    // Se não houver conversas, cria uma automaticamente
    const convs = document.querySelectorAll('.conversation-item');
    if (convs.length === 0 && newConversationBtn) {
        newConversationBtn.click(); // dispara a criação de nova conversa
    } else if (convs.length > 0) {
        // Carrega a primeira conversa da lista (mais recente)
        const firstConv = convs[0];
        await loadConversation(firstConv.dataset.id);
    }
})();

// ======================
// Toggle da sidebar (abrir/fechar em mobile)
// ======================
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Fechar sidebar ao clicar fora (opcional, em mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}
