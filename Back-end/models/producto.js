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
  codigoProducto: {
    type: Number,
    trim: true,
  }
});

module.exports = mongoose.model('Productos', productoSchema, 'productos');

