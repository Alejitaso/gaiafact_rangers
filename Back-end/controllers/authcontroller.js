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
