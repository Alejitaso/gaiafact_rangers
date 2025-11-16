require('dotenv').config();

const express = require("express")
const router=express.Router()

const usuarioController= require("../controllers/usuarioController.js");
const { verificarAuth, verificarRolGestor, verificarAccesoPerfil } = require('../middlewares/authMiddleware.js');
const productoController=require('../controllers/productoController.js');
const facturaController=require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js"); 
const imagenesController = require('../controllers/imagenesController.js');
const notificacionController = require('../controllers/notificacionController.js')

module.exports=function(){
    //registro nuevo cliente
    router.post('/Usuario',usuarioController.nuevoUsuario)
    //buscar cliente por documento
    router.get('/Usuario/documento/:documento',verificarAuth,usuarioController.buscarPorDocumento)

    // CONSULTAR CLIENTE POR ID: Requiere ser el propio usuario O un gestor
    router.get('/Usuario/:idUsuario', verificarAuth, verificarAccesoPerfil, usuarioController.mostrarUsuario)

    // CONSULTAR TODOS LOS USUARIOS (LISTADO): Requiere ser un gestor
    router.get('/Usuario', verificarAuth, verificarRolGestor, usuarioController.mostrarUsuarios)
    
    //actualizar cliente
    router.put('/Usuario/:idUsuario',verificarAuth,usuarioController.actualizarUsuario)
    //eliminar cliente
    router.delete('/Usuario/:idUsuario',verificarAuth,usuarioController.eliminarUsuario)


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


    /* ===== FACTURAS (CON AUTENTICACIÓN) ===== */
    
    // ✅ Generar nueva factura - requiere autenticación
    router.post('/facturas', verificarAuth, facturaController.generarFactura);
    
    // ✅ Mostrar todas las facturas - CON CONTROL DE ACCESO POR ROL
    router.get('/facturas', verificarAuth, facturaController.mostrarFacturas);
    
    // ✅ Buscar factura por número - requiere autenticación
    router.get('/facturas/numero/:numeroFactura', verificarAuth, facturaController.buscarFactura);
    
    // ✅ Enviar factura por correo - requiere autenticación
    router.post('/facturas/enviar-correo', verificarAuth, facturaController.enviarFacturaCorreo);
    
    // ✅ Obtener PDF de factura - CON CONTROL DE ACCESO
    router.get('/facturas/:idFactura/pdf', verificarAuth, facturaController.obtenerFacturaPDF);
    
    // ✅ Obtener XML de factura - CON CONTROL DE ACCESO
    router.get('/facturas/:idFactura/xml', verificarAuth, facturaController.obtenerFacturaXML);
    
    // ✅ Mostrar factura por ID - CON CONTROL DE ACCESO
    router.get('/facturas/:idFactura', verificarAuth, facturaController.mostrarFactura);
    
    // ✅ Actualizar factura - requiere autenticación
    router.put('/facturas/:idFactura', verificarAuth, facturaController.actualizarFactura);
    
    // ✅ Eliminar factura - requiere autenticación
    router.delete('/facturas/:idFactura', verificarAuth, facturaController.eliminarFactura);

    // Rutas de autenticación (NO requieren verificarAuth)
    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);

    router.post('/notificaciones/crear', notificacionController.crearNotificacion);

    return router;
}