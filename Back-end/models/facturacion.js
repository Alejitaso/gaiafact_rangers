const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const facturacionSchema = new Schema({
  // Referencia al Producto: Enlaza este ítem con el documento del producto
  id_producto: {
    type: Schema.ObjectId, 
    ref: 'producto',            
  },
  // Cantidad vendida: Número de unidades de este producto facturadas.
  cantidad_producto: {
    type: Number,
  },
  // Descripción: Cadena de texto que describe el producto en la factura.
  descripcion_producto: {
    type: String,
  },
  // Valor Unitario: Precio base por unidad del producto.
  valor_producto: {
    type: mongoose.Schema.Types.Decimal128,
  },
  // Impuesto (IVA): Valor del IVA aplicado al producto (puede ser un monto o porcentaje).
  IVA: {
    type: mongoose.Schema.Types.Decimal128,
  },
  // Descuento: Monto o porcentaje de descuento aplicado a este ítem de línea.
  descuento: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  }
});

module.exports = mongoose.model('facturacion', facturacionSchema);
