// backend/utils/sendEmail.js
const { MailtrapClient } = require('mailtrap');

// Carrega variáveis de ambiente
const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN;
const MAILTRAP_FROM_EMAIL = process.env.MAILTRAP_FROM_EMAIL;
const MAILTRAP_FROM_NAME = process.env.MAILTRAP_FROM_NAME || 'SaaS AI';

// Determina se está em modo sandbox (desenvolvimento) ou produção
const isSandbox = process.env.NODE_ENV !== 'production'; // true em dev, false em prod

// Inicializa o cliente Mailtrap
const mailtrapClient = new MailtrapClient({
  token: MAILTRAP_API_TOKEN,
  sandbox: isSandbox,
});

/**
 * Envia um e-mail usando a API do Mailtrap.
 * @param {Object} options - Opções do e-mail.
 * @param {string} options.toEmail - E-mail do destinatário.
 * @param {string} options.subject - Assunto.
 * @param {string} options.text - Corpo em texto plano.
 * @param {string} [options.html] - Corpo em HTML (opcional).
 * @returns {Promise}
 */
const sendEmail = async ({ toEmail, subject, text, html }) => {
  try {
    const sender = {
      name: MAILTRAP_FROM_NAME,
      email: MAILTRAP_FROM_EMAIL,
    };
    const recipients = [{ email: toEmail }];

    const response = await mailtrapClient.send({
      from: sender,
      to: recipients,
      subject,
      text,
      html,
      category: 'Transactional',
    });

    console.log(`✅ E-mail enviado para ${toEmail}`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via Mailtrap:', error);
    throw new Error('Falha no envio do e-mail');
  }
};

module.exports = sendEmail;
