const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const solicitudSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Productos',
    required: true
  },
  solicitante: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  aprobador: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  cambios: {
    precioAnterior: Number,
    precioNuevo: Number,

    cantidadAnterior: Number,
    cantidadNuevo: Number
  },
  tipoAccion: {
  type: String,
  enum: ['CAMBIO', 'ELIMINACION'],
  required: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'],
    default: 'PENDIENTE'
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  },
  fechaAprobacion: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('SolicitudCambio', solicitudSchema);
