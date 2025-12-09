const Usuario = require('../models/usuario'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validarEmail } = require('../Validators/validarEmail');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.EMAIL_PASS); 

const FRONTEND_LOGIN_URL = `${process.env.FRONTEND_URL}/login`;

// Agrega un nuevo usuario 
exports.nuevoUsuario = async (req, res) => {
    try {

        const datos = req.body;

        // Validar email
        const { valid } = await validarEmail(datos.correo_electronico);

        if (!valid) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido'
            });
        }

        // ASIGNAR CONTRASEÑA ANTES DE CREAR EL USUARIO
        datos.password = datos.numero_documento;

        // Crear instancia
        const usuario = new Usuario(datos);

        // Guardar usuario en Mongo
        await usuario.save();
        console.log("🟢 Nuevo usuario guardado:", usuario._id);


        // Crear token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email/${encodeURIComponent(token)}`;

        try {
        await sgMail.send({
            to: usuario.correo_electronico,
            from: process.env.EMAIL_USER,   
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
        });
        } catch (mailErr) {
            console.error('⚠️  SendGrid body:', mailErr.response?.body);
            console.error('⚠️  SendGrid status:', mailErr.code);
            console.error('⚠️  SendGrid message:', mailErr.message);
        }

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

// ---------------------------------------------------
// 2. VERIFICAR CUENTA (BACKEND) Y REDIRIGIR A LOGIN
// ---------------------------------------------------
exports.verificarCuenta = async (req, res) => {
  try {
    // aceptar token por query o por params
    const token = req.query.token || req.params.token;

    console.log('🔎 llamada a verificarCuenta, token recibido:', token ? token.slice(0,50) + '...' : token);

    if (!token) {
      return res.status(400).send('Token no proporcionado');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded.usuarioId;

    if (!userId) {
      return res.status(400).send('Token inválido: no contiene userId');
    }

    const usuario = await Usuario.findById(userId);
    if (!usuario) return res.status(404).send('Usuario no encontrado.');

    if (usuario.isVerified) return res.status(200).send('Tu cuenta ya ha sido verificada.');

    usuario.isVerified = true;
    await usuario.save();

    // opcional: redirigir al front
    return res.redirect(`${process.env.FRONTEND_URL}/verificado`); // o enviar mensaje

  } catch (error) {
    console.error('Error verificarCuenta:', error);
    return res.status(400).send('El enlace de verificación es inválido o ha expirado.');
  }
};

exports.reenviarVerificacionAdmin = async (req, res) => {
  try {
    const { idUsuario } = req.params;  

    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    if (usuario.isVerified) {
      return res.status(400).json({ msg: 'El usuario ya verificó su correo' });
    }

    // Generar nuevo token (1 h)
    const token = jwt.sign(
      { userId: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const verificationLink = `${process.env.BACKEND_URL}/api/auth/verify-email/${encodeURIComponent(token)}`;

    // Mismo HTML que ya tienes
    await sgMail.send({
      to: usuario.correo_electronico,
      from: process.env.EMAIL_USER,
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
    });

    res.json({ msg: 'Correo de verificación re-enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al reenviar correo', error: err.message });
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
  try {
    const usuario = await Usuario.findOne({
      numero_documento: req.params.documento, 
    });

    if (!usuario) {
      return res.json({ 
        mensaje: 'Usuario no encontrado',
        usuario: null 
      });
    }

    return res.json({ 
      mensaje: 'Usuario encontrado', 
      usuario: usuario 
    });

  } catch (error) {
    console.error("❌ Error al buscar usuario:", error);
    return res.status(500).json({ 
      mensaje: 'Error al buscar usuario', 
      error: error.message 
    });
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
