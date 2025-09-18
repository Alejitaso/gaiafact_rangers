// controllers/authcontroller.js
const Usuario = require("../models/usuario");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Usa variable de entorno para seguridad
const JWT_SECRET = process.env.JWT_SECRET || "mi_clave_secreta";

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // 1. Verifica el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 2. Encuentra y actualiza al usuario
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

    // Crear JWT real
    const token = jwt.sign(
      { id: user._id, correo_electronico: user.correo_electronico, tipo: user.tipo_usuario },
      JWT_SECRET,
      { expiresIn: "1h" } // el token expira en 1 hora
    );

    return res.json({
      success: true,
      message: "✅ Login exitoso",
      usuario: {
        id: user._id,
        nombre: user.nombre,
        correo_electronico: user.correo_electronico,
        tipo: user.tipo_usuario,
      },
      token, // ahora es un JWT válido
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
        user: "gaiafactrangers@gmail.com",
        pass: "feba ukea kheb fsmn", // ⚠ pon esto en .env
      },
    });

    const resetLink = "http://localhost:3000/reset-password/${token}";

    const mailOptions = {
      from: "gaiafactrangers@gmail.com",
      to: correo_electronico,
      subject: "Recuperación de contraseña",
      html: `
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en este enlace (válido 1 hora):</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Si no solicitaste este cambio, ignora este mesnsaje</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo",
    });
  } catch (err) {
    console.error("❌ Error en recoverPassword:", err);
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(nuevaPassword, salt);

    user.resetToken = undefined;
    user.tokenExpiration = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (err) {
    console.error("❌ Error en resetPassword:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

// 🛡 Middleware para proteger rutas con JWT
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // formato: Bearer <token>

  if (!token) {
    return res.status(403).json({ success: false, message: "Token requerido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token inválido o expirado" });
    }

    req.user = user; // guardamos los datos del token en req.user
    next();
  });
};