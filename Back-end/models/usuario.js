const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const usuarioSchema = new Schema({
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
        type: String,
        required: true,
        enum: ['Cedula de ciudadania', 'Cedula extranjeria', 'Nit', 'Pasaporte']
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
        type: String,
        required: true,
        enum: ['Activo', 'Inactivo']
    },
    tipo_usuario:{
        type: String,
        required:true,
        enum: ['Admin', 'Superadmin', 'cliente', 'Usuario']
    }
});

module.exports = mongoose.model('usuario', usuarioSchema);