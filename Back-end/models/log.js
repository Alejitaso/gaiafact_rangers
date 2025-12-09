// models/log.js
const mongoose = require('mongoose');

// Definición del esquema para los logs
const logSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  accion: { type: String, required: true },
  ruta: { type: String, required: true },
  metodo: { type: String, required: true },
  resultado: { type: String, enum: ['éxito', 'error'], default: 'éxito' },
  fecha: { type: Date, default: Date.now },
  recursoId:   { type: String, default: null },   // _id del producto/factura/otro
  cambios:     { type: mongoose.Schema.Types.Mixed, default: null } // {antes, despues}
});

module.exports = mongoose.model('Log', logSchema);