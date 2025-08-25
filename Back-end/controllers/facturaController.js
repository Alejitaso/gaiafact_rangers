const Factura = require('../models/factura.js');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const nodemailer = require('nodemailer');
const { Canvas } = require('canvas');

// =====================================================
// GENERAR XML DIAN
// =====================================================
function generarXMLFactura(datosFactura) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    
    <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>DIAN 2.1</cbc:CustomizationID>
    <cbc:ProfileID>DIAN 2.1: Factura Electrónica de Venta</cbc:ProfileID>
    <cbc:ID>${datosFactura.rango_numeracion_actual}</cbc:ID>
    <cbc:UUID>${datosFactura.codigo_CUFE}</cbc:UUID>
    <cbc:IssueDate>${new Date(datosFactura.fechaHora_generacion).toISOString().split('T')[0]}</cbc:IssueDate>
    <cbc:IssueTime>${new Date(datosFactura.fechaHora_generacion).toTimeString().split(' ')[0]}</cbc:IssueTime>
    
    <!-- Información del Emisor -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${datosFactura.nombre_empresa}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:RegistrationName>${datosFactura.nombre_empresa}</cbc:RegistrationName>
                <cbc:CompanyID>${datosFactura.NIT_empresa}</cbc:CompanyID>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <!-- Información del Cliente -->
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID>${datosFactura.cliente_documento}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${datosFactura.cliente_nombre}</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <!-- Totales -->
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="COP">${datosFactura.valor_unitario}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="COP">${datosFactura.valor_unitario}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="COP">${datosFactura.valor_total}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="COP">${datosFactura.valor_total}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    <!-- Productos -->
    ${datosFactura.productos.map((prod, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">${prod.cantidad}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="COP">${prod.precio * prod.cantidad}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>${prod.nombre}</cbc:Description>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="COP">${prod.precio}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`).join('')}

</Invoice>`;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================
async function obtenerSiguienteNumero() {
    const ultimaFactura = await Factura.findOne().sort({ rango_numeracion_actual: -1 });
    return ultimaFactura ? ultimaFactura.rango_numeracion_actual + 1 : 1001;
}

function generarCUFE() {
    return require('crypto').randomBytes(20).toString('hex');
}

async function generarCodigoQR(texto) {
    try {
        return await QRCode.toDataURL(texto);
    } catch (error) {
        return 'QR_ERROR';
    }
}

function generarCodigoBarras() {
    return `789${Date.now()}`.substring(0, 13);
}

// =====================================================
// CONTROLLERS
// =====================================================

// Crear factura desde formulario React
exports.crearFacturaDesdeFormulario = async (req, res, next) => {
    try {
        const {
            tipo_documento,
            numero_documento,
            nombres,
            apellidos,
            telefono,
            correo,
            productos,
            forma_pago = 'Contado',
            medio_pago = 'Efectivo'
        } = req.body;

        // Validaciones básicas
        if (!productos || productos.length === 0) {
            return res.status(400).json({ mensaje: 'Debe agregar al menos un producto' });
        }

        // Calcular totales
        let valor_subtotal = 0;
        productos.forEach(prod => {
            valor_subtotal += (prod.precio * prod.cantidad);
        });

        const iva = Math.round(valor_subtotal * 0.19);
        const valor_total = valor_subtotal + iva;
        const siguiente_numero = await obtenerSiguienteNumero();
        const cufe = generarCUFE();

        // Preparar datos completos
        const datosFactura = {
            // Cliente
            cliente_tipo_documento: tipo_documento,
            cliente_documento: numero_documento,
            cliente_nombre: `${nombres} ${apellidos}`.trim(),
            cliente_telefono: telefono,
            cliente_correo: correo,
            
            // Factura
            denominacion: `FACT-${String(siguiente_numero).padStart(6, '0')}`,
            rango_numeracion_actual: siguiente_numero,
            codigo_CUFE: cufe,
            fechaHora_generacion: new Date(),
            fechaHora_validacion: new Date(),
            
            // Productos y valores
            productos: productos,
            descripcion_producto: productos.map(p => `${p.nombre} x${p.cantidad}`).join(', '),
            valor_unitario: valor_subtotal,
            valor_total: valor_total,
            IVA: iva,
            
            // Pago
            forma_de_pago: forma_pago,
            medio_pago: medio_pago,
            
            // Empresa
            nombre_empresa: "Athena'S",
            NIT_empresa: "900123456-1",
            
            // Códigos
            URL_DIAN: `https://catalogo-vpfe-hab.dian.gov.co/Document/FindDocument?documentKey=${cufe}`,
            codigo_QR: await generarCodigoQR(`${cufe}-${siguiente_numero}`),
            codigo_barras: generarCodigoBarras(),
            
            // Otros campos requeridos
            impuesto_bolsa: 0,
            rango_numeracion_final: 9999,
            fecha_numeracion: parseInt(new Date().getFullYear() + '0101'),
            firma_facturador: "FIRMA_DIGITAL_ATHENAS",
            nombre_fabricante_software: "GaiaFact",
            NIT_fabricante_software: "800987654-3",
            nombre_software: "GaiaFact v1.0",
            estado: 'Generada'
        };

        // Generar XML
        const xmlFactura = generarXMLFactura(datosFactura);
        datosFactura.xml_factura = xmlFactura;

        // Crear y guardar
        const nuevaFactura = new Factura(datosFactura);
        const facturaGuardada = await nuevaFactura.save();

        res.json({
            mensaje: 'Factura generada exitosamente',
            numero_factura: siguiente_numero,
            cufe: cufe,
            id_factura: facturaGuardada._id,
            valor_total: valor_total
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al generar la factura', error: error.message });
        next();
    }
}

// Mostrar todas las facturas
exports.mostrarFacturas = async (req, res, next) => {
    try {
        const facturas = await Factura.find({}).sort({ createdAt: -1 });
        res.json(facturas);
    } catch (error) {
        console.log(error);
        next();
    }
}

// Mostrar una factura específica
exports.mostrarFactura = async (req, res, next) => {
    const factura = await Factura.findById(req.params.idFactura);
    
    if (!factura) {
        res.json({ mensaje: 'No existe esa factura' });
        return next();
    }

    res.json(factura);
}

// Buscar por número de factura
exports.buscarPorNumeroFactura = async (req, res, next) => {
    try {
        const factura = await Factura.findOne({ rango_numeracion_actual: req.params.numeroFactura });
        
        if (!factura) {
            res.json({ mensaje: 'No existe factura con ese número' });
            return next();
        }

        res.json(factura);
    } catch (error) {
        console.log(error);
        next();
    }
}

// Generar PDF
exports.obtenerFacturaPDF = async (req, res, next) => {
    try {
        const factura = await Factura.findById(req.params.idFactura);
        
        if (!factura) {
            return res.json({ mensaje: 'No existe esa factura' });
        }

        // Crear PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${factura.rango_numeracion_actual}.pdf"`);
        
        // Stream del PDF
        doc.pipe(res);

        // Contenido del PDF
        // Header
        doc.fontSize(20).text("Athena'S", 50, 50);
        doc.fontSize(14).text('FACTURA ELECTRÓNICA DE VENTA', 50, 80);
        doc.moveTo(50, 100).lineTo(550, 100).stroke();
        
        // Información de la factura
        doc.fontSize(12).text(`No. Factura: ${factura.rango_numeracion_actual}`, 50, 120);
        doc.text(`CUFE: ${factura.codigo_CUFE}`, 50, 140);
        doc.text(`Fecha: ${new Date(factura.fechaHora_generacion).toLocaleDateString()}`, 50, 160);
        doc.text(`NIT: ${factura.NIT_empresa}`, 350, 120);
        
        // Cliente
        doc.fontSize(14).text('DATOS DEL CLIENTE:', 50, 200);
        doc.fontSize(12).text(`Nombre: ${factura.cliente_nombre}`, 50, 220);
        doc.text(`Documento: ${factura.cliente_documento}`, 50, 240);
        doc.text(`Teléfono: ${factura.cliente_telefono || 'N/A'}`, 50, 260);
        doc.text(`Correo: ${factura.cliente_correo || 'N/A'}`, 50, 280);
        
        // Productos
        doc.fontSize(14).text('PRODUCTOS:', 50, 320);
        let yPos = 340;
        
        factura.productos.forEach((producto, index) => {
            doc.fontSize(10).text(`${index + 1}. ${producto.nombre}`, 50, yPos);
            doc.text(`Cant: ${producto.cantidad}`, 300, yPos);
            doc.text(`Precio: $${producto.precio.toLocaleString()}`, 400, yPos);
            doc.text(`Total: $${(producto.precio * producto.cantidad).toLocaleString()}`, 480, yPos);
            yPos += 20;
        });
        
        // Totales
        yPos += 20;
        doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
        yPos += 20;
        
        doc.fontSize(12).text(`Subtotal: $${factura.valor_unitario.toLocaleString()}`, 350, yPos);
        doc.text(`IVA (19%): $${factura.IVA.toLocaleString()}`, 350, yPos + 20);
        doc.fontSize(14).text(`TOTAL: $${factura.valor_total.toLocaleString()}`, 350, yPos + 40);
        
        // Información adicional
        yPos += 80;
        doc.fontSize(10).text(`Forma de pago: ${factura.forma_de_pago}`, 50, yPos);
        doc.text(`Medio de pago: ${factura.medio_pago}`, 50, yPos + 15);
        
        // Footer
        doc.text('Esta es una representación impresa de una factura electrónica', 50, yPos + 50);
        doc.text(`Generado por: ${factura.nombre_software}`, 50, yPos + 65);

        doc.end();

    } catch (error) {
        console.log(error);
        next();
    }
}

// Enviar por correo
exports.enviarFacturaPorCorreo = async (req, res, next) => {
    try {
        const factura = await Factura.findById(req.params.idFactura);
        
        if (!factura) {
            return res.json({ mensaje: 'No existe esa factura' });
        }

        if (!factura.cliente_correo) {
            return res.json({ mensaje: 'La factura no tiene correo registrado' });
        }

        // Configurar nodemailer (necesitarás configurar esto)
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Aquí generarías el PDF en memoria y lo enviarías
        // Por simplicidad, envío solo el texto
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: factura.cliente_correo,
            subject: `Factura ${factura.rango_numeracion_actual} - Athena'S`,
            html: `
                <h2>Factura Electrónica - Athena'S</h2>
                <p><strong>Número:</strong> ${factura.rango_numeracion_actual}</p>
                <p><strong>Cliente:</strong> ${factura.cliente_nombre}</p>
                <p><strong>Total:</strong> $${factura.valor_total.toLocaleString()}</p>
                <p><strong>CUFE:</strong> ${factura.codigo_CUFE}</p>
                <p>Gracias por su compra.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Actualizar estado
        await Factura.findByIdAndUpdate(req.params.idFactura, {
            enviada_por_correo: true,
            fecha_envio_correo: new Date()
        });

        res.json({ mensaje: 'Factura enviada por correo exitosamente' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al enviar factura por correo', error: error.message });
        next();
    }
}

// Actualizar factura
exports.actualizarFactura = async (req, res, next) => {
    try {
        let factura = await Factura.findByIdAndUpdate(req.params.idFactura, req.body, { new: true });
        res.json(factura);
    } catch (error) {
        console.log(error);
        next();
    }
}

// Eliminar factura
exports.eliminarFactura = async (req, res, next) => {
    try {
        await Factura.findByIdAndDelete({ _id: req.params.idFactura });
        res.json({ mensaje: 'Factura eliminada con éxito' });
    } catch (error) {
        console.log(error);
        next();
    }
}