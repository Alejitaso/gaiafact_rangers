const axios = require('axios');
const { validarEmail } = require("../Validators/validarEmail.js");

async function tieneRegistrosMX(email) {
  const apiKey = process.env.ABSTRACT_API_KEY;
  const url = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    return data.email_deliverability?.is_mx_valid === true;
  } catch (err) {
    console.error("❌ Error verificando MX:", err.message);
    return false;
  }
}

exports.checkEmail = async (req, res, next) => {
  const { correo_electronico } = req.body;

  try {
    const { valid, reason } = await validarEmail(correo_electronico);

    if (!valid) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo no tiene un formato válido. Asegúrate de escribirlo correctamente, por ejemplo: usuario@gmail.com",
      });
    }

    const mxValido = await tieneRegistrosMX(correo_electronico);

    if (!mxValido) {
      return res.status(400).json({
        ok: false,
        mensaje: "El correo no puede recibir mensajes. Usa uno válido como Gmail, Outlook, etc.",
      });
    }

    next();
  } catch (error) {
    console.error("Error validando email:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno validando correo",
    });
  }
};