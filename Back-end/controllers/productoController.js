const Productos = require('../models/producto');
const shortid = require('shortid');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');
const SolicitudCambio = require('../models/SolicitudCambio');
const AuditoriaProducto = require('../models/AuditoriaProducto');
const sgMail = require('@sendgrid/mail');
const Usuario = require('../models/Usuario'); // Necesario para la lógica de notificación

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Función auxiliar: genera el código de barras (últimos 12 dígitos del _id)
const generarCodigoBarras = (datosProducto) => {
    const idString = datosProducto._id.toString();
    const codigoBarras = idString.substring(idString.length - 12);
    
    datosProducto.codigo_barras_datos = codigoBarras;
    
    return codigoBarras;
};

// ---------------------------------------------
// 1. CREACIÓN DE PRODUCTOS (INCREMENTO O REGISTRO NUEVO)
// ---------------------------------------------

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

            // Generar código de barras y guardarlo
            generarCodigoBarras(nuevoProducto);
            await nuevoProducto.save();

            res.json({
                mensaje: `Nuevo producto "${nombre}" registrado correctamente con cantidad ${nuevoProducto.cantidad}.`,
                producto: nuevoProducto
            });

            // Bloque de logging para la generación del código de barras
            try {
                console.log('📝 Generando código de barras...');
                const codigoBarras = nuevoProducto.codigo_barras_datos; 
                console.log('✅ Código de barras generado:', codigoBarras);
                console.log('💾 Producto guardado con código de barras');
            } catch (errPDF) {
                console.error('⚠️ Error al generar código de barras:', errPDF.message);
            }
        }

    }catch(error){
        console.error('Error al procesar el producto:', error);
        res.status(500).json({ mensaje: 'Error en el servidor. Intente más tarde.' });
        next();
    }
};

// ---------------------------------------------
// 2. OBTENER INFORMACIÓN DE PRODUCTOS
// ---------------------------------------------

// Obtener código de barras y URL
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
        res.status(500).json({ mensaje: 'Error en el servidor.', error: error.message });
    }
};

// Muestra todos los productos
exports.mostrarProductos = async(req, res, next) => {
    try{
        const productos = await Productos.find({});
        res.json(productos);
    }catch(error){
        console.log(error);
        next();
    }
};

// Muestra un producto específico por su id
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

// ---------------------------------------------
// 3. ACTUALIZACIÓN DE PRODUCTOS CON APROBACIÓN
// (Usa la lógica compleja del segundo archivo)
// ---------------------------------------------

exports.actualizarProducto = async (req, res) => {
    try {
        const nuevoProducto = req.body;
        // Asume que el usuario que realiza la solicitud está disponible en req.usuario._id
        const usuarioId = req.usuario._id; 

        const productoActual = await Productos.findById(req.params.idProducto);

        if (!productoActual) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // Detectar cambios sensibles
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
        const admins = await Usuario.find({
            tipo_usuario: { $in: ["ADMIN", "SUPERADMIN"] },
            verificado: true
        }).select("correo_electronico nombre");

        const destinatarios = [
            ...admins.map(a => a.correo_electronico),
            req.usuario.correo_electronico 
        ];

        const mensajeCorreo = {
            to: destinatarios,
            from: process.env.EMAIL_USER, 
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

// ---------------------------------------------
// 4. ACTUALIZACIÓN SIMPLE (Versión del primer archivo, mantenida)
// ---------------------------------------------

exports.actualizarProductoSimple = async (req, res, next) => {
    try {
        let nuevoProducto = req.body;
    
        // Asegurar que tipo_prenda sea string
        if (Array.isArray(nuevoProducto.tipo_prenda)) {
            nuevoProducto.tipo_prenda = nuevoProducto.tipo_prenda[0];
        }
    
        const producto = await Productos.findOneAndUpdate(
            { _id: req.params.idProducto },
            nuevoProducto,
            { new: true }
        );
    
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
    
        res.json(producto);
    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

// ---------------------------------------------
// 5. APROBACIÓN DE SOLICITUDES
// ---------------------------------------------

exports.aprobarSolicitud = async (req, res) => {
    try {
        const { idSolicitud } = req.params;
        // Aprobador
        const usuarioId = req.usuario._id; 

        const solicitud = await SolicitudCambio.findById(idSolicitud);

        if (!solicitud) return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
        if (solicitud.estado !== 'PENDIENTE')
            return res.status(400).json({ mensaje: 'La solicitud ya fue procesada' });

        // Obtener el producto (necesario para el nombre en el correo)
        const productoActual = await Productos.findById(solicitud.productoId);
        if (!productoActual) return res.status(404).json({ mensaje: 'Producto asociado a la solicitud no encontrado' });


        // Marcar solicitud como aprobada
        solicitud.estado = 'APROBADO';
        solicitud.aprobador = usuarioId;
        solicitud.fechaAprobacion = Date.now();
        await solicitud.save();


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
        
        // === 📩 CORREO DE APROBACIÓN ===
        const admins = await Usuario.find({
            tipo_usuario: { $in: ["ADMIN", "SUPERADMIN"] },
            verificado: true
        }).select("correo_electronico nombre");

        const solicitante = await Usuario.findById(solicitud.solicitante)
            .select("correo_electronico nombre");

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


        return res.json({ mensaje: 'Solicitud aprobada correctamente.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en servidor' });
    }
};

// ---------------------------------------------
// 6. ELIMINACIÓN DE PRODUCTOS
// ---------------------------------------------

exports.eliminarProducto = async(req, res, next) => {
    try{
        await Productos.findByIdAndDelete({_id: req.params.idProducto});
        res.json({mensaje: 'El producto ha sido eliminado'});
    }catch (error) {
        console.log(error);
        next();
    }
};

// DEBUG - Eliminar después de verificar
console.log('Funciones exportadas en productoController:', Object.keys(exports));