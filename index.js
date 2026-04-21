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

app.delete('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await Persona.findByIdAndDelete(id);

    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json({ message: 'Persona eliminada correctamente', persona });
  } catch (error) {
    console.error('Error eliminando persona:', error);
    res.status(500).json({ error: error.message });
  }
});
//actualizar Peronas

app.put('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const personaActualizada = await Persona.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,        // devuelve el documento actualizado
        runValidators: true // aplica validaciones del schema
      }
    );

    if (!personaActualizada) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json({
      message: 'Persona actualizada correctamente',
      persona: personaActualizada
    });

  } catch (error) {
    console.error('Error actualizando persona:', error);
    res.status(500).json({ error: error.message });
  }
});

///

//Contratos

// Crear contrato
app.post('/contratos', async (req, res) => {
  try {
    const contrato = new Contrato(req.body);
    await contrato.save();

    res.status(201).json({
      message: 'Contrato creado',
      contrato
    });
  } catch (error) {
    console.error(error);
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


app.get('/contratos/:id', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('prestamistas.persona')
      .populate('prestatarios.persona');

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json(contrato);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/contratos/codigo/:codigo', async (req, res) => {
  try {
    const contrato = await Contrato.findOne({ codigo: req.params.codigo })
      .populate('prestamistas.persona')
      .populate('prestatarios.persona');

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json(contrato);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/contratos/buscar/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;

    const contratos = await Contrato.find()
      .populate({
        path: 'prestamistas.persona',
        match: {
          $or: [
            { nombres: { $regex: nombre, $options: 'i' } },
            { apellidos: { $regex: nombre, $options: 'i' } }
          ]
        }
      })
      .populate({
        path: 'prestatarios.persona',
        match: {
          $or: [
            { nombres: { $regex: nombre, $options: 'i' } },
            { apellidos: { $regex: nombre, $options: 'i' } }
          ]
        }
      });

    // filtrar solo contratos donde hubo match
    const filtrados = contratos.filter(c =>
      c.prestamistas.some(p => p.persona) ||
      c.prestatarios.some(p => p.persona)
    );

    res.json(filtrados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.put('/contratos/:id', async (req, res) => {
  try {
    const data = req.body;

    // recalcular montoTotal si viene prestamistas
    if (data.prestamistas) {
      data.montoTotal = data.prestamistas.reduce((acc, p) => acc + p.monto, 0);
    }

    const contrato = await Contrato.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json({
      message: 'Contrato actualizado',
      contrato
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.delete('/contratos/:id', async (req, res) => {
  try {
    const contrato = await Contrato.findByIdAndDelete(req.params.id);

    if (!contrato) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    res.json({
      message: 'Contrato eliminado',
      contrato
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







// --- Escuchar puerto ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});