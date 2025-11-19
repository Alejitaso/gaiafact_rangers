const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

/**
 * Middleware de Autenticación: Verifica la validez del token JWT 
 */
exports.verificarAuth = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    console.log('🔍 Verificando autenticación...');
    console.log('📋 Headers:', req.headers['authorization'] ? 'Authorization header presente' : 'No hay header Authorization');

    if (!token) {
        console.log('❌ Token no proporcionado');
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    try {
        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decodificado:', { id: decoded.id });
        
        // 1. Obtiene el usuario de la base de datos
        const usuario = await Usuario.findById(decoded.id).select('-password');
        
        if (!usuario) {
            console.log('❌ Usuario no encontrado en BD');
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        console.log('✅ Usuario encontrado:', { 
            id: usuario._id, 
            tipo_usuario: usuario.tipo_usuario,
            numero_documento: usuario.numero_documento 
        });
        
        // 2. Adjuntar el usuario completo a req.usuario
        req.usuario = usuario;
        
        // 3. Asegurar que req.usuario.id existe (para compatibilidad)
        req.usuario.id = decoded.id;

        next();
    } catch (error) {
        console.error("❌ Error al verificar token:", error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ mensaje: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Token expirado' });
        }
        
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

/**
 * Middleware de Autorización de Perfil: Permite ver un perfil si:
 * 1. Es el perfil del propio usuario 
 * 2. El usuario autenticado es un gestor 
 */
exports.verificarAccesoPerfil = (req, res, next) => {
    // ID del usuario autenticado (del token, gracias a verificarAuth)
    const userIdFromToken = req.usuario._id.toString(); 
    // ID del perfil que se intenta ver (de la URL)
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