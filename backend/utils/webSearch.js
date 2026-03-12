// backend/utils/webSearch.js
const { getJson } = require('serpapi');

// Controle de taxa (1 requisição por segundo é seguro para o plano gratuito)
let lastRequestTime = 0;
const REQUEST_INTERVAL = 1000; // 1 segundo

async function searchWeb(query, count = 5) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SERPAPI_API_KEY não configurada');
    return [];
  }

  // Log para depuração
  console.log(`🔎 searchWeb chamada para: "${query}"`);

  // Rate limiting simples
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL - timeSinceLast));
  }

  try {
    const response = await getJson({
      api_key: apiKey,
      engine: 'google',
      q: query,
      num: count,
      google_domain: 'google.com',
      gl: 'br',
      hl: 'pt'
    });

    lastRequestTime = Date.now();

    const results = response.organic_results || [];
    return results.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link
    }));
  } catch (error) {
    console.error('❌ Erro na busca SerpApi:', error.message);
    return [];
  }
}

module.exports = searchWeb;
