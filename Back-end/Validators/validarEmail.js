const validateEmail = require("deep-email-validator");

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
