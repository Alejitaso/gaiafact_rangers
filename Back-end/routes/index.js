const express = require("express")

const router=express.Router()

const clienteController= require("../controllers/clienteController.js");
const productoController=require('../controllers/productoController.js');

module.exports=function(){
    //registro nuevo cliente
    router.post('/clientes',clienteController.nuevoCliente)
    //consultar cliente
    router.get('/clientes',clienteController.mostrarClientes)
    //consultar cliente
    router.get('/clientes/:idCliente',clienteController.mostrarClientes)
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
    //eliminar factura
    router.delete('/factura/:idFactura', facturaController.eliminarFactura);
    
    return router;

}