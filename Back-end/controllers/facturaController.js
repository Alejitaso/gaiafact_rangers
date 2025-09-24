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

const generarPDFFactura = (datosFactura) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        // Lógica para el PDF
        doc.fontSize(16).text('Factura Simplificada', { align: 'center' });
        doc.text(`Número de Factura: ${datosFactura.numero_factura}`);
        // Se corrige para usar "usuario.nombre" y "usuario.apellido"
        doc.text(`Usuario: ${datosFactura.usuario.nombre} ${datosFactura.usuario.apellido}`); 
        doc.text(`Total: $${datosFactura.total}`);
        doc.end();

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);
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

        // Crea una nueva instancia del modelo con los datos del body
        // Esto ahora funcionará porque el modelo tiene el campo 'usuario'
        const nuevaFactura = new Factura(datosFactura);
        
        // Guarda la nueva factura en la base de datos
        await nuevaFactura.save();

        res.status(201).json({
            mensaje: 'Factura generada y guardada correctamente',
            numeroFactura: nuevaFactura.numero_factura
        });

    } catch (error) {
        console.error('❌ Error al generar la factura:', error);
        res.status(500).json({ mensaje: 'Error al generar la factura', error: error.message });
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

        if (factura.pdf_factura) {
            const pdfBuffer = Buffer.from(factura.pdf_factura, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
            return res.send(pdfBuffer);
        } else {
            const pdfBuffer = await generarPDFFactura(factura);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.numero_factura}.pdf"`);
            return res.send(pdfBuffer);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al obtener la factura en PDF' });
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