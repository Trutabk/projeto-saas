const { client, Payment } = require('../config/mercadopago');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// @desc    Criar pagamento Pix
// @route   POST /api/payments/create-pix
exports.createPixPayment = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    const plans = {
      bronze: { title: 'Plano Bronze', price: 29.90 },
      prata: { title: 'Plano Prata', price: 59.90 },
      ouro: { title: 'Plano Ouro', price: 99.90 },
      personalizado: { title: 'Plano Personalizado', price: 199.90 },
    };
    const plan = plans[planId];
    if (!plan) return res.status(400).json({ message: 'Plano inválido' });

    const externalReference = uuidv4();

    const paymentData = {
      body: {
        transaction_amount: plan.price,
        description: plan.title,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          first_name: user.name.split(' ')[0],
          last_name: user.name.split(' ').slice(1).join(' ') || '',
          identification: { type: 'CPF', number: '19119119100' },
        },
        external_reference: externalReference,
      },
    };

    const payment = new Payment(client);
    const response = await payment.create(paymentData);

    const { id, point_of_interaction } = response;

    const transaction = await Transaction.create({
      user: user._id,
      plan: planId,
      amount: plan.price,
      mercadopagoId: id,
      qrCode: point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: point_of_interaction.transaction_data.qr_code_base64,
      paymentInfo: response,
      externalReference,
    });

    res.json({
      transactionId: transaction._id,
      qrCode: point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: point_of_interaction.transaction_data.qr_code_base64,
      copyPaste: point_of_interaction.transaction_data.qr_code,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Webhook para notificações do Mercado Pago
// @route   POST /api/payments/webhook
exports.webhook = async (req, res) => {
  try {
    console.log('Webhook body:', req.body);
    console.log('Webhook query:', req.query);

    // Extrair o ID do pagamento de diferentes formas possíveis
    let paymentId = null;
    if (req.body?.data?.id) {
      paymentId = req.body.data.id;
    } else if (req.body?.id) {
      paymentId = req.body.id;
    } else if (req.query?.['data.id']) {
      paymentId = req.query['data.id'];
    } else if (req.query?.id) {
      paymentId = req.query.id;
    }

    if (!paymentId) {
      console.log('Webhook sem ID de pagamento, ignorando');
      return res.sendStatus(200);
    }

    console.log(`Processando notificação para ID: ${paymentId}`);

    // Buscar o pagamento no Mercado Pago
    let paymentData;
    try {
      const payment = new Payment(client);
      paymentData = await payment.get({ id: paymentId });
      console.log('Dados do pagamento:', paymentData);
    } catch (mpError) {
      console.error('Erro ao buscar pagamento no MP:', mpError.message);
      return res.sendStatus(200);
    }

    const { status, external_reference } = paymentData;

    // Localizar transação pelo mercadopagoId (que é o ID do pagamento)
    const transaction = await Transaction.findOne({ mercadopagoId: paymentId });
    if (transaction) {
      transaction.status = status === 'approved' ? 'paid' : 'pending';
      await transaction.save();

      if (status === 'approved') {
        const user = await User.findById(transaction.user);
        if (user) {
          user.plan.type = transaction.plan;
          user.plan.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (!user.plan.purchasedPlans.includes(transaction.plan)) {
            user.plan.purchasedPlans.push(transaction.plan);
          }
          await user.save();
          console.log(`Plano do usuário ${user.email} atualizado para ${transaction.plan}`);
        }
      }
    } else {
      console.log('Transação não encontrada para mercadopagoId:', paymentId);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro inesperado no webhook:', error);
    res.sendStatus(200);
  }
};

// @desc    Verificar status do pagamento (polling)
// @route   GET /api/payments/status/:transactionId
exports.checkStatus = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    res.json({ status: transaction.status });
  } catch (error) {
    next(error);
  }
};
