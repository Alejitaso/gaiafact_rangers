const SolicitudCambio = require('../models/SolicitudCambio');
const AuditoriaProducto = require('../models/AuditoriaProducto');
const sgMail = require('@sendgrid/mail');
const Productos = require('../models/producto');
const shortid = require('shortid');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//genera el codigode barras del producto
const generarCodigoBarras = (datosProducto) => {
    const idString = datosProducto._id.toString();
    const codigoBarras = idString.substring(idString.length - 12);
    
    datosProducto.codigo_barras_datos = codigoBarras;
    
    return codigoBarras;
};

//agregar nuevos productos
exports.nuevoProducto = async(req, res, next) => {
    const { nombre, cantidad } = req.body;
    const cantidadNumerica = Number(cantidad);

    // Validación básica
    if (!nombre || isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
        return res.status(400).json({ mensaje: 'Debe especificar el nombre del producto y una cantidad válida (> 0).' });
    }

    try{
        // 1. Intentar encontrar y actualizar SOLO LA CANTIDAD usando el nombre como clave
        const productoActualizado = await Productos.findOneAndUpdate(
            { nombre: nombre },
            { $inc: { cantidad: cantidadNumerica } },
            { new: true, runValidators: true }
        );

        if (productoActualizado) {
            // Producto encontrado y actualizado
            res.json({
                mensaje: `Producto "${nombre}" encontrado. Cantidad actualizada a ${productoActualizado.cantidad}.`,
                producto: productoActualizado
            });
        } else {
            // 2. Producto NO existe, creamos uno nuevo
            const nuevoProductoData = req.body;
            
            if(req.file && req.file.filename){
                nuevoProductoData.imagen = req.file.filename;
            }

            const nuevoProducto = new Productos(nuevoProductoData);
            await nuevoProducto.save();

            const codigoBarras = generarCodigoBarras(nuevoProducto);
            await nuevoProducto.save();

            res.json({
                mensaje: `Nuevo producto "${nombre}" registrado correctamente con cantidad ${nuevoProducto.cantidad}.`,
                producto: nuevoProducto
            });

            // Generar código de barras
            try {
                console.log('📝 Generando código de barras...');
                const codigoBarras = await generarCodigoBarras(nuevoProducto);
                console.log('✅ Código de barras generado:', codigoBarras);
                await nuevoProducto.save();
                console.log('💾 Producto guardado con imagen de código');
            } catch (errPDF) {
                console.error('⚠️ Error al generar código de barras:', errPDF.message);
            }
        }

    }catch(error){
        // Si hay un error (ej. validación, o la base de datos no está disponible)
        console.error('Error al procesar el producto:', error);
        res.status(500).json({mensaje: 'Error al procesar el producto', error: error.message});
        next();
    }
};


// Genera un PDF con el código de barras del producto
exports.obtenerCodigoBarrasPDF = async (req, res, next) => {
    try {
        const producto = await Productos.findById(req.params.idProducto);
        
        if (!producto || !producto.codigo_barras_datos) {
            return res.status(404).json({ mensaje: 'No existe código de barras' });
        }

        res.json({ 
            codigo: producto.codigo_barras_datos,
            url: `https://barcodeapi.org/api/128/${producto.codigo_barras_datos}`
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error', error: error.message });
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
    const admins = await usuarioId.find({
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

