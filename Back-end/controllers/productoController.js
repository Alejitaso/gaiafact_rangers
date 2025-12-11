const SolicitudCambio = require('../models/SolicitudCambio');
const AuditoriaProducto = require('../models/AuditoriaProducto');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


exports.actualizarProducto = async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const usuarioId = req.usuario._id;

    const productoActual = await Productos.findById(req.params.idProducto);

    if (!productoActual) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const cambioPrecio = nuevoProducto.precio != productoActual.precio;
    const cambioCantidad = nuevoProducto.cantidad != productoActual.cantidad;

    // Si no cambió nada sensible, actualizamos normal (NO requiere aprobación)
    if (!cambioPrecio && !cambioCantidad) {
      const actualizado = await Productos.findByIdAndUpdate(
        req.params.idProducto,
        nuevoProducto,
        { new: true }
      );

      return res.json(actualizado);
    }

    // Crear solicitud pendiente
    const solicitud = new SolicitudCambio({
      productoId: productoActual._id,
      solicitante: usuarioId,
      cambios: {
        precioAnterior: productoActual.precio,
        precioNuevo: nuevoProducto.precio,
        cantidadAnterior: productoActual.cantidad,
        cantidadNuevo: nuevoProducto.cantidad
      }
    });

    await solicitud.save();

    // Registrar auditoría
    await AuditoriaProducto.create({
      productoId: productoActual._id,
      usuario: usuarioId,
      accion: 'SOLICITUD_CAMBIO',
      datos: solicitud.cambios
    });

    // === 📩 NOTIFICACIÓN POR CORREO ===

    // Obtener todos los admins y superadmins verificados
    const admins = await Usuario.find({
    tipo_usuario: { $in: ["ADMIN", "SUPERADMIN"] },
    verificado: true
    }).select("correo_electronico nombre");

    // Generar lista de destinatarios
    const destinatarios = [
    ...admins.map(a => a.correo_electronico),
    req.usuario.correo_electronico // quien hizo la solicitud
    ];

    // Preparar contenido del correo
    const mensajeCorreo = {
    to: destinatarios,
    from: process.env.EMAIL_USER, // configurado en Railway
    subject: "Solicitud de cambio pendiente - GaiaFact",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 15px;">
        <h2 style="color:#2C89E8;">Solicitud de modificación detectada</h2>
        <p>El usuario <strong>${req.usuario.nombre}</strong> ha solicitado modificar un producto.</p>
        
        <h3>Producto:</h3>
        <p><strong>${productoActual.nombre}</strong></p>

        <h3>Cambios solicitados:</h3>
        <ul>
            <li><strong>Precio:</strong> ${productoActual.precio} → ${nuevoProducto.precio}</li>
            <li><strong>Cantidad:</strong> ${productoActual.cantidad} → ${nuevoProducto.cantidad}</li>
        </ul>

        <p style="color:gray; font-size:12px;">
            Fecha: ${new Date().toLocaleString()}
        </p>
        </div>
    `
    };

    // Enviar correo con SendGrid
    sgMail.sendMultiple(mensajeCorreo)
    .then(() => console.log("📧 Notificación enviada a administradores"))
    .catch((err) => console.error("❌ Error enviando correo:", err.message));


        return res.status(202).json({
        mensaje: 'Se necesita aprobación de otro administrador.',
        solicitudId: solicitud._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en servidor' });
    }
    };

exports.aprobarSolicitud = async (req, res) => {
  try {
    const { idSolicitud } = req.params;
    const usuarioId = req.usuario._id;

    const solicitud = await SolicitudCambio.findById(idSolicitud);

    if (!solicitud) return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'PENDIENTE')
      return res.status(400).json({ mensaje: 'La solicitud ya fue procesada' });

    solicitud.estado = 'APROBADO';
    solicitud.aprobador = usuarioId;
    solicitud.fechaAprobacion = Date.now();
    await solicitud.save();

    // === 📩 CORREO DE APROBACIÓN ===
    // Obtener admins y superadmins
    const admins = await Usuario.find({
    tipo_usuario: { $in: ["ADMIN", "SUPERADMIN"] },
    verificado: true
    }).select("correo_electronico nombre");

    // Buscar solicitante
    const solicitante = await Usuario.findById(solicitud.solicitante)
    .select("correo_electronico nombre");

    // Construir destinatarios
    const destinatarios = [
    ...admins.map(a => a.correo_electronico),
    solicitante.correo_electronico,
    req.usuario.correo_electronico // quien aprobó
    ];

    const mensajeCorreo = {
    to: destinatarios,
    from: process.env.EMAIL_USER,
    subject: "Solicitud de cambio aprobada - GaiaFact",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 15px;">
        <h2 style="color:#28A745;">Cambios aprobados</h2>

        <p>El usuario <strong>${req.usuario.nombre}</strong> ha aprobado los cambios del producto:</p>
        <p><strong>${productoActual.nombre}</strong></p>

        <h3>Cambios aplicados:</h3>
        <ul>
            <li><strong>Precio:</strong> ${solicitud.cambios.precioAnterior} → ${solicitud.cambios.precioNuevo}</li>
            <li><strong>Cantidad:</strong> ${solicitud.cambios.cantidadAnterior} → ${solicitud.cambios.cantidadNuevo}</li>
        </ul>

        <p style="color:gray; font-size:12px;">
            Fecha: ${new Date().toLocaleString()}
        </p>
        </div>
    `
    };

    sgMail.sendMultiple(mensajeCorreo)
    .then(() => console.log("📧 Correo enviado (aprobación)"))
    .catch((err) => console.error("❌ Error enviando correo:", err.message));


    // Aplicar el cambio al producto real
    await Productos.findByIdAndUpdate(
      solicitud.productoId,
      {
        precio: solicitud.cambios.precioNuevo,
        cantidad: solicitud.cambios.cantidadNuevo
      }
    );

    // AUDITORÍA
    await AuditoriaProducto.create({
      productoId: solicitud.productoId,
      usuario: usuarioId,
      accion: 'APROBACION',
      datos: solicitud.cambios
    });

    return res.json({ mensaje: 'Solicitud aprobada correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en servidor' });
  }
};
