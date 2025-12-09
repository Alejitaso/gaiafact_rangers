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
const { checkEmail } = require('../middlewares/checkEmail.js');
const { verificarCuenta } = require("../controllers/usuarioController");


const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Demasiados intentos. Intenta de nuevo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = function () {  
  /* ─────────────── USUARIOS ─────────────── */
  router.post('/Usuario', checkEmail, audit('registrarCliente'), usuarioController.nuevoUsuario);
  router.get('/Usuario/documento/:documento', verificarAuth, audit('buscarClientePorDocumento'), usuarioController.buscarPorDocumento);
  router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, audit('verPerfilUsuario'), usuarioController.mostrarUsuario);
  router.get('/Usuario', verificarAuth, verificarRolGestor, audit('listarUsuarios'), usuarioController.mostrarUsuarios);
  router.put('/Usuario/:idUsuario', verificarAuth, audit('actualizarUsuario'), usuarioController.actualizarUsuario);
  router.get('/Usuario/verificar', usuarioController.verificarCuenta);

  /* ─────────────── PRODUCTOS ─────────────── */
  router.post('/productos', verificarAuth, verificarRolGestor, audit('crearProducto'), productoController.nuevoProducto);
  router.get('/productos', verificarAuth, audit('listarProductos'), productoController.mostrarProductos);
  router.get('/productos/:idProducto', verificarAuth, audit('verProducto'), productoController.mostrarProducto);
  router.get('/productos/:idProducto/codigo', verificarAuth, audit('verCodigoBarras'), productoController.obtenerCodigoBarrasPDF);
  router.put('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('actualizarProducto'), productoController.actualizarProducto);
  router.delete('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('eliminarProducto'), productoController.eliminarProducto);

<<<<<<< HEAD
    /* Facturas */
    router.get('/facturas/:idFactura/pdf', facturaController.obtenerFacturaPDF);
    router.get('/facturas/:idFactura/xml', facturaController.obtenerFacturaXML);
    // genera nueva factura
    router.post('/facturas', facturaController.crearFactura);
    // mostrar las facturas
    router.get('/facturas', facturaController.mostrarFacturas);
    // muestra factura por ID
    router.get('/facturas/:idFactura', facturaController.mostrarFactura);
    // actualiza una factura
    router.put('/facturas/:idFactura', facturaController.actualizarFactura);
    // eliminar factura
    router.delete('/facturas/:idFactura', facturaController.eliminarFactura);
    // obtiene la factura en pdf
    router.get('/facturas/pdf/:idFactura', facturaController.obtenerFacturaPDF);
    // obtiene la factura en xml
    router.get('/facturas/xml/:idFactura', facturaController.obtenerFacturaXML);
    // enviar por correo
    router.post('/facturas/enviar-correo', facturaController.enviarFacturaCorreo);
    // buscar por numero de factura
        router.get('/facturas/buscar-factura/:numeroFactura', facturaController.buscarFactura);
=======
  /* ─────────────── IMÁGENES ─────────────── */
  router.post('/imagenes/carousel', verificarAuth, verificarRolGestor, imagenesController.upload.single('imagen'), audit('subirImagenCarousel'), imagenesController.subirImagenCarousel);
  router.get('/imagenes/carousel', imagenesController.obtenerImagenesCarousel);
>>>>>>> 8d09379a0de49d31afe21bc4b41e98374f122b84

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

<<<<<<< HEAD
    router.post('/admin/nueva-resolucion', facturaController.actualizarLimiteFacturacion);

    // Rutas de autenticación
    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);
=======
  router.get('/facturas', verificarAuth, audit('listarFacturas'), facturaController.mostrarFacturas);
  router.get('/facturas/:idFactura', verificarAuth, audit('verFactura'), facturaController.mostrarFactura);
  router.get('/facturas/pdf/:idFactura', verificarAuth, audit('descargarFacturaPDF'), facturaController.obtenerFacturaPDF);
  router.get('/facturas/xml/:idFactura', verificarAuth, audit('descargarFacturaXML'), facturaController.obtenerFacturaXML);
  router.post('/facturas/enviar-correo', verificarAuth, audit('enviarFacturaCorreo'), facturaController.enviarFacturaCorreo);
  router.get('/facturas/buscar-factura/:numeroFactura', verificarAuth, audit('buscarFacturaPorNumero'), facturaController.buscarFactura);
  router.get('/buscar/:numeroFactura', verificarAuth, audit('buscarFactura'), facturaController.buscarFactura);
  router.post('/enviar-correo', verificarAuth, audit('enviarFacturaCorreoDirecto'), facturaController.enviarFacturaCorreo);
>>>>>>> 8d09379a0de49d31afe21bc4b41e98374f122b84

  /* ─────────────── AUTENTICACIÓN ─────────────── */   
  router.post("/auth/login", verificarAuth, loginLimiter, audit('inicioSesion'), authController.login);
  router.post("/auth/recover", verificarAuth, audit('recuperarContrasena'), authController.recoverPassword);
  router.get('/auth/verify-email', verificarAuth, audit('verificarCorreo'), authController.verifyEmail);
  router.post('/auth/reset/:token', verificarAuth, audit('restablecerContrasena'), authController.resetPassword);
  router.get('/auth/verify', usuarioController.verificarCuenta);
  router.get("/verificar/:token", verificarCuenta);

  /* ─────────────── NOTIFICACIONES ─────────────── */
  router.post('/notificaciones/crear', verificarAuth, audit('crearNotificacion'), notificacionController.guardarNotificacion);
  router.get('/notificaciones', verificarAuth, notificacionController.listarNotificaciones);

  /* ─────────────── LOGS (solo ADMIN / SUPERADMIN) ─────────────── */
  router.get('/logs', verificarAuth, verificarRolGestor, logController.obtenerLogs);

  return router;
};