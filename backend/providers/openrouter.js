// backend/providers/openrouter.js

/**
 * Modelos gratuitos da OpenRouter baseados na lista fornecida.
 * Inclui modelos multimodais e de texto.
 * 
 * Web Search: Qualquer modelo pode usar busca na web ativando o plugin 'web'
 * na requisição ou usando o sufixo ':online'. O custo adicional é de $4/1000 resultados
 * via Exa ou preços específicos do provedor para busca nativa [citation:4].
 */
module.exports = [
  {
    name: 'OpenRouter - Google Gemini 2.0 Flash (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.0-flash-exp:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: true,
    supportsWebSearch: true, // Pode usar busca via plugin
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Google Gemini 2.0 Pro (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.0-pro-exp-02-05:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: true,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Meta Llama 3.3 70B (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - NVIDIA Llama 3.1 Nemotron 70B (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - DeepSeek R1 (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-r1:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - DeepSeek R1 Distill Llama 70B (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-r1-distill-llama-70b:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Mistral Small 3 (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'mistralai/mistral-small-24b-instruct-2501:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Qwen 2.5 7B (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen-2.5-7b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Qwen 2.5 VL 72B (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen-2.5-vl-72b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: true,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  {
    name: 'OpenRouter - Microsoft Phi-3 Medium (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'microsoft/phi-3-medium-128k-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: false,
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
  // Modelo auto que roteia para qualquer free disponível
  {
    name: 'OpenRouter - Auto (free)',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openrouter/free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    supportsVision: true, // pode rotear para modelos com visão
    supportsWebSearch: true,
    type: 'openai',
    headers: { 'HTTP-Referer': process.env.FRONTEND_URL, 'X-Title': 'SaaS AI' },
  },
];
