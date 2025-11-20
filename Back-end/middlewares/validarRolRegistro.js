export const validarRolRegistro = (req, res, next) => {
    const rolCreador = req.usuario.tipo_usuario; 
    const rolNuevo = req.body.tipo_usuario;

    // SUPERADMIN → puede crear a todos
    if (rolCreador === "SUPERADMIN") {
        return next();
    }

    // ADMINISTRADOR → puede crear USUARIO y CLIENTE
    if (rolCreador === "ADMINISTRADOR") {
        if (["USUARIO", "CLIENTE"].includes(rolNuevo)) {
            return next();
        } else {
            return res.status(403).json({
                mensaje: "No tienes permisos para crear este tipo de usuario"
            });
        }
    }

    // USUARIO → solo puede crear CLIENTE
    if (rolCreador === "USUARIO") {
        if (rolNuevo === "CLIENTE") {
            return next();
        }
        return res.status(403).json({
            mensaje: "Los usuarios solo pueden registrar clientes"
        });
    }

    return res.status(403).json({
        mensaje: "Rol no autorizado para registrar usuarios"
    });
};
