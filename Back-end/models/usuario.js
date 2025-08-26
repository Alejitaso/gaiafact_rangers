const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
  nombre: {
    type: String,
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
    enum: ["Cedula de ciudadania", "Cedula extranjeria", "Nit", "Pasaporte"],
  },
  numero_documento: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  correo_electronico: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {   // 👈 cambiamos "contraseña" por "password"
    type: String,
    required: true,
    trim: true,
  },
  estado: {
    type: String,
    required: true,
    enum: ["Activo", "Inactivo"],
  },
  tipo_usuario: {
    type: String,
    required: true,
    enum: ["Admin", "Superadmin", "Cliente", "Usuario"],
  },
});

// 🔹 Encriptar contraseña antes de guardar
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
