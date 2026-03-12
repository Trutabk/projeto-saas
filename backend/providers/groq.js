// backend/providers/groq.js

/**
 * Configurações dos modelos gratuitos da Groq.
 * Lista baseada nos IDs oficiais da API Groq.
 * A propriedade 'supportsWebSearch' indica se o modelo tem ferramentas
 * integradas para busca em tempo real (web search).
 */
module.exports = [
  {
    name: 'Groq Llama 3.3 70B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false, // Modelo padrão, sem ferramentas
    type: 'openai',
  },
  {
    name: 'Groq Llama 3.1 8B Instant',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  {
    name: 'Groq Llama 3 70B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-70b-8192',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  {
    name: 'Groq Llama 3 8B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-8b-8192',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  {
    name: 'Groq Mixtral 8x7B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  {
    name: 'Groq Gemma 2 9B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'gemma2-9b-it',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  {
    name: 'Groq DeepSeek Distill Llama 70B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'deepseek-r1-distill-llama-70b',
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: false,
    type: 'openai',
  },
  // === NOVOS MODELOS COM SUPORTE A BUSCA NA WEB ===
  {
    name: 'Groq Compound (with Web Search & Tools)',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'groq/compound', // ID do modelo Compound
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: true, // ✅ HABILITADO
    type: 'openai',
  },
  {
    name: 'Groq Compound Mini (with Web Search & Tools)',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'groq/compound-mini', // ID do modelo Compound Mini
    apiKeyEnv: 'GROQ_API_KEY',
    supportsVision: false,
    supportsWebSearch: true, // ✅ HABILITADO
    type: 'openai',
  },
];
