// models/log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  accion: { type: String, required: true },
  ruta: { type: String, required: true },
  metodo: { type: String, required: true },
  resultado: { type: String, enum: ['éxito', 'error'], default: 'éxito' },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);