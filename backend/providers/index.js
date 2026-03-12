// backend/providers/index.js

// Importação dos provedores existentes
const groqProviders = require('./groq');
const geminiProviders = require('./gemini');
const openrouterProviders = require('./openrouter');

// Futuramente, adicione aqui os imports de outros provedores:
// const huggingfaceProviders = require('./huggingface');
// const cerebrasProviders = require('./cerebras');
// const togetherProviders = require('./together');
// const cohereProviders = require('./cohere');
// const mistralProviders = require('./mistral');
// ... etc.

// Combina todos os provedores em um único array
const allProviders = [
  ...groqProviders,
  ...geminiProviders,
  ...openrouterProviders,
  // ... adicione os outros aqui, por exemplo:
  // ...huggingfaceProviders,
  // ...cerebrasProviders,
  // ...togetherProviders,
];

// Filtra apenas os provedores que suportam visão (imagens)
const visionProviders = allProviders.filter(p => p.supportsVision);

module.exports = {
  allProviders,
  visionProviders,
};
