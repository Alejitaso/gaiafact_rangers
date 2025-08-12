const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const facturacionSchema = new Schema({
  id_producto: {
    type: Schema.ObjectId, 
    ref: 'producto',            
  },
  cantidad_producto: {
    type: Number,
  },
  descripcion_producto: {
    type: String,
  },
  valor_producto: {
    type: mongoose.Schema.Types.Decimal128,
  },
  IVA: {
    type: mongoose.Schema.Types.Decimal128,
  },
  descuento: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  }
});

module.exports = mongoose.model('Facturacion', facturacionSchema);
