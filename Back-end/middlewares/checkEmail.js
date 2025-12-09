const { validarEmail } = require("../Validators/validarEmail.js");

exports.checkEmail = async (req, res, next) => {
  const { correo_electronico } = req.body;

  try {
    const { valid, reason } = await validarEmail(correo_electronico);

    if (!valid) {
      return res.status(400).json({
        ok: false,
        mensaje: `Correo inválido (${reason})`,
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
