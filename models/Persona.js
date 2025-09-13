const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombres: { type: String, required: true },
  apellidos: { type: String, required: false },
  dni: { type: String, required: true, unique:true},
  celular: { type: String, required: false }
});

module.exports = mongoose.model('Persona', personaSchema);

