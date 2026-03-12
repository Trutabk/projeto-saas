// backend/utils/aiFallback.js
const { allProviders, visionProviders } = require('../providers');
const axios = require('axios');

/**
 * Função auxiliar para detectar se a mensagem do usuário parece exigir
 * informações atualizadas (tempo real, notícias, preços, etc.)
 */
function precisaDeInfoAtual(messages) {
  if (!messages || messages.length === 0) return false;
  const ultimaMensagem = messages[messages.length - 1];
  // Se a última mensagem não for do usuário, ignora (por segurança)
  if (ultimaMensagem.role !== 'user') return false;
  const texto = (typeof ultimaMensagem.content === 'string') 
    ? ultimaMensagem.content.toLowerCase() 
    : JSON.stringify(ultimaMensagem.content).toLowerCase();

  const palavrasChave = [
    'último', 'última', 'recente', 'atual', 'hoje', 'agora',
    'notícia', 'preço', 'cotação', 'tempo', 'clima',
    'resultado', 'jogo', 'partida', 'lançamento',
    'buscar', 'pesquisar', 'google', 'internet', 'web'
  ];
  return palavrasChave.some(palavra => texto.includes(palavra));
}

/**
 * Função que monta o payload específico para provedores com busca na web
 */
function montarPayload(provider, messages, basePayload) {
  const payload = { ...basePayload };

  // Se o provedor suporta busca e a pergunta exige informação atualizada
  if (provider.supportsWebSearch && precisaDeInfoAtual(messages)) {
    console.log(`🌐 Ativando busca na web para ${provider.name}`);

    // OpenRouter: usa plugin 'web'
    if (provider.name.includes('OpenRouter')) {
      payload.plugins = [{ id: "web", max_results: 5 }];
    }
    // Google Gemini: usa ferramenta googleSearch
    else if (provider.name.includes('Gemini')) {
      payload.tools = [{ googleSearch: {} }];
    }
    // Groq Compound: não precisa de parâmetro extra, mas podemos priorizar
    // (já é um modelo especial que faz busca automaticamente)
    else if (provider.name.includes('Compound')) {
      // Nada a adicionar, o modelo já suporta
    }
    // Outros provedores podem ser adicionados conforme necessário
  }

  return payload;
}

async function callWithFallback(messages, hasImages = false) {
  const candidates = hasImages ? visionProviders : allProviders;
  // Embaralha para distribuir carga
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());

  for (const provider of shuffled) {
    try {
      console.log(`🔄 Tentando ${provider.name}...`);

      // Payload base
      const basePayload = {
        model: provider.model,
        messages: messages,
        max_tokens: 8000,
        temperature: 0.7,
      };

      // Monta payload com possíveis parâmetros de busca
      const payload = montarPayload(provider, messages, basePayload);

      const response = await axios.post(
        provider.url,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env[provider.apiKeyEnv]}`,
            'Content-Type': 'application/json',
            ...(provider.headers || {}),
          },
          timeout: 15000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        console.log(`✅ Sucesso com ${provider.name}`);
        // Opcional: extrair metadados de busca se existirem
        const metadata = response.data?.choices?.[0]?.message;
        if (metadata?.executed_tools || metadata?.groundingMetadata) {
          console.log(`🔍 A resposta incluiu resultados de busca.`);
          // Aqui você pode processar os metadados e talvez retorná-los junto
        }
        return content;
      } else {
        console.log(`⚠️ Resposta sem conteúdo de ${provider.name}`);
      }
    } catch (error) {
      console.error(`❌ Falha em ${provider.name}:`, error.response?.status, error.message);
      // Se for erro de rate limit (429), tenta o próximo
      if (error.response?.status === 429) continue;
      // Para outros erros, continua tentando
    }
  }
  throw new Error('Todos os provedores falharam. Tente novamente mais tarde.');
}

module.exports = callWithFallback;
