const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  numero_factura: {
    type: String,
    required: true,
  },
  documento_emisor: {
    type: String,
    required: true,
  },
  documento_receptor: {
    type: String,
    required: true,
  },
  correo_receptor: {
    type: String,
    required: true,
  },
  fecha_envio: {
    type: Date,
    default: Date.now,
  },
  tipo: {
    type: String,
    enum: ['manual', 'automatico'],
    default: 'manual',
  },
});

module.exports = mongoose.model('Notificacion', notificacionSchema);