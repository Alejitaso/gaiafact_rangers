const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productoSchema = new Schema({
  cliente: {
    type: Schema.ObjectId,
    ref: 'Clientes'
  },
  id_producto: {
    type: Schema.ObjectId,
    ref: 'Productos'
  },
  descripcion: {
    type: String
  },
  tipo_prenda: {
    type: [String],
    enum: ['camisa', 'pantalón', 'chaqueta', 'falda', 'camiseta','buzo'],
    required: true
  },
  cantidad: {
    type: Number
  },
  precio: {
    type: Number
  },
  descuento: {
    type: mongoose.Schema.Types.Decimal128,
  }
});

module.exports = mongoose.model('facturacion', productoSchema);

