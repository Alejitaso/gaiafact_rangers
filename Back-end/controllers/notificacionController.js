const Notificacion = require('../models/notificacion');

// Guardar notificación
exports.guardarNotificacion = async (datos) => {
  try {
    const notificacion = new Notificacion({
      numero_factura: datos.numero_factura,
      documento_emisor: datos.documento_emisor,
      documento_receptor: datos.documento_receptor,
      correo_receptor: datos.correo_receptor,
      tipo: datos.tipo || 'automatico',
      fecha_enviada: datos.fecha_enviada || new Date(),
      factura: datos.factura,
      cliente: datos.cliente
    });

    await notificacion.save();
    console.log('✅ Notificación guardada:', notificacion.numero_factura);

  } catch (error) {
    console.error('❌ Error al guardar notificación:', error.message);
  }
};


// Listar notificaciones con filtros
exports.listarNotificaciones = async (req, res) => {
  try {
    const {
      fecha,
      documento_emisor,
      documento_receptor,
      numero_factura,
    } = req.query;

    const filtros = {};



    if (fecha) {
      const inicio = new Date(fecha);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 1);
      filtros.fecha_envio = { $gte: inicio, $lt: fin };
    }

    if (documento_emisor) filtros.documento_emisor = new RegExp(documento_emisor, 'i');
    if (documento_receptor) filtros.documento_receptor = new RegExp(documento_receptor, 'i');
    if (numero_factura) filtros.numero_factura = new RegExp(numero_factura, 'i');

    if (req.query.q) {
        const regex = new RegExp(req.query.q, 'i');
        filtros.$or = [
            { numero_factura: regex },
            { documento_emisor: regex },
            { documento_receptor: regex },
            { correo_receptor: regex },
        ];
    }

    const notificaciones = await Notificacion.find(filtros).sort({ fecha_envio: -1 });

    res.json(notificaciones);
  } catch (error) {
    console.error('❌ Error al listar notificaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
};