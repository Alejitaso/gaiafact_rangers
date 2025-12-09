// controllers/logController.js
const Log = require('../models/log');

exports.obtenerLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('usuarioId', 'nombre apellido tipo_usuario') // ✅ campos reales
      .sort({ fecha: -1 })
      .limit(500);
    res.json(logs);
  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({ mensaje: 'Error al obtener logs' });
  }
};