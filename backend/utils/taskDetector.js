// backend/utils/taskDetector.js

/**
 * Task Detector Avançado
 * ======================
 * Detecta automaticamente o tipo de tarefa baseado na entrada do usuário,
 * retornando também detalhes específicos.
 *
 * Tipos de tarefa:
 *  - "code": solicita código, script ou função
 *  - "debug": erros, falhas ou problemas técnicos
 *  - "project": criação ou implementação de projetos
 *  - "research": busca por dados atualizados, notícias, preços, eventos
 *  - "explain": explicação de conceitos ou definição de termos
 *  - "api", "security", "performance", "devops", "ai", "database", "network", "cloud", "ux_ui", "testing", "analytics"
 *
 * Retorna:
 *  {
 *    type: string,
 *    confidence: number (0-1),
 *    details: array of strings (ex.: ['function', 'example', 'fix'])
 *  }
 */

const TASK_PATTERNS = {
  // Geração e desenvolvimento de código
  code: [
    { pattern: /\bcódigo\b/i, type: 'code' },
    { pattern: /\bscript\b/i, type: 'script' },
    { pattern: /\bfunção\b/i, type: 'function' },
    { pattern: /\bclasse\b/i, type: 'class' },
    { pattern: /\bmétodo\b/i, type: 'method' },
    { pattern: /\balgoritmo\b/i, type: 'algorithm' },
    { pattern: /\bimplementação\b/i, type: 'implementation' },
    { pattern: /\btrecho de código\b/i, type: 'snippet' },
    { pattern: /\bexemplo de código\b/i, type: 'example' },
    { pattern: /\bexemplo\b/i, type: 'example' },
    { pattern: /\bescreva\b/i, type: 'generate' },
    { pattern: /\bgere\b/i, type: 'generate' },
    { pattern: /\bcrie\b/i, type: 'generate' },
    { pattern: /\bprograma\b/i, type: 'program' },
    { pattern: /\bsolução\b/i, type: 'solution' },
    { pattern: /\bimplementação completa\b/i, type: 'full_implementation' },
    { pattern: /\btrecho funcional\b/i, type: 'functional_snippet' }
  ],

  // Debugging e resolução de erros
  debug: [
    { pattern: /\berro\b/i, type: 'error' },
    { pattern: /\bbug\b/i, type: 'bug' },
    { pattern: /\bdebug\b/i, type: 'debug' },
    { pattern: /\bfalha\b/i, type: 'failure' },
    { pattern: /\bexception\b/i, type: 'exception' },
    { pattern: /\bnão funciona\b/i, type: 'not_working' },
    { pattern: /\bquebrou\b/i, type: 'crash' },
    { pattern: /\bproblema\b/i, type: 'problem' },
    { pattern: /\bstack trace\b/i, type: 'stacktrace' },
    { pattern: /\btravando\b/i, type: 'freeze' },
    { pattern: /\bnão executa\b/i, type: 'not_execute' },
    { pattern: /\bfalhando\b/i, type: 'failing' },
    { pattern: /\bconflito\b/i, type: 'conflict' },
    { pattern: /\bpanic\b/i, type: 'panic' },
    { pattern: /\bdebug avançado\b/i, type: 'advanced_debug' },
    { pattern: /\binspeção\b/i, type: 'inspection' },
    { pattern: /\btrace\b/i, type: 'trace' }
  ],

  // Projetos, arquitetura e desenvolvimento de aplicações
  project: [
    { pattern: /\bcomo criar\b/i, type: 'create' },
    { pattern: /\bcomo fazer\b/i, type: 'create' },
    { pattern: /\bimplementar\b/i, type: 'implement' },
    { pattern: /\bprojeto\b/i, type: 'project' },
    { pattern: /\bconstruir\b/i, type: 'build' },
    { pattern: /\bdesenvolver\b/i, type: 'develop' },
    { pattern: /\bmontar\b/i, type: 'assemble' },
    { pattern: /\barquitetura\b/i, type: 'architecture' },
    { pattern: /\bestrutura\b/i, type: 'structure' },
    { pattern: /\bsetup\b/i, type: 'setup' },
    { pattern: /\biniciar projeto\b/i, type: 'init_project' },
    { pattern: /\bcriar aplicação\b/i, type: 'create_app' },
    { pattern: /\bconfiguração\b/i, type: 'configuration' },
    { pattern: /\bscaffold\b/i, type: 'scaffold' },
    { pattern: /\bboas práticas\b/i, type: 'best_practices' },
    { pattern: /\bdocumentação\b/i, type: 'documentation' },
    { pattern: /\barquitetura limpa\b/i, type: 'clean_architecture' },
    { pattern: /\bdesign pattern\b/i, type: 'design_pattern' }
  ],

  // Pesquisa, dados e informações atualizadas
  research: [
    // Padrões básicos de pesquisa
    { pattern: /\bpesquisar\b/i, type: 'search' },
    { pattern: /\bbuscar\b/i, type: 'search' },
    { pattern: /\bdados atualizados\b/i, type: 'fresh_data' },
    { pattern: /\bnotícias\b/i, type: 'news' },
    { pattern: /\bnotícia\b/i, type: 'news' },
    { pattern: /\búltimas notícias\b/i, type: 'latest_news' },
    
    // Preços, valores e cotações
    { pattern: /\bpreço\b/i, type: 'price' },
    { pattern: /\bpreços\b/i, type: 'price' },
    { pattern: /\bcotação\b/i, type: 'quote' },
    { pattern: /\bcotações\b/i, type: 'quote' },
    { pattern: /\bvalor\b/i, type: 'value' },
    { pattern: /\bvalores\b/i, type: 'value' },
    { pattern: /\bcusto\b/i, type: 'cost' },
    { pattern: /\bcustos\b/i, type: 'cost' },
    { pattern: /\bpromoção\b/i, type: 'promotion' },
    { pattern: /\bpromoções\b/i, type: 'promotion' },
    { pattern: /\bdesconto\b/i, type: 'discount' },
    { pattern: /\bdescontos\b/i, type: 'discount' },
    { pattern: /\boferta\b/i, type: 'offer' },
    { pattern: /\bofertas\b/i, type: 'offer' },
    
    // Tempo, data e hora
    { pattern: /\bque horas são\b/i, type: 'current_time' },
    { pattern: /\bhoras\b/i, type: 'time_query' },
    { pattern: /\bhorário\b/i, type: 'time_query' },
    { pattern: /\bhorário atual\b/i, type: 'current_time' },
    { pattern: /\bhora certa\b/i, type: 'current_time' },
    { pattern: /\bhora exata\b/i, type: 'current_time' },
    { pattern: /\bhora\b/i, type: 'time_query' },
    { pattern: /\bminutos\b/i, type: 'time_query' },
    { pattern: /\bsegundos\b/i, type: 'time_query' },
    { pattern: /\bdata atual\b/i, type: 'current_date' },
    { pattern: /\bdata de hoje\b/i, type: 'current_date' },
    { pattern: /\bque dia é hoje\b/i, type: 'current_date' },
    { pattern: /\bdia da semana\b/i, type: 'weekday' },
    { pattern: /\bque dia é\b/i, type: 'current_date' },
    { pattern: /\bdata\b/i, type: 'date_query' },
    { pattern: /\bcalendário\b/i, type: 'calendar' },
    { pattern: /\bfuso horário\b/i, type: 'timezone' },
    
    // Eventos recentes e atualizações
    { pattern: /\blançamento\b/i, type: 'launch' },
    { pattern: /\blançamentos\b/i, type: 'launch' },
    { pattern: /\brecente\b/i, type: 'recent' },
    { pattern: /\brecentes\b/i, type: 'recent' },
    { pattern: /\batual\b/i, type: 'current' },
    { pattern: /\batualizado\b/i, type: 'current' },
    { pattern: /\batualizada\b/i, type: 'current' },
    { pattern: /\búltimo\b/i, type: 'latest' },
    { pattern: /\búltima\b/i, type: 'latest' },
    { pattern: /\búltimos\b/i, type: 'latest' },
    { pattern: /\búltimas\b/i, type: 'latest' },
    { pattern: /\bhoje\b/i, type: 'today' },
    { pattern: /\bagora\b/i, type: 'now' },
    { pattern: /\bagorinha\b/i, type: 'now' },
    { pattern: /\bnesse momento\b/i, type: 'now' },
    { pattern: /\batualmente\b/i, type: 'currently' },
    { pattern: /\bem tempo real\b/i, type: 'realtime' },
    { pattern: /\bbreaking\b/i, type: 'breaking' },
    { pattern: /\burgente\b/i, type: 'urgent' },
    
    // Clima e tempo
    { pattern: /\btempo\b/i, type: 'weather' },
    { pattern: /\bclima\b/i, type: 'weather' },
    { pattern: /\bprevisão\b/i, type: 'forecast' },
    { pattern: /\bprevisão do tempo\b/i, type: 'weather_forecast' },
    { pattern: /\bchuv\b/i, type: 'weather' }, // chuva, chuvoso
    { pattern: /\bsol\b/i, type: 'weather' },
    { pattern: /\btemperatura\b/i, type: 'temperature' },
    { pattern: /\bmáxima\b/i, type: 'temperature' },
    { pattern: /\bmínima\b/i, type: 'temperature' },
    { pattern: /\bumidade\b/i, type: 'humidity' },
    { pattern: /\bfrio\b/i, type: 'weather' },
    { pattern: /\bcalor\b/i, type: 'weather' },
    
    // Esportes e resultados
    { pattern: /\bjogo\b/i, type: 'sports' },
    { pattern: /\bjogos\b/i, type: 'sports' },
    { pattern: /\bpartida\b/i, type: 'sports' },
    { pattern: /\bpartidas\b/i, type: 'sports' },
    { pattern: /\bresultado\b/i, type: 'result' },
    { pattern: /\bresultados\b/i, type: 'result' },
    { pattern: /\bplacar\b/i, type: 'score' },
    { pattern: /\bplacares\b/i, type: 'score' },
    { pattern: /\bcampeonato\b/i, type: 'championship' },
    { pattern: /\bcampeonatos\b/i, type: 'championship' },
    { pattern: /\bcopa\b/i, type: 'cup' },
    { pattern: /\btorneio\b/i, type: 'tournament' },
    { pattern: /\bolimpíadas\b/i, type: 'olympics' },
    
    // Política e eleições
    { pattern: /\beleição\b/i, type: 'politics' },
    { pattern: /\beleições\b/i, type: 'politics' },
    { pattern: /\bvotação\b/i, type: 'politics' },
    { pattern: /\bvotações\b/i, type: 'politics' },
    { pattern: /\bpresidente\b/i, type: 'politics' },
    { pattern: /\bgovernador\b/i, type: 'politics' },
    { pattern: /\bprefeito\b/i, type: 'politics' },
    { pattern: /\bpesquisa eleitoral\b/i, type: 'polls' },
    
    // Economia e finanças
    { pattern: /\bdólar\b/i, type: 'currency' },
    { pattern: /\beuro\b/i, type: 'currency' },
    { pattern: /\breal\b/i, type: 'currency' },
    { pattern: /\blibra\b/i, type: 'currency' },
    { pattern: /\bmoeda\b/i, type: 'currency' },
    { pattern: /\bcâmbio\b/i, type: 'exchange_rate' },
    { pattern: /\btaxa de câmbio\b/i, type: 'exchange_rate' },
    { pattern: /\bbitcoin\b/i, type: 'crypto' },
    { pattern: /\bcriptomoeda\b/i, type: 'crypto' },
    { pattern: /\bcriptomoedas\b/i, type: 'crypto' },
    { pattern: /\bethereum\b/i, type: 'crypto' },
    { pattern: /\bbtc\b/i, type: 'crypto' },
    { pattern: /\bmercado financeiro\b/i, type: 'finance' },
    { pattern: /\bbolsa de valores\b/i, type: 'stock_market' },
    { pattern: /\bíndice\b/i, type: 'index' },
    { pattern: /\bíndices\b/i, type: 'index' },
    { pattern: /\bipca\b/i, type: 'index' },
    { pattern: /\binflação\b/i, type: 'inflation' },
    { pattern: /\bpib\b/i, type: 'gdp' },
    { pattern: /\bjuros\b/i, type: 'interest' },
    { pattern: /\bselic\b/i, type: 'interest' },
    { pattern: /\bcdi\b/i, type: 'interest' },
    
    // Análise e estatísticas
    { pattern: /\banálise\b/i, type: 'analysis' },
    { pattern: /\banálises\b/i, type: 'analysis' },
    { pattern: /\bestatística\b/i, type: 'statistics' },
    { pattern: /\bestatísticas\b/i, type: 'statistics' },
    { pattern: /\bgráfico\b/i, type: 'chart' },
    { pattern: /\bgráficos\b/i, type: 'chart' },
    { pattern: /\btabela\b/i, type: 'table' },
    { pattern: /\bdados\b/i, type: 'data' },
    { pattern: /\bmétrica\b/i, type: 'metrics' },
    { pattern: /\bmétricas\b/i, type: 'metrics' },
    { pattern: /\bindicador\b/i, type: 'indicator' },
    { pattern: /\bindicadores\b/i, type: 'indicator' },
    { pattern: /\btendência\b/i, type: 'trend' },
    { pattern: /\btendências\b/i, type: 'trend' }
  ],

  // Explicações, conceitos e exemplos
  explain: [
    { pattern: /\bexplique\b/i, type: 'explanation' },
    { pattern: /\bexplicar\b/i, type: 'explanation' },
    { pattern: /\bcomo funciona\b/i, type: 'how_it_works' },
    { pattern: /\bconceito\b/i, type: 'concept' },
    { pattern: /\bo que é\b/i, type: 'definition' },
    { pattern: /\bdefinição\b/i, type: 'definition' },
    { pattern: /\bsignificado\b/i, type: 'meaning' },
    { pattern: /\bentender\b/i, type: 'understand' },
    { pattern: /\bpara que serve\b/i, type: 'purpose' },
    { pattern: /\bexemplo\b/i, type: 'example' },
    { pattern: /\butilização\b/i, type: 'usage' },
    { pattern: /\bexplicação detalhada\b/i, type: 'detailed_explanation' },
    { pattern: /\bpasso a passo\b/i, type: 'step_by_step' },
    { pattern: /\bfluxo\b/i, type: 'workflow' },
    { pattern: /\bmelhores práticas\b/i, type: 'best_practices_explanation' }
  ],

  // Categorias avançadas corporativas
  api: [
    { pattern: /\bapi\b/i, type: 'api' },
    { pattern: /\bendpoint\b/i, type: 'endpoint' },
    { pattern: /\brest\b/i, type: 'rest' },
    { pattern: /\bgraphql\b/i, type: 'graphql' },
    { pattern: /\brequisição\b/i, type: 'request' },
    { pattern: /\bresponse\b/i, type: 'response' },
    { pattern: /\bautenticação\b/i, type: 'authentication' },
    { pattern: /\btoken\b/i, type: 'token' },
    { pattern: /\bwebhook\b/i, type: 'webhook' }
  ],

  security: [
    { pattern: /\bsegurança\b/i, type: 'security' },
    { pattern: /\bautenticação\b/i, type: 'authentication' },
    { pattern: /\bautorização\b/i, type: 'authorization' },
    { pattern: /\bcriptografia\b/i, type: 'encryption' },
    { pattern: /\bsql injection\b/i, type: 'sql_injection' },
    { pattern: /\bxss\b/i, type: 'xss' },
    { pattern: /\bcsrf\b/i, type: 'csrf' },
    { pattern: /\bpenetration test\b/i, type: 'pentest' }
  ],

  performance: [
    { pattern: /\bperformance\b/i, type: 'performance' },
    { pattern: /\botimização\b/i, type: 'optimization' },
    { pattern: /\bbenchmark\b/i, type: 'benchmark' },
    { pattern: /\bcaching\b/i, type: 'caching' },
    { pattern: /\blazy loading\b/i, type: 'lazy_loading' },
    { pattern: /\bthroughput\b/i, type: 'throughput' },
    { pattern: /\bresposta rápida\b/i, type: 'fast_response' }
  ],

  devops: [
    { pattern: /\bdeploy\b/i, type: 'deploy' },
    { pattern: /\bci\/cd\b/i, type: 'ci_cd' },
    { pattern: /\bdocker\b/i, type: 'docker' },
    { pattern: /\bkubernetes\b/i, type: 'k8s' },
    { pattern: /\binfraestrutura\b/i, type: 'infrastructure' },
    { pattern: /\bautomação\b/i, type: 'automation' },
    { pattern: /\bmonitoramento\b/i, type: 'monitoring' },
    { pattern: /\blog\b/i, type: 'logging' }
  ],

  ai: [
    { pattern: /\binteligência artificial\b/i, type: 'ai' },
    { pattern: /\bmachine learning\b/i, type: 'ml' },
    { pattern: /\bdeep learning\b/i, type: 'dl' },
    { pattern: /\bmodelo\b/i, type: 'model' },
    { pattern: /\btreinamento\b/i, type: 'training' },
    { pattern: /\bpreditivo\b/i, type: 'predictive' },
    { pattern: /\balgoritmo de IA\b/i, type: 'ai_algorithm' }
  ],

  database: [
    { pattern: /\bbanco de dados\b/i, type: 'database' },
    { pattern: /\bquery\b/i, type: 'query' },
    { pattern: /\bsql\b/i, type: 'sql' },
    { pattern: /\bnosql\b/i, type: 'nosql' },
    { pattern: /\bmigration\b/i, type: 'migration' },
    { pattern: /\bindexação\b/i, type: 'indexing' }
  ],

  network: [
    { pattern: /\brede\b/i, type: 'network' },
    { pattern: /\bprotocolo\b/i, type: 'protocol' },
    { pattern: /\blatência\b/i, type: 'latency' },
    { pattern: /\blargura de banda\b/i, type: 'bandwidth' },
    { pattern: /\brouting\b/i, type: 'routing' }
  ],

  cloud: [
    { pattern: /\bnuvem\b/i, type: 'cloud' },
    { pattern: /\baws\b/i, type: 'aws' },
    { pattern: /\bazure\b/i, type: 'azure' },
    { pattern: /\bgcp\b/i, type: 'gcp' },
    { pattern: /\bserviço gerenciado\b/i, type: 'managed_service' }
  ],

  ux_ui: [
    { pattern: /\binterface\b/i, type: 'ui' },
    { pattern: /\bexperiência do usuário\b/i, type: 'ux' },
    { pattern: /\bdesign\b/i, type: 'design' },
    { pattern: /\bprototipo\b/i, type: 'prototype' },
    { pattern: /\bwireframe\b/i, type: 'wireframe' }
  ],

  testing: [
    { pattern: /\bteste\b/i, type: 'testing' },
    { pattern: /\bunitário\b/i, type: 'unit_test' },
    { pattern: /\bintegração\b/i, type: 'integration_test' },
    { pattern: /\bautomático\b/i, type: 'automation_test' },
    { pattern: /\bqa\b/i, type: 'quality_assurance' }
  ],

  analytics: [
    { pattern: /\banálise de dados\b/i, type: 'data_analysis' },
    { pattern: /\bdashboard\b/i, type: 'dashboard' },
    { pattern: /\bKPI\b/i, type: 'kpi' },
    { pattern: /\bmetr[ií]cas\b/i, type: 'metrics' },
    { pattern: /\brelatório\b/i, type: 'report' }
  ]
};

/**
 * Detecta o tipo de tarefa baseado na entrada do usuário.
 *
 * @param {string} userInput - Entrada do usuário
 * @returns { {type: string, confidence: number, details: string[]} }
 */
function detectTaskType(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return { type: 'explain', confidence: 0.5, details: [] };
  }

  const text = userInput.toLowerCase().trim();
  const scores = {};

  for (const [task, patterns] of Object.entries(TASK_PATTERNS)) {
    let count = 0;
    let details = [];
    for (const { pattern, type } of patterns) {
      if (pattern.test(text)) {
        count++;
        details.push(type);
      }
    }
    scores[task] = {
      score: count / patterns.length,
      details: [...new Set(details)] // remove duplicatas
    };
  }

  // Ordena por maior score
  const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  const [bestTask, bestData] = sorted[0];

  if (bestData.score === 0) {
    return { type: 'explain', confidence: 0.5, details: [] };
  }

  return {
    type: bestTask,
    confidence: parseFloat(bestData.score.toFixed(2)),
    details: bestData.details
  };
}

module.exports = detectTaskType;
