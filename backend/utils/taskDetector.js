// backend/utils/taskDetector.js

/**
 * Task Detector Avançado
 * ======================
 * Detecta automaticamente o tipo de tarefa baseado na entrada do usuário,
 * retornando também detalhes específicos (ex.: tipo de código, função, classe, etc.)
 *
 * Tipos de tarefa:
 *  - "code": solicita código, script ou função
 *  - "debug": erros, falhas ou problemas técnicos
 *  - "project": criação ou implementação de projetos
 *  - "research": busca por dados atualizados, notícias, preços, eventos
 *  - "explain": explicação de conceitos ou definição de termos
 *
 * Retorna:
 *  {
 *    type: string,
 *    confidence: number (0-1),
 *    details: array of strings (ex.: ['function', 'example', 'fix'])
 *  }
 */

const TASK_PATTERNS = {
  code: [
    { pattern: /\bcódigo\b/i, type: 'general' },
    { pattern: /\bscript\b/i, type: 'general' },
    { pattern: /\bfunção\b/i, type: 'function' },
    { pattern: /\bclasse\b/i, type: 'class' },
    { pattern: /\bexemplo de código\b/i, type: 'example' },
    { pattern: /\bcorrigir\b/i, type: 'fix' },
    { pattern: /\bdebug\b/i, type: 'debug' },
    { pattern: /\bescreva\b/i, type: 'general' },
    { pattern: /\bgere\b/i, type: 'general' },
    { pattern: /\bprograma\b/i, type: 'general' }
  ],
  debug: [
    { pattern: /\berro\b/i, type: 'error' },
    { pattern: /\bbug\b/i, type: 'bug' },
    { pattern: /\bfalha\b/i, type: 'failure' },
    { pattern: /\bexception\b/i, type: 'exception' },
    { pattern: /\bnão funciona\b/i, type: 'not-working' },
    { pattern: /\bquebrou\b/i, type: 'crash' },
    { pattern: /\bproblema\b/i, type: 'problem' }
  ],
  project: [
    { pattern: /\bcomo criar\b/i, type: 'create' },
    { pattern: /\bimplementar\b/i, type: 'implement' },
    { pattern: /\bprojeto\b/i, type: 'project' },
    { pattern: /\bconstruir\b/i, type: 'build' },
    { pattern: /\bdesenvolver\b/i, type: 'develop' },
    { pattern: /\bfazer um\b/i, type: 'make' },
    { pattern: /\bmontar um\b/i, type: 'assemble' }
  ],
  research: [
    { pattern: /\bpesquisar\b/i, type: 'search' },
    { pattern: /\bbuscar\b/i, type: 'search' },
    { pattern: /\bdados atualizados\b/i, type: 'fresh' },
    { pattern: /\bnotícias\b/i, type: 'news' },
    { pattern: /\bpreço\b/i, type: 'price' },
    { pattern: /\bcotação\b/i, type: 'quote' },
    { pattern: /\búltimo\b/i, type: 'latest' },
    { pattern: /\brecente\b/i, type: 'recent' },
    { pattern: /\bhoje\b/i, type: 'today' },
    { pattern: /\bagora\b/i, type: 'now' },
    { pattern: /\batual\b/i, type: 'current' },
    { pattern: /\bnovo\b/i, type: 'new' },
    { pattern: /\blançamento\b/i, type: 'launch' },
    { pattern: /\btempo\b/i, type: 'weather' },
    { pattern: /\bclima\b/i, type: 'weather' },
    { pattern: /\bprevisão\b/i, type: 'forecast' },
    { pattern: /\bresultado\b/i, type: 'result' },
    { pattern: /\bjogo\b/i, type: 'game' },
    { pattern: /\bpartida\b/i, type: 'match' },
    { pattern: /\beleição\b/i, type: 'election' },
    { pattern: /\bcotação do dólar\b/i, type: 'currency' },
    { pattern: /\bbitcoin\b/i, type: 'crypto' },
    { pattern: /\bvalor\b/i, type: 'value' },
    { pattern: /\bcusto\b/i, type: 'cost' },
    { pattern: /\bpromoção\b/i, type: 'promo' },
    { pattern: /\bdesconto\b/i, type: 'discount' },
    { pattern: /\boferta\b/i, type: 'offer' },
    { pattern: /\búltimas\b/i, type: 'latest' },
    { pattern: /\bbreaking\b/i, type: 'breaking' },
    { pattern: /\burgente\b/i, type: 'urgent' }
  ],
  explain: [
    { pattern: /\bexplique\b/i, type: 'explain' },
    { pattern: /\bcomo funciona\b/i, type: 'how-it-works' },
    { pattern: /\bconceito\b/i, type: 'concept' },
    { pattern: /\bo que é\b/i, type: 'definition' },
    { pattern: /\bdefinição\b/i, type: 'definition' },
    { pattern: /\bsignificado\b/i, type: 'meaning' },
    { pattern: /\bentender\b/i, type: 'understand' }
  ]
};

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
