const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

/**
 * Middleware de Autenticación: Verifica la validez del token JWT 
 */
exports.verificarAuth = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener usuario desde la BD
        const usuarioBD = await Usuario.findById(decoded.id).select('-password');

        if (!usuarioBD) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // 🔥 FUSIONAR INFO DEL TOKEN + BD
        req.usuario = {
            _id: usuarioBD._id,
            nombre: usuarioBD.nombre,
            correo_electronico: usuarioBD.correo_electronico,

            // 🔥 El tipo_usuario MÁS CONFIABLE es EL DEL TOKEN
            tipo_usuario: decoded.tipo_usuario || usuarioBD.tipo_usuario,
        };

        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

exports.verificarRolGestor = (req, res, next) => {
    // req.usuario es proporcionado por verificarAuth
    const usuarioRol = req.usuario.tipo_usuario?.toUpperCase();
    
    console.log('🔐 Verificando rol de gestor. Rol del usuario:', usuarioRol);
    
    if (!req.usuario || !['SUPERADMIN', 'ADMINISTRADOR'].includes(usuarioRol)) {
        console.log('❌ Acceso denegado. Rol insuficiente');
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere un rol de gestor (Superadmin o Administrador).' });
    }
    
    console.log('✅ Rol de gestor verificado');
    next();
};

exports.verificarAccesoPerfil = (req, res, next) => {
    // ID del usuario autenticado (del token, gracias a verificarAuth)
    const userIdFromToken = req.usuario._id.toString(); 
    const userIdFromParams = req.params.idUsuario;
            
    console.log('🔍 Verificando acceso a perfil:', { 
        tokenId: userIdFromToken, 
        paramsId: userIdFromParams 
    });

    // Caso 1: Es el perfil propio
    if (userIdFromToken === userIdFromParams) {
        console.log('✅ Acceso permitido: perfil propio');
        return next();
    }

    // Caso 2: El usuario autenticado tiene un rol de gestor
    const usuarioRol = req.usuario.tipo_usuario?.toUpperCase();
    const isGestor = ['SUPERADMIN', 'ADMINISTRADOR'].includes(usuarioRol);

    if (isGestor) {
        console.log('✅ Acceso permitido: rol de gestor');
        return next();
    }

    // Caso 3: Acceso denegado
    console.log('❌ Acceso denegado: no es perfil propio ni gestor');
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver su propio perfil o debe ser un Gestor.' });
};