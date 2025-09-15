const Usuario = require('../models/usuario'); 

// Agrega un nuevo usuario
exports.nuevoUsuario = async (req, res, next) => {
    const usuario = new Usuario(req.body);
    try {
        await usuario.save();
        res.json({ mensaje: 'Se agregó un nuevo usuario' });
    } catch (error) {
        res.json(error);
        next();
    }
};

// Mostrar todos los usuarios
exports.mostrarUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        console.log(error);
        next();
    }
};

// Mostrar un usuario específico (ESTA FUNCIÓN FALTABA CORRECCIÓN)
exports.mostrarUsuario = async (req, res, next) => {
    try {
        const usuario = await Usuario.findById(req.params.idUsuario);
        if (!usuario) {
            return res.json({ mensaje: 'No existe el usuario' });
        }
        res.json(usuario);
    } catch (error) {
        console.log(error);
        next();
    }
};

// Buscar usuario por documento (CORREGIDO - era Cliente, ahora es Usuario)
exports.buscarPorDocumento = async (req, res, next) => {
    try {
        const usuario = await Usuario.findOne({ 
            $or: [
                { numero_documento: req.params.documento }
            ]
        });
        
        if (!usuario) {
            res.json({ 
                mensaje: 'Usuario no encontrado',
                usuario: null 
            });
            return next();
        }

        res.json({ 
            mensaje: 'Usuario encontrado', 
            usuario: usuario 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al buscar usuario', error: error.message });
        next();
    }
};

exports.actualizarUsuario = async (req, res, next) => {
    try {
        const usuario = await Usuario.findOneAndUpdate(
            { _id: req.params.idUsuario },
            req.body,
            { new: true }
        );
        res.json(usuario);
    } catch (error) {
        res.send(error);
        next();
    }
};

exports.eliminarUsuario = async (req, res, next) => {
    try {
        await Usuario.findOneAndDelete({ _id: req.params.idUsuario });
        res.json({ mensaje: 'El usuario ha sido eliminado' });
    } catch (error) {
        console.log(error);
        next();
    }
};

// DEBUG - Eliminar después de verificar
console.log('Funciones exportadas en usuarioController:', Object.keys(exports));