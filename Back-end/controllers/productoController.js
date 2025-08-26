const Productos=require('../models/productos');
const shortid=require('shortid');

//pasar la configuracion y el campo
const upload = multer(configuracionMulter).single('imagen');

//sube un archivo
exports.subirArchivo=(req,res,next)=>{
    upload(req,res,function(error){
        if(error) {
            res.json({mensaje: error})
        }
        return next();
    })
}
//agregar nuevos productos
exports.nuevoProducto=async(req,res,next)=>{
    const producto = new Productos(req.body);
    try{
        //verificar si subieron archivo
        if(req.file.filename){
            producto.imagen=req.file.filename
        }
        await producto.save();
        res.json({mensaje:'se ha guardado el producto'});

    }catch(error){
        console.log(error);
        next();
    }

}
//muestra todos los productos
exports.mostrarProductos=async(req,res,next)=>{
    try{
        //obtener todos los productos
        const productos = await Productos.find({});
        res.json(productos);
    }catch(error){
        console.log(error);
        next();
    }
}
//muestra un producto en especifico por su id
exports.mostrarProducto=async(req,res,next)=>{
    const producto=await Productos.findById(req.params.idProducto);

    if(!producto){
        res.json({mensaje: 'Ese producto no existe'});
        return next();
    }

    //mostrar el producto
    res.json(producto);
}

exports.actualizarProducto=async(req,res,next)=>{
    try{
        //construir un nuevo producto
        let nuevoProducto=req.body;
        //verificar si hay imagen nueva
        if(req.file){
            nuevoProducto.imagen=req.file.filename;
        }else{
            let productoAnterior=await Productos.findById(req.params.idProducto);
            nuevoProducto.imagen=productoAnterior.imagen;
        }

        let producto=await Productos.findOneAndUpdate({_id:req.params.idProducto},nuevoProducto, {
            new:true,
        });
        res.json(producto);
    }catch(error){
        console.log(error);
        next();
    }
}

//elimina un producto via id
exports.eliminarProducto=async(req,res,next)=>{
    try{
        await Productos.findByIdAndDelete({_id:req.params.idProducto});
        res.json({mensaje: 'El producto ha sido eliminado'});
    }catch (error) {
        console.log(error);
        next();
    }
}