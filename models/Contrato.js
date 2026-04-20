const mongoose = require('mongoose');
const Pago = require('./Cuota');
const Counter = require('./Counter');

const contratoSchema = new mongoose.Schema({
  codigo: { type: String, unique: true },
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
contratoSchema.pre('save', async function (next) {
  console.log("entro a presave");
  try {
    // 🔹 1. Generar código SOLO si es nuevo
    if (this.isNew) {
      const counter = await Counter.findOneAndUpdate(
        { nombre: 'contratos' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.codigo = String(counter.seq).padStart(3, '0');
    }

    // 🔹 2. Calcular montoTotal (tu lógica actual)
    const montoTotal = this.prestamistas.reduce((acc, p) => acc + p.monto, 0);
    this.montoTotal = montoTotal;

    next();
  } catch (err) {
    next(err);
  }
});

// Después de guardar un contrato, generar sus cuotas



module.exports = mongoose.model('Contrato', contratoSchema);

