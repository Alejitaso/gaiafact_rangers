const dns = require('dns').promises;
const { validarEmail } = require("../Validators/validarEmail.js");

async function tieneRegistrosMX(dominio) {
  try {
    const registros = await dns.resolveMx(dominio);
    return registros.length > 0;
  } catch (err) {
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

    const dominio = correo_electronico.split('@')[1];
    const tieneMX = await tieneRegistrosMX(dominio);

    if (!tieneMX) {
      return res.status(400).json({
        ok: false,
        mensaje: "El dominio del correo no puede recibir mensajes. Usa uno válido.",
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