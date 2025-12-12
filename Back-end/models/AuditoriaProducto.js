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
    enum: ['SOLICITUD_CAMBIO', 'APROBACION', 'RECHAZO','SOLICITUD_ELIMINACION','ELIMINACION_APROBADA'],
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
