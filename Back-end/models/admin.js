const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const adminSchema = new Schema({
    nombre:{
        type:String,
        required: true,
        trim: true,
    },
    apellido: {
        type: String,
        required: true,
        trim: true,
    },
    tipo_documento: {
        type:Schema.Types.ObjectId,
        required: true,
        ref: 'tipodedocumento',
    },
    numero_documento:{
        type:String,
        required: true,
        unique:true,
        trim:true,
    },
    correo_electronico:{
        type:String,
        required: true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    contraseña:{
        type:String,
        required: true,
        trim:true,
    },
    estado:{
        type:Schema.Types.ObjectId,
        required: true,
        ref: 'estado',
    }
});

module.exports = mongoose.model('Admin', adminSchema);