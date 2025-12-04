const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

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
    password:{
        type:String,
        required: true,
        trim:true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    telefono:{
        type: String,
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
        enum: ['ADMINISTRADOR','CLIENTE', 'USUARIO', 'SUPERADMIN' ]
    },
    resetToken: {
        type: String,
        default: null,
    },
    verifyToken: {
    type: String,
    default: null,
    },
    tokenExpiration: {
        type: Date,
        default: null,
    }

});

// 🔒 Hook para encriptar contraseña antes de guardar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


// 🔹 Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Usuario", usuarioSchema);
