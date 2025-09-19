const Usuario = require('../models/usuario'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // o tu servicio de correo
  auth: {
    user: process.env.EMAIL_USER, // Asegúrate de tener estas variables de entorno
    pass: process.env.EMAIL_PASSWORD
  }
});
// Agrega un nuevo usuario
exports.nuevoUsuario = async (req, res) => {
    // IMPORTANTE: El password del front-end es 'temporal123'. 
    // Mongoose lo encriptará en el 'pre("save")' que ya tienes, lo cual es correcto.
    const usuario = new Usuario(req.body);
    try {
        await usuario.save();

        // 1. Genera un token
        const token = jwt.sign({
            userId: usuario._id
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 2. Crea el enlace de verificación
        // Cambia 'http://localhost:4000' por la URL base de tu servidor si es en producción
        const verificationLink = `http://localhost:4000/api/auth/verify-email?token=${token}`;

        // 3. Define las opciones del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usuario.correo_electronico,
            subject: 'Verifica tu correo electrónico para GaiaFact',
            html: `
                <h2>Hola ${usuario.nombre},</h2>
                <p>Por favor, haz clic en el botón para verificar tu cuenta:</p>
                <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Verificar mi cuenta
                </a>
            `
        };

        // 4. Envía el correo
        await transporter.sendMail(mailOptions);

        res.json({ mensaje: 'Se agregó un nuevo usuario. Por favor, verifica tu correo electrónico.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Hubo un error al registrar el usuario', error: error.message });
    }
};

// Mostrar todos los usuarios
exports.mostrarUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        console.log(error);
        next();
    }
};

// Mostrar un usuario específico (ESTA FUNCIÓN FALTABA CORRECCIÓN)
exports.mostrarUsuario = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.idUsuario);
        if (!usuario) {
            return res.json({ mensaje: 'No existe el usuario' });
        }
        res.json(usuario);
    } catch (error) {
        console.log(error);
        next();
    }
};

// Buscar usuario por documento (CORREGIDO - era Cliente, ahora es Usuario)
exports.buscarPorDocumento = async (req, res, next) => {
    try {
        const usuario = await Usuario.findOne({ 
            $or: [
                { numero_documento: req.params.documento }
            ]
        });
        
        if (!usuario) {
            res.json({ 
                mensaje: 'Usuario no encontrado',
                usuario: null 
            });
            return next();
        }

        res.json({ 
            mensaje: 'Usuario encontrado', 
            usuario: usuario 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al buscar usuario', error: error.message });
        next();
    }
};

exports.actualizarUsuario = async (req, res, next) => {
    try {
        const usuario = await Usuario.findOneAndUpdate(
            { _id: req.params.idUsuario },
            req.body,
            { new: true }
        );
        res.json(usuario);
    } catch (error) {
        res.send(error);
        next();
    }
};

exports.eliminarUsuario = async (req, res, next) => {
    try {
        await Usuario.findOneAndDelete({ _id: req.params.idUsuario });
        res.json({ mensaje: 'El usuario ha sido eliminado' });
    } catch (error) {
        console.log(error);
        next();
    }
};

// DEBUG - Eliminar después de verificar
console.log('Funciones exportadas en usuarioController:', Object.keys(exports));