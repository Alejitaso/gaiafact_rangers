require('dotenv').config();
console.log('🚀 Cargando rutas de API...');
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
    console.log('📌 Registrando ruta: /Usuario/documento/:documento');
    router.get('/Usuario/documento/:documento', verificarAuth, usuarioController.buscarPorDocumento);

    router.post('/Usuario',
        verificarAuth,               
        validarRolRegistro,         
        usuarioController.nuevoUsuario
    );

    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, usuarioController.mostrarUsuario);

    router.get('/Usuario',
        verificarAuth,
        verificarRolGestor,
        usuarioController.mostrarUsuarios
    );

    router.put('/Usuario/:idUsuario',
        verificarAuth,
        usuarioController.actualizarUsuario
    );

    router.delete('/Usuario/:idUsuario',
        verificarAuth,
        usuarioController.eliminarUsuario
    );


    /* ====================== PRODUCTOS ====================== */

    router.post('/productos',
        verificarAuth,
        productoController.subirArchivo,
        productoController.nuevoProducto
    );

    router.get('/productos', productoController.mostrarProductos);

    router.get('/productos/:idProducto', productoController.mostrarProducto);

    router.get('/productos/:idProducto/codigo', productoController.obtenerCodigoBarrasPDF);

    router.put('/productos/:idProducto',
        verificarAuth,
        productoController.subirArchivo,
        productoController.actualizarProducto
    );

    router.delete('/productos/:idProducto',
        verificarAuth,
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
        facturaController.generarFactura
    );

    router.get('/facturas',
        verificarAuth,
        validarRolRegistro,
        facturaController.mostrarFacturas
    );

    router.get('/facturas/buscar-factura/:numeroFactura',
        verificarAuth,
        facturaController.buscarFactura
    );

    router.post('/facturas/enviar-correo',
        verificarAuth,
        facturaController.enviarFacturaCorreo
    );

    router.get('/facturas/:idFactura/pdf',
        verificarAuth,
        facturaController.obtenerFacturaPDF
    );

    router.get('/facturas/:idFactura/xml',
        verificarAuth,
        facturaController.obtenerFacturaXML
    );

    router.get('/facturas/:idFactura',
        verificarAuth,
        facturaController.mostrarFactura
    );

    router.put('/facturas/:idFactura',
        verificarAuth,
        facturaController.actualizarFactura
    );

    router.delete('/facturas/:idFactura',
        verificarAuth,
        facturaController.eliminarFactura
    );


    /* ====================== NOTIFICACIONES ====================== */

    router.post('/notificaciones/crear',
        verificarAuth,
        notificacionController.crearNotificacion
    );


    /* ====================== AUTH ====================== */

    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);

    return router;
}
