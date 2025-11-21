// controllers/facturaController.js
// VERSIÓN CON API HTTP DE SENDGRID (más confiable que SMTP)

const Producto = require('../models/producto.js');
const Factura = require('../models/factura.js');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const sgMail = require('@sendgrid/mail'); // npm install @sendgrid/mail

// Configurar SendGrid con la API key
const configurarSendGrid = () => {
  if (!process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_PASS no está configurada');
    throw new Error('EMAIL_PASS (SendGrid API Key) no está configurada');
  }
  
  console.log('✅ Configurando SendGrid API...');
  console.log('📧 API Key detectada:', process.env.EMAIL_PASS.substring(0, 10) + '...');
  
  sgMail.setApiKey(process.env.EMAIL_PASS);
};

// Llamar configuración al cargar el módulo
try {
  configurarSendGrid();
} catch (error) {
  console.error('⚠️ No se pudo configurar SendGrid:', error.message);
}

// ... (todas las funciones anteriores como generarPDFFactura, generarXMLFactura, etc.)

// FUNCIÓN MODIFICADA: enviarFacturaPorCorreo usando API HTTP
exports.enviarFacturaPorCorreo = async (req, res, next) => {
    try {
        const { idFactura, emailCliente } = req.body;

        // Validaciones
        if (!idFactura || !emailCliente) {
            return res.status(400).json({ 
                mensaje: 'Faltan datos: ID de factura y correo son obligatorios' 
            });
        }

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

        // Obtener PDF y XML
        const pdfBuffer = factura.pdf_factura;
        const xmlBuffer = factura.xml_factura;

        if (!pdfBuffer || !xmlBuffer) {
            return res.status(400).json({ 
                mensaje: 'La factura no tiene PDF o XML generado. Genere la factura primero.' 
            });
        }

        // Formatear valores para el correo
        const nombreCliente = `${factura.usuario.nombre} ${factura.usuario.apellido}`;
        const fechaFormateada = new Date(factura.fecha_emision).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const totalFormateado = factura.total.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        // Crear HTML del correo (mismo que antes)
        const htmlCorreo = `
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
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
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
        .total-row {
            background-color: #276177;
            color: white;
            padding: 15px 20px;
            margin: 20px -20px -20px -20px;
            border-radius: 0 0 5px 5px;
            font-size: 18px;
            font-weight: bold;
        }
        .footer {
            background-color: #254454;
            color: #F0F4F8;
            padding: 20px;
            text-align: center;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Athena'S</h1>
            <p>GaiaFact - Sistema de Facturación Electrónica</p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Hola <strong>${nombreCliente}</strong>,
            </p>
            
            <p>
                Gracias por tu compra. Adjuntamos tu factura electrónica en formato PDF y XML.
            </p>

            <div class="info-box">
                <p><strong>📄 Número de Factura:</strong> ${factura.numero_factura}</p>
                <p><strong>📅 Fecha de emisión:</strong> ${fechaFormateada}</p>
                <p><strong>📦 Productos:</strong> ${factura.productos_factura.length} item(s)</p>
                <div class="total-row">
                    💰 TOTAL: $${totalFormateado} COP
                </div>
            </div>

            <p>
                Esta factura es un documento válido para efectos tributarios. 
                Por favor, consérvala para tus registros contables.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Athena'S - GaiaFact</strong></p>
            <p>📍 Calle 11 #22-04</p>
            <p>📞 Tel: 3023650911</p>
            <p>🆔 NIT: 876.543.219-5</p>
        </div>
    </div>
</body>
</html>
        `;

        // ENVIAR CON API HTTP DE SENDGRID
        console.log(`📧 Enviando factura ${factura.numero_factura} a ${emailCliente} usando SendGrid API...`);

        const mensaje = {
            to: emailCliente,
            from: {
                email: 'gaiafactrangers@gmail.com',  // ⚠️ CAMBIAR por tu correo verificado en SendGrid
                name: 'Athena\'S - GaiaFact'
            },
            subject: `📄 Factura ${factura.numero_factura} - Athena'S`,
            html: htmlCorreo,
            attachments: [
                {
                    content: pdfBuffer.toString('base64'),
                    filename: `factura-${factura.numero_factura}.pdf`,
                    type: 'application/pdf',
                    disposition: 'attachment'
                },
                {
                    content: xmlBuffer.toString('base64'),
                    filename: `factura-${factura.numero_factura}.xml`,
                    type: 'application/xml',
                    disposition: 'attachment'
                }
            ]
        };

        try {
            await sgMail.send(mensaje);
            console.log(`✅ Factura enviada exitosamente a ${emailCliente}`);

            res.json({ 
                mensaje: 'Factura enviada por correo exitosamente',
                destinatario: emailCliente,
                numeroFactura: factura.numero_factura
            });
        } catch (sendGridError) {
            console.error('❌ Error de SendGrid:', sendGridError.response?.body || sendGridError.message);
            
            let mensajeError = 'Error al enviar la factura por correo';
            
            if (sendGridError.code === 403) {
                mensajeError = 'Error de autenticación con SendGrid. Verifica tu API key';
            } else if (sendGridError.code === 400) {
                mensajeError = 'Datos inválidos. Verifica el correo del destinatario y el remitente';
            } else if (sendGridError.response?.body?.errors) {
                const errors = sendGridError.response.body.errors;
                mensajeError = `Error de SendGrid: ${errors.map(e => e.message).join(', ')}`;
            }
            
            res.status(500).json({ 
                mensaje: mensajeError,
                error: sendGridError.message,
                detalles: sendGridError.response?.body
            });
        }

    } catch (error) {
        console.error('❌ Error general al enviar la factura por correo:', error);
        
        res.status(500).json({ 
            mensaje: 'Error al enviar la factura por correo',
            error: error.message 
        });
    }
};

exports.configurarSendGrid = configurarSendGrid;