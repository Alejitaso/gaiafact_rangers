const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Definición del esquema Mongoose para el modelo de Notificación.
const notificacionSchema = new Schema({
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CLIENTE',
        required: true,
    }
}, {
//Opción que añade automáticamente campos 'createdAt' y 'updatedAt' para el registro de tiempo
    timestamps: true
});
//Exporta el modelo Mongoose, nombrando la colección como "notificacion".
module.exports = mongoose.model("notificacion", notificacionSchema);
