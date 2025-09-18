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

    const crypto = require("crypto");
    const nodemailer = require("nodemailer");
    const Usuario = require("../models/usuario"); // ajusta la ruta de tu modelo

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

        // 🔹 Generar token seguro
        const token = crypto.randomBytes(20).toString("hex");

        // Guardar en DB con 1 hora de validez
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 3600000;
        await user.save();

        // 🔹 Configurar transporte de correo
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "tuCorreo@gmail.com",       // ⬅️ pon tu correo
            pass: "tuClaveDeAplicacion",      // ⬅️ clave de aplicación de Gmail
          },
        });

        // 🔹 Crear enlace de recuperación
        const resetLink = `http://localhost:4000/reset-password/${token}`;

        // 🔹 Configurar contenido del correo
        const mailOptions = {
          from: "soporte@tuapp.com",
          to: correo_electronico,
          subject: "Recuperación de contraseña",
          html: `
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace (válido 1 hora):</p>
            <a href="${resetLink}">${resetLink}</a>
          `,
        };

        // 🔹 Enviar el correo
        await transporter.sendMail(mailOptions);

        return res.json({
          success: true,
          message: "Se ha enviado un enlace de recuperación a tu correo",
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error en el servidor" });
      }
    };

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

exports.resetPassword = async (req, res) => {
  const { token } = req.params;         // token viene en la URL
  const { nuevaPassword } = req.body;   // contraseña nueva viene en el body

  try {
    // Buscar usuario con el token válido
    const user = await Usuario.findOne({
      resetToken: token,
      tokenExpiration: { $gt: Date.now() }, // válido mientras no haya expirado
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(nuevaPassword, salt);

    // Borrar token y expiración (ya no sirven)
    user.resetToken = undefined;
    user.tokenExpiration = undefined;

    // Guardar cambios en DB
    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};