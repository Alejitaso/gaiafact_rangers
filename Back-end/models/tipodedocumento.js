const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const tipodedocumentoSchema = new Schema ({
    Cedula_ciudadania:{
        type:String,
        required: true,
        maxlength: 10,
        trim: true,
    },
    Cedula_extranjeria:{
        type:String,
        required: true,
        maxlength: 10,
        trim: true,
    },
    Nit:{
        type:String,
        required: true,
        maxlength: 10,
        trim: true,
    },
    pasaporte:{
        type:String,
        required: true,
        maxlength: 11,
        trim: true,
    },
});

module.exports = mongoose.model('tipodedocumento', tipodedocumentoSchema);