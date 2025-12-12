const mongoose = require('mongoose');

const NumeracionSchema = new mongoose.Schema({
    // Prefijo de la resolución (ej: 'F')
    prefijo: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // El último número generado (ej: 57119)
    numeroActual: { 
        type: Number, 
        required: true 
    },
    // Rango final de la resolución (el límite)
    rangoFinal: { 
        type: Number, 
        required: true 
    }
});

module.exports = mongoose.model('Numeracion', NumeracionSchema);