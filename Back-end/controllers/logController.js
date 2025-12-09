const Log = require('../models/log');

// Este controlador obtiene los logs de la base de datos, los ordena por fecha y limita la cantidad a 500.

exports.obtenerLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('usuarioId', 'nombre apellido tipo_usuario') 
      .sort({ fecha: -1 })
      .limit(500);
    res.json(logs);
  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({ mensaje: 'Error al obtener logs' });
  }
};