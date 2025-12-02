const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
  id_producto: {
    type: Schema.ObjectId,
    ref: 'Productos'
  },
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  descripcion: {
    type: String
  },
  tipo_prenda: {
    type: String,
    enum: ['Camisetas', 'Camisas', 'Pantalones', 'Vestidos', 'Faldas', 'Sacos'],
    required: true
  },
  cantidad: {
    type: Number
  },
  precio: {
    type: Number
  },
  descuento: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  codigoProducto: {
    type: Number,
    trim: true,
  },
  codigo_barras_pdf: {
    type: Buffer,
    default: null
  },
  codigo_barras_datos: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Productos', productoSchema, 'productos');

