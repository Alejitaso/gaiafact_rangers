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
const generarPDFFactura = async (datosFactura) => { /* tu código tal cual */ };
const generarXMLFactura = (datosFactura) => { /* tu código tal cual */ };
const puedeVerTodasLasFacturas = (tipoUsuario) => {
  if (!tipoUsuario) return false;
  const tipo = tipoUsuario.toUpperCase();
  return ['SUPERADMIN', 'ADMINISTRADOR', 'USUARIO'].includes(tipo);
};

// -----------------------------------------------------------
// 3)  CONTROLADORES
// -----------------------------------------------------------

exports.generarFactura = async (req, res, next) => {
  try {
    const datos = req.body;
    if (!datos.usuario?.nombre || !datos.usuario?.apellido)
      return res.status(400).json({ mensaje: 'Faltan datos del usuario' });
    if (!datos.productos_factura?.length)
      return res.status(400).json({ mensaje: 'Sin productos' });

    // Descuento de stock
    for (const item of datos.productos_factura) {
      const prod = await Producto.findById(item.producto_id);
      if (!prod) return res.status(404).json({ mensaje: `Producto no encontrado: ${item.producto}` });
      if (prod.stock < item.cantidad) return res.status(400).json({ mensaje: `Stock insuficiente: ${item.producto}` });
      prod.stock -= item.cantidad;
      await prod.save();
    }

    const pdfBuffer = await generarPDFFactura(datos);
    const xmlBuffer = generarXMLFactura(datos);

    const factura = new Factura({
      numero_factura: datos.numero_factura,
      fecha_emision: new Date(),
      usuario: datos.usuario,
      productos_factura: datos.productos_factura,
      subtotal: datos.subtotal,
      iva: datos.iva,
      total: datos.total,
      codigo_CUFE: datos.codigo_CUFE || `TEMP-${datos.numero_factura}`,
      pdf_factura: pdfBuffer,
      xml_factura: Buffer.from(xmlBuffer, 'utf-8'),
      rango_numeracion_actual: datos.rango_numeracion_actual || 'TEMP-2025'
    });
    await factura.save();

    res.status(201).json({ mensaje: 'Factura generada y guardada', factura });
  } catch (e) {
    console.error('❌ generarFactura:', e);
    res.status(500).json({ mensaje: 'Error interno al generar factura' });
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
    if (!idFactura || !emailCliente)
      return res.status(400).json({ mensaje: 'Faltan datos' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailCliente))
      return res.status(400).json({ mensaje: 'Correo inválido' });

    const factura = await Factura.findById(idFactura);
    if (!factura) return res.status(404).json({ mensaje: 'Factura no encontrada' });
    if (!factura.pdf_factura || !factura.xml_factura)
      return res.status(400).json({ mensaje: 'Falta PDF o XML' });

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