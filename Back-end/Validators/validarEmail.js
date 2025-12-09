// Back-end/Validators/validarEmail.js
const validateEmail = require("deep-email-validator");

// Función para validar el formato del correo electrónico
async function validarEmail(correo) {
  return await validateEmail.validate({
    email: correo,
    validateRegex: true,
    validateMx: true,
    validateTypo: true,
    validateDisposable: true,
    validateSMTP: false
  });
}

module.exports = { validarEmail };
