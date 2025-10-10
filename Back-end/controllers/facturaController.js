// controllers/facturaController.js

const Factura = require('../models/factura.js');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const configurarTransportador = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

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
               .text('NIT: [TU_NIT_AQUI]', 50, 92)
               .text('Régimen Común', 50, 106)
               .text('Calle [DIRECCIÓN]', 50, 120)
               .text('Tel: [TELÉFONO]', 50, 134);

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
            const iva = 0;
            const totalFinal = datosFactura.total;

            doc.fontSize(10).fillColor(colorTexto)
               .text('Subtotal:', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${subtotalGeneral.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            yPosition += 20;
            doc.text('IVA (0%):', 380, yPosition, { align: 'right', width: 80 })
               .text(`$${iva.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            yPosition += 25;
            doc.fontSize(12).fillColor(colorPrimario).font('Helvetica-Bold')
               .text('TOTAL:', 380, yPosition, { align: 'right', width: 80 })
               .fontSize(14)
               .text(`$${totalFinal.toLocaleString('es-CO')}`, 460, yPosition, { align: 'right', width: 85 });

            // ========== CÓDIGOS QR ==========
            yPosition += 50;

            // Generar QR Code
            const qrData = `CUFE:${datosFactura.codigo_CUFE || 'TEMP-' + datosFactura.numero_factura}|NUM:${datosFactura.numero_factura}|TOTAL:${datosFactura.total}`;
            const qrCodeImage = await QRCode.toBuffer(qrData, {
                width: 120,
                margin: 1
            });

            doc.image(qrCodeImage, 60, yPosition, { width: 120, height: 120 });
            doc.fontSize(8).fillColor(colorGris).text('Escanea para verificar', 60, yPosition + 125, { width: 120, align: 'center' });

            // Información del código de barras (usando JsBarcode requiere Canvas)
            // Como alternativa, mostramos el número en texto grande
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
</Invoice>`;
};

exports.generarFactura = async (req, res, next) => {
    try {
        const datosFactura = req.body;
        console.log('📄 Datos recibidos:', datosFactura);

        // Validar datos necesarios
        if (!datosFactura.usuario || !datosFactura.usuario.nombre || !datosFactura.usuario.apellido) {
            return res.status(400).json({ 
                mensaje: 'Faltan datos del usuario (nombre y apellido son obligatorios)' 
            });
        }

        if (!datosFactura.productos_factura || datosFactura.productos_factura.length === 0) {
            return res.status(400).json({ 
                mensaje: 'Debe incluir al menos un producto en la factura' 
            });
        }

        // Crear la instancia de la factura
        const nuevaFactura = new Factura(datosFactura);

        // Generar el PDF y el XML
        const pdfBuffer = await generarPDFFactura(nuevaFactura);
        const xmlString = generarXMLFactura(nuevaFactura);

        // Guardar el PDF y XML en la factura
        nuevaFactura.pdf_factura = pdfBuffer;
        nuevaFactura.xml_factura = xmlString;

        // Guardar en la base de datos
        await nuevaFactura.save();

        console.log('✅ Factura guardada con PDF y XML');

        res.status(201).json({
            mensaje: 'Factura generada y guardada correctamente',
            numeroFactura: nuevaFactura.numero_factura,
            facturaId: nuevaFactura._id
        });

    } catch (error) {
        console.error('❌ Error al generar la factura:', error);
        res.status(500).json({ 
            mensaje: 'Error al generar la factura', 
            error: error.message 
        });
    }
};

exports.mostrarFacturas = async (req, res, next) => {
    try {
        const facturas = await Factura.find({});
        res.json(facturas);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al mostrar las facturas' });
    }
};

exports.mostrarFactura = async (req, res, next) => {
    try {
        const factura = await Factura.findById(req.params.idFactura);
        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe esa factura' });
        }
        res.json(factura);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al mostrar la factura' });
    }
};

exports.actualizarFactura = async (req, res, next) => {
    try {
        const factura = await Factura.findOneAndUpdate(
            { _id: req.params.idFactura },
            req.body,
            { new: true }
        );
        res.json(factura);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al actualizar la factura' });
    }
};

exports.eliminarFactura = async (req, res, next) => {
    try {
        await Factura.findOneAndDelete({ _id: req.params.idFactura });
        res.json({ mensaje: 'La factura ha sido eliminada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al eliminar la factura' });
    }
};

exports.obtenerFacturaPDF = async (req, res, next) => {
    try {
        const factura = await Factura.findById(req.params.idFactura);
        
        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe esa factura' });
        }

        if (factura.pdf_factura && factura.pdf_factura.length > 0) {
            // El PDF ya está guardado en la BD
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
            return res.send(factura.pdf_factura);
        } else {
            // Si no existe PDF guardado, generarlo al vuelo
            const pdfBuffer = await generarPDFFactura(factura);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
            return res.send(pdfBuffer);
        }
    } catch (error) {
        console.error('Error al obtener PDF:', error);
        res.status(500).json({ mensaje: 'Error al obtener la factura en PDF', error: error.message });
    }
};

exports.obtenerFacturaXML = async (req, res, next) => {
    try {
        const factura = await Factura.findById(req.params.idFactura);
        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe esa factura' });
        }

        if (factura.xml_factura) {
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.xml"`);
            return res.send(factura.xml_factura);
        } else {
            const xml = generarXMLFactura(factura);
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.xml"`);
            return res.send(xml);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al obtener la factura en XML' });
    }
};

exports.enviarFacturaCorreo = async (req, res, next) => {
    try {
        const { idFactura, emailCliente } = req.body;
        const factura = await Factura.findById(idFactura);

        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe esa factura' });
        }

        const pdfBuffer = factura.pdf_factura;
        const xmlBuffer = factura.xml_factura;
        const transportador = configurarTransportador();

        await transportador.sendMail({
            from: '"Tu Empresa" <gaiafactrangers@gmail.com>',
            to: emailCliente,
            subject: `Factura ${factura.numero_factura}`,
            html: `<h1>Hola,</h1><p>Adjuntamos tu factura ${factura.numero_factura}.</p>`,
            attachments: [
                {
                    filename: `factura-${factura.numero_factura}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                },
                {
                    filename: `factura-${factura.numero_factura}.xml`,
                    content: xmlBuffer,
                    contentType: 'application/xml'
                }
            ]
        });

        res.json({ mensaje: 'Factura enviada por correo' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al enviar la factura por correo' });
    }
};

exports.buscarFactura = async (req, res, next) => {
    try {
        const factura = await Factura.findOne({ numero_factura: req.params.numeroFactura });
        if (!factura) {
            return res.status(404).json({ mensaje: 'No existe factura con ese número' });
        }
        res.json(factura);
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al buscar la factura' });
    }
};