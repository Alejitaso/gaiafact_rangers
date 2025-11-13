// controllers/authcontroller.js
const Usuario = require("../models/usuario");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Usa variable de entorno para seguridad
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // 1. Verifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).send('Usuario no encontrado.');
        }

        if (usuario.isVerified) {
            return res.status(200).send('Tu cuenta ya ha sido verificada.');
        }

        usuario.isVerified = true;
        await usuario.save();

        res.status(200).send('¡Correo verificado con éxito! Puedes cerrar esta ventana.');
        
    } catch (error) {
        res.status(400).send('El enlace de verificación es inválido o ha expirado.');
    }
};

// 🟢 Login
exports.login = async (req, res) => {
  const { correo_electronico, password } = req.body;

  try {
    const user = await Usuario.findOne({ correo_electronico });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    const isMatch = await user.compararPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    // Crear JWT que incluya tipo_usuario (rol)
    const payload = {
      id: user._id,
      correo_electronico: user.correo_electronico,
      tipo_usuario: user.tipo_usuario, 
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      success: true,
      message: "✅ Login exitoso",
      usuario: {
        id: user._id,
        nombre: user.nombre,
        correo_electronico: user.correo_electronico,
        tipo_usuario: user.tipo_usuario,
      },
      token, 
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

// 🟢 Recuperar contraseña
exports.recoverPassword = async (req, res) => {
  const { correo_electronico } = req.body;
  console.log("📩 Correo recibido:", correo_electronico);

  try {
    const user = await Usuario.findOne({ correo_electronico });
    console.log("👤 Usuario encontrado:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.resetToken = token;
    user.tokenExpiration = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:3000/nueva_contra/${token}`;

    const mailOptions = {
      from: "gaiafactrangers@gmail.com",
      to: correo_electronico,
      subject: "Recuperación de contraseña",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reestablecer tu contraseña</title>
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
                                    <h1 style="color: #333333; font-size: 28px; margin: 20px 0 10px;">Reestablecer contraseña</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                                    <h2>Hola,</h2>
                                    <p>Este es tu correo para restablecer tu contraseña, si no solicitaste este mensaje, porfavor ignoralo, de lo contrario da click en el siguiente enlace para rentablecer tu contraseña. (válido 1 hora)</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 20px;">
                                    <a href="${resetLink}" style="background-color:#276177;color:#ffffff;padding:15px 30px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;font-size:16px;">
                                      Restablecer mi contraseña
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
                                    <p style="margin-top: 10px;">Este correo ha sido enviado por GaiaFact. Todos los derechos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

        </body>
        </html>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo",
    });
  } catch (err) {
    console.error("❌ Error en recuperar contraseña:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

// 🟢 Reset contraseña
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { nuevaPassword } = req.body;

  try {
    const user = await Usuario.findOne({
      resetToken: token,
      tokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // 🟢 Solo asigna la contraseña, el hook pre-save la hasheará
    user.password = nuevaPassword;

    user.resetToken = null;
    user.tokenExpiration = null;

    await user.save(); // Aquí el hook pre-save hasheará automáticamente

    return res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (err) {
    console.error("❌ Error en reestablecer contraseña:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};
// 🛡 Middleware para proteger rutas con JWT
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(403).json({ success: false, message: "Token requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token inválido o expirado" });
    }

    req.user = user; 
    next();
  });
};