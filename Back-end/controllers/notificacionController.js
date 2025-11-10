const Notificacion = require('../models/notificacion');
const Factura = require('../models/factura');
const Usuario = require('../models/usuario'); 
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Asegurar que el directorio temporal exista
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)){
    // Usamos 'recursive: true' para crear directorios anidados si fuera necesario
    fs.mkdirSync(TEMP_DIR, { recursive: true }); 
}

// ==========================================================
// 🌟 FUNCIONES AUXILIARES DE FORMATO Y GENERACIÓN 
// ==========================================================

// Funciones de formateo
const formatearPrecio = (valor) => valor ? `$${parseFloat(valor).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : '$0.00';
const formatearFecha = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-CO') : 'N/A';

// Función auxiliar para generar el PDF (CORRECCIÓN CLAVE DE I/O)
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
            const fecha = new Date(datosFactura.fecha_emision || new Date());
            const fechaFormato = fecha.toLocaleDateString('es-CO');
            const horaFormato = fecha.toLocaleTimeString('es-CO');
            
            const qrData = `Número de Factura: ${datosFactura.numero_factura}
Fecha: ${fechaFormato}
Hora: ${horaFormato}
NIT: 900123456-1
Cliente: ${datosFactura.usuario.nombre} ${datosFactura.usuario.apellido}
Documento: ${datosFactura.usuario.tipo_documento || 'CC'} ${datosFactura.usuario.numero_documento}
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

// Función auxiliar para generar el cuerpo HTML del correo
const generarCuerpoCorreo = (factura, cliente) => {
    const nombreEmpresa = process.env.DIAN_NOMBRE_EMPRESA || 'Athena\'s Facturación';
    return `
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #2C5F6F;">Notificación de Factura Electrónica</h2>
                    <p>Estimado(a) ${cliente.nombre} ${cliente.apellido},</p>
                    <p>Le adjuntamos su factura electrónica de venta con la siguiente información:</p>
                    <ul>
                        <li><strong>Número de Factura:</strong> ${factura.numero_factura}</li>
                        <li><strong>Total a Pagar:</strong> ${formatearPrecio(factura.total)}</li>
                    </ul>
                    <p>Gracias por su compra. Puede encontrar el archivo PDF adjunto a este correo.</p>
                    <p style="font-size: 0.8em; color: #999;">Atentamente, el equipo de ${nombreEmpresa}.</p>
                </div>
            </body>
        </html>
    `;
};


// ==========================================================
// FUNCIÓN ASÍNCRONA DE TRASFONDO (NO BLOQUEA LA RESPUESTA HTTP)
// ==========================================================
const procesarEnvioFactura = async (idFactura, cliente) => {
    
    // 1. CREAR EL TRANSPORTADOR (CONFIGURACIÓN GMAIL)
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS
        }
    });
    
    // **VERIFICACIÓN CRÍTICA**
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("[BG TASK FATAL ERROR] EMAIL_USER o EMAIL_PASS no están definidas. El correo NO se enviará.");
        return;
    }
    
    // VARIABLES NECESARIAS
    const nombreEmpresa = process.env.DIAN_NOMBRE_EMPRESA || 'Athena\'s Facturación';
    const remitenteCorreo = process.env.EMAIL_USER; 
    const pdfPath = path.join(TEMP_DIR, `factura_${idFactura}.pdf`); 

    let factura; 
    
    try {
        // 1. Buscar Factura
        factura = await Factura.findById(idFactura);
        if (!factura) {
            console.error(`[BG TASK ERROR] Factura no encontrada: ${idFactura}`);
            return;
        }
        
        // 2. Generar PDF en Buffer (MEMORIA)
        factura.usuario = cliente; 
        // 🚨 CORRECCIÓN AQUÍ: Capturamos el Buffer devuelto.
        const pdfBuffer = await generarPDFFactura(factura); 

        // 3. Escribir el Buffer al disco de forma ASÍNCRONA y SEGURA.
        // Usamos fs.promises para garantizar que la escritura esté completa y el archivo cerrado.
        await fs.promises.writeFile(pdfPath, pdfBuffer); 
        console.log("[BG TASK DEBUG] PDF generado y escrito en disco correctamente. Iniciando envío de correo.");


        // 4. Configurar y enviar correo
        const mailOptions = {
            from: `"${nombreEmpresa}" <${remitenteCorreo}>`, 
            to: cliente.correo_electronico,
            subject: `Factura #${factura.numero_factura} de su compra - ${nombreEmpresa}`,
            html: generarCuerpoCorreo(factura, cliente),
            attachments: [
                {
                    filename: `factura_${factura.numero_factura}.pdf`,
                    path: pdfPath // Nodemailer ahora lee el archivo existente.
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[BG TASK SUCCESS] Factura ${factura.numero_factura} enviada a ${cliente.correo_electronico} usando GMAIL. Respuesta: ${info.response}`);

    } catch (mailError) {
        // Log detallado del error (ya sea de DB, PDF o Nodemailer)
        const numFactura = factura ? factura.numero_factura : idFactura;
        console.error(`==========================================================`);
        console.error(`[BG TASK ERROR] Falló el proceso de envío para la factura ${numFactura}.`);
        console.error("DETALLES DEL ERROR (DB, PDF o GMAIL):", mailError.message || mailError);
        console.error(`==========================================================`);
        
    } finally {
        // 5. Eliminar archivo temporal SIEMPRE
        if (fs.existsSync(pdfPath)) {
            try {
                fs.unlinkSync(pdfPath); 
            } catch(err) {
                 console.error(`Error al intentar eliminar el PDF temporal ${pdfPath}:`, err.message);
            }
        }
    }
};

// ==========================================================
// ENDPOINT DE CREACIÓN (RESPUESTA RÁPIDA)
// ==========================================================
exports.crearNotificacion = async (req, res) => {
    try {
        const { numeroFactura, numeroDocumentoUsuario } = req.body;

        // 1. Buscar la Factura
        const factura = await Factura.findOne({ numero_factura: numeroFactura });
        if (!factura) {
            return res.status(404).json({ mensaje: "Factura no encontrada." });
        }

        // 2. Buscar el Usuario/Cliente 
        const cliente = await Usuario.findOne({ numero_documento: numeroDocumentoUsuario });
        if (!cliente || !cliente._id || !cliente.correo_electronico) {
            return res.status(404).json({ mensaje: "Cliente no encontrado o no tiene correo registrado." });
        }

        // 3. Crear el registro de Notificación en la BD (Paso rápido)
        const nuevaNotificacion = new Notificacion({
            fecha_enviada: Date.now(),
            factura: factura._id,
            cliente: cliente._id,
        });

        await nuevaNotificacion.save();

        // 4. Disparar la tarea pesada en segundo plano SIN esperar el resultado
        // 🚨 BEST PRACTICE: Añadir .catch() para evitar Unhandled Rejections
        procesarEnvioFactura(factura._id, cliente)
            .catch(err => {
                console.error("[BG TASK UNHANDLED REJECTION] Error en la promesa de envío de correo:", err.message || err);
            });
        
        // 5. RESPUESTA RÁPIDA AL CLIENTE
        res.json({ 
            mensaje: `Notificación registrada. El envío del correo de la factura #${numeroFactura} ha comenzado en segundo plano.`, 
            idFactura: factura._id
        });

    } catch (error) {
        console.error("Error FATAL en crearNotificacion (Endpoint):", error);
        res.status(500).json({ mensaje: "Error interno del servidor. Verifique los logs del servidor para detalles." });
    }
};