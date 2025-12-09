const Joi = require('joi');

// Definición del esquema de validación para la factura
const facturaSchema = Joi.object({
  usuario: Joi.object({
    nombre: Joi.string().min(2).max(50).required(),
    apellido: Joi.string().min(2).max(50).required(),
    tipo_documento: Joi.string().valid('Cedula de ciudadania', 'Cedula extranjeria', 'Pasaporte', 'NIT').required(),
    numero_documento: Joi.string().min(5).max(20).required(),
    correo_electronico: Joi.string().email().required(),
    telefono: Joi.string().min(7).max(15).optional(),
  }).required(),

  productos_factura: Joi.array().items(
    Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(), // ✅ MongoID válido
      producto: Joi.string().min(2).max(100).required(),
      cantidad: Joi.number().integer().min(1).required(),
      precio: Joi.number().min(0).required(), // ✅ lo validamos, pero luego lo ignoras en el servidor
    })
  ).min(1).required(),

  metodo_pago: Joi.string().valid('Efectivo', 'Tarjeta', 'Transferencia').required(),
  fecha_emision: Joi.date().optional(),
  codigo_CUFE: Joi.string().optional(),
});

module.exports = facturaSchema;