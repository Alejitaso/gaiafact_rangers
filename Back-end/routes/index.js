require('dotenv').config();

const express = require("express");
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { audit } = require('../middlewares/auditMiddleware');
const usuarioController = require("../controllers/usuarioController.js");
const { verificarAuth, verificarRolGestor, verificarAccesoPerfil } = require('../middlewares/authMiddleware.js');
const productoController = require('../controllers/productoController.js');
const facturaController = require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js");
const imagenesController = require('../controllers/imagenesController.js');
const notificacionController = require('../controllers/notificacionController.js');
const logController = require('../controllers/logController');
const Factura = require('../models/factura');

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Demasiados intentos. Intenta de nuevo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = function () {  
  /* ─────────────── USUARIOS ─────────────── */
  router.post('/Usuario', verificarAuth, audit('registrarCliente'), usuarioController.nuevoUsuario);
  router.get('/Usuario/documento/:documento', verificarAuth, audit('buscarClientePorDocumento'), usuarioController.buscarPorDocumento);
  router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, audit('verPerfilUsuario'), usuarioController.mostrarUsuario);
  router.get('/Usuario', verificarAuth, verificarRolGestor, audit('listarUsuarios'), usuarioController.mostrarUsuarios);
  router.put('/Usuario/:idUsuario', verificarAuth, audit('actualizarUsuario'), usuarioController.actualizarUsuario);

  /* ─────────────── PRODUCTOS ─────────────── */
  router.post('/productos', verificarAuth, verificarRolGestor, productoController.subirArchivo, audit('crearProducto'), productoController.nuevoProducto);
  router.get('/productos', verificarAuth, audit('listarProductos'), productoController.mostrarProductos);
  router.get('/productos/:idProducto', verificarAuth, audit('verProducto'), productoController.mostrarProducto);
  router.get('/productos/:idProducto/codigo', verificarAuth, audit('verCodigoBarras'), productoController.obtenerCodigoBarrasPDF);
  router.put('/productos/:idProducto', verificarAuth, verificarRolGestor, productoController.subirArchivo, audit('actualizarProducto'), productoController.actualizarProducto);
  router.delete('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('eliminarProducto'), productoController.eliminarProducto);

  /* ─────────────── IMÁGENES ─────────────── */
  router.post('/imagenes/carousel', verificarAuth, verificarRolGestor, imagenesController.upload.single('imagen'), audit('subirImagenCarousel'), imagenesController.subirImagenCarousel);
  router.get('/imagenes/carousel', imagenesController.obtenerImagenesCarousel);

  /* ─────────────── FACTURAS ─────────────── */
  router.get('/facturas/:idFactura/pdf', verificarAuth, audit('descargarFacturaPDF'), facturaController.obtenerFacturaPDF);
  router.get('/facturas/:idFactura/xml', verificarAuth, audit('descargarFacturaXML'), facturaController.obtenerFacturaXML);

  router.post('/facturas', verificarAuth, async (req, res, next) => {
    try {
      const factura = new Factura(req.body);
      await factura.validate();
      next();
    } catch (err) {
      return res.status(400).json({
        mensaje: 'Datos de factura inválidos',
        detalles: Object.values(err.errors).map(e => e.message)
      });
    }
  }, audit('crearFactura'), facturaController.generarFactura);

  router.get('/facturas', verificarAuth, audit('listarFacturas'), facturaController.mostrarFacturas);
  router.get('/facturas/:idFactura', verificarAuth, audit('verFactura'), facturaController.mostrarFactura);
  router.put('/facturas/:idFactura', verificarAuth, verificarRolGestor, audit('actualizarFactura'), facturaController.actualizarFactura);
  router.delete('/facturas/:idFactura', verificarAuth, verificarRolGestor, audit('eliminarFactura'), facturaController.eliminarFactura);
  router.get('/facturas/pdf/:idFactura', verificarAuth, audit('descargarFacturaPDF'), facturaController.obtenerFacturaPDF);
  router.get('/facturas/xml/:idFactura', verificarAuth, audit('descargarFacturaXML'), facturaController.obtenerFacturaXML);
  router.post('/facturas/enviar-correo', verificarAuth, audit('enviarFacturaCorreo'), facturaController.enviarFacturaCorreo);
  router.get('/facturas/buscar-factura/:numeroFactura', verificarAuth, audit('buscarFacturaPorNumero'), facturaController.buscarFactura);
  router.get('/buscar/:numeroFactura', verificarAuth, audit('buscarFactura'), facturaController.buscarFactura);
  router.post('/enviar-correo', verificarAuth, audit('enviarFacturaCorreoDirecto'), facturaController.enviarFacturaCorreo);

  /* ─────────────── AUTENTICACIÓN ─────────────── */   
  router.post("/auth/login", verificarAuth, loginLimiter, audit('inicioSesion'), authController.login);
  router.post("/auth/recover", verificarAuth, audit('recuperarContrasena'), authController.recoverPassword);
  router.get('/auth/verify-email', verificarAuth, audit('verificarCorreo'), authController.verifyEmail);
  router.post('/auth/reset/:token', verificarAuth, audit('restablecerContrasena'), authController.resetPassword);

  /* ─────────────── NOTIFICACIONES ─────────────── */
  router.post('/notificaciones/crear', verificarAuth, audit('crearNotificacion'), notificacionController.crearNotificacion);

  /* ─────────────── LOGS (solo ADMIN / SUPERADMIN) ─────────────── */
  router.get('/logs', verificarAuth, verificarRolGestor, audit('verLogs'), logController.obtenerLogs);

  return router;
};