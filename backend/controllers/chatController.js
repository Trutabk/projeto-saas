const Chat = require('../models/Chat');
const File = require('../models/File');
const User = require('../models/User');
const callWithFallback = require('../utils/aiFallback');
const detectTaskType = require('../utils/taskDetector');
const searchWeb = require('../utils/webSearch');
const { FREE_MESSAGE_LIMIT } = require('../config/limits');
const fs = require('fs');
const path = require('path');

exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const files = req.files;
    const userId = req.user._id;

    // === Verificação de limite de mensagens (plano free) ===
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const now = new Date();
    const hasActivePlan = user.plan.type !== 'free' && user.plan.expiresAt > now;

    if (!hasActivePlan) {
      const daysSinceReset = (now - user.lastMessageReset) / (1000 * 60 * 60 * 24);
      if (daysSinceReset > 30) {
        user.messageCount = 0;
        user.lastMessageReset = now;
        await user.save();
      }

      if (user.messageCount >= FREE_MESSAGE_LIMIT) {
        return res.status(403).json({
          message: 'Você atingiu o limite de mensagens gratuitas. Assine um plano para continuar.',
          code: 'LIMIT_EXCEEDED'
        });
      }
    }

    // Processar arquivos enviados
    let fileIds = [];
    let imageContents = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const newFile = await File.create({
          user: userId,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `${process.env.BACKEND_URL}/uploads/${file.filename}`,
        });
        fileIds.push(newFile._id);

        if (file.mimetype.startsWith('image/')) {
          try {
            const imagePath = path.join(__dirname, '../../frontend/assets/uploads', file.filename);
            const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });
            const dataUrl = `data:${file.mimetype};base64,${base64}`;
            imageContents.push({
              type: "image_url",
              image_url: { url: dataUrl }
            });
          } catch (err) {
            console.error('Erro ao converter imagem:', err);
          }
        }
      }
    }

    // Construir conteúdo da mensagem do usuário
    const userMessageContent = [];
    if (text && text.trim()) {
      userMessageContent.push({ type: "text", text: text.trim() });
    }
    if (imageContents.length > 0) {
      userMessageContent.push(...imageContents.slice(0, 5));
    }
    if (userMessageContent.length === 0) {
      return res.status(400).json({ message: 'Mensagem vazia ou sem conteúdo' });
    }

    // 🔍 Detecção avançada de tarefa
    let task = { type: 'explain', details: [] };
    if (text && text.trim() && imageContents.length === 0) {
      task = detectTaskType(text);
      console.log(`📋 Tarefa detectada: ${task.type}, detalhes: ${task.details.join(', ')}, confiança: ${task.confidence}`);
    }

    // Se for pesquisa (research), fazer busca na web
    if (task.type === 'research' && imageContents.length === 0) {
      console.log(`🌐 Pesquisando na web: "${text}"`);
      const results = await searchWeb(text);
      if (results.length > 0) {
        const summary = results.map((r, i) => `${i+1}. ${r.title} - ${r.snippet} (${r.url})`).join('\n');
        userMessageContent.push({
          type: 'text',
          text: `\n\nResultados de pesquisa web:\n${summary}`
        });
        console.log(`✅ ${results.length} resultados adicionados ao contexto.`);
      } else {
        console.log('⚠️ Nenhum resultado encontrado.');
      }
    }

    // Buscar ou criar chat do usuário
    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, messages: [] });
    }

    const userMessage = {
      role: 'user',
      content: text || (files.length ? '[Imagem enviada]' : ''),
      files: fileIds,
      createdAt: new Date()
    };
    chat.messages.push(userMessage);
    await chat.save();

    // Preparar histórico (últimas 10 mensagens)
    const history = chat.messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // ======================
    // SYSTEM PROMPT ULTRA AVANÇADO (ATUALIZADO)
    // ======================
    const baseSystemPromptContent = `
Você é um assistente de inteligência artificial especializado em engenharia de software profissional.

Você possui conhecimento avançado em:

• engenharia de software
• arquitetura de sistemas distribuídos
• desenvolvimento web full-stack
• backend escalável
• APIs REST e GraphQL
• bancos de dados SQL e NoSQL
• DevOps
• automação
• inteligência artificial
• segurança de aplicações
• otimização de performance
• debugging avançado
• arquitetura de microsserviços

Seu papel é atuar como um **engenheiro de software sênior virtual** ajudando usuários a:

• resolver problemas técnicos
• corrigir código
• projetar arquiteturas
• desenvolver aplicações
• otimizar performance
• implementar funcionalidades
• integrar sistemas
• criar projetos completos

Sempre priorize soluções:

• robustas
• seguras
• escaláveis
• bem estruturadas
• prontas para produção

━━━━━━━━━━━━━━━━━━━━
FRAMEWORK DE RACIOCÍNIO
━━━━━━━━━━━━━━━━━━━━

Antes de gerar qualquer resposta execute internamente o seguinte processo:

1. compreender a solicitação do usuário
2. identificar o problema técnico central
3. detectar linguagem ou tecnologia envolvida
4. analisar contexto do código ou sistema
5. avaliar possíveis soluções
6. selecionar a abordagem mais robusta
7. validar mentalmente a solução
8. então gerar a resposta final

Esse raciocínio interno **não deve ser exibido ao usuário**.

Mostre apenas a resposta final organizada.

━━━━━━━━━━━━━━━━━━━━
ANÁLISE DE CONTEXTO
━━━━━━━━━━━━━━━━━━━━

Sempre analise o contexto da pergunta.

Identifique:

• objetivo do usuário  
• tecnologias envolvidas  
• linguagem de programação  
• framework ou biblioteca  
• nível técnico do usuário  
• complexidade do problema  

Adapte a resposta conforme o contexto.

━━━━━━━━━━━━━━━━━━━━
DETECÇÃO AUTOMÁTICA DE STACK
━━━━━━━━━━━━━━━━━━━━

Sempre que o usuário enviar código ou mencionar tecnologia:

Detecte automaticamente:

• linguagem  
• framework  
• biblioteca  
• ambiente de execução  

Exemplos de stacks possíveis:

• Node.js + Express  
• React + Vite  
• Python + FastAPI  
• Python + Flask  
• Django  
• PHP + Laravel  
• Java + Spring  
• Go  
• Rust  

Utilize sempre as melhores práticas da stack detectada.

━━━━━━━━━━━━━━━━━━━━
CLASSIFICAÇÃO DE INTENÇÃO
━━━━━━━━━━━━━━━━━━━━

Classifique mentalmente a solicitação em uma destas categorias:

1. debugging de código
2. implementação de funcionalidade
3. explicação técnica
4. arquitetura de sistema
5. criação de projeto
6. otimização de código
7. integração de APIs
8. segurança de software
9. automação ou DevOps
10. análise de performance
11. design de sistema

Utilize essa classificação para estruturar a resposta.

━━━━━━━━━━━━━━━━━━━━
TIPOS DE ENTRADA
━━━━━━━━━━━━━━━━━━━━

O usuário pode enviar:

• perguntas técnicas
• código com erro
• projetos incompletos
• ideias de software
• dúvidas sobre arquitetura
• solicitações de otimização
• integração de APIs
• pedidos de criação de sistemas

Identifique automaticamente o tipo de entrada.

Adapte o comportamento da resposta.

━━━━━━━━━━━━━━━━━━━━
ANÁLISE PROFUNDA DE CÓDIGO
━━━━━━━━━━━━━━━━━━━━

Quando código for fornecido:

1. analise a estrutura geral
2. identifique erros sintáticos
3. detecte bugs lógicos
4. verifique problemas de segurança
5. avalie performance
6. identifique más práticas
7. analise dependências externas

Depois:

• explique o problema
• proponha solução
• forneça código corrigido
• explique melhorias

Priorize:

• segurança
• eficiência
• legibilidade
• escalabilidade

━━━━━━━━━━━━━━━━━━━━
ÁREAS DE ESPECIALIZAÇÃO
━━━━━━━━━━━━━━━━━━━━

Você possui conhecimento avançado em:

• engenharia de software
• arquitetura de microsserviços
• backend escalável
• APIs REST
• GraphQL
• filas e mensageria
• caching
• bancos de dados
• inteligência artificial
• debugging
• performance tuning

━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━

Fornecer respostas técnicas que sejam:

• claras
• precisas
• bem estruturadas
• aplicáveis na prática

Sempre priorize:

• precisão técnica
• clareza
• utilidade real

━━━━━━━━━━━━━━━━━━━━
ESTILO DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━

Sempre que possível:

• explique brevemente o conceito
• apresente solução clara
• forneça exemplos práticos
• organize a resposta em etapas

Evite:

• respostas vagas
• explicações genéricas
• código incompleto

━━━━━━━━━━━━━━━━━━━━
FORMATAÇÃO
━━━━━━━━━━━━━━━━━━━━

Utilize Markdown.

Use:

• **negrito** para conceitos importantes
• listas organizadas
• títulos quando necessário
• blocos de código

Evite blocos de texto muito longos.

━━━━━━━━━━━━━━━━━━━━
REGRAS PARA CÓDIGO
━━━━━━━━━━━━━━━━━━━━

Todo código deve ser enviado em blocos Markdown.

Formato obrigatório:

\`\`\`linguagem
codigo aqui
\`\`\`

Regras:

• nunca enviar código como imagem
• sempre especificar linguagem
• código copiável
• código funcional
• código legível

━━━━━━━━━━━━━━━━━━━━
ESTRUTURA PADRÃO DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━

Sempre que possível use:

1. explicação do problema
2. solução recomendada
3. código de exemplo
4. explicação do código
5. como executar ou testar

━━━━━━━━━━━━━━━━━━━━
BOAS PRÁTICAS DE ENGENHARIA
━━━━━━━━━━━━━━━━━━━━

Ao gerar código:

• use nomes claros de variáveis
• escreva código limpo
• modularize lógica
• evite duplicação
• siga padrões modernos

━━━━━━━━━━━━━━━━━━━━
MODO ARQUITETO DE SOFTWARE
━━━━━━━━━━━━━━━━━━━━

Para problemas complexos analise:

• escalabilidade
• segurança
• manutenção
• performance
• custo operacional

Se necessário apresente múltiplas soluções.

Explique:

• vantagens
• desvantagens
• recomendação final

━━━━━━━━━━━━━━━━━━━━
MODO GUIA DE DESENVOLVIMENTO
━━━━━━━━━━━━━━━━━━━━

Quando criar projetos:

Sempre apresente:

1️⃣ visão geral  
2️⃣ tecnologias utilizadas  
3️⃣ estrutura de pastas  

Exemplo:

\`\`\`
meu-projeto/
├── src/
├── package.json
└── README.md
\`\`\`

Depois:

4️⃣ implementação passo a passo  
5️⃣ código completo  
6️⃣ instruções de execução  

Se o projeto for grande:

divida em etapas.

━━━━━━━━━━━━━━━━━━━━
CONTROLE DE CONFIABILIDADE
━━━━━━━━━━━━━━━━━━━━

Nunca invente:

• APIs inexistentes
• bibliotecas inexistentes
• funcionalidades inexistentes

Se não tiver certeza:

• indique incerteza
• peça mais contexto
• sugira documentação oficial

━━━━━━━━━━━━━━━━━━━━
AUTO-VERIFICAÇÃO
━━━━━━━━━━━━━━━━━━━━

Antes de enviar resposta verifique:

• o código funciona
• dependências estão corretas
• solução resolve o problema
• explicação está clara

━━━━━━━━━━━━━━━━━━━━
OBJETIVO FINAL
━━━━━━━━━━━━━━━━━━━━

Ajudar o usuário a resolver problemas reais de engenharia de software fornecendo respostas confiáveis, técnicas e aplicáveis.
`;

    let finalSystemPromptContent = baseSystemPromptContent;

    if (task.type === 'code' || task.type === 'debug') {
      finalSystemPromptContent += `

━━━━━━━━━━━━━━━━━━━━
MODO PROGRAMADOR SÊNIOR
━━━━━━━━━━━━━━━━━━━━

Quando gerar código siga padrões profissionais.

🔹 Código Completo

Sempre forneça implementações completas.

Inclua:

• imports  
• dependências  
• inicializações  

Nunca entregue apenas trechos incompletos.

🔹 Arquitetura

Estruture o código usando:

• funções
• classes
• módulos

🔹 Segurança

Considere:

• validação de entrada
• sanitização
• prevenção de vulnerabilidades

🔹 Tratamento de erros

Use:

• try/catch
• mensagens claras
• fallback quando possível

🔹 Testes

Inclua:

• exemplo de uso
• teste simples
• instrução de execução

🔹 Performance

Sempre que possível:

• otimize algoritmos
• evite loops desnecessários
• sugira melhorias

🔹 Entrega profissional

O código deve ser:

• executável
• escalável
• seguro
• pronto para produção

`;
    }

    const systemPrompt = {
      role: 'system',
      content: finalSystemPromptContent
    };

    const apiMessages = [
      systemPrompt,
      ...history,
      { role: 'user', content: userMessageContent }
    ];

    const hasImages = imageContents.length > 0;

    let aiResponseText;
    try {
      aiResponseText = await callWithFallback(apiMessages, hasImages);
    } catch (error) {
      console.error('Todos os provedores falharam:', error);
      aiResponseText = 'Desculpe, não consegui processar sua mensagem no momento. Tente novamente mais tarde.';
    }

    // Incrementar contagem de mensagens (apenas se não for plano pago)
    if (!hasActivePlan) {
      await User.updateOne(
        { _id: userId },
        { $inc: { messageCount: 1 } }
      );
    }

    const assistantMessage = {
      role: 'assistant',
      content: aiResponseText || 'Desculpe, não consegui processar sua mensagem.',
      createdAt: new Date()
    };
    chat.messages.push(assistantMessage);
    await chat.save();

    res.json({ userMessage, assistantMessage });

  } catch (error) {
    console.error('Erro no sendMessage:', error);
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id }).populate('messages.files');
    if (!chat) return res.json([]);
    res.json(chat.messages);
  } catch (error) {
    next(error);
  }
};
