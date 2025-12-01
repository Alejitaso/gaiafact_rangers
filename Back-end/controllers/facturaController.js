// Back-end/controllers/facturaController.js
const Producto    = require('../models/producto.js');
const Factura     = require('../models/factura.js');
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const sgMail      = require('@sendgrid/mail');   // API HTTP oficial

console.log('📦 Variables de entorno disponibles:', Object.keys(process.env));

// -----------------------------------------------------------
// 1)  CONFIG DE SENDGRID – FUENTE ÚNICA: SENDGRID_API_KEY
// -----------------------------------------------------------
const apiKey = process.env.EMAIL_PASS;   // usamos la que YA existe
if (!apiKey) {
  console.error('❌ FATAL: EMAIL_PASS no está definida. El servidor NO puede enviar correos.');
  process.exit(1);
  }
sgMail.setApiKey(apiKey);
console.log('✅ SendGrid configurado con API key (longitud):', apiKey.length);

// -----------------------------------------------------------
// 2)  FUNCIONES AUXILIARES (PDF, XML, PERMISOS)
// -----------------------------------------------------------
const generarPDFFactura = async (datosFactura) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                bufferPages: true
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Colores de tu marca
            const colorPrimario = '#2C5F6F';
            const colorSecundario = '#A8B8D8';
            const colorTexto = '#2C3E50';
            const colorGris = '#7F8C8D';

            // ========== ENCABEZADO ==========
            doc.fontSize(24).fillColor(colorPrimario).text('Athena\'S', 50, 50);
            doc.fontSize(10).fillColor(colorGris)
               .text(' GaiaFact - Sistema de Facturación', 50, 78)
               .text('NIT: 876.543.219 - 5', 50, 92)
               .text('Régimen Común', 50, 106)
               .text('Calle 11 #22-04', 50, 120)
               .text('Tel: 3023650911', 50, 134);

            // Información de la factura (lado derecho)
            doc.fontSize(18).fillColor(colorPrimario).text('FACTURA DE VENTA', 350, 50, { align: 'right' });
            doc.fontSize(10).fillColor(colorTexto)
               .text(`No. ${datosFactura.numero_factura}`, 350, 75, { align: 'right' })
               .fillColor(colorGris)
               .text(`Fecha: ${new Date(datosFactura.fecha_emision).toLocaleDateString('es-CO', { 
                   year: 'numeric', month: 'long', day: 'numeric' 
               })}`, 350, 90, { align: 'right' });

            // CUFE en texto más pequeño
            doc.fontSize(7).text(`CUFE: ${datosFactura.codigo_CUFE || 'TEMPORAL-' + datosFactura.numero_factura}`, 
                     300, 110, { align: 'right', width: 245 });

            // Línea divisoria
            doc.moveTo(50, 160).lineTo(545, 160).strokeColor(colorPrimario).lineWidth(2).stroke();

            // ========== INFORMACIÓN DEL CLIENTE ==========
            doc.fontSize(12).fillColor(colorPrimario).text('INFORMACIÓN DEL CLIENTE', 50, 180);
            
            doc.fontSize(9).fillColor(colorTexto)
               .text(`Cliente: ${datosFactura.usuario.nombre} ${datosFactura.usuario.apellido}`, 50, 200)
               .text(`${datosFactura.usuario.tipo_documento}: ${datosFactura.usuario.numero_documento}`, 50, 215);
            
            if (datosFactura.usuario.telefono) {
                doc.text(`Teléfono: ${datosFactura.usuario.telefono}`, 50, 230);
            }

            // ========== MÉTODO DE PAGO ==========
            doc.fontSize(10).fillColor(colorTexto).text(`Método de pago: ${datosFactura.metodo_pago}`, 50, 245);

            // ========== TABLA DE PRODUCTOS ==========
            const tableTop = 270;
            
            // Encabezado de tabla con fondo
            doc.rect(50, tableTop - 5, 495, 25).fillColor(colorSecundario).fill();
            
            doc.fontSize(9).fillColor(colorTexto)
               .text('DESCRIPCIÓN', 60, tableTop + 5, { width: 220 })
               .text('CANT.', 290, tableTop + 5, { width: 40, align: 'center' })
               .text('PRECIO UNIT.', 340, tableTop + 5, { width: 80, align: 'right' })
               .text('SUBTOTAL', 430, tableTop + 5, { width: 100, align: 'right' });

            // Productos
            let yPosition = tableTop + 35;
            let subtotalGeneral = 0;

            datosFactura.productos_factura.forEach((item, index) => {
                const subtotal = item.precio * item.cantidad;
                subtotalGeneral += subtotal;

                // Fondo alternado para filas
                if (index % 2 === 0) {
                    doc.rect(50, yPosition - 5, 495, 20).fillColor('#F8F9FA').fill();
                }

                doc.fontSize(9).fillColor(colorTexto)
                   .text(item.producto, 60, yPosition, { width: 220 })
                   .text(item.cantidad.toString(), 290, yPosition, { width: 40, align: 'center' })
                   .text(`$${item.precio.toLocaleString('es-CO')}`, 340, yPosition, { width: 80, align: 'right' })
                   .text(`$${subtotal.toLocaleString('es-CO')}`, 430, yPosition, { width: 100, align: 'right' });

                yPosition += 25;
            });

            // Línea antes de totales
            yPosition += 10;
            doc.moveTo(50, yPosition).lineTo(545, yPosition).strokeColor(colorGris).lineWidth(1).stroke();
            yPosition += 15;

            // ========== TOTALES ==========
            const subtotal = datosFactura.productos_factura.reduce((sum, item) => {
                return sum + (item.precio * item.cantidad);
            }, 0);

            const iva = subtotal * 0.19; // 19% IVA
            const totalFinal = subtotal + iva;

            // Guardar valores en la factura
            datosFactura.subtotal = subtotal;
            datosFactura.iva = iva;
            datosFactura.total = totalFinal;

            doc.fontSize(10).fillColor(colorTexto)
               .text('Subtotal:', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${subtotalGeneral.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            yPosition += 20;
            doc.text('IVA (19%):', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${iva.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            yPosition += 25;
            doc.fontSize(12).fillColor(colorPrimario).font('Helvetica-Bold')
               .text('TOTAL:', 380, yPosition, { align: 'right', width: 80 })
               .fontSize(14)
               .text(`$${totalFinal.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            // ========== CÓDIGOS QR ==========
            yPosition += 50;

            // Generar QR Code
            // ========== GENERAR QR CON LÓGICA DE codigo_QR.js ==========
            const fecha = new Date(datosFactura.fecha_emision);
            const fechaFormato = fecha.toLocaleDateString('es-CO');
            const horaFormato = fecha.toLocaleTimeString('es-CO');

            const qrData = `Número de Factura: ${datosFactura.numero_factura}
                Fecha: ${fechaFormato}
                Hora: ${horaFormato}
                NIT: 900123456-1
                Cliente: ${datosFactura.usuario.nombre} ${datosFactura.usuario.apellido}
                Documento: ${datosFactura.usuario.tipo_documento || 'CC'} ${datosFactura.usuario.numero_documento}
                Método de pago: ${datosFactura.metodo_pago}
                CUFE: ${datosFactura.codigo_CUFE || 'TEMP-' + datosFactura.numero_factura}`;

            const qrCodeImage = await QRCode.toBuffer(qrData, {
            width: 120,
            margin: 1,
            color: { dark: "#276177", light: "#FFFFFF" },
            errorCorrectionLevel: "M"
            });

            doc.image(qrCodeImage, 60, yPosition, { width: 120, height: 120 });
            doc.fontSize(8).fillColor(colorGris).text('Escanea para verificar', 60, yPosition + 125, { width: 120, align: 'center' });

            // Número de factura
            doc.fontSize(16).fillColor(colorTexto).font('Helvetica-Bold')
               .text(datosFactura.numero_factura, 250, yPosition + 40, { align: 'center', width: 250 });
            
            doc.fontSize(8).fillColor(colorGris).font('Helvetica')
               .text('Número de Factura', 250, yPosition + 60, { align: 'center', width: 250 });

            // ========== FOOTER ==========
            yPosition += 150;
            doc.fontSize(8).fillColor(colorGris)
               .text('Esta factura electrónica ha sido generada por el sistema GaiaFact - Athena\'S', 50, yPosition, { 
                   align: 'center', 
                   width: 495 
               })
               .text(`Rango de numeración: ${datosFactura.rango_numeracion_actual || 'TEMP-2025'}`, 50, yPosition + 15, { 
                   align: 'center', 
                   width: 495 
               })
               .text('Gracias por su compra', 50, yPosition + 30, { 
                   align: 'center', 
                   width: 495 
               });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generarXMLFactura = (datosFactura) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
            <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
            <cbc:CustomizationID>DIAN 2.1</cbc:CustomizationID>
            <cbc:ProfileID>1</cbc:ProfileID>
            <cbc:ID>${datosFactura.numero_factura}</cbc:ID>
            <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
            <cac:PaymentMeans>
                <cbc:PaymentMeansCode>${datosFactura.metodo_pago}</cbc:PaymentMeansCode>
            </cac:PaymentMeans>
        </Invoice>`;
};

const puedeVerTodasLasFacturas = (tipoUsuario) => {
  if (!tipoUsuario) return false;
  const tipo = tipoUsuario.toUpperCase();
  return ['SUPERADMIN', 'ADMINISTRADOR', 'USUARIO'].includes(tipo);
};

// -----------------------------------------------------------
// 3)  CONTROLADORES
// -----------------------------------------------------------

exports.generarFactura = async (req, res) => {
    try {
        const datosFactura = req.body;

        // ---------------- VALIDACIONES ----------------

        // Validar usuario
        if (!datosFactura.usuario || 
            !datosFactura.usuario.nombre || 
            !datosFactura.usuario.apellido) {

            return res.status(400).json({ 
                mensaje: 'Faltan datos del usuario (nombre y apellido son obligatorios)' 
            });
        }

        // ❗ CORREO OBLIGATORIO
        if (!datosFactura.usuario.correo_electronico || datosFactura.usuario.correo_electronico.trim() === "") {
            return res.status(400).json({
                mensaje: 'El correo electrónico es obligatorio para generar la factura'
            });
        }

        // ---------------- VALIDAR Y LIMPIAR PRODUCTOS ----------------

        // Filtrar productos inválidos: null, undefined o sin producto_id
        const productosLimpios = (datosFactura.productos_factura || []).filter(
            p => p && p.producto_id && p.cantidad > 0
        );

        if (productosLimpios.length === 0) {
            return res.status(400).json({
                mensaje: "Debe incluir al menos un producto válido para generar la factura"
            });
        }

        // Reemplazar la lista original por la lista limpia
        datosFactura.productos_factura = productosLimpios;

        // ---------------- PROCESAR PRODUCTOS (DESCONTAR STOCK) ----------------
        for (const item of datosFactura.productos_factura) {

            // Validación de producto_id
            if (!item.producto_id) {
                console.log("❌ producto_id ausente en item:", item);
                return res.status(400).json({ mensaje: "Cada producto debe tener producto_id" });
            }

            // 🔍 CÓDIGO DIAGNÓSTICO ----> PEGAR AQUÍ
            console.log("🔍 ID recibido del frontend:", item.producto_id);

            const producto = await Producto.findById(item.producto_id);

            if (!producto) {
                console.log("❌ Producto no encontrado en la BD con ID:", item.producto_id);

                return res.status(400).json({
                    mensaje: `El producto "${item.producto}" con ID ${item.producto_id} NO existe en la base de datos conectada.`
                });
            }

            console.log("✔ Producto encontrado:", producto.nombre);

            // Calcular subtotal
            item.precio = producto.precio;
            item.subtotal = producto.precio * item.cantidad;

            // Descontar stock solo una vez
            producto.cantidad -= item.cantidad;
            await producto.save();
        }


        // ---------------- CALCULAR TOTALES ----------------
        const subtotal = datosFactura.productos_factura.reduce((s, item) => s + item.subtotal, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;

        datosFactura.subtotal = subtotal;
        datosFactura.iva = iva;
        datosFactura.total = total;

        // ---------------- CREAR FACTURA ----------------
        const nuevaFactura = new Factura(datosFactura);

        // ---------------- GENERAR PDF ----------------
        const pdfBuffer = await generarFacturaPDF(nuevaFactura);
        nuevaFactura.pdf_factura = pdfBuffer;

        // ---------------- GENERAR XML ----------------
        const xmlString = await generarFacturaXML(nuevaFactura);
        nuevaFactura.xml_factura = xmlString;

        // Guardar en BD
        await nuevaFactura.save();

        // ---------------- ENVIAR CORREO (OBLIGATORIO) ----------------
        try {
            await exports.enviarFacturaCorreo(
                {
                    body: {
                        idFactura: nuevaFactura._id,
                        emailCliente: nuevaFactura.usuario.correo_electronico
                    }
                },
                {
                    json: () => {},
                    status: () => ({ json: () => {} })
                }
            );

            console.log(`📧 Correo enviado automáticamente a ${nuevaFactura.usuario.correo_electronico}`);

        } catch (error) {
            console.warn("⚠️ No se pudo enviar el correo automáticamente:", error.message);
        }

        console.log('✅ Factura generada con PDF y XML, stock actualizado');

        // ---------------- RESPUESTA FINAL ----------------
        res.status(201).json({
            mensaje: 'Factura generada y guardada correctamente',
            numeroFactura: nuevaFactura.numero_factura,
            facturaId: nuevaFactura._id
        });


    } catch (error) {
        console.error('❌ Error al generar la factura:', error);
        res.status(500).json({ mensaje: "Error en el servidor. Intente más tarde." });
    }
};

exports.mostrarFacturas = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    if (!usuario) return res.status(401).json({ mensaje: 'Usuario no autenticado' });

    let query = {};
    if (!puedeVerTodasLasFacturas(usuario.tipo_usuario))
      query = { 'usuario.numero_documento': usuario.numero_documento };

    const facturas = await Factura.find(query).sort({ fecha_emision: -1 });
    res.json(facturas);
  } catch (e) {
    console.error('❌ mostrarFacturas:', e);
    res.status(500).json({ mensaje: 'Error al mostrar facturas' });
  }
};

exports.obtenerFacturaPDF = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    if (!factura.pdf_factura) return res.status(404).json({ mensaje: 'PDF no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.numero_factura}.pdf`);
    res.send(factura.pdf_factura);
  } catch (e) {
    console.error('❌ obtenerFacturaPDF:', e);
    res.status(500).json({ mensaje: 'Error al obtener PDF' });
  }
};

exports.obtenerFacturaXML = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    if (!factura.xml_factura) return res.status(404).json({ mensaje: 'XML no encontrado' });

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.numero_factura}.xml`);
    res.send(factura.xml_factura);
  } catch (e) {
    console.error('❌ obtenerFacturaXML:', e);
    res.status(500).json({ mensaje: 'Error al obtener XML' });
  }
};

// -----------------------------------------------------------
// 4)  ENVÍO DE FACTURA POR CORREO  (API HTTP OFICIAL)
// -----------------------------------------------------------
exports.enviarFacturaPorCorreo = async (req, res, next) => {
  try {
    const { idFactura, emailCliente } = req.body;

        // Validaciones
        if (!idFactura || !emailCliente) {
            return res.status(400).json({ 
                mensaje: 'Faltan datos: ID de factura y correo son obligatorios' 
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailCliente)) {
            return res.status(400).json({ 
                mensaje: 'El formato del correo electrónico no es válido' 
            });
        }

        // Buscar la factura
        const factura = await Factura.findById(idFactura);

        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe esa factura' });
        }

        // Obtener PDF y XML directamente de la factura
        const pdfBuffer = factura.pdf_factura;
        const xmlBuffer = factura.xml_factura;

        // Verificar que existan
        if (!pdfBuffer || !xmlBuffer) {
            return res.status(400).json({ 
                mensaje: 'La factura no tiene PDF o XML generado. Genere la factura primero.' 
            });
        }

    console.log('Tamaño XML en bytes:', factura.xml_factura.length);
    console.log('Tamaño XML en base64:', Buffer.from(factura.xml_factura).toString('base64').length);

    const nombreCliente = `${factura.usuario.nombre} ${factura.usuario.apellido}`;
    const fechaFormateada = new Date(factura.fecha_emision).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalFormateado = factura.total.toLocaleString('es-CO');

    const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Factura Athena'S</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #254454 0%, #276177 100%);
                        color: #ffffff;
                        padding: 30px;
                        text-align: center;
                    }

                    .header .logo {
                        width: 90px; /* Reducimos el tamaño para que quepa bien al lado del texto */
                        height: auto; 
                        margin-right: 10px; 
                        /* ¡Clave! Permite que el elemento se coloque junto a otros */
                        display: inline-block; 
                        /* Alinea la imagen con el centro vertical del texto */
                        vertical-align: middle;
                    }

                    .header h1 {
                        display: inline-block;
                        margin: 0;
                        font-size: 32px;
                        font-weight: bold;
                        vertical-align: middle;
                    }
                    .header p {
                        margin: 5px 0 0 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 30px;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #254454;
                        margin-bottom: 20px;
                    }
                    .info-box {
                        background-color: #F0F4F8;
                        border-left: 4px solid #276177;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #D1DCE6;
                    }
                    .info-row:last-child {
                        border-bottom: none;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #276177;
                    }
                    .info-value {
                        color: #254454;
                        text-align: right;
                    }
                    .total-row {
                        background-color: #276177;
                        color: white;
                        padding: 15px 20px;
                        margin: 20px -20px -20px -20px;
                        border-radius: 0 0 5px 5px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .products-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .products-table th {
                        background-color: #276177;
                        color: white;
                        padding: 12px;
                        text-align: left;
                    }
                    .products-table td {
                        padding: 12px;
                        border-bottom: 1px solid #D1DCE6;
                    }
                    .products-table tr:last-child td {
                        border-bottom: none;
                    }
                    .message {
                        color: #666;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 20px 0;
                    }
                    .footer {
                        background-color: #254454;
                        color: #F0F4F8;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    .footer a {
                        color: #8E9BE8;
                        text-decoration: none;
                    }
                    
                    .footer .logo-gaia {
                    width: 35px; /* Tamaño pequeño, adecuado para el footer */
                    height: auto;
                    vertical-align: middle; /* Alinea verticalmente con el texto si está en línea */
                    margin-right: 5px; /* Espacio a la derecha si está antes del texto */
                    display: inline-block; /* Permite que la imagen y el texto estén en la misma línea */
                    }

                    .attachment-info {
                        background-color: #fff3cd;
                        border: 1px solid #ffc107;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .attachment-info strong {
                        color: #856404;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            margin: 10px;
                        }
                        .content {
                            padding: 20px;
                        }
                        .products-table {
                            font-size: 12px;
                        }
                        .products-table th,
                        .products-table td {
                            padding: 8px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img 
                            src="https://drive.google.com/uc?export=view&id=1W9hegx7_xrNjxl4bN6939vas_DFwV2s4" 
                            alt="Logo de athenas" 
                            class="logo"
                        >
                        <h1>Athena'S</h1>
                        <p>GaiaFact - Sistema de Facturación Electrónica</p>
                    </div>
                    
                    <div class="content">
                        <p class="greeting">
                            Hola <strong>${nombreCliente}</strong>,
                        </p>
                        
                        <p class="message">
                            Gracias por tu compra. Adjuntamos tu factura electrónica en formato PDF y XML.
                        </p>

                        <div class="info-box">
                            <div class="info-row">
                                <span class="info-label">📄 Número de Factura:</span>
                                <span class="info-value"><strong>${factura.numero_factura}</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📅 Fecha de emisión:</span>
                                <span class="info-value">${fechaFormateada}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📦 Productos:</span>
                                <span class="info-value">${factura.productos_factura.length} item(s)</span>
                            </div>
                            ${factura.codigo_CUFE ? `
                            <div class="info-row">
                                <span class="info-label">🔐 CUFE:</span>
                                <span class="info-value" style="font-size: 11px; word-break: break-all;">${factura.codigo_CUFE}</span>
                            </div>
                            ` : ''}
                            <div class="info-row">
                                <span class="info-label">💳 Método de pago:</span>
                                <span class="info-value">${factura.metodo_pago}</span>
                            </div>
                            <div class="total-row">
                                <span>💰 TOTAL:</span>
                                <span>$${totalFormateado} COP</span>
                            </div>
                        </div>

                        <h3 style="color: #254454; border-bottom: 2px solid #276177; padding-bottom: 10px; margin-top: 30px;">
                            📋 Detalle de productos
                        </h3>
                        
                        <table class="products-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th style="text-align: center;">Cant.</th>
                                    <th style="text-align: right;">Precio Unit.</th>
                                    <th style="text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${factura.productos_factura.map(prod => `
                                    <tr>
                                        <td>${prod.producto}</td>
                                        <td style="text-align: center;">${prod.cantidad}</td>
                                        <td style="text-align: right;">$${prod.precio.toLocaleString('es-CO')}</td>
                                        <td style="text-align: right;">$${(prod.precio * prod.cantidad).toLocaleString('es-CO')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="attachment-info">
                            <strong>📎 Archivos adjuntos:</strong><br>
                            • factura-${factura.numero_factura}.pdf<br>
                            • factura-${factura.numero_factura}.xml
                        </div>

                        <p class="message">
                            Esta factura es un documento válido para efectos tributarios. 
                            Por favor, consérvala para tus registros contables.
                        </p>

                        <p class="message">
                            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos 
                            respondiendo a este correo o llamando al <strong>3023650911</strong>.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>
                        <img 
                        src="https://drive.google.com/uc?export=view&id=1YTQhGVEM1pTeurD1bF8Zf4qvNd3Ky03-" 
                        alt="Logo GaiaFact" 
                        class="logo-gaia"
                        >
                        <strong>Athena'S - GaiaFact</strong></p>
                        <p>📍 Calle 11 #22-04</p>
                        <p>📞 Tel: 3023650911</p>
                        <p>🆔 NIT: 876.543.219-5</p>
                        <p>📧 <a href="mailto:gaiafactrangers@gmail.com">gaiafactrangers@gmail.com</a></p>
                        <p style="margin-top: 15px; font-size: 11px; opacity: 0.8;">
                            Este correo fue generado automáticamente por el sistema GaiaFact.<br>
                            Por favor, no responder directamente a este mensaje.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const msg = {
      to: [{ email: emailCliente }],
      from: { email: process.env.EMAIL_FROM || 'gaiafactrangers@gmail.com', name: 'Athena\'S - GaiaFact' },
      subject: `📄 Factura ${factura.numero_factura} - Athena'S`,
      html,
    attachments: [
        {
            content: factura.pdf_factura.toString('base64'),
            filename: `factura-${factura.numero_factura}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
        },
        {
            content: Buffer.from(factura.xml_factura).toString('base64'),
            filename: `factura-${factura.numero_factura}.xml`,
            type: 'application/xml',
            disposition: 'attachment'
        }
        ]
    };

    console.log('Attachments a enviar:', msg.attachments.map(a => ({
    filename: a.filename,
    type: a.type,
    contentLength: a.content.length
    })));

    await sgMail.send(msg);
    console.log(`✅ Factura ${factura.numero_factura} enviada a ${emailCliente}`);
    res.json({ mensaje: 'Factura enviada por correo', destinatario: emailCliente, numeroFactura: factura.numero_factura });
  } catch (e) {
    console.error('❌ enviarFacturaPorCorreo:', e);
    console.error('❌ SendGrid error completo:', e.response?.body || e.message);
    let msg = 'Error al enviar correo';
    if (e.code === 403) msg = 'Autenticación fallida – revisá SENDGRID_API_KEY';
    if (e.code === 400) msg = 'Datos inválidos – revisá que el remitente esté verificado';
    res.status(500).json({ mensaje: msg, error: e.message });
  }
};

// -----------------------------------------------------------
// 5)  BUSCAR FACTURA
// -----------------------------------------------------------
exports.buscarFactura = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    if (!usuario) return res.status(401).json({ mensaje: 'Usuario no autenticado' });

    const factura = await Factura.findOne({ numero_factura: req.params.numeroFactura });
    if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' });

    if (!puedeVerTodasLasFacturas(usuario.tipo_usuario) &&
        factura.usuario.numero_documento !== usuario.numero_documento)
      return res.status(403).json({ mensaje: 'Sin permisos para ver esta factura' });

    res.json(factura);
  } catch (e) {
    console.error('❌ buscarFactura:', e);
    res.status(500).json({ mensaje: 'Error al buscar factura' });
  }
};

// -----------------------------------------------------------
// 6)  EXPORTS AUXILIARES (si alguien los necesita)
// -----------------------------------------------------------
exports.generarPDFFactura = generarPDFFactura;
exports.generarXMLFactura = generarXMLFactura;