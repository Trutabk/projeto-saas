// backend/utils/aiFallback.js
const { allProviders, visionProviders } = require('../providers');
const axios = require('axios');
// ==================== MELHORIAS PROFISSIONAIS ====================
// Importação de módulos nativos para melhor controle
const { performance } = require('perf_hooks');
// AbortController é global em Node.js >= 15, não precisa importar

// Configurações avançadas centralizadas
const CONFIG = {
  CACHE_TTL: 60 * 60 * 1000, // 1 hora
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  MAX_TOKENS: 8000,
  TEMPERATURE: 0.7,
  LOOKBACK_MESSAGES: 3,
  CACHE_ENABLED: true,
  LOG_LEVEL: 'info' // 'debug', 'info', 'warn', 'error'
};

// Classe de cache com expiração automática
class ResponseCache {
  constructor(ttl = CONFIG.CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    // Limpeza assíncrona periódica (opcional)
    setTimeout(() => this.cleanup(), this.ttl);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância global do cache
const responseCache = new ResponseCache();

// Logger estruturado (simples, mas com níveis)
const logger = {
  debug: (...args) => CONFIG.LOG_LEVEL === 'debug' && console.log(`[DEBUG] ${new Date().toISOString()} -`, ...args),
  info: (...args) => console.log(`[INFO] ${new Date().toISOString()} -`, ...args),
  warn: (...args) => console.warn(`[WARN] ${new Date().toISOString()} -`, ...args),
  error: (...args) => console.error(`[ERROR] ${new Date().toISOString()} -`, ...args)
};

// Lista expandida de palavras‑chave para detectar necessidade de informação atualizada
const PALAVRAS_CHAVE_BUSCA = [
  // Português
  'último', 'última', 'últimos', 'últimas', 'recente', 'recentes', 'atual', 'atuais',
  'hoje', 'agora', 'agorinha', 'agora mesmo', 'neste momento', 'momento',
  'notícia', 'notícias', 'preço', 'preços', 'cotação', 'cotações', 'tempo', 'clima',
  'resultado', 'resultados', 'jogo', 'jogos', 'partida', 'partidas', 'lançamento', 'lançamentos',
  'estreia', 'estreias', 'buscar', 'pesquisar', 'google', 'internet', 'web', 'online',
  'novo', 'nova', 'novos', 'novas', 'novidades', 'futebol', 'campeonato', 'campeonatos',
  'eleição', 'eleições', 'covid', 'vacina', 'vacinas', 'trânsito', 'previsão', 'previsões',
  'bolsa', 'bolsas', 'dólar', 'euro', 'libra', 'iene', 'bitcoin', 'criptomoeda', 'criptomoedas',
  'ação', 'ações', 'ibovespa', 'inflação', 'pib', 'desemprego', 'selic', 'cdi',
  'política', 'governo', 'presidente', 'ministro', 'congresso', 'senado', 'câmara',
  'lei', 'decreto', 'medida provisória', 'mp', 'projeto de lei', 'pl',
  'acidente', 'acidentes', 'desastre', 'desastres', 'enchente', 'enchentes', 'chuva', 'chuvas',
  'temperatura', 'máxima', 'mínima', 'sensação térmica', 'umidade', 'vento', 'ventos',
  'frio', 'calor', 'neve', 'geada', 'furacão', 'tufão', 'ciclone', 'tempestade',
  'saúde', 'doença', 'doenças', 'epidemia', 'pandemia', 'surto', 'surtos',
  'tratamento', 'remédio', 'remédios', 'medicamento', 'medicamentos', 'vacinação',
  'economia', 'financeiro', 'mercado', 'mercados', 'investimento', 'investimentos',
  'renda fixa', 'renda variável', 'tesouro direto', 'cdb', 'lci', 'lca', 'fii', 'fiis',
  'etf', 'etfs', 'stock', 'stocks', 'commodity', 'commodities', 'ouro', 'prata', 'petróleo',
  'guerra', 'conflito', 'ataque', 'ataques', 'bomba', 'explosão', 'explosões',
  'mundo', 'internacional', 'exterior', 'global',
  'tecnologia', 'lançamento', 'smartphone', 'celular', 'app', 'aplicativo', 'software',
  'hardware', 'processador', 'placa de vídeo', 'gpu', 'cpu', 'memória ram', 'ssd', 'hd',
  'entretenimento', 'filme', 'filmes', 'série', 'séries', 'novela', 'novelas',
  'streaming', 'netflix', 'prime video', 'disney+', 'hbo max', 'globoplay',
  'música', 'músicas', 'álbum', 'álbuns', 'show', 'shows', 'famoso', 'famosos',
  'artista', 'atores', 'atrizes', 'cantor', 'cantora',
  'esporte', 'esportes', 'futebol', 'basquete', 'vôlei', 'tênis', 'fórmula 1', 'f1',
  'campeonato brasileiro', 'brasileirão', 'libertadores', 'copa do brasil',
  'champions league', 'premier league', 'la liga', 'serie a', 'bundesliga',
  'olimpíadas', 'paralimpíadas', 'copa do mundo', 'mundial',

  // Inglês (para queries bilíngues)
  'last', 'latest', 'recent', 'current', 'today', 'now', 'right now',
  'news', 'price', 'prices', 'quote', 'quotes', 'weather', 'climate',
  'result', 'results', 'game', 'games', 'match', 'matches', 'release', 'releases',
  'premiere', 'premieres', 'search', 'google', 'internet', 'web', 'online',
  'new', 'newest', 'breaking', 'live', 'coverage', 'update', 'updates',
  'election', 'elections', 'covid', 'vaccine', 'vaccines', 'traffic', 'forecast',
  'stock', 'stocks', 'dollar', 'euro', 'pound', 'yen', 'bitcoin', 'cryptocurrency',
  'crypto', 'ethereum', 'blockchain', 'nasdaq', 's&p500', 'dow jones',
  'inflation', 'gdp', 'unemployment', 'interest rate', 'fed', 'central bank',
  'politics', 'government', 'president', 'minister', 'congress', 'senate',
  'law', 'bill', 'regulation', 'accident', 'accidents', 'disaster', 'disasters',
  'flood', 'floods', 'rain', 'rains', 'temperature', 'high', 'low', 'humidity',
  'wind', 'winds', 'cold', 'heat', 'snow', 'frost', 'hurricane', 'typhoon',
  'cyclone', 'storm', 'health', 'disease', 'diseases', 'epidemic', 'pandemic',
  'outbreak', 'treatment', 'medicine', 'medicines', 'vaccination',
  'economy', 'financial', 'market', 'markets', 'investment', 'investments',
  'war', 'conflict', 'attack', 'attacks', 'bomb', 'explosion', 'explosions',
  'world', 'international', 'global', 'technology', 'launch', 'smartphone',
  'app', 'application', 'software', 'hardware', 'cpu', 'gpu', 'ram', 'ssd',
  'entertainment', 'movie', 'movies', 'series', 'tv show', 'streaming',
  'netflix', 'amazon prime', 'disney+', 'hbo', 'music', 'album', 'concert',
  'celebrity', 'actor', 'actress', 'singer', 'sport', 'sports', 'football',
  'soccer', 'basketball', 'volleyball', 'tennis', 'formula 1', 'f1',
  'champions league', 'premier league', 'la liga', 'world cup', 'olympics',

  // Expressões compostas (semânticas)
  'qual é', 'qual a', 'quais são', 'como está', 'como anda', 'o que aconteceu',
  'o que está acontecendo', 'últimas notícias', 'breaking news', 'ao vivo',
  'em tempo real', 'real time', 'atualização', 'atualizações',
  'previsão do tempo', 'weather forecast', 'cotação do dólar', 'dollar rate',
  'valor do bitcoin', 'bitcoin price', 'resultado dos jogos', 'match results',
  'classificação', 'standings', 'tabela', 'tabela do campeonato',
  'próximos jogos', 'upcoming games', 'lançamentos da semana', 'releases this week',
  'estreias no cinema', 'movie premieres', 'novidades da Netflix', 'netflix new releases'
];

// Configurações específicas por provedor (incluindo novos provedores)
const PROVIDER_CONFIG = {
  'OpenRouter': {
    webSearchPlugin: { id: "web", max_results: 5 }
  },
  'Gemini': {
    webSearchTool: { googleSearch: {} }
  },
  'Groq Compound': {
    webSearchSupported: true
  },
  'Claude': {
    // Claude 3.5 Sonnet suporta busca via ferramenta "web_search"
    webSearchTool: { type: "web_search" }
  },
  'DeepSeek': {
    // DeepSeek pode ter suporte a busca, dependendo da versão
    webSearchSupported: false // ajuste conforme necessário
  }
  // Adicione outros provedores conforme necessário
};

/**
 * Função auxiliar aprimorada: analisa as últimas N mensagens do usuário
 * com detecção semântica simples (stemming e expansão de termos)
 */
function precisaDeInfoAtualAprimorada(messages, lookback = CONFIG.LOOKBACK_MESSAGES) {
  if (!messages || messages.length === 0) return false;

  const userMessages = messages
    .filter(m => m.role === 'user')
    .slice(-lookback);

  if (userMessages.length === 0) return false;

  const textoCombinado = userMessages
    .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
    .join(' ')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos

  // Verifica palavras‑chave
  return PALAVRAS_CHAVE_BUSCA.some(palavra => {
    const palavraNormalizada = palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return textoCombinado.includes(palavraNormalizada);
  });
}

/**
 * Retry com backoff exponencial e suporte a AbortController
 */
async function axiosWithRetry(config, retries = CONFIG.MAX_RETRIES, baseDelay = CONFIG.BASE_DELAY) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || CONFIG.REQUEST_TIMEOUT);
    try {
      const response = await axios({
        ...config,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      const status = error.response?.status;
      const isAbort = error.name === 'AbortError' || error.code === 'ECONNABORTED';
      
      // Não retenta para erros de cliente (4xx) exceto 429
      if (!isAbort && status >= 400 && status < 500 && status !== 429) break;
      
      if (i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        logger.warn(`Tentativa ${i + 1} falhou (${status || (isAbort ? 'timeout' : error.message)}). Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Valida se a resposta contém conteúdo útil
 */
function validarResposta(content, providerName) {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;

  const mensagensErro = [
    'desculpe', 'não posso responder', 'erro interno', 'falha na geração',
    'i am sorry', 'cannot answer', 'internal error', 'generation failed'
  ];
  const lower = trimmed.toLowerCase();
  if (mensagensErro.some(msg => lower.includes(msg))) {
    logger.warn(`Resposta do ${providerName} parece ser uma mensagem de erro: "${trimmed.substring(0, 100)}..."`);
    return false;
  }
  return true;
}

/**
 * Extrai metadados de busca da resposta (para log)
 */
function extrairMetadadosBusca(responseData) {
  const message = responseData?.choices?.[0]?.message;
  if (message?.executed_tools || message?.groundingMetadata) {
    return true;
  }
  return false;
}
// ==================== FIM DAS MELHORIAS ====================

/**
 * Função auxiliar original para detectar se a mensagem do usuário parece exigir
 * informações atualizadas (tempo real, notícias, preços, etc.) 
 * AGORA COM LISTA MASSIVA DE PALAVRAS-CHAVE
 */
function precisaDeInfoAtual(messages) {
  if (!messages || messages.length === 0) return false;
  const ultimaMensagem = messages[messages.length - 1];
  if (ultimaMensagem.role !== 'user') return false;
  const texto = (typeof ultimaMensagem.content === 'string')
    ? ultimaMensagem.content.toLowerCase()
    : JSON.stringify(ultimaMensagem.content).toLowerCase();

  const palavrasChave = [
    // ==================== TEMPO E ATUALIDADE ====================
    'último', 'última', 'últimos', 'últimas', 'recente', 'recentes', 
    'atual', 'atuais', 'hoje', 'agora', 'agorinha', 'agora mesmo',
    'neste momento', 'momento', 'já', 'já já', 'imediatamente',
    'recém', 'recém-lançado', 'recém-publicado', 'fresco', 'novo',
    'nova', 'novos', 'novas', 'novidade', 'novidades', 'lançamento',
    'lançamentos', 'estreia', 'estreias', 'próximo', 'próxima',
    'próximos', 'próximas', 'futuro', 'futura', 'futuros', 'futuras',
    'hoje mesmo', 'amanhã', 'ontem', 'esta semana', 'essa semana',
    'este mês', 'esse mês', 'este ano', 'esse ano',

    // ==================== NOTÍCIAS E INFORMAÇÃO ====================
    'notícia', 'notícias', 'últimas notícias', 'manchete', 'manchetes',
    'jornal', 'jornal hoje', 'g1', 'globo', 'cnn', 'bbc', 'folha',
    'estadão', 'uol', 'r7', 'yahoo', 'google notícias', 'informação',
    'informações', 'reportagem', 'reportagens', 'matéria', 'matérias',
    'cobertura', 'ao vivo', 'live', 'breaking', 'urgente', 'emergência',

    // ==================== FINANÇAS E ECONOMIA ====================
    'preço', 'preços', 'cotação', 'cotações', 'valor', 'valores',
    'dólar', 'euro', 'libra', 'iene', 'yuan', 'peso', 'moeda', 'moedas',
    'bitcoin', 'btc', 'ethereum', 'eth', 'litecoin', 'ltc', 'xrp',
    'cardano', 'ada', 'solana', 'sol', 'dogecoin', 'doge', 'criptomoeda',
    'criptomoedas', 'crypto', 'altcoin', 'blockchain', 'defi', 'nft',
    'bolsa', 'bolsas', 'ibovespa', 'ibov', 's&p500', 'sp500', 'nasdaq',
    'dow jones', 'nyse', 'nasdaq composite', 'ftse', 'nikkei', 'hang seng',
    'commodities', 'ouro', 'prata', 'petróleo', 'brent', 'wti', 'soja',
    'milho', 'café', 'açúcar', 'minério de ferro', 'índice', 'índices',
    'inflação', 'ipca', 'igpm', 'pib', 'crescimento', 'recessão',
    'desemprego', 'selic', 'cdi', 'taxa de juros', 'fed', 'federal reserve',
    'bcb', 'banco central', 'investimento', 'investimentos', 'ação', 'ações',
    'stock', 'stocks', 'fii', 'fiis', 'renda fixa', 'renda variável',
    'tesouro direto', 'cdb', 'lci', 'lca', 'poupança', 'poupanca',

    // ==================== CLIMA E TEMPO ====================
    'tempo', 'clima', 'previsão', 'previsões', 'temperatura', 'máxima',
    'mínima', 'sensação térmica', 'umidade', 'vento', 'ventos',
    'chuva', 'chuvas', 'garoa', 'pancada', 'temporal', 'tempestade',
    'ciclone', 'furacão', 'tufão', 'furação', 'enchente', 'enchentes',
    'alagamento', 'alagamentos', 'deslizamento', 'deslizamentos',
    'nevoeiro', 'neblina', 'neve', 'geada', 'granizo', 'calor', 'frio',
    'onda de calor', 'onda de frio', 'inverno', 'verão', 'outono', 'primavera',
    'sol', 'nublado', 'encoberto', 'aberto', 'rajada', 'meteorologia',
    'meteoro', 'climatempo', 'accuweather', 'weather', 'forecast',

    // ==================== ESPORTES ====================
    'jogo', 'jogos', 'partida', 'partidas', 'resultado', 'resultados',
    'placar', 'placares', 'gol', 'gols', 'cartão', 'cartões', 'expulsão',
    'expulsões', 'campeonato', 'campeonatos', 'torneio', 'torneios',
    'copa', 'copas', 'mundial', 'libertadores', 'sul-americana',
    'brasileirão', 'serie a', 'serie b', 'premier league', 'la liga',
    'liga das nações', 'champions league', 'europa league', 'futebol',
    'basquete', 'nba', 'vôlei', 'volei', 'superliga', 'tênis', 'tenis',
    'grand slam', 'australian open', 'roland garros', 'wimbledon', 'us open',
    'fórmula 1', 'f1', 'gp', 'moto gp', 'motogp', 'indy', 'nascar',
    'olimpíadas', 'olimpiadas', 'paralimpíadas', 'jogos olímpicos',
    'jogos paraolímpicos', 'atletismo', 'natação', 'ginástica', 'judô',
    'boxe', 'mma', 'ufc', 'wwe', 'ciclismo', 'skate', 'surfe', 'waves',

    // ==================== TECNOLOGIA ====================
    'lançamento', 'lançamentos', 'smartphone', 'celular', 'iphone',
    'android', 'samsung', 'xiaomi', 'motorola', 'apple', 'google pixel',
    'tablet', 'notebook', 'laptop', 'pc', 'computador', 'hardware',
    'software', 'app', 'aplicativo', 'aplicativos', 'atualização',
    'atualizações', 'update', 'updates', 'versão', 'versões', 'beta',
    'ios', 'ipad os', 'mac os', 'watch os', 'tv os', 'windows', 'linux',
    'ubuntu', 'processador', 'cpu', 'placa de vídeo', 'gpu', 'memória',
    'ram', 'ssd', 'hd', 'armazenamento', 'bateria', 'câmera', 'foto',
    'vídeo', 'gravação', 'tela', 'display', 'resolução', '4k', '8k',
    'inteligência artificial', 'ia', 'machine learning', 'chatgpt',
    'openai', 'gemini', 'copilot', 'assistente', 'robot', 'robô',
    'drones', '5g', 'wi-fi', 'bluetooth', 'nfc', 'realidade virtual',
    'realidade aumentada', 'vr', 'ar', 'metaverso', 'criptografia',

    // ==================== ENTRETENIMENTO E CULTURA ====================
    'filme', 'filmes', 'série', 'séries', 'novela', 'novelas', 'dorama',
    'k-drama', 'anime', 'animes', 'desenho', 'desenhos', 'animação',
    'streaming', 'netflix', 'prime video', 'disney+', 'hbo', 'max',
    'globoplay', 'apple tv+', 'paramount+', 'star+', 'crunchyroll',
    'artista', 'ator', 'atriz', 'atores', 'atrizes', 'cantor', 'cantora',
    'cantores', 'banda', 'bandas', 'show', 'shows', 'turnê', 'tour',
    'álbum', 'álbuns', 'música', 'músicas', 'hit', 'sucesso', 'famoso',
    'famosos', 'celebridade', 'celebridades', 'instagram', 'tiktok',
    'youtube', 'twitter', 'x', 'facebook', 'influenciador', 'digital',
    'game', 'games', 'videogame', 'playstation', 'xbox', 'nintendo',
    'lançamento de jogo', 'dlc', 'expansão', 'remaster', 'remake',

    // ==================== POLÍTICA E GOVERNO ====================
    'política', 'político', 'políticos', 'governo', 'governos',
    'presidente', 'governador', 'governadora', 'prefeito', 'prefeita',
    'senador', 'senadora', 'deputado', 'deputada', 'vereador', 'vereadora',
    'ministro', 'ministra', 'secretário', 'secretária', 'eleição',
    'eleições', 'votação', 'voto', 'urnas', 'candidato', 'candidata',
    'campanha', 'partido', 'partidos', 'congresso', 'senado', 'câmara',
    'câmara dos deputados', 'planalto', 'alvorada', 'supremo', 'stf',
    'tse', 'lei', 'leis', 'decreto', 'decretos', 'medida provisória',
    'mp', 'projeto de lei', 'pl', 'emenda', 'constituição', 'orçamento',
    'gastos', 'receita', 'imposto', 'impostos', 'taxa', 'taxas', 'tarifa',
    'tarifas', 'reforma', 'reformas', 'privatização', 'privatizações',

    // ==================== SAÚDE ====================
    'saúde', 'doença', 'doenças', 'epidemia', 'pandemia', 'covid',
    'coronavírus', 'covid-19', 'sars-cov-2', 'vírus', 'bactéria',
    'infecção', 'infecções', 'sintoma', 'sintomas', 'tratamento',
    'tratamentos', 'remédio', 'remédios', 'medicamento', 'medicamentos',
    'vacina', 'vacinas', 'vacinação', 'dose', 'doses', 'reforço',
    'imunização', 'imunidade', 'hospital', 'hospitais', 'uti', 'leito',
    'leitos', 'médico', 'médicos', 'enfermeiro', 'enfermeiros',
    'sus', 'ministério da saúde', 'ans', 'anvisa', 'fioCruz',
    'butantan', 'vacina da gripe', 'influenza', 'h1n1', 'dengue',
    'zika', 'chikungunya', 'febre amarela', 'sarampo', 'câncer', 'cancer',
    'diabetes', 'hipertensão', 'coração', 'infarto', 'avc', 'derrame',

    // ==================== TRÂNSITO E TRANSPORTE ====================
    'trânsito', 'transito', 'engarrafamento', 'congestionamento',
    'acidente', 'acidentes', 'colisão', 'batida', 'capotamento',
    'atropelamento', 'via', 'vias', 'estrada', 'estradas', 'rodovia',
    'rodovias', 'ferrovia', 'ferrovias', 'metrô', 'metro', 'trem', 'trens',
    'ônibus', 'onibus', 'carro', 'carros', 'moto', 'motos', 'bicicleta',
    'bike', 'transporte público', 'mobilidade', 'tarifa', 'tarifas',
    'passagem', 'passagens', 'bilhete', 'bilhetes', 'uber', '99',
    'cabify', 'aplicativo de transporte', 'gasolina', 'etanol', 'diesel',
    'álcool', 'combustível', 'combustíveis', 'posto', 'postos',

    // ==================== MEIO AMBIENTE ====================
    'meio ambiente', 'natureza', 'ecologia', 'sustentabilidade',
    'reciclagem', 'lixo', 'poluição', 'poluicao', 'desmatamento',
    'queimada', 'queimadas', 'incêndio', 'incêndios', 'desastre ambiental',
    'ecossistema', 'fauna', 'flora', 'animais', 'extinção', 'preservação',
    'carbono', 'co2', 'efeito estufa', 'aquecimento global', 'mudanças climáticas',
    'climáticas', 'protocolo de kyoto', 'acordo de paris', 'cop30',

    // ==================== EXPRESSÕES DE PESQUISA ====================
    'buscar', 'pesquisar', 'procure', 'procurar', 'quero saber',
    'gostaria de saber', 'preciso saber', 'me diga', 'diga-me',
    'conte-me', 'informe', 'explique', 'o que é', 'quem é', 'quem são',
    'qual é', 'quais são', 'onde fica', 'onde encontrar', 'como fazer',
    'como funciona', 'por que', 'porque', 'qual o motivo', 'qual a razão',
    'que dia', 'que horas', 'quando', 'desde quando', 'até quando',
    'o que aconteceu', 'o que está acontecendo', 'o que houve',
    'o que há de novo', 'últimas', 'último', 'recém', 'novidades',
    'fiquei sabendo', 'ouvi dizer', 'li que', 'vi que',

    // ==================== TERMOS EM INGLÊS (para queries mistas) ====================
    'last', 'latest', 'recent', 'current', 'today', 'now', 'right now',
    'news', 'breaking', 'headline', 'update', 'updates', 'report',
    'price', 'prices', 'quote', 'quotes', 'stock', 'stocks', 'market',
    'dollar', 'euro', 'pound', 'yen', 'bitcoin', 'crypto', 'cryptocurrency',
    'weather', 'forecast', 'rain', 'storm', 'hurricane', 'temperature',
    'game', 'games', 'match', 'score', 'result', 'championship',
    'movie', 'movies', 'series', 'tv show', 'release', 'premiere',
    'celebrity', 'actor', 'actress', 'singer', 'song', 'album',
    'election', 'vote', 'president', 'government', 'policy', 'law',
    'health', 'disease', 'vaccine', 'covid', 'pandemic', 'treatment',
    'traffic', 'accident', 'road', 'highway', 'transit', 'bus', 'train',
    'search', 'google', 'internet', 'web', 'online', 'find', 'look up'
  ];
  return palavrasChave.some(palavra => texto.includes(palavra));
}

/**
 * Função original que monta o payload específico para provedores com busca na web
 */
function montarPayload(provider, messages, basePayload) {
  const payload = { ...basePayload };

  if (provider.supportsWebSearch && precisaDeInfoAtual(messages)) {
    logger.info(`Ativando busca na web para ${provider.name}`);

    if (provider.name.includes('OpenRouter')) {
      payload.plugins = [{ id: "web", max_results: 5 }];
    } else if (provider.name.includes('Gemini')) {
      payload.tools = [{ googleSearch: {} }];
    } else if (provider.name.includes('Compound')) {
      // Nada a adicionar
    } else if (provider.name.includes('Claude')) {
      // Claude usa ferramenta "web_search" (formato pode variar)
      payload.tools = [{ type: "web_search" }];
    }
    // Outros provedores...
  }

  return payload;
}

async function callWithFallback(messages, hasImages = false) {
  const startTime = performance.now();
  const candidates = hasImages ? visionProviders : allProviders;
  const shuffled = [...candidates].sort(() => 0.5 - Math.random());

  // Cache key: apenas para texto e se habilitado
  const cacheKey = (CONFIG.CACHE_ENABLED && !hasImages) ? JSON.stringify(messages) : null;
  if (cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      logger.info(`Resposta em cache. (${(performance.now() - startTime).toFixed(2)}ms)`);
      return cached;
    }
  }

  // Log de detecção aprimorada
  const precisaBuscarAprimorado = precisaDeInfoAtualAprimorada(messages);
  if (precisaBuscarAprimorado) {
    logger.info(`Detecção aprimorada indica necessidade de busca.`);
  }

  for (const provider of shuffled) {
    const providerStart = performance.now();
    try {
      logger.info(`Tentando ${provider.name}...`);

      const basePayload = {
        model: provider.model,
        messages: messages,
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: CONFIG.TEMPERATURE,
      };

      const payload = montarPayload(provider, messages, basePayload);

      const response = await axiosWithRetry({
        method: 'post',
        url: provider.url,
        data: payload,
        headers: {
          'Authorization': `Bearer ${process.env[provider.apiKeyEnv]}`,
          'Content-Type': 'application/json',
          ...(provider.headers || {}),
        },
        timeout: CONFIG.REQUEST_TIMEOUT,
      });

      const content = response.data?.choices?.[0]?.message?.content;

      if (content && validarResposta(content, provider.name)) {
        const elapsed = performance.now() - providerStart;
        logger.info(`Sucesso com ${provider.name} (${elapsed.toFixed(2)}ms)`);

        if (extrairMetadadosBusca(response.data)) {
          logger.info(`A resposta incluiu resultados de busca.`);
        }

        if (cacheKey) {
          responseCache.set(cacheKey, content);
        }

        return content;
      } else {
        logger.warn(`Resposta inválida ou vazia de ${provider.name}`);
      }
    } catch (error) {
      const elapsed = performance.now() - providerStart;
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      logger.error(`Falha em ${provider.name} após ${elapsed.toFixed(2)}ms:`, 
        status ? `${status} ${statusText}` : error.message);
      
      if (error.response?.status === 429) continue;
      // Para outros erros, continua
    }
  }

  throw new Error('Todos os provedores falharam. Tente novamente mais tarde.');
}

module.exports = callWithFallback;
