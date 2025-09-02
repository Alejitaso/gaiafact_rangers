const Productos = require('../models/producto');
const shortid = require('shortid');
const multer = require('multer');
const path = require('path');

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

//agregar nuevos productos
exports.nuevoProducto = async(req, res, next) => {
    const producto = new Productos(req.body);
    try{
        //verificar si subieron archivo
        if(req.file && req.file.filename){
            producto.imagen = req.file.filename;
        }
        await producto.save();
        res.json({mensaje:'Se ha guardado el producto'});
    }catch(error){
        console.log(error);
        res.status(500).json({mensaje: 'Error al guardar producto', error: error.message});
        next();
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