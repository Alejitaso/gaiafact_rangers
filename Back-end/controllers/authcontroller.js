// controllers/authController.js
const Usuario = require("../models/usuario");

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

    // Usamos el método del modelo para comparar contraseñas
    const isMatch = await user.compararPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    // Aquí normalmente generarías un JWT con info del usuario
    return res.json({
      success: true,
      message: "✅ Login exitoso",
      usuario: {
        id: user._id,
        nombre: user.nombre,
        correo: user.correo_electronico,
        tipo: user.tipo_usuario,
      },
      token: "FAKE_JWT_TOKEN", // reemplazar por jwt real después
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

// 🟢 Recuperar contraseña (placeholder)
exports.recoverPassword = async (req, res) => {
  const { correo_electronico } = req.body;

  try {
    const user = await Usuario.findOne({ correo_electronico });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Aquí implementarías la lógica para enviar email de recuperación
    // Por ahora solo devolvemos un mensaje
    return res.json({
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

// 🟢 Reset contraseña (placeholder)
exports.resetPassword = async (req, res) => {
  const { token, nuevaPassword } = req.body;

  try {
    // Aquí validarías el token y actualizarías la contraseña
    // Por ahora solo devolvemos un mensaje de éxito
    return res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};