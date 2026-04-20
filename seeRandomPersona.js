const mongoose = require('mongoose');
const Persona = require('./models/Persona'); // ¡Cambiado a Persona con P mayúscula!
require('dotenv').config(); // Para usar variable de entorno

const personasData = [
    { nombres: "Juan", apellidos: "García López", dni: "12345", celular: "987654321" },
    { nombres: "María", apellidos: "Rodríguez Martínez", dni: "12346", celular: "912345678" },
    { nombres: "Carlos", apellidos: "González Pérez", dni: "12347", celular: "" },
    { nombres: "Ana", apellidos: "Sánchez Ramírez", dni: "12348", celular: "998877665" },
    { nombres: "Luis", apellidos: "", dni: "12349", celular: "955443322" }
];

async function seedRandom() {
    // Usar variable de entorno MONGO_URI
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await Persona.deleteMany({});
    console.log('🗑️ Datos anteriores eliminados');

    const resultado = await Persona.insertMany(personasData);

    console.log(`\n✅ ${resultado.length} personas insertadas:`);
    resultado.forEach((p, i) => {
        console.log(`${i + 1}. ${p.nombres} ${p.apellidos || '(sin apellido)'} - DNI: ${p.dni}`);
    });

    await mongoose.disconnect();
    console.log('\n🔌 Conexión cerrada');
}

seedRandom();