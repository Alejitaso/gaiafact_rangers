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

    const nombreCliente = `${factura.usuario.nombre} ${factura.usuario.apellido}`;
    const fechaFormateada = new Date(factura.fecha_emision).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalFormateado = factura.total.toLocaleString('es-CO');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>body{font-family:Segoe UI;background:#f4f4f4;margin:0}.container{max-width:600px;margin:20px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,.1)}.header{background:linear-gradient(135deg,#254454 0%,#276177 100%);color:#fff;padding:30px;text-align:center}.content{padding:30px}.footer{background:#254454;color:#f0f4f8;padding:20px;text-align:center;font-size:13px}</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Athena'S</h1><p>GaiaFact - Sistema de Facturación</p></div>
    <div class="content">
      <p>Hola <strong>${nombreCliente}</strong>,</p>
      <p>Adjuntamos tu factura electrónica en formato PDF y XML.</p>
      <p><strong>Número:</strong> ${factura.numero_factura}<br>
         <strong>Fecha:</strong> ${fechaFormateada}<br>
         <strong>Total:</strong> $${totalFormateado} COP</p>
    </div>
    <div class="footer">
      <p><strong>Athena'S - GaiaFact</strong></p>
      <p>📍 Calle 11 #22-04 | 📞 3023650911 | 🆔 NIT: 876.543.219-5</p>
    </div>
  </div>
</body>
</html>`;

    const msg = {
      to: emailCliente,
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
          content: factura.xml_factura.toString('base64'),
          filename: `factura-${factura.numero_factura}.xml`,
          type: 'application/xml',
          disposition: 'attachment'
        }
      ]
    };

    console.log('📬 Payload a SendGrid:', JSON.stringify({ from: msg.from, to: msg.to, subject: msg.subject, attachmentsCount: msg.attachments?.length }, null, 2));
    
    await sgMail.send(msg);
    console.log(`✅ Factura ${factura.numero_factura} enviada a ${emailCliente}`);
    res.json({ mensaje: 'Factura enviada por correo', destinatario: emailCliente, numeroFactura: factura.numero_factura });
  } catch (e) {
    console.error('❌ enviarFacturaPorCorreo:', e);
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