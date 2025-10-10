const Factura = require("../models/factura");
const Cliente = require("../models/cliente");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.enviarFactura = async (req, res) => {
    try {
        const { idFactura } = req.params;

        // 1. Buscar la factura
        const factura = await Factura.findById(idFactura);
        if (!factura) {
            return res.status(404).json({ mensaje: "Factura no encontrada" });
        }

        // 2. Buscar el cliente
        const cliente = await Cliente.findOne({ id_cliente: factura.id_cliente });
        if (!cliente || !cliente.correo_electronico) {
            return res.status(404).json({ mensaje: "Cliente no encontrado o sin correo electrónico" });
        }

        // 3. Generar PDF de la factura
        const pdfPath = path.join(__dirname, `../temp/factura_${factura._id}.pdf`);
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(pdfPath));

        doc.fontSize(18).text(`Factura #${factura._id}`, { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Cliente: ${cliente.nombre} ${cliente.apellido}`);
        doc.text(`Correo: ${cliente.correo_electronico}`);
        doc.moveDown();
        doc.fontSize(12).text(`Descripción: ${factura.descripcion_producto}`);
        doc.text(`Valor Unitario: $${factura.valor_unitario}`);
        doc.text(`Valor Total: $${factura.valor_total}`);
        doc.text(`Forma de Pago: ${factura.forma_de_pago}`);
        doc.text(`Medio de Pago: ${factura.medio_pago}`);
        doc.end();

        doc.on("finish", async () => {
            // 4. Configurar transporte de correo
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "tu_correo@gmail.com", // Cambiar
                    pass: "tu_password_app"      // Cambiar (usar app password)
                }
            });

            // 5. Configurar correo
            const mailOptions = {
                from: '"Sistema de Facturación" <tu_correo@gmail.com>',
                to: cliente.correo_electronico,
                subject: "Factura de su compra",
                text: `Hola ${cliente.nombre}, adjuntamos la factura de su compra.`,
                attachments: [
                    {
                        filename: `factura_${factura._id}.pdf`,
                        path: pdfPath
                    }
                ],

                text: 'Gracias por su compra.' 
            };

            // 6. Enviar correo
            await transporter.sendMail(mailOptions);

            // 7. Eliminar archivo temporal
            fs.unlinkSync(pdfPath);

            res.json({ mensaje: "Factura enviada al correo del cliente" });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al enviar la factura", error });
    }
};
