require('dotenv').config();

const express = require("express")
const router=express.Router()

const usuarioController = require("../controllers/usuarioController.js");
const productoController = require('../controllers/productoController.js');
const facturaController = require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js"); 
const imagenesController = require('../controllers/imagenesController.js');

module.exports = function() {
    // registro nuevo cliente
    router.post('/Usuario', usuarioController.nuevoUsuario)
    // consultar todos los usuarios
    router.get('/Usuario', usuarioController.mostrarUsuarios)
    // consultar cliente por ID
    router.get('/Usuario/:idUsuario', usuarioController.mostrarUsuario)
    // buscar cliente por documento
    router.get('/Usuario/documento/:documento', usuarioController.buscarPorDocumento)
    // actualizar cliente
    router.put('/Usuario/:idUsuario', usuarioController.actualizarUsuario)
    // eliminar cliente
    router.delete('/Usuario/:idUsuario', usuarioController.eliminarUsuario)

    /* Productos */
    // se agrega nuevo producto
    router.post('/productos', productoController.subirArchivo, productoController.nuevoProducto);
    // mostrar los productos
    router.get('/productos', productoController.mostrarProductos);
    // muestra un producto por id
    router.get('/productos/:idProducto', productoController.mostrarProducto);
    // actualiza un producto
    router.put('/productos/:idProducto', productoController.subirArchivo, productoController.actualizarProducto);
    // eliminar producto
    router.delete('/productos/:idProducto', productoController.eliminarProducto);

    /* Facturas */

    router.get('/facturas/:idFactura/pdf', facturaController.obtenerFacturaPDF);
    router.get('/facturas/:idFactura/xml', facturaController.obtenerFacturaXML);
    // genera nueva factura
    router.post('/facturas', facturaController.generarFactura);
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

    // Rutas de autenticación
    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.post("/auth/reset-password", authController.resetPassword);
    router.get('/auth/verify-email', authController.verifyEmail);
    router.post('/auth/reset/:token', authController.resetPassword);

    return router;
}