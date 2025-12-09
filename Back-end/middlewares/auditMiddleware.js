// middlewares/auditMiddleware.js
const Log = require('../models/log');

// Middleware para auditar acciones
exports.audit = (accion, extra = {}) => (req, res, next) => {
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

        /* === NUEVOS CAMPOS === */
        recursoId: extra.recursoId || req.params.idProducto || req.params.idFactura || null,
        cambios: extra.cambios || null
      }).catch(console.error);
    }
    originalSend(data);
  };
  next();
};