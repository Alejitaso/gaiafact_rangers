const Usuario = require('../models/usuario');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validarEmail } = require('../Validators/validarEmail');

// URL frontend (login)
const FRONTEND_LOGIN_URL = 'http://localhost:3000/login';

// CONFIGURACIÓN DEL TRANSPORTER
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ---------------------------------------------------
// 1. REGISTRAR NUEVO USUARIO
// ---------------------------------------------------
exports.nuevoUsuario = async (req, res) => {

    req.body.password = req.body.numero_documento;

    const usuario = new Usuario(req.body);

    try {
        
        // Validar email
        const { valid } = await validarEmail(usuario.correo_electronico);

        if (!valid) {
            return res.status(400).json({
                success: false,
                mensaje: 'El correo electrónico no es válido'
            });
        }

        // Guardar usuario
        await usuario.save();
        console.log("🟢 Nuevo usuario guardado:", usuario._id);

        // Crear token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // URL de verificación (BACKEND)
        const verificationLink = `http://localhost:4000/api/auth/verify?token=${token}`;

        // Correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usuario.correo_electronico,
            subject: 'Verifica tu cuenta',
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

        // Enviar correo
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            mensaje: 'Usuario creado. Revisa tu correo para verificar tu cuenta.'
        });

    } catch (error) {

        // Duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                mensaje: "El correo o número de documento ya están registrados."
            });
        }

        console.error("❌ Error en nuevoUsuario:", error);
        return res.status(500).json({
            success: false,
            mensaje: "Error en el servidor."
        });
    }
};


// ---------------------------------------------------
// 2. VERIFICAR CUENTA (BACKEND) Y REDIRIGIR A LOGIN
// ---------------------------------------------------
exports.verificarCuenta = async (req, res) => {

    const token = req.query.token;

    if (!token) {
        const redirectUrl = `${FRONTEND_LOGIN_URL}?verified=false&error=Token inválido`;
        return res.redirect(redirectUrl);
    }

    try {
        // Desencriptar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        console.log("🟢 TOKEN DECODIFICADO:", decoded);

        // Actualizar usuario
        const usuario = await Usuario.findByIdAndUpdate(
            userId,
            { isVerified: true },
            { new: true }
        );

        if (!usuario) {
            console.log("❌ Usuario no encontrado:", userId);
            return res.redirect(`${FRONTEND_LOGIN_URL}?verified=false&error=Usuario no encontrado`);
        }

        console.log("🟢 Cuenta verificada:", usuario._id);

        // Redirigir al login con éxito
        return res.redirect(`${FRONTEND_LOGIN_URL}?verified=true`);

    } catch (error) {

        console.error("❌ Error al verificar la cuenta:", error);

        let msg = "Error en la verificación";

        if (error.name === "TokenExpiredError") msg = "El enlace ha expirado";
        if (error.name === "JsonWebTokenError") msg = "Token inválido";

        return res.redirect(`${FRONTEND_LOGIN_URL}?verified=false&error=${encodeURIComponent(msg)}`);
    }
};


// ---------------------------------------------------
// 3. MOSTRAR TODOS LOS USUARIOS
// ---------------------------------------------------
exports.mostrarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor." });
    }
};


// ---------------------------------------------------
// 4. MOSTRAR UN USUARIO POR ID
// ---------------------------------------------------
exports.mostrarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.idUsuario).select('-password');

        if (!usuario) return res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });

        res.json(usuario);

    } catch (err) {
        res.status(500).json({ success: false, mensaje: "Error en el servidor" });
    }
};


// ---------------------------------------------------
// 5. BUSCAR POR DOCUMENTO
// ---------------------------------------------------
exports.buscarPorDocumento = async (req, res) => {

    try {
        const usuario = await Usuario.findOne({ numero_documento: req.params.documento });

        if (!usuario) {
            return res.json({
                success: false,
                mensaje: 'Usuario no encontrado',
                usuario: null
            });
        }

        return res.json({
            success: true,
            mensaje: 'Usuario encontrado',
            usuario
        });

    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error en el servidor." });
    }
};


// ---------------------------------------------------
// 6. ACTUALIZAR USUARIO
// ---------------------------------------------------
exports.actualizarUsuario = async (req, res) => {

    try {
        const usuario = await Usuario.findByIdAndUpdate(
            req.params.idUsuario,
            req.body,
            { new: true }
        );

        res.json(usuario);

    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor." });
    }
};


// ---------------------------------------------------
// 7. ELIMINAR USUARIO
// ---------------------------------------------------
exports.eliminarUsuario = async (req, res) => {

    try {
        await Usuario.findByIdAndDelete(req.params.idUsuario);
        res.json({ mensaje: 'Usuario eliminado' });

    } catch (error) {
        res.status(500).json({ mensaje: "Error en el servidor." });
    }
};


// ---------------------------------------------------
// 8. REENVIAR VERIFICACIÓN POR ADMIN/GESTOR
// ---------------------------------------------------
exports.reenviarVerificacionAdmin = async (req, res) => {
    try {
        const { idUsuario } = req.params;

        const usuario = await Usuario.findById(idUsuario);

        if (!usuario) {
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
        }

        if (usuario.isVerified) {
            return res.status(400).json({ success: false, mensaje: 'Este usuario ya está verificado.' });
        }

        // Crear nuevo token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // URL de verificación (BACKEND)
        // Nota: Asegúrate de que esta URL coincida con la ruta definida en index.js (ej. /api/auth/verify)
        const verificationLink = `http://localhost:4000/api/auth/verify?token=${token}`; 

        // Correo (usando una plantilla simple, puedes usar la plantilla HTML completa de 'nuevoUsuario')
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usuario.correo_electronico,
            subject: 'Reenvío de Verificación de cuenta',
            html: `
                <p>Hola ${usuario.nombre},</p>
                <p>Tu cuenta aún no ha sido verificada. Haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
                <a href="${verificationLink}">Verificar mi cuenta</a>
                <p>Si no solicitaste esto, ignora este correo.</p>
            ` 
        };

        // Enviar correo
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            mensaje: `Correo de verificación reenviado a ${usuario.correo_electronico}.`
        });

    } catch (error) {
        console.error("❌ Error en reenviarVerificacionAdmin:", error);
        return res.status(500).json({
            success: false,
            mensaje: "Error en el servidor al reenviar la verificación."
        });
    }
};