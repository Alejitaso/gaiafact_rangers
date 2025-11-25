const mongoose = require('mongoose');

const facturasSchema = new mongoose.Schema({
    numero_factura: {
        type: String,
        required: true,
        unique: true
    },
    codigo_CUFE: {
        type: String,
        default: function() {
            return `CUFE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    rango_numeracion_actual: {
        type: String,
        default: 'TEMP-2025'
    },
    fecha_emision: {
        type: Date,
        default: Date.now
    },
    metodo_pago: {
        type: String,
        required: true,
        enum: [
            'Efectivo',
            'Tarjeta débito',
            'Tarjeta crédito',
            'Transferencia',
            'Nequi',
            'Daviplata'
        ]
    },
    usuario: {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        tipo_documento: { type: String, required: true },
        numero_documento: { type: String, required: true },
        correo_electronico: { type: String, required: true },
        telefono: { type: String }
    },
    productos_factura: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    pdf_factura: {
        type: Buffer, 
        required: false
    },
    xml_factura: { 
        type: String, 
        required: false
    }
});

module.exports = mongoose.model('Factura', facturasSchema);