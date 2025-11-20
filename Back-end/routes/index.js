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
const securityNetworkMiddleware = require("../middlewares/securityNetworkMiddleware");
const validarRolRegistro = require('../middlewares/validarRolRegistro.js');

module.exports = function(){

    /* ====================== USUARIOS ====================== */

    router.post('/Usuario',
        verificarAuth,               
        validarRolRegistro,         
        usuarioController.nuevoUsuario
    );

    router.get('/Usuario/documento/:documento', verificarAuth, usuarioController.buscarPorDocumento);

    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, usuarioController.mostrarUsuario);

    router.get('/Usuario',
        verificarAuth,
        verificarRolGestor,
        securityNetworkMiddleware,
        usuarioController.mostrarUsuarios
    );

    router.put('/Usuario/:idUsuario',
        verificarAuth,
        securityNetworkMiddleware,
        usuarioController.actualizarUsuario
    );

    router.delete('/Usuario/:idUsuario',
        verificarAuth,
        securityNetworkMiddleware,
        usuarioController.eliminarUsuario
    );


    /* ====================== PRODUCTOS ====================== */

    router.post('/productos',
        verificarAuth,
        securityNetworkMiddleware,
        productoController.subirArchivo,
        productoController.nuevoProducto
    );

    router.get('/productos', productoController.mostrarProductos);

    router.get('/productos/:idProducto', productoController.mostrarProducto);

    router.get('/productos/:idProducto/codigo', productoController.obtenerCodigoBarrasPDF);

    router.put('/productos/:idProducto',
        verificarAuth,
        securityNetworkMiddleware,
        productoController.subirArchivo,
        productoController.actualizarProducto
    );

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

    router.post('/facturas',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.generarFactura
    );

    router.get('/facturas',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.mostrarFacturas
    );

    router.get('/facturas/numero/:numeroFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.buscarFactura
    );

    router.post('/facturas/enviar-correo',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.enviarFacturaCorreo
    );

    router.get('/facturas/:idFactura/pdf',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.obtenerFacturaPDF
    );

    router.get('/facturas/:idFactura/xml',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.obtenerFacturaXML
    );

    router.get('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.mostrarFactura
    );

    router.put('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.actualizarFactura
    );

    router.delete('/facturas/:idFactura',
        verificarAuth,
        securityNetworkMiddleware,
        facturaController.eliminarFactura
    );


    /* ====================== NOTIFICACIONES ====================== */

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
