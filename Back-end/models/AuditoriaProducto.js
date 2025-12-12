const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditoriaSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Productos',
    required: true
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuarios',
    required: true
  },
  accion: {
    type: String,
    enum: [
      "CREACION",
      "ACTUALIZACION",
      "APROBACION",
      "RECHAZO",
      "ELIMINACION_SOLICITADA",
      "ELIMINACION_APROBADA",
      "ELIMINACION_RECHAZADA"
    ],
  required: true
  },
  datos: {
    precioAnterior: Number,
    precioNuevo: Number,
    cantidadAnterior: Number,
    cantidadNuevo: Number
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditoriaProducto', auditoriaSchema);
