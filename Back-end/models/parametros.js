const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const parametrosSchema = new Schema({
    denominacion: {
        type: String,
        required: true,
        maxlength: 15,
        trim: true,
    },
    nombre_empresa: {
        type: String,
        required: true,
        trim: true,
    },
    NIT_empresa: {
        type: String,
        required: true,
        maxlength: 15,
        trim: true,
    },
    nombre_default: {
        type: String,
        trim: true,
    },
    documento_default: {
        type: String,
        trim: true,
    },
    rango_numeracion_inicial: {
        type: Number,
        required: true,
    },
    rango_numeracion_final: {
        type: Number,
        required: true,
    },
    fecha_numeracion: {
        type: Number,
        required: true,
    },
    fechaHora_generacion: {
        type: Date,
        required: true,
    },
    fechaHora_validacion: {
        type: Date,
        required: true,
    },
    IVA: {
        type: Number,
        required: true,
    },
    impuesto_bolsa: {
        type: Number,
        required: true,
    },
    firma_facturador: {
        type: String,
        trim: true,
    },
    nombre_fabricante_software: {
        type: String,
        trim: true,
    },
    NIT_fabricante_software: {
        type: String,
        trim: true,
    },
    nombre_software: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("parametros", parametrosSchema);
