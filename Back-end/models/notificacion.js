const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Definición del esquema Mongoose para el modelo de Notificación.
const notificacionSchema = new Schema({
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
//Campo 'fecha_enviada', almacena la fecha en que se envió la notificación. Es obligatorio.
    fecha_enviada: {
        type: Date,
        required: true,
    },
//Campo 'factura', referencia al documento de la colección 'factura' por su ID (ObjectId). Es obligatorio
    factura: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'factura',
        required: true,
    },
//Campo 'cliente', referencia al documento de la colección 'CLIENTE' por su ID (ObjectId). Es obligatorio
    cliente: {
      nombre: String,
      apellido: String,
      numero_documento: String,
      correo_electronico: String
    }
}, {
//Opción que añade automáticamente campos 'createdAt' y 'updatedAt' para el registro de tiempo
    timestamps: true
});
//Exporta el modelo Mongoose, nombrando la colección como "notificacion".
module.exports = mongoose.model("notificacion", notificacionSchema);
