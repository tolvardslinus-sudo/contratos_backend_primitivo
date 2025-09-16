require('dotenv').config();
const mongoose = require('mongoose');
const Contrato = require('./models/Contrato'); // tu modelo

async function borrarContratos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    const result = await Contrato.deleteMany({});
    console.log(`Se eliminaron ${result.deletedCount} contratos`);

    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  } catch (error) {
    console.error("Error eliminando contratos:", error);
  }
}

borrarContratos();
