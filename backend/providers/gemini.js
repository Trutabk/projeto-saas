// backend/providers/gemini.js

/**
 * Configurações dos modelos gratuitos do Google Gemini via endpoint compatível com OpenAI.
 * Lista baseada nos IDs oficiais da API Gemini.
 * Modelos com suporte a "Grounding with Google Search" (busca na web) requerem
 * a ativação via parâmetro 'tools' na chamada da API [citation:4][citation:8].
 */
module.exports = [
  {
    name: 'Gemini 2.5 Flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web [citation:4]
    type: 'openai',
  },
  {
    name: 'Gemini 2.5 Flash Preview',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash-preview-09-2025',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web
    type: 'openai',
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash-lite',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web
    type: 'openai',
  },
  {
    name: 'Gemini 2.5 Flash Lite Preview',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash-lite-preview-09-2025',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web
    type: 'openai',
  },
  {
    name: 'Gemini 2.0 Flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web (cota generosa) [citation:9]
    type: 'openai',
  },
  {
    name: 'Gemini 2.0 Flash Lite',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash-lite',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web
    type: 'openai',
  },
  {
    name: 'Gemini 2.5 Flash TTS',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash-preview-tts',
    apiKeyEnv: 'GEMINI_API_KEY',
    supportsVision: true,
    supportsGrounding: true, // ✅ Suporta busca na web
    type: 'openai',
  },
];
