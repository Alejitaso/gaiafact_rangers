// middlewares/auditMiddleware.js
const Log = require('../models/log');

exports.audit = (accion) => (req, res, next) => {
  const originalSend = res.json.bind(res);

  res.json = function (data) {
    if (res.statusCode < 400) {
      Log.create({
          usuarioId: req.usuario?._id || null, 
        accion,
        ruta: req.originalUrl,
        metodo: req.method,
        resultado: 'éxito',
        fecha: new Date()
      }).catch(console.error);
    }
    originalSend(data);
  };

  next();
};