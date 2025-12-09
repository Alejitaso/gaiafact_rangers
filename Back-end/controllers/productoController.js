const Productos = require('../models/producto');
const shortid = require('shortid');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');


//genera el codigode barras del producto
const generarCodigoBarras = (datosProducto) => {
    const idString = datosProducto._id.toString();
    const codigoBarras = idString.substring(idString.length - 12);
    
    datosProducto.codigo_barras_datos = codigoBarras;
    
    return codigoBarras;
};

//agregar nuevos productos
exports.nuevoProducto = async(req, res, next) => {
    const { nombre, cantidad } = req.body;
    const cantidadNumerica = Number(cantidad);

    // Validación básica
    if (!nombre || isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
        return res.status(400).json({ mensaje: 'Debe especificar el nombre del producto y una cantidad válida (> 0).' });
    }

    try{
        // 1. Intentar encontrar y actualizar SOLO LA CANTIDAD usando el nombre como clave
        const productoActualizado = await Productos.findOneAndUpdate(
            { nombre: nombre },
            { $inc: { cantidad: cantidadNumerica } },
            { new: true, runValidators: true }
        );

        if (productoActualizado) {
            // Producto encontrado y actualizado
            res.json({
                mensaje: `Producto "${nombre}" encontrado. Cantidad actualizada a ${productoActualizado.cantidad}.`,
                producto: productoActualizado
            });
        } else {
            // 2. Producto NO existe, creamos uno nuevo
            const nuevoProductoData = req.body;
            
            if(req.file && req.file.filename){
                nuevoProductoData.imagen = req.file.filename;
            }

            const nuevoProducto = new Productos(nuevoProductoData);
            await nuevoProducto.save();

            const codigoBarras = generarCodigoBarras(nuevoProducto);
            await nuevoProducto.save();

            res.json({
                mensaje: `Nuevo producto "${nombre}" registrado correctamente con cantidad ${nuevoProducto.cantidad}.`,
                producto: nuevoProducto
            });

            // Generar código de barras
            try {
                console.log('📝 Generando código de barras...');
                const codigoBarras = await generarCodigoBarras(nuevoProducto);
                console.log('✅ Código de barras generado:', codigoBarras);
                await nuevoProducto.save();
                console.log('💾 Producto guardado con imagen de código');
            } catch (errPDF) {
                console.error('⚠️ Error al generar código de barras:', errPDF.message);
            }
        }

    }catch(error){
        // Si hay un error (ej. validación, o la base de datos no está disponible)
        console.error('Error al procesar el producto:', error);
        res.status(500).json({mensaje: 'Error al procesar el producto', error: error.message});
        next();
    }
};


// Genera un PDF con el código de barras del producto
exports.obtenerCodigoBarrasPDF = async (req, res, next) => {
    try {
        const producto = await Productos.findById(req.params.idProducto);
        
        if (!producto || !producto.codigo_barras_datos) {
            return res.status(404).json({ mensaje: 'No existe código de barras' });
        }

        res.json({ 
            codigo: producto.codigo_barras_datos,
            url: `https://barcodeapi.org/api/128/${producto.codigo_barras_datos}`
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error', error: error.message });
    }
};


//muestra todos los productos
exports.mostrarProductos = async(req, res, next) => {
    try{
        const productos = await Productos.find({});
        res.json(productos);
    }catch(error){
        console.log(error);
        next();
    }
};

//muestra un producto específico por su id
exports.mostrarProducto = async(req, res, next) => {
    try {
        const producto = await Productos.findById(req.params.idProducto);
        if(!producto){
            return res.json({mensaje: 'Ese producto no existe'});
        }
        res.json(producto); 
    } catch(error) {
        console.log(error);
        next();
    }
};


//actualiza un producto via id
exports.actualizarProducto = async (req, res, next) => {

  try {
    let nuevoProducto = req.body;

    // ✅ Asegurar que tipo_prenda sea string
    if (Array.isArray(nuevoProducto.tipo_prenda)) {
      nuevoProducto.tipo_prenda = nuevoProducto.tipo_prenda[0];
    }

    const producto = await Productos.findOneAndUpdate(
      { _id: req.params.idProducto },
      nuevoProducto,
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
};

//elimina un producto via id
exports.eliminarProducto = async(req, res, next) => {
    try{
        await Productos.findByIdAndDelete({_id: req.params.idProducto});
        res.json({mensaje: 'El producto ha sido eliminado'});
    }catch (error) {
        console.log(error);
        next();
    }
};

// DEBUG - Eliminar después de verificar
console.log('Funciones exportadas en productoController:', Object.keys(exports));