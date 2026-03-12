import { MailtrapClient } from "mailtrap";

const MAILTRAP_API_TOKEN = process.env.MAILTRAP_API_TOKEN;
const MAILTRAP_FROM_EMAIL = process.env.MAILTRAP_FROM_EMAIL;
const MAILTRAP_FROM_NAME = process.env.MAILTRAP_FROM_NAME || "SaaS AI";
const isSandbox = process.env.NODE_ENV !== 'production'; // true em dev, false em prod

export const mailtrapClient = new MailtrapClient({
  token: MAILTRAP_API_TOKEN,
  sandbox: isSandbox,      // importante: false para produção
});

export const sendEmail = async ({ toEmail, subject, text, html }) => {
  try {
    const sender = { name: MAILTRAP_FROM_NAME, email: MAILTRAP_FROM_EMAIL };
    const recipients = [{ email: toEmail }];

    const response = await mailtrapClient.send({
      from: sender,
      to: recipients,
      subject,
      text,
      html,
      category: "Transactional",
    });

    console.log(`✅ E-mail enviado para ${toEmail}`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    throw new Error('Falha no envio do e-mail');
  }
};
