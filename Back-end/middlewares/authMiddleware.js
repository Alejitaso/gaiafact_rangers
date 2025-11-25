const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const Log = require('../models/log');


exports.audit = (accion) => (req, res, next) => {
  const originalSend = res.json.bind(res);

  res.json = function (data) {
    // ✅ solo registra si la respuesta fue exitosa (2xx)
    if (res.statusCode < 400) {
      Log.create({
        usuarioId: req.user?.id || null,
        accion,
        ruta: req.originalUrl,
        metodo: req.method,
        resultado: 'éxito',
        fecha: new Date()
      }).catch(console.error);
    }
    originalSend(data);
  };

  next();
};

/**
 * Middleware de Autenticación: Verifica la validez del token JWT en el encabezado
 * y adjunta el objeto del usuario a `req.usuario` para su uso posterior.
 */
exports.verificarAuth = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 1. Obtiene el usuario de la base de datos
        req.usuario = await Usuario.findById(decoded.id).select('-password');
        
        if (!req.usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        
        // 2. Adjunta el ID del token (ObjectID) a req.usuario.id para facilitar la comparación
        req.usuario.id = decoded.userId; 

        next();
    } catch (error) {
        // console.error("Error al verificar token:", error);
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

/**
 * Middleware de Autorización: Requiere que el usuario autenticado tenga el rol de 'SUPERADMIN' o 'ADMINISTRADOR'.
 * Se ejecuta después de verificarAuth.
 */
exports.verificarRolGestor = (req, res, next) => {
    // req.usuario es proporcionado por verificarAuth
    const usuarioRol = req.usuario.tipo_usuario?.toUpperCase();
    
    if (!req.usuario || !['SUPERADMIN', 'ADMINISTRADOR'].includes(usuarioRol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere un rol de gestor (Superadmin o Administrador).' });
    }
    
    // El usuario tiene el rol requerido
    next();
};

/**
 * Middleware de Autorización de Perfil: Permite ver un perfil si:
 * 1. Es el perfil del propio usuario (ID del token coincide con el ID de los parámetros).
 * 2. El usuario autenticado es un gestor (SUPERADMIN o ADMINISTRADOR).
 * Se ejecuta después de verificarAuth.
 */
exports.verificarAccesoPerfil = (req, res, next) => {
    // ID del usuario autenticado (del token, gracias a verificarAuth)
    const userIdFromToken = req.usuario.id.toString(); 
    // ID del perfil que se intenta ver (de la URL)
    const userIdFromParams = req.params.idUsuario;

    // Caso 1: Es el perfil propio
    if (userIdFromToken === userIdFromParams) {
        return next();
    }

    // Caso 2: El usuario autenticado tiene un rol de gestor
    const usuarioRol = req.usuario.tipo_usuario?.toUpperCase();
    const isGestor = ['SUPERADMIN', 'ADMINISTRADOR'].includes(usuarioRol);

    if (isGestor) {
        return next();
    }

    // Caso 3: Acceso denegado
    return res.status(403).json({ mensaje: 'Acceso denegado. Solo puede ver su propio perfil o debe ser un Gestor.' });
};
