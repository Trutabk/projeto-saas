const nodemailer = require('nodemailer');

// Configuração do transporte SMTP do Mailtrap (Transactional Stream)
const transporter = nodemailer.createTransport({
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false,
  auth: {
    user: 'api',
    pass: process.env.MAILTRAP_API_TOKEN, // seu token de API (funciona como senha SMTP)
  },
});

/**
 * Envia um e-mail usando SMTP do Mailtrap.
 * @param {Object} options - Opções do e-mail.
 * @param {string} options.toEmail - E-mail do destinatário.
 * @param {string} options.subject - Assunto.
 * @param {string} options.text - Corpo em texto plano.
 * @param {string} [options.html] - Corpo em HTML (opcional).
 * @returns {Promise}
 */
const sendEmail = async ({ toEmail, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAILTRAP_FROM_NAME}" <${process.env.MAILTRAP_FROM_EMAIL}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log(`✅ E-mail enviado para ${toEmail}`);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail via SMTP:', error);
    throw new Error('Falha no envio do e-mail');
  }
};

module.exports = sendEmail;
