const express = require("express")

const router=express.Router()

const clienteController= require("../controllers/clienteController.js");
const productoController=require('../controllers/productoController.js');
const facturaController=require('../controllers/facturaController.js');
const authController = require("../controllers/authcontroller.js");
 

module.exports=function(){
    //registro nuevo cliente
    router.post('/clientes',clienteController.nuevoCliente)
    //consultar cliente
    router.get('/clientes',clienteController.mostrarClientes)
    //consultar cliente por ID
    router.get('/clientes/:idCliente',clienteController.mostrarCliente)
    //buscar cliente por documento
    router.get('/clientes/documento/:documento',clienteController.buscarPorDocumento)
    //actualizar cliente
    router.put('/clientes/:idCliente',clienteController.actualizarCliente)
    //eliminar cliente
    router.delete('/clientes/:idCliente',clienteController.eliminarCliente)

    /*productos*/
    //se agrega nuevo producto
    router.post('/productos', productoController.subirArchivo, productoController.nuevoProducto);
    //mostrar los productos
    router.get('/productos',productoController.mostrarProductos);
    //muestra un producto por id
    router.get('/productos/:idProducto',productoController.mostrarProducto);
    //actualizar productos
    router.put('/productos/:idProducto', productoController.subirArchivo,productoController.actualizarProducto);
    //eliminar producto
    router.delete('/productos/:idProducto', productoController.eliminarProducto);

    /*facturas*/
    //crear factura desde formulario
    router.post('/facturas/crear-desde-formulario', facturaController.crearFacturaDesdeFormulario);
    //mostrar todas las facturas
    router.get('/facturas', facturaController.mostrarFacturas);
    //mostrar factura específica
    router.get('/facturas/:idFactura', facturaController.mostrarFactura);
    //buscar por número de factura
    router.get('/facturas/numero/:numeroFactura', facturaController.buscarPorNumeroFactura);
    //actualizar factura
    router.put('/facturas/:idFactura', facturaController.actualizarFactura);
    //eliminar factura
    router.delete('/facturas/:idFactura', facturaController.eliminarFactura);

    // Rutas específicas para archivos
    router.get('/facturas/pdf/:idFactura', facturaController.obtenerFacturaPDF);
    router.post('/facturas/enviar-correo/:idFactura', facturaController.enviarFacturaPorCorreo);

    // Obtener XML de la factura
    router.get('/facturas/xml/:idFactura', async (req, res, next) => {
        try {
            const Factura = require('../models/factura');
            const factura = await Factura.findById(req.params.idFactura);
            
            if (!factura) {
                return res.json({ mensaje: 'No existe esa factura' });
            }

            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.rango_numeracion_actual}.xml"`);
            res.send(factura.xml_factura);

        } catch (error) {
            console.log(error);
            next();
        }
    });

    //auth(login,recuperar contraseña, nueva contraseña)
    router.post("/auth/login", authController.login);
    router.post("/auth/recover", authController.recoverPassword);
    router.post("/auth/reset-password", authController.resetPassword);
    
    return router;
}