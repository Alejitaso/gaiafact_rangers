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


exports.mostrarUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.find({});
        res.json(usuarios);
    } catch (error) {
        console.log(error);
        next();
    }
};


exports.mostrarUsuario = async (req, res, next) => {
    const usuario = await Usuario.findById(req.params.idUsuario);
    if (!usuario) {
        res.json({ mensaje: 'No existe el usuario' });
        next();
    }
    res.json(usuario);
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