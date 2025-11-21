const mongoose = require('mongoose');

const facturasSchema = new mongoose.Schema({
    // Campo que almacena el número consecutivo de la factura.
    numero_factura: {
        type: String,
        required: true,
        unique: true
    },
    // Código Único de Factura Electrónica (CUFE).
    codigo_CUFE: {
        type: String,
        default: function() {
            return `CUFE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    },
    // Rango de numeración autorizado para la factura.
    rango_numeracion_actual: {
        type: String,
        default: 'TEMP-2025'
    },
    // Fecha y hora de emisión de la factura.
    fecha_emision: {
        type: Date,
        default: Date.now
    },
    // Subdocumento o campo embebido para los datos del cliente (usuario).
    usuario: {
        nombre: { type: String, required: true },
        apellido: { type: String, required: true },
        tipo_documento: { type: String, required: true },
        numero_documento: { type: String, required: true },
        correo_electronico: { type: String, required: true },
        telefono: { type: String }
    },
    // Array que contendrá los detalles de los productos incluidos en la factura.
    productos_factura: {
        type: Array,
        required: true
    },
    // Valor total de la factura.
    total: {
        type: Number,
        required: true
    },
    // Campo para almacenar el archivo PDF de la representación gráfica de la factura.
    pdf_factura: {
        type: Buffer, 
        required: false
    },
    // Campo para almacenar el contenido XML de la factura electrónica.
    xml_factura: { 
        type: String, 
        required: false
    }
});

module.exports = mongoose.model('Factura', facturasSchema);