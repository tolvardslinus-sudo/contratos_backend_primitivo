require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const Persona = require('./models/Persona');
const Contrato = require('./models/Contrato');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- DEBUG: Middleware para loguear cada request ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Solo revisar body si existe
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  
  next();
});


// --- Conexión a MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar MongoDB:', err));

// --- Rutas ---

// Ruta de prueba
app.get('/', (req, res) => {
  console.log('Ruta / accedida');
  res.send('Backend funcionando correctamente');
});

// Crear persona
app.post('/personas', async (req, res) => {
  try {
    const persona = new Persona(req.body);
    const result = await persona.save();
    console.log('Persona creada:', result);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creando persona:', err);
    res.status(400).json({ error: err.message });
  }
});

// Obtener personas
app.get('/personas', async (req, res) => {
  try {
    const personas = await Persona.find();
    console.log(`Se obtuvieron ${personas.length} personas`);
    res.json(personas);
  } catch (err) {
    console.error('Error obteniendo personas:', err);
    res.status(500).json({ error: err.message });
  }
});


// Buscar personas por nombre o apellido (patrón en el texto)
app.get('/personas/:nombre', async (req, res) => {
  const { nombre } = req.params;

  try {
    const personas = await Persona.find({
      $or: [
        { nombres: { $regex: nombre, $options: 'i' } },
        { apellidos: { $regex: nombre, $options: 'i' } }
      ]
    });

    if (personas.length === 0) {
      return res.status(404).json({ message: `No se encontraron personas con "${nombre}"` });
    }

    res.json(personas); // devuelve todo el objeto persona
  } catch (err) {
    console.error('Error buscando personas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


const buscarIdPersonaPorNombre = async (nombre) => {
  try {
    const persona = await Persona.findOne({
      $or: [
        { nombres: { $regex: nombre, $options: 'i' } },
        { apellidos: { $regex: nombre, $options: 'i' } }
      ]
    }).select('_id'); // solo traer el campo _id

    return persona ? persona._id : null; // devolver solo el id o null si no hay match
  } catch (error) {
    console.error('Error buscando persona:', error);
    throw error;
  }
};

// Crear contrato
app.post('/contratos', async (req, res) => {
  try {
    const contrato = new Contrato(req.body);
    await contrato.save();
    res.status(201).json({
      message: 'Contrato creado con éxito',
      contrato
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Obtener todos los contratos
app.get('/allcontratos', async (req, res) => {
  try {
    const contratos = await Contrato.find()
      .populate('prestamistas.persona', 'nombres apellidos dni celular') // trae datos del prestamista
      .populate('prestatarios.persona', 'nombres apellidos dni celular'); // trae datos del prestatario

    res.json(contratos);
  } catch (err) {
    console.error('Error obteniendo contratos:', err);
    res.status(500).json({ error: err.message });
  }
});


// --- Escuchar puerto ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});