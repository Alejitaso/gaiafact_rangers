// middlewares/auditMiddleware.js
const Log = require('../models/log');

// Middleware para auditar acciones
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
        fecha: new Date(),

        /* ✅ CORREGIDO: usar el valor real */
        recursoId: req.params.idProducto || req.params.idFactura || null,
        cambios: null // opcional
      }).catch(console.error);
    }
    originalSend(data);
  };
  next();
};