const Usuario = require('../models/usuario'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// Agrega un nuevo usuario (Solución: Correo temporalmente deshabilitado)
exports.nuevoUsuario = async (req, res) => {
    const usuario = new Usuario(req.body);
    
    try {
        await usuario.save();

        // 2. Genera un token
        const token = jwt.sign({
            userId: usuario._id 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 3. Crea el enlace de verificación
        const verificationLink = `http://localhost:3000?token=${token}`;

        // 4. Define las opciones del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usuario.correo_electronico,
            subject: 'Verifica tu correo electrónico para GaiaFact',
            html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>¡Verifica tu correo electrónico!</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <tr>
                                <td align="center" style="padding: 20px 20px 0;">
                                    <table cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
                                        <tr>
                                            <td style="padding-right: 10px; vertical-align: middle;">
                                                <img src="https://drive.google.com/uc?export=view&id=1W9hegx7_xrNjxl4bN6939vas_DFwV2s4" alt="Logo de athenas" style="width: 90px; height: auto; display:block;">
                                            </td>
                                            <td style="vertical-align: middle;">
                                                <span style="font-size: 30px; font-weight: bold; color: #333333;">Athena's</span>
                                            </td>
                                        </tr>
                                    </table>
                                    <h1 style="color: #333333; font-size: 28px; margin: 20px 0 10px;">¡Verifica tu correo electrónico!</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                                    <h2>Hola ${usuario.nombre},</h2>
                                    <p>¡Gracias por registrarte! Para activar tu cuenta, por favor, haz clic en el botón de abajo para verificar tu dirección de correo electrónico.</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px;">
                                    <a href="${verificationLink}" style="background-color:#276177;color:#ffffff;padding:15px 30px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;font-size:16px;">
                                      Verificar mi cuenta
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px; color: #999999; font-size: 12px;">
                                    <table cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
                                        <tr>
                                            <td style="padding-right: 10px; vertical-align: middle;">
                                                <img src="https://drive.google.com/uc?export=view&id=1YTQhGVEM1pTeurD1bF8Zf4qvNd3Ky03-" alt="Logo de Gaifact" style="width: 40px; height: auto; display:block;">
                                            </td>
                                            <td style="vertical-align: middle;">
                                                <span style="font-size: 18px; font-weight: bold; color: #333333;">GaiaFact</span>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin-top: 10px;">Este correo ha sido enviado por Athenas y GaiaFact. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

        </body>
        </html>
    `
        };

        // 🛑 Envía el correo - ESTA LÍNEA FUE COMENTADA PARA EVITAR EL ERROR 500
        await transporter.sendMail(mailOptions);

        res.json({ mensaje: 'Se agregó un nuevo usuario. Por favor, verifica tu correo electrónico.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                mensaje: 'El correo electrónico o el número de documento ya están registrados.', 
                error: error.message 
            });
        }
        
        // Si no es unicidad, es un error 500 real.
        res.status(500).json({ mensaje: 'Hubo un error interno al registrar el usuario', error: error.message });
    }
};

// Mostrar todos los usuarios (SOLO SUPERADMIN y ADMINISTRADOR)
exports.mostrarUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
};

// Mostrar un usuario específico
exports.mostrarUsuario = async (req, res) => {
    const userIdToView = req.params.idUsuario;
    
    try {
        // 1. Buscar el usuario
        const usuario = await Usuario.findById(userIdToView).select('-password'); 

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // 2. Respuesta exitosa
        res.json(usuario); 

    } catch (err) {
        console.error("Error al mostrar usuario:", err);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ success: false, message: "ID de usuario inválido" });
        }
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
};

// Buscar usuario por documento
exports.buscarPorDocumento = async (req, res) => {
  const doc = req.params.documento;
  console.log("🔍 Buscando numero_documento:", doc, typeof doc);

  const usuario = await Usuario.findOne({ numero_documento: doc });
  console.log("🔎 Resultado findOne:", usuario);

  if (!usuario) {
    return res.json({ mensaje: 'Usuario no encontrado', usuario: null });
  }

  return res.json({ mensaje: 'Usuario encontrado', usuario });
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
