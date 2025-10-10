const Productos = require('../models/producto');
const shortid = require('shortid');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');

// Configuración de multer
const configuracionMulter = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './uploads');
        },
        filename: (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no válido. Solo se permiten imágenes'), false);
        }
    },
    limits: {
        fileSize: 5000000
    }
};

const upload = multer(configuracionMulter).single('imagen');

// FUNCIONES EXPORTADAS - ESTAS SON LAS QUE NECESITAS

//sube un archivo
exports.subirArchivo = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            return res.json({mensaje: error.message});
        }
        return next();
    });
};




const generarCodigoBarras = (datosProducto) => {
    const idString = datosProducto._id.toString();
    const codigoBarras = idString.substring(idString.length - 12);
    
    datosProducto.codigo_barras_datos = codigoBarras;
    
    return codigoBarras;
};

//agregar nuevos productos
exports.nuevoProducto = async(req, res, next) => {
    // Extraemos nombre y cantidad del body
    const { nombre, cantidad } = req.body;
    const cantidadNumerica = Number(cantidad);

    // Validación básica
    if (!nombre || isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
        return res.status(400).json({ mensaje: 'Debe especificar el nombre del producto y una cantidad válida (> 0).' });
    }

    try{
        // 1. Intentar encontrar y actualizar SOLO LA CANTIDAD usando el nombre como clave
        const productoActualizado = await Productos.findOneAndUpdate(
            // Criterio de búsqueda: busca el producto por su nombre
            { nombre: nombre },
            // Operación: incrementar el campo 'cantidad' por el valor de 'cantidadNumerica'
            { $inc: { cantidad: cantidadNumerica } },
            // Opciones: new: true para devolver el documento actualizado; runValidators: true para validar el esquema
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

            // Generar código de barras PDF
            // Generar código de barras
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

exports.actualizarProducto = async(req, res, next) => {
    try{
        let nuevoProducto = req.body;
        //verificar si hay imagen nueva
        if(req.file){
            nuevoProducto.imagen = req.file.filename;
        }else{
            let productoAnterior = await Productos.findById(req.params.idProducto);
            if(productoAnterior) {
                nuevoProducto.imagen = productoAnterior.imagen;
            }
        }

        let producto = await Productos.findOneAndUpdate(
            {_id: req.params.idProducto}, 
            nuevoProducto, 
            {new: true}
        );
        res.json(producto);
    }catch(error){
        console.log(error);
        next();
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