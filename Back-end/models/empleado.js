const mongoose = require ("mongoose")
const Schema = mongoose.Schema

const empleadosSchema = new Schema({
    nombre:{
        type:String,
        trim: true,
        required: true,
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },

    tipo_edocumento:{
        type: Schema.Types.ObjectId,
        required:true,
        ref: 'TipoDeDocumento'
    },

    numero_documento:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    correo_electronico: {
        type:String,
        unique:true,
        lowarcase:true,
        trim:true
    },
    telefono: {
        type:String,
        trim:true
    },

      tipo_usuario:{
        type: Schema.Types.ObjectId,
        required:true,
        ref: 'TipoDeUsaurio'
    }


});

module.exports = mongoose.model('empleados', empleadosSchema);