require('dotenv').config();

const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js");
const { verificarAuth, verificarRolGestor, verificarAccesoPerfil } = require('../middlewares/authMiddleware.js');
const productoController = require('../controllers/productoController.js');
const facturaController = require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js"); 
const imagenesController = require('../controllers/imagenesController.js');
const notificacionController = require('../controllers/notificacionController.js')

// 🔒 Middleware de seguridad de red
const securityNetworkMiddleware = require("../middlewares/securityNetworkMiddleware");

module.exports = function(){

    /* ====================== USUARIOS ====================== */

    // Registro nuevo cliente
    router.post('/Usuario', usuarioController.nuevoUsuario);

    // Buscar cliente por documento
    router.get('/Usuario/documento/:documento', verificarAuth, usuarioController.buscarPorDocumento);

    // Consultar cliente por ID (solo su propio perfil O gestor)
    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, usuarioController.mostrarUsuario);

    // Listar todos los usuarios (solo empleados)
    router.get('/Usuario',
        verificarAuth,
        verificarRolGestor,
        securityNetworkMiddleware,
        usuarioController.mostrarUsuarios
    );

    // Actualizar usuario (solo empleados)
    router.put('/Usuario/:idUsuario',
        verificarAuth,
        securityNetworkMiddleware,
        usuarioController.actualizarUsuario
    );

    // Eliminar usuario (solo empleados)
    router.delete('/Usuario/:idUsuario',
        verificarAuth,
        securityNetworkMiddleware,
        usuarioController.eliminarUsuario
    );


    /* ====================== PRODUCTOS ====================== */

    // Crear un producto (solo empleados)
    router.post('/productos',
        verificarAuth,
        securityNetworkMiddleware,
        productoController.subirArchivo,
        productoController.nuevoProducto
    );

    // Mostrar productos (acceso libre)
    router.get('/productos', productoController.mostrarProductos);

    // Mostrar producto por ID (acceso libre)
    router.get('/productos/:idProducto', productoController.mostrarProducto);

    // Obtener el código de barras PDF (acceso libre)
    router.get('/productos/:idProducto/codigo', productoController.obtenerCodigoBarrasPDF);

    // Actualizar producto (solo empleados)
    router.put('/productos/:idProducto',
        verificarAuth,
        securityNetworkMiddleware,
        productoController.subirArchivo,
        productoController.actualizarProducto
    );

    // Eliminar producto (solo empleados)
    router.delete('/productos/:idProducto',
        verificarAuth,
        securityNetworkMiddleware,
        productoController.eliminarProducto
    );


    /* ====================== IMÁGENES ====================== */

    router.post('/imagenes/carousel',
        imagenesController.upload.single('imagen'),
        imagenesController.subirImagenCarousel
    );

    router.get('/imagenes/carousel', imagenesController.obtenerImagenesCarousel);


    /* ====================== FACTURAS ====================== */

    // Crear factura (solo empleados)
    router.post('/facturas',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.generarFactura
    );

    // Mostrar todas las facturas (solo empleados)
    router.get('/facturas',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.mostrarFacturas
    );

    // Buscar factura por número (solo empleados)
    router.get('/facturas/numero/:numeroFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.buscarFactura
    );

    // Enviar factura por correo (solo empleados)
    router.post('/facturas/enviar-correo',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.enviarFacturaCorreo
    );

    // Obtener PDF de factura (solo empleados)
    router.get('/facturas/:idFactura/pdf',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.obtenerFacturaPDF
    );

    // Obtener XML de factura (solo empleados)
    router.get('/facturas/:idFactura/xml',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.obtenerFacturaXML
    );

    // Mostrar factura por ID (solo empleados)
    router.get('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.mostrarFactura
    );

    // Actualizar factura (solo empleados)
    router.put('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.actualizarFactura
    );

    // Eliminar factura (solo empleados)
    router.delete('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.eliminarFactura
    );


    /* ====================== NOTIFICACIONES ====================== */

    // Crear notificación (solo empleados)
    router.post('/notificaciones/crear',
        verificarAuth,
        securityNetworkMiddleware,
        notificacionController.crearNotificacion
    );


    /* ====================== AUTH ====================== */

    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);

    return router;
}
