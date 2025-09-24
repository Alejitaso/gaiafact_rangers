// models/factura.js

const mongoose = require('mongoose');

const facturasSchema = new mongoose.Schema({
    numero_factura: {
        type: String,
        required: true,
        unique: true
    },
    fecha_emision: {
        type: Date,
        default: Date.now
    },
    // Añade la información del usuario directamente al esquema
    usuario: {
        nombre: {
            type: String,
            required: true
        },
        apellido: {
            type: String,
            required: true
        },
        tipo_documento: {
            type: String,
            required: true
        },
        numero_documento: {
            type: String,
            required: true
        },
        telefono: {
            type: String
        }
    },
    productos_factura: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    // Guarda el PDF como datos binarios (Buffer)
    pdf_factura: {
        type: Buffer, 
        required: false
    },
    // Guarda el XML como texto
    xml_factura: { 
        type: String, 
        required: false
    }
});

module.exports = mongoose.model('Factura', facturasSchema);