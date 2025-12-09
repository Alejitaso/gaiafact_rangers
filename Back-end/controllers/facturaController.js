// Back-end/controllers/facturaController.js
const Producto    = require('../models/producto.js');
const Factura     = require('../models/factura.js');
const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const sgMail      = require('@sendgrid/mail');
const notificacionController = require('./notificacionController');
const facturaSchema = require('../Validators/facturaValidator');
const obtenerFiltroFacturas = require('../Validators/filtroFacturas');
const crypto = require('crypto');
const { generarNumeroFactura, cargarNuevaResolucion } = require('../models/numeraciones.js');

const CERTIFICADO_DUMMY = 'MIID+zCCAuOgAwIBAgIQN+J/r...[CERTIFICADO SIMULADO LARGO]...T/TjX2A9T7tW/8Xb3';
const SIGNATURE_VALUE_DUMMY = 'QkFzZTY0IEZpcm1hIHJlYWxpemFkYSBwb3IgR2FpYUZhY3QgZGUgbW9kbyBhY2FkZW1pY28...';



// -----------------------------------------------------------
// 1)  CONFIG DE SENDGRID – FUENTE ÚNICA: SENDGRID_API_KEY
// -----------------------------------------------------------
const apiKey = process.env.EMAIL_PASS;   
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

            // Bloque de CUFE
            const cufeX = 300;
            const cufeY = 110;
            doc.fontSize(7).fillColor(colorPrimario).font('Helvetica-Bold')
                .text('CÓDIGO ÚNICO DE FACTURA ELECTRÓNICA (CUFE)', cufeX, cufeY, { align: 'right', width: 245 });

            doc.fontSize(8).fillColor(colorTexto).font('Helvetica')
                .text(datosFactura.codigo_CUFE || 'TEMPORAL-' + datosFactura.numero_factura, 
                    cufeX, cufeY + 12, { align: 'right', width: 245, lineBreak: true });

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
               .text('DTO.', 420, tableTop + 5, { width: 40, align: 'center' })
               .text('SUBTOTAL', 430, tableTop + 5, { width: 100, align: 'right' });

            // Productos
            let yPosition = tableTop + 35;
            let subtotalGeneral = 0;

            datosFactura.productos_factura.forEach((item, index) => {
                const precioConDescuento = item.precio * (1 - (item.descuento || 0) / 100);
                const subtotal = precioConDescuento * item.cantidad;
                subtotalGeneral += subtotal;

                item.subtotal = subtotal;
                // Fondo alternado para filas
                if (index % 2 === 0) {
                    doc.rect(50, yPosition - 5, 495, 20).fillColor('#F8F9FA').fill();
                }

                doc.fontSize(9).fillColor(colorTexto)
                   .text(item.producto, 60, yPosition, { width: 220 })
                   .text(item.cantidad.toString(), 290, yPosition, { width: 40, align: 'center' })
                   .text(`$${item.precio.toLocaleString('es-CO')}`, 340, yPosition, { width: 80, align: 'right' })
                   .text(`${item.descuento || 0}%`, 420, yPosition, { width: 40, align: 'center' })
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
            const totalFinal = subtotalGeneral + iva;

            // Guardar valores en la factura
            datosFactura.subtotal = subtotalGeneral;
            datosFactura.iva = iva;
            datosFactura.total = totalFinal;
            datosFactura.descuento_total = subtotalGeneral - (datosFactura.productos_factura.reduce((sum, p) => sum + (p.precio * p.cantidad), 0));

            doc.fontSize(10).fillColor(colorTexto)
               .text('Subtotal:', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${subtotalGeneral.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            yPosition += 20;
            doc.text('IVA (19%):', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${iva.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            // ========== DESCUENTO TOTAL ==========
            if (datosFactura.descuento_total !== 0) {
            yPosition += 20;
            doc.fontSize(10).fillColor(colorTexto)
                .text('Descuento total:', 380, yPosition, { align: 'right', width: 80 })
                .text(`-$${Math.abs(datosFactura.descuento_total).toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });
            }

            yPosition += 25;
            doc.fontSize(12).fillColor(colorPrimario).font('Helvetica-Bold')
               .text('TOTAL:', 380, yPosition, { align: 'right', width: 80 })
               .fontSize(14)
               .text(`$${totalFinal.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            // ========== CÓDIGOS QR ==========
            let yPositionQRStart = yPosition + 50;

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

            doc.image(qrCodeImage, 60, yPositionQRStart, { width: 120, height: 120 });
            doc.fontSize(8).fillColor(colorGris).text('Escanea para verificar', 60, yPositionQRStart + 125, { width: 120, align: 'center' });

            // Número de factura
            doc.fontSize(16).fillColor(colorTexto).font('Helvetica-Bold')
                .text(datosFactura.numero_factura, 250, yPositionQRStart + 40, { align: 'center', width: 250 });            
            doc.fontSize(8).fillColor(colorGris).font('Helvetica')
               .text('Número de Factura', 250, yPositionQRStart + 60, { align: 'center', width: 250 });

            // ========== BLOQUE DE VALIDACIÓN DIGITAL SIMULADA ==========
            let yPositionValidation = yPositionQRStart + 150; 
            
            doc.moveTo(50, yPositionValidation).lineTo(545, yPositionValidation).strokeColor(colorSecundario).lineWidth(1).stroke();
            yPositionValidation += 15;

            doc.fontSize(10).fillColor(colorPrimario).font('Helvetica-Bold')
               .text('VALIDACIÓN DE FACTURA ELECTRÓNICA', 50, yPositionValidation);
            
            yPositionValidation += 15;
            doc.fontSize(8).fillColor(colorGris).font('Helvetica')
               .text('Este documento ha sido firmado digitalmente mediante el estándar XAdES por Athena\'S - GaiaFact.', 50, yPositionValidation)
               .text('La integridad y autenticidad pueden ser verificadas con el CUFE ante la DIAN.', 50, yPositionValidation + 10);

            // ========== FOOTER ==========
            let yPositionFooter = yPositionValidation + 35;
            doc.fontSize(8).fillColor(colorGris)
               .text('Esta factura electrónica ha sido generada por el sistema GaiaFact - Athena\'S', 50, yPositionFooter, {  
                   align: 'center', 
                   width: 495 
               })
               .text(`Rango de numeración: ${datosFactura.rango_numeracion_actual || 'TEMP-2025'}`, 50, yPositionFooter + 15, {  
                   align: 'center', 
                   width: 495 
               })
               .text('Gracias por su compra', 50, yPositionFooter + 30, { 
                   align: 'center', 
                   width: 495 
               });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generarXMLFactura = (datosFactura, digestValue) => {

    const signingTime = new Date().toISOString();

    const signatureBlock = `
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#">
        <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"/>
            <ds:Reference URI="">
                <ds:Transforms>
                    <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                    <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                </ds:Transforms>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                <ds:DigestValue>${digestValue}</ds:DigestValue>
            </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>
            ${SIGNATURE_VALUE_DUMMY}
        </ds:SignatureValue>
        <ds:KeyInfo>
            <ds:X509Data>
                <ds:X509Certificate>${CERTIFICADO_DUMMY}</ds:X509Certificate>
            </ds:X509Data>
        </ds:KeyInfo>
        <ds:Object>
            <xades:QualifyingProperties Target="#SignatureId">
                <xades:SignedProperties>
                    <xades:SignedSignatureProperties>
                        <xades:SigningTime>${signingTime}</xades:SigningTime>
                        <xades:SigningCertificate>
                            <xades:Cert>
                                <xades:CertDigest>
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                    <ds:DigestValue>SIMULATED_CERT_DIGEST</ds:DigestValue>
                                </xades:CertDigest>
                            </xades:Cert>
                        </xades:SigningCertificate>
                    </xades:SignedSignatureProperties>
                </xades:SignedProperties>
            </xades:QualifyingProperties>
        </ds:Object>
    </ds:Signature>`;

    const xmlBase = `<?xml version="1.0" encoding="UTF-8"?>
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

            const finalXML = xmlBase.replace('</Invoice>', `${signatureBlock}\n</Invoice>`);

            return finalXML;
};

exports.mostrarFacturas = async (req, res) => {
  try {
    const { filtroFecha, puedeVerHistorico } = obtenerFiltroFacturas(req.usuario.tipo_usuario);

    const facturas = await Factura.find(filtroFecha)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      facturas,
      puedeVerHistorico,
      fechaConsulta: new Date()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener facturas' });
  }
};

// -----------------------------------------------------------
// 3)  CONTROLADORES
// -----------------------------------------------------------

exports.generarFactura = async (req, res) => {

    try {
        const datosFactura = req.body;

        // ---------------- VALIDACIONES ----------------

        // 1. VALIDACIÓN BÁSICA
        if (!datosFactura.usuario || !datosFactura.usuario.nombre || !datosFactura.productos_factura || datosFactura.productos_factura.length === 0) {
            return res.status(400).json({ 
                ok: false,
                mensaje: 'Faltan datos obligatorios (usuario y/o productos).' 
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

            const producto = await Producto.findById(item.producto_id);

            if (!producto) {
                return res.status(404).json({ ok: false, mensaje: `Producto "${item.producto_id}" no encontrado.` });
            }

            if (producto.cantidad < item.cantidad) return res.status(400).json({ ok: false, mensaje: `Stock insuficiente para "${producto.nombre}"` });

            console.log("✔ Producto encontrado:", producto.nombre);

            const descuento = Number(item.descuento) || 0;
            const precioConDescuento = producto.precio * (1 - descuento / 100);

            // Calcular subtotal
            item.precio = producto.precio;
            item.descuento = descuento;
            item.subtotal = precioConDescuento * item.cantidad;

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

        // Generar el PDF y el XML
        const contentToSign = JSON.stringify({
            numero: nuevaFactura.numero_factura,
            fecha: nuevaFactura.fecha_emision,
            total: nuevaFactura.total
        });

        const digestValue = crypto.createHash('sha256').update(contentToSign).digest('base64');
        console.log(`🔑 Digest Value generado: ${digestValue}`);

        const pdfBuffer = await generarPDFFactura(nuevaFactura);
        const xmlString = generarXMLFactura(nuevaFactura, digestValue);

        // Guardar el PDF y XML en la factura
        nuevaFactura.pdf_factura = pdfBuffer;
        nuevaFactura.xml_factura = xmlString;

        // Guardar en BD
        await nuevaFactura.save();

        // ---------------- ENVIAR CORREO (OBLIGATORIO) ----------------
        try {
            await exports.enviarFacturaPorCorreo(
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

            await notificacionController.guardarNotificacion({
                numero_factura: nuevaFactura.numero_factura,
                documento_emisor: 'Sistema',
                documento_receptor: nuevaFactura.usuario.numero_documento,
                correo_receptor: nuevaFactura.usuario.correo_electronico,
                tipo: 'automatico',
                factura: nuevaFactura._id,                
                cliente: nuevaFactura.usuario._id   
            });  

            console.log(`📧 Correo enviado automáticamente a ${nuevaFactura.usuario.correo_electronico}`);

        } catch (error) {
            console.warn("⚠️ No se pudo enviar el correo automáticamente:", error.message);
        }

        console.log('✅ Factura generada con PDF y XML, stock actualizado');

        // ---------------- RESPUESTA FINAL ----------------
        res.status(201).json({
            ok: true,
            mensaje: 'Factura generada y guardada correctamente',
            numeroFactura: nuevaFactura.numero_factura,
            facturaId: nuevaFactura._id
        });


    } catch (error) {
        console.error('❌ Error al generar la factura:', error);
        res.status(500).json({ mensaje: "Error en el servidor. Intente más tarde." });
    }
};

//mostrar facturas con filtros según tipo de usuario
exports.mostrarFacturas = async (req, res) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    let filtro = {};

    /** ===================================================
     *  🧑‍🛒 CLIENTE → solo sus facturas (todas las fechas)
     * =================================================== */
    if (usuario.tipo_usuario === "CLIENTE") {
      filtro = {
        "usuario.numero_documento": usuario.numero_documento
      };

      console.log("🟦 CLIENTE: mostrando solo sus facturas →", filtro);
    }

    /** ===================================================
     *  👨‍💼 USUARIO → solo facturas del día actual
     * =================================================== */
    else if (usuario.tipo_usuario === "USUARIO") {
      const inicio = new Date();
      inicio.setHours(0, 0, 0, 0);

      const fin = new Date();
      fin.setHours(23, 59, 59, 999);

      filtro = {
        fecha_emision: { $gte: inicio, $lte: fin }
      };

      console.log("🟧 USUARIO: mostrando solo facturas de hoy →", filtro);
    }

    /** ===================================================
     *  👑 ADMIN / SUPERADMIN → todo
     * =================================================== */
    else if (
      usuario.tipo_usuario === "ADMINISTRADOR" ||
      usuario.tipo_usuario === "SUPERADMIN"
    ) {
      filtro = {};
      console.log("🟩 ADMIN/SUPERADMIN: mostrando todas las facturas");
    }

    const facturas = await Factura.find(filtro)
      .sort({ fecha_emision: -1 })
      .lean();

    res.json({
      facturas,
      filtroAplicado: filtro,
      fechaConsulta: new Date()
    });

  } catch (e) {
    console.error("❌ Error en mostrarFacturas →", e);
    res.status(500).json({ mensaje: "Error al mostrar facturas" });
  }
};

exports.obtenerFacturaPDF = async (req, res, next) => {
  try {
    // ❗ Tu ruta usa :idFactura, no :id → esto corregido
    const factura = await Factura.findById(req.params.idFactura);

    console.log("📄 Factura encontrada?:", factura ? "SI" : "NO");

    if (!factura) {
      console.log("❌ No existe factura con ese ID en la BD");
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    console.log("📄 PDF existe?:", factura.pdf_factura ? "SI" : "NO");

    if (!factura.pdf_factura) {
      console.log("❌ La factura existe, pero NO tiene PDF almacenado");
      return res.status(404).json({ mensaje: 'PDF no encontrado' });
    }

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
                                    <th style="text-align:center">Cant.</th>
                                    <th style="text-align:right">Precio Unit.</th>
                                    <th style="text-align:right">Dto. %</th>
                                    <th style="text-align:right">Subtotal</th>
                            </thead>
                            <tbody>
                                ${factura.productos_factura.map(prod => `
                                    <tr>
                                        <td>${prod.producto}</td>
                                        <td style="text-align:center">${prod.cantidad}</td>
                                        <td style="text-align:right">$${(Number(prod.precio) || 0).toLocaleString('es-CO')}</td>
                                        <td style="text-align:right">${prod.descuento || 0} %</td>
                                        <td style="text-align:right">$${(Number(prod.subtotal) || 0).toLocaleString('es-CO')
}</td>
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

        console.log(`📧 Enviando factura ${factura.numero_factura} a ${emailCliente}...`);

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

    await notificacionController.guardarNotificacion({
        numero_factura: factura.numero_factura,
        documento_emisor: factura.usuario.numero_documento,
        documento_receptor: factura.cliente.numero_documento,
        correo_receptor: factura.usuario.correo_electronico,
        tipo: "automatico",

        factura: factura._id,
        cliente: factura.usuario._id,
        fecha_enviada: new Date()
    });


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

    const { puedeVerHistorico } = obtenerFiltroFacturas(usuario.tipo_usuario);

    if (!puedeVerHistorico) {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);

      const finDelDia = new Date();
      finDelDia.setHours(23, 59, 59, 999);

      const fechaFactura = new Date(factura.fecha_emision);

      if (fechaFactura < inicioDelDia || fechaFactura > finDelDia) {
        return res.status(403).json({ mensaje: 'Solo puedes ver facturas creadas hoy' });
      }
    }

    res.json(factura);

  } catch (e) {
    console.error('❌ buscarFactura:', e);
    res.status(500).json({ mensaje: 'Error al buscar factura' });
  }
};


// ==========================================================
// FUNCIÓN DE ADMINISTRACIÓN: ACTUALIZAR LÍMITE
// ==========================================================

exports.actualizarLimiteFacturacion = async (req, res) => {
    try {
        const prefijo = 'F';               
        const nuevo_limite = 60000;        
        const nuevo_actual = 1;            
        const nueva_resolucion = '2026001'; 

        const resultado = await cargarNuevaResolucion(
            prefijo, 
            nuevo_limite, 
            nuevo_actual, 
            nueva_resolucion
        );

        res.json({
            ok: true,
            mensaje: `✅ Nueva resolución cargada. Límite establecido hasta ${nuevo_limite}. El próximo número será: ${resultado.actual}`,
            nuevaResolucion: resultado
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar la resolución de facturación:', error);
        res.status(500).json({ 
            ok: false, 
            mensaje: 'Error al cargar la nueva resolución', 
            error: error.message 
        });
    }

};

// -----------------------------------------------------------
// 6)  EXPORTS AUXILIARES (si alguien los necesita)
// -----------------------------------------------------------
exports.generarPDFFactura = generarPDFFactura;
exports.generarXMLFactura = generarXMLFactura;