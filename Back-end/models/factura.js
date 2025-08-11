const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const factiraSchema = new Schema({
    id_cliente :{
        type: Number,
        ref: 'cliente',
        required: true,
    },
    denominacion:{
        type: String,
        required: true,
        maxlength: 15,
        trim: true,
    },
    URL_DIAN: {
        type: String,
        required: true,
        trim: true,
    },
    codigo_CUFE: {
        type: String,
        required: true,
        trim: true,
    },
    codigo_QR: {
        type: String,
        required: true,
        trim: true,
    },
    codigo_barras: {
        type: String,
        required: true,
        trim: true,
    },
    descripcion_producto: {
        type: String,
        required: true,
    },
    valor_unitario: {
        type: Number,
        required: true,
    },
    valor_total: {
        type: Number,
        required: true,
    },
    forma_de_pago: {
        type: String,
        required: true,
        trim: true,
    },
    medio_pago: {
        type: String,
        required: true,
        trim: true,
    },
    informacion_adicional: {
        type: String,
        trim: true,
    },
    // Campos extraídos de la tabla de parámetros
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
    IVA: {
        type: Number,
        required: true,
    },
    impuesto_bolsa: {
        type: Number,
        required: true,
    },
    rango_numeracion_actual: {
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
    firma_facturador: {
        type: String,
        required: true,
        trim: true,
    },
    nombre_fabricante_software: {
        type: String,
        required: true,
        trim: true,
    },
    NIT_fabricante_software: {
        type: String,
        required: true,
        trim: true,
    },
    nombre_software: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("factura", facturaSchema);