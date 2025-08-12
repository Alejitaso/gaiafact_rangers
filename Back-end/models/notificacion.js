const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificacionSchema = new Schema({
    fecha_enviada: {
        type: Date,
        required: true,
    },
    factura: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'factura',
        required: true,
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cliente',
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("notificacion", notificacionSchema);
