require('dotenv').config();

const express = require("express")
const rateLimit = require('express-rate-limit')
const router=express.Router()

const { audit } = require('../middlewares/auditMiddleware');

const usuarioController= require("../controllers/usuarioController.js");
const { verificarAuth, verificarRolGestor, verificarAccesoPerfil } = require('../middlewares/authMiddleware.js');
const productoController=require('../controllers/productoController.js');
const facturaController=require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js"); 
const imagenesController = require('../controllers/imagenesController.js');
const notificacionController = require('../controllers/notificacionController.js')

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // máximo 5 intentos por IP
  message: { success: false, message: "Demasiados intentos. Intenta de nuevo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports=function(){
    //registro nuevo cliente
    router.post('/Usuario',usuarioController.nuevoUsuario)
    //buscar cliente por documento
    router.get('/Usuario/documento/:documento',verificarAuth,usuarioController.buscarPorDocumento)

    // CONSULTAR CLIENTE POR ID: Requiere ser el propio usuario O un gestor
    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, audit('actualizarUsuario'), usuarioController.mostrarUsuario)

    // CONSULTAR TODOS LOS USUARIOS (LISTADO): Requiere ser un gestor
    router.get('/Usuario', verificarAuth, verificarRolGestor, usuarioController.mostrarUsuarios)
    
    //actualizar cliente
    router.put('/Usuario/:idUsuario',verificarAuth,usuarioController.actualizarUsuario)




    /* Productos */
    // se agrega nuevo producto
    router.post('/productos', productoController.subirArchivo, productoController.nuevoProducto);
    // mostrar los productos
    router.get('/productos', productoController.mostrarProductos);
    // muestra un producto por id
    router.get('/productos/:idProducto', productoController.mostrarProducto);
    // obtiene el código de barras en PDF
    router.get('/productos/:idProducto/codigo', productoController.obtenerCodigoBarrasPDF);
    // actualiza un producto
    router.put('/productos/:idProducto', productoController.subirArchivo, productoController.actualizarProducto);
    // eliminar producto
    router.delete('/productos/:idProducto', productoController.eliminarProducto);

    /*imagenes*/
    router.post('/imagenes/carousel', imagenesController.upload.single('imagen'), imagenesController.subirImagenCarousel);
    router.get('/imagenes/carousel', imagenesController.obtenerImagenesCarousel);


    /* Facturas */
    router.get('/facturas/:idFactura/pdf', facturaController.obtenerFacturaPDF);
    router.get('/facturas/:idFactura/xml', facturaController.obtenerFacturaXML);
    // genera nueva factura
    router.post('/facturas', (req, res, next) => {
        const { error } = facturaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
            mensaje: 'Datos de factura inválidos',
            detalles: error.details.map(d => d.message)
            });
        }
        next(); // ✅ sigue con tu controlador normal
    }, audit('crearFactura'), facturaController.generarFactura);

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

    // Ruta para buscar factura por número
    router.get('/buscar/:numeroFactura', facturaController.buscarFactura);

    // Ruta para enviar por correo
    router.post('/enviar-correo', facturaController.enviarFacturaCorreo);

    // Rutas de autenticación
    router.post("/auth/login", loginLimiter, authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);

    router.post('/notificaciones/crear', notificacionController.crearNotificacion);

    return router;
}