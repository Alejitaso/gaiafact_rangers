const mongoose = require("mongoose");
const Schema = mongoose.Schema; 

const parametrosSchema = new Schema({
    // Identificador corto o código para el conjunto de parámetros.
    denominacion: {
        type: String,
        required: true,      
        maxlength: 15,       
        trim: true,          
    },
    // Nombre legal o comercial de la empresa que factura.
    nombre_empresa: {
        type: String,
        required: true,
        trim: true,
    },
    // Número de Identificación Tributaria (NIT) de la empresa emisora.
    NIT_empresa: {
        type: String,
        required: true,
        maxlength: 15,
        trim: true,
    },
    // Nombre del cliente por defecto (e.g., "Consumidor Final").
    nombre_default: {
        type: String,
        trim: true,
    },
    // Número de documento o identificación del cliente por defecto.
    documento_default: {
        type: String,
        trim: true,
    },
    // Número inicial del rango de numeración autorizado para las facturas.
    rango_numeracion_inicial: {
        type: Number,
        required: true,
    },
    // Número final del rango de numeración autorizado para las facturas.
    rango_numeracion_final: {
        type: Number,
        required: true,
    },
    // Fecha relacionada con la autorización del rango de numeración (posiblemente timestamp).
    fecha_numeracion: {
        type: Number,
        required: true,
    },
    // Fecha y hora en que se generó este conjunto de parámetros.
    fechaHora_generacion: {
        type: Date,
        required: true,
    },
    // Fecha y hora en que se validó este conjunto de parámetros (e.g., ante una entidad fiscal).
    fechaHora_validacion: {
        type: Date,
        required: true,
    },
    // Tasa o porcentaje del Impuesto al Valor Agregado (IVA) estándar.
    IVA: {
        type: Number,
        required: true,
    },
    // Valor fijo del impuesto cobrado por las bolsas plásticas.
    impuesto_bolsa: {
        type: Number,
        required: true,
    },
    // Firma digital o certificado del facturador.
    firma_facturador: {
        type: String,
        trim: true,
    },
    // Nombre del proveedor del software de facturación.
    nombre_fabricante_software: {
        type: String,
        trim: true,
    },
    // NIT del proveedor del software de facturación.
    NIT_fabricante_software: {
        type: String,
        trim: true,
    },
    // Nombre del software de facturación utilizado (e.g., "GaiaFact").
    nombre_software: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("parametros", parametrosSchema);