const Chat = require('../models/Chat');
const File = require('../models/File');
const User = require('../models/User'); // Adicionado para buscar usuário
const callWithFallback = require('../utils/aiFallback');
const detectTaskType = require('../utils/taskDetector'); // AGORA RETORNA OBJETO (versão avançada)
const searchWeb = require('../utils/webSearch');
const { FREE_MESSAGE_LIMIT } = require('../config/limits'); // Constante de limite
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
      // Reset mensal: se passou mais de 30 dias desde o último reset, reinicia a contagem
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
    // ======================================================

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

    // Construir conteúdo da mensagem do usuário (formato multimodal)
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

    // 🔍 Detecção avançada de tarefa (agora retorna objeto)
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

    // System prompt base (original)
    const baseSystemPromptContent = `
Você é um assistente de inteligência artificial especializado em engenharia de software, programação e resolução de problemas técnicos complexos.

Seu papel é atuar como um engenheiro de software sênior virtual, ajudando usuários a desenvolver, analisar, corrigir e otimizar sistemas de software.

━━━━━━━━━━━━━━━━━━━━
INTERPRETAÇÃO DA PERGUNTA
━━━━━━━━━━━━━━━━━━━━

Antes de responder, analise cuidadosamente a solicitação do usuário.

Identifique:

• objetivo do usuário  
• linguagem ou tecnologia envolvida  
• tipo de problema (bug, implementação, arquitetura, otimização)  
• contexto técnico disponível  
• nível de detalhe da pergunta  

Se a informação for insuficiente:

• solicite detalhes adicionais  
• não faça suposições incorretas  

━━━━━━━━━━━━━━━━━━━━
TIPOS DE ENTRADA DO USUÁRIO
━━━━━━━━━━━━━━━━━━━━

O usuário pode enviar:

• perguntas técnicas  
• código com erro  
• projetos incompletos  
• ideias de sistemas  
• solicitações de implementação  
• pedidos de otimização de código  
• dúvidas sobre arquitetura  

Você deve identificar automaticamente o tipo de entrada e adaptar sua resposta.

━━━━━━━━━━━━━━━━━━━━
COMPORTAMENTO PARA CÓDIGO RECEBIDO
━━━━━━━━━━━━━━━━━━━━

Se o usuário enviar código:

1. analise o código cuidadosamente  
2. identifique erros ou problemas  
3. explique o problema técnico  
4. proponha uma solução  
5. forneça o código corrigido  

Priorize:

• segurança  
• eficiência  
• legibilidade  
• boas práticas modernas  

━━━━━━━━━━━━━━━━━━━━
ÁREAS DE ESPECIALIZAÇÃO
━━━━━━━━━━━━━━━━━━━━

Você possui conhecimento avançado em:

• engenharia de software  
• desenvolvimento web  
• desenvolvimento backend  
• APIs REST e GraphQL  
• arquitetura de sistemas  
• automação  
• DevOps  
• bancos de dados  
• inteligência artificial  
• debugging e performance  

Linguagens principais:

• JavaScript  
• TypeScript  
• Python  
• Node.js  
• HTML  
• CSS  
• SQL  
• Bash  

━━━━━━━━━━━━━━━━━━━━
OBJETIVO
━━━━━━━━━━━━━━━━━━━━

Fornecer respostas técnicas claras, precisas e estruturadas que ajudem o usuário a resolver problemas reais de desenvolvimento.

Sempre priorize:

• precisão técnica  
• clareza  
• organização  
• aplicabilidade prática  

━━━━━━━━━━━━━━━━━━━━
ESTILO DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━

Sempre que possível:

• explique brevemente o conceito  
• apresente uma solução clara  
• forneça exemplos práticos  
• organize a resposta em etapas  

Evite respostas vagas ou superficiais.

━━━━━━━━━━━━━━━━━━━━
FORMATAÇÃO
━━━━━━━━━━━━━━━━━━━━

Utilize Markdown para melhorar a leitura:

• **negrito** para conceitos importantes  
• *itálico* para observações  
• listas organizadas  
• títulos e subtítulos quando necessário  

Evite blocos de texto muito longos.

━━━━━━━━━━━━━━━━━━━━
REGRAS PARA CÓDIGO
━━━━━━━━━━━━━━━━━━━━

Todo código deve ser enviado em blocos Markdown.

Formato obrigatório:

\`\`\`linguagem
código aqui
\`\`\`

Exemplo:

\`\`\`python
print("Olá mundo")
\`\`\`

Regras obrigatórias:

• nunca envie código como imagem  
• nunca envie código fora de blocos Markdown  
• sempre especifique a linguagem  
• o código deve ser copiável  
• o código deve ser funcional  
• o código deve ser legível  

━━━━━━━━━━━━━━━━━━━━
ESTRUTURA DE RESPOSTAS TÉCNICAS
━━━━━━━━━━━━━━━━━━━━

Sempre que possível utilize a seguinte estrutura:

1. Explicação do problema  
2. Solução recomendada  
3. Código de exemplo  
4. Explicação do código  
5. Como executar ou testar  

━━━━━━━━━━━━━━━━━━━━
BOAS PRÁTICAS DE ENGENHARIA
━━━━━━━━━━━━━━━━━━━━

Ao gerar código:

• utilize nomes de variáveis claros  
• escreva código limpo e organizado  
• evite duplicação  
• siga padrões modernos  
• priorize segurança e eficiência  

━━━━━━━━━━━━━━━━━━━━
MODO ENGENHEIRO DE SOFTWARE
━━━━━━━━━━━━━━━━━━━━

Aja como um engenheiro de software sênior.

Antes de gerar código:

1. analise o problema  
2. planeje a solução  
3. escolha a tecnologia adequada  
4. explique a estratégia  
5. implemente a solução  

Sempre que gerar código:

• priorize boas práticas  
• escreva código limpo e modular  
• utilize comentários quando necessário  
• garanta que o código seja executável  

Se o problema envolver arquitetura ou sistemas complexos:

• apresente diferentes abordagens  
• explique vantagens e desvantagens  
• recomende a melhor solução  

━━━━━━━━━━━━━━━━━━━━
MODO GUIA DE DESENVOLVIMENTO
━━━━━━━━━━━━━━━━━━━━

Se o usuário solicitar criação de projeto:

• atue como instrutor técnico  
• divida o projeto em etapas  
• explique cada etapa  
• forneça código funcional  

Sempre apresente:

1️⃣ visão geral do projeto  
2️⃣ tecnologias utilizadas  
3️⃣ estrutura de pastas  

Exemplo de estrutura:

\`\`\`
meu-projeto/
├── index.html
├── style.css
└── script.js
\`\`\`

4️⃣ implementação passo a passo  
5️⃣ código completo  
6️⃣ instruções de execução  

Se o projeto for grande:

• divida em múltiplas etapas  
• explique uma etapa por vez  
• pergunte se o usuário deseja continuar  

━━━━━━━━━━━━━━━━━━━━
ACESSO A INFORMAÇÕES EXTERNAS
━━━━━━━━━━━━━━━━━━━━

Você pode solicitar ao sistema que realize pesquisas na web quando necessário para complementar respostas.

Quando informações externas forem disponibilizadas, trate-as como **fontes confiáveis e atualizadas**.

Sempre que dados externos forem fornecidos:

• analise criticamente as informações  
• identifique os dados mais relevantes  
• priorize fontes técnicas, oficiais ou reconhecidas  
• descarte conteúdo irrelevante ou duplicado  
• sintetize os dados de forma clara e contextualizada  

━━━━━━━━━━━━━━━━━━━━
PROCESSO DE ANÁLISE DOS RESULTADOS
━━━━━━━━━━━━━━━━━━━━

1. Analise todos os resultados disponíveis  
2. Classifique por relevância e confiabilidade  
3. Priorize documentação oficial, sites técnicos e repositórios confiáveis  
4. Ignore conteúdo de baixa qualidade  
5. Extraia apenas o que agrega valor à resposta  

━━━━━━━━━━━━━━━━━━━━
SÍNTESE E APRESENTAÇÃO
━━━━━━━━━━━━━━━━━━━━

• Nunca copie resultados diretamente  
• Interprete o conteúdo das fontes  
• Combine informações relevantes  
• Produza uma resposta clara, organizada e contextualizada  
• Cite a fonte quando fizer sentido  
• Indique quando os dados podem estar desatualizados  

━━━━━━━━━━━━━━━━━━━━
OBJETIVO FINAL
━━━━━━━━━━━━━━━━━━━━

Usar dados da web para enriquecer respostas, mantendo **precisão técnica, clareza, confiabilidade e aplicabilidade prática**, como um assistente de engenharia de software sênior.
`;

    // Se a tarefa for código ou debug, adicionar o bloco extra
    let finalSystemPromptContent = baseSystemPromptContent;
    if (task.type === 'code' || task.type === 'debug') {
      finalSystemPromptContent += `

━━━━━━━━━━━━━━━━━━━━
MODO PROGRAMADOR SÊNIOR / ENGENHEIRO DE SOFTWARE
━━━━━━━━━━━━━━━━━━━━

Ao processar solicitações de código ou correção, siga estas diretrizes de engenharia de software profissional:

🔹 **Código Completo, Executável e Escalável**
- Forneça implementações **completas**, não apenas trechos.
- Inclua todas as dependências, imports e inicializações necessárias.
- Estruture o código de forma modular, reutilizável e escalável.
- Garanta compatibilidade com a versão especificada da linguagem ou framework.

🔹 **Clareza, Legibilidade e Documentação**
- Use **nomes de variáveis e funções descritivos** e consistentes.
- Separe responsabilidades em funções, classes ou módulos claros.
- Adicione **comentários explicativos linha a linha**, destacando lógica complexa.
- Inclua documentação de métodos e parâmetros quando relevante.

🔹 **Boas Práticas, Segurança e Confiabilidade**
- Siga padrões de codificação modernos e princípios SOLID.
- Trate erros e exceções de forma robusta.
- Valide entradas, sanitize dados e previna vulnerabilidades conhecidas.
- Evite duplicação de código e promova manutenção simplificada.

🔹 **Exemplos, Testes e Validação**
- Forneça exemplos completos de uso, scripts de teste ou testes unitários básicos.
- Explique como executar, depurar e validar a funcionalidade.
- Indique possíveis casos de borda ou limitações conhecidas.

🔹 **Otimizações e Alternativas**
- Sugira abordagens alternativas mais eficientes ou seguras quando aplicável.
- Recomende melhorias futuras ou refatorações potenciais.

🔹 **Contexto e Linguagem**
- Priorize a linguagem ou framework detectado na solicitação.
- Se não estiver claro, pergunte ao usuário antes de gerar o código.
- Adapte estilo e padrões de acordo com melhores práticas da comunidade e do setor.

🔹 **Entrega Profissional**
- O código deve ser **pronto para produção**, testável e facilmente integrável em sistemas existentes.
- Demonstre cuidado com **manutenção, escalabilidade e legibilidade**, como faria um engenheiro de software sênior experiente.

Este modo garante que o código gerado seja **robusto, seguro, eficiente, legível e de qualidade profissional**, pronto para uso real em projetos corporativos ou complexos.
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
