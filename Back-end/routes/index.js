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
const securityNetworkMiddleware = require("../middlewares/securityNetworkMiddleware");
const validarRolRegistro = require('../middlewares/validarRolRegistro.js');
const logController = require('../controllers/logController');
const { checkEmail } = require('../middlewares/checkEmail.js');
const { verificarCuenta } = require("../controllers/usuarioController");
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
  router.post('/Usuario', verificarAuth,checkEmail, audit('registrarCliente'),validarRolRegistro, usuarioController.nuevoUsuario);
  router.get('/Usuario/documento/:documento', verificarAuth, audit('buscarClientePorDocumento'), usuarioController.buscarPorDocumento);
  router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, audit('verPerfilUsuario'), usuarioController.mostrarUsuario);
  router.get('/Usuario', verificarAuth, verificarRolGestor, audit('listarUsuarios'), usuarioController.mostrarUsuarios);
  router.put('/Usuario/:idUsuario', verificarAuth, audit('actualizarUsuario'), usuarioController.actualizarUsuario);
  router.post('/Usuario/reenviar-verificacion/:idUsuario', usuarioController.reenviarVerificacionAdmin);

  /* ─────────────── PRODUCTOS ─────────────── */
  router.post('/productos', verificarAuth, verificarRolGestor, audit('crearProducto'), productoController.nuevoProducto);
  router.get('/productos', verificarAuth, audit('listarProductos'), productoController.mostrarProductos);
  router.get('/productos/:idProducto', verificarAuth, audit('verProducto'), productoController.mostrarProducto);
  router.get('/productos/:idProducto/codigo', verificarAuth, audit('verCodigoBarras'), productoController.obtenerCodigoBarrasPDF);
  router.delete('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('eliminarProducto'), productoController.eliminarProducto);
  router.put('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('actualizarProducto'), productoController.actualizarProducto);

  /* ─────────────── IMÁGENES ─────────────── */
  router.post('/imagenes/carousel', verificarAuth, verificarRolGestor, imagenesController.upload.single('imagen'), audit('subirImagenCarousel'), imagenesController.subirImagenCarousel);
  router.get('/imagenes/carousel', imagenesController.obtenerImagenesCarousel);

  /* ─────────────── FACTURAS ─────────────── */
  router.post('/facturas', verificarAuth, audit('crearFactura'), facturaController.generarFactura);
  router.get('/facturas', verificarAuth, audit('listarFacturas'), facturaController.mostrarFacturas);
  router.get('/facturas/:idFactura', verificarAuth, audit('verFactura'), facturaController.mostrarFacturas);
  router.post('/facturas/enviar-correo', verificarAuth, audit('enviarFacturaCorreo'), facturaController.enviarFacturaPorCorreo);
  router.get('/facturas/buscar-factura/:numeroFactura', verificarAuth, audit('buscarFacturaPorNumero'), facturaController.buscarFactura);
  router.get('/buscar/:numeroFactura', verificarAuth, audit('buscarFactura'), facturaController.buscarFactura);
  router.post('/enviar-correo', verificarAuth, audit('enviarFacturaCorreoDirecto'), facturaController.enviarFacturaPorCorreo);
  router.get('/facturas/:idFactura/pdf', verificarAuth, audit('descargarFacturaPDF'), facturaController.obtenerFacturaPDF);
  router.get('/facturas/:idFactura/xml', verificarAuth, audit('descargarFacturaXML'), facturaController.obtenerFacturaXML);

 /* ─────────────── AUTENTICACIÓN ─────────────── */   
  router.post("/login", loginLimiter, audit('inicioSesion'), authController.login);
  router.post("/recover", audit('recuperarContrasena'), authController.recoverPassword);
  router.get('/auth/verify-email/:token', usuarioController.verificarCuenta);
  router.post('/reset/:token', audit('restablecerContrasena'), authController.resetPassword);

  /* ─────────────── NOTIFICACIONES ─────────────── */
  router.post('/notificaciones/crear', verificarAuth, audit('crearNotificacion'), notificacionController.guardarNotificacion);
  router.get('/notificaciones', verificarAuth, notificacionController.listarNotificaciones);
  /* ─────────────── (solo ADMIN / SUPERADMIN) ─────────────── */
  router.get('/logs', verificarAuth, verificarRolGestor, logController.obtenerLogs);
  router.post('/admin/nueva-resolucion', facturaController.actualizarLimiteFacturacion);

  return router;
};