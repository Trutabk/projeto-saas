const mongoose = require('mongoose');
require('dotenv').config();

const email = 'trutabk4@gmail.com';

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const User = require('./models/User');

    const user = await User.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    );

    if (user) {
      console.log(`✅ Usuário ${user.email} agora é administrador.`);
    } else {
      console.log('❌ Usuário não encontrado.');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
};

makeAdmin();
