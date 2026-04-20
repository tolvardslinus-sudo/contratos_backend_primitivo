const mongoose = require('mongoose');
const Persona = require('./models/Persona'); // ¡Con P mayúscula!
require('dotenv').config();

async function eliminarTodos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Contar cuántos hay antes
    const total = await Persona.countDocuments();
    console.log(`📊 Personas actuales: ${total}`);
    
    // Eliminar todos
    const resultado = await Persona.deleteMany({});
    console.log(`✅ Eliminadas ${resultado.deletedCount} personas`);
    
    // Mostrar nuevo total
    const nuevoTotal = await Persona.countDocuments();
    console.log(`📊 Personas restantes: ${nuevoTotal}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

eliminarTodos();