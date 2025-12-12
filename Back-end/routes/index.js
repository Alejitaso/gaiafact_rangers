require('dotenv').config();

const express = require("express");
const rateLimit = require('express-rate-limit');
const router = express.Router();

// --------------------------------------------------------------------------
// I. MIDDLEWARES Y CONTROLADORES
// --------------------------------------------------------------------------

// Middlewares
const { audit } = require('../middlewares/auditMiddleware');
const { verificarAuth, verificarRolGestor, verificarAccesoPerfil } = require('../middlewares/authMiddleware.js');
const { checkEmail } = require('../middlewares/checkEmail.js');

// Controladores
const usuarioController = require("../controllers/usuarioController.js");
const productoController = require('../controllers/productoController.js');
const facturaController = require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js");
const imagenesController = require('../controllers/imagenesController.js');
const notificacionController = require('../controllers/notificacionController.js');
const logController = require('../controllers/logController');

// Modelos (Solo si se requiere un modelo directamente en rutas, como para validación)
const Factura = require('../models/factura'); 

// --------------------------------------------------------------------------
// II. CONFIGURACIÓN DE LIMITADORES
// --------------------------------------------------------------------------

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Demasiados intentos. Intenta de nuevo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});

// --------------------------------------------------------------------------
// III. DEFINICIÓN DE RUTAS
// --------------------------------------------------------------------------

module.exports = function () { 
    
    /* ─────────────── AUTENTICACIÓN (Rutas Públicas) ─────────────── */ 
    
    // Las rutas de autenticación no deben llevar verificarAuth, ya que se usan para iniciar sesión, etc.
    router.post("/auth/login", loginLimiter, audit('inicioSesion'), authController.login);
    router.post("/auth/recover", audit('recuperarContrasena'), authController.recoverPassword);
    router.get('/auth/verify-email', audit('verificarCorreo'), authController.verifyEmail);
    router.post('/auth/reset/:token', audit('restablecerContrasena'), authController.resetPassword);

    // Rutas de verificación de cuenta
    router.get('/Usuario/verificar', usuarioController.verificarCuenta); // Ruta de verificación directa
    router.get("/verificar/:token", usuarioController.verificarCuenta); // Otra ruta de verificación

    /* ─────────────── USUARIOS (Requiere Auth) ─────────────── */
    
    router.post('/Usuario', checkEmail, audit('registrarCliente'), usuarioController.nuevoUsuario); // Registro público
    router.get('/Usuario/documento/:documento', verificarAuth, audit('buscarClientePorDocumento'), usuarioController.buscarPorDocumento);
    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, audit('verPerfilUsuario'), usuarioController.mostrarUsuario);
    router.get('/Usuario', verificarAuth, verificarRolGestor, audit('listarUsuarios'), usuarioController.mostrarUsuarios);
    router.put('/Usuario/:idUsuario', verificarAuth, audit('actualizarUsuario'), usuarioController.actualizarUsuario);
    router.post('/Usuario/reenviar-verificacion/:idUsuario', verificarAuth, verificarRolGestor, usuarioController.reenviarVerificacionAdmin);

    /* ─────────────── PRODUCTOS (Requiere Auth y Rol) ─────────────── */

    router.post('/productos', verificarAuth, verificarRolGestor, audit('crearProducto'), productoController.nuevoProducto);
    router.get('/productos', verificarAuth, audit('listarProductos'), productoController.mostrarProductos);
    router.get('/productos/:idProducto', verificarAuth, audit('verProducto'), productoController.mostrarProducto);
    router.get('/productos/:idProducto/codigo', verificarAuth, audit('verCodigoBarras'), productoController.obtenerCodigoBarrasPDF);
    router.put('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('actualizarProducto'), productoController.actualizarProducto);
    router.delete('/productos/:idProducto', verificarAuth, verificarRolGestor, audit('eliminarProducto'), productoController.eliminarProducto);

    /* ─────────────── FACTURAS ─────────────── */
    
    // Rutas específicas DEBEN ir primero para evitar conflictos con :idFactura
    router.get('/facturas/buscar-factura/:numeroFactura', verificarAuth, audit('buscarFactura'), facturaController.buscarFactura);
    router.post('/facturas/enviar-correo', verificarAuth, audit('enviarFacturaCorreo'), facturaController.enviarFacturaCorreo);
    router.post('/admin/nueva-resolucion', verificarAuth, verificarRolGestor, audit('actualizarLimiteFacturacion'), facturaController.actualizarLimiteFacturacion);
    
    // Generar nueva factura (con validación de esquema en la ruta)
    router.post('/facturas', verificarAuth, async (req, res, next) => {
        try {
            const factura = new Factura(req.body);
            await factura.validate();
            next();
        } catch (err) {
            // Manejo de errores de validación de Mongoose
            return res.status(400).json({
                mensaje: 'Datos de factura inválidos',
                detalles: Object.values(err.errors).map(e => e.message)
            });
        }
    }, audit('crearFactura'), facturaController.generarFactura);
    
    // Rutas Generales de Factura
    router.get('/facturas', verificarAuth, audit('listarFacturas'), facturaController.mostrarFacturas);
    router.get('/facturas/:idFactura', verificarAuth, audit('verFactura'), facturaController.mostrarFactura);
    router.put('/facturas/:idFactura', verificarAuth, audit('actualizarFactura'), facturaController.actualizarFactura);
    router.delete('/facturas/:idFactura', verificarAuth, verificarRolGestor, audit('eliminarFactura'), facturaController.eliminarFactura);
    
    // Descarga y Visualización
    router.get('/facturas/:idFactura/pdf', verificarAuth, audit('descargarFacturaPDF'), facturaController.obtenerFacturaPDF);
    router.get('/facturas/:idFactura/xml', verificarAuth, audit('descargarFacturaXML'), facturaController.obtenerFacturaXML);

    /* ─────────────── NOTIFICACIONES (Requiere Auth) ─────────────── */
    router.post('/notificaciones/crear', verificarAuth, audit('crearNotificacion'), notificacionController.guardarNotificacion);
    router.get('/notificaciones', verificarAuth, audit('listarNotificaciones'), notificacionController.listarNotificaciones);

    /* ─────────────── LOGS (Solo Gestor/Admin) ─────────────── */
    router.get('/logs', verificarAuth, verificarRolGestor, audit('obtenerLogs'), logController.obtenerLogs);

    /* ─────────────── IMÁGENES (Subida/Visualización) ─────────────── */
    // Asumiendo que tienes rutas de imágenes para subida o visualización

    return router;
};