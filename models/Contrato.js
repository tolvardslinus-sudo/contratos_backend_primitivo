const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
  prestamistas: [
    {
      persona: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
      monto: { type: Number, required: true } // monto prestado por esa persona
    }
  ],
  prestatarios: [
    {
      persona: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
      monto: { type: Number } // opcional: cuánto recibe cada uno (puede usarse si se reparte)
    }
  ],
  montoTotal: { type: Number ,default:0 }, // suma de todos los montos
  plazo: { type: Number, required: true },
  tasaInteres: { type: Number, required: true },
  fecha: { type: String, required: true },
  estado: { type: String, required: true },
  observaciones: { type: String }
});

// Middleware: calcular montoTotal antes de guardar
contratoSchema.pre('save', function (next) {
  const montoTotal = this.prestamistas.reduce((acc, p) => acc + p.monto, 0);
  this.montoTotal = montoTotal;
  next();
});
contratoSchema.pre('insertMany', function(next, docs) {
  docs.forEach(doc => {
    const montoTotal = doc.prestamistas.reduce((acc, p) => acc + p.monto, 0);
    doc.montoTotal = montoTotal;
  });
  next();
});

module.exports = mongoose.model('Contrato', contratoSchema);

