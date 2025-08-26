// src/componentes/EditarProducto.js
import React, { useEffect, useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';

const OPCIONES_PRENDA = ['camisa', 'pantalón', 'chaqueta', 'falda', 'camiseta', 'buzo'];

function EditarProducto({ idProducto }) {
  const [producto, setProducto] = useState({
    descripcion: '',
    tipo_prenda: '',     // UI: simple select; al enviar convertimos a [tipo_prenda]
    cantidad: '',
    precio: '',
    descuento: ''        // string/number; backend lo parsea a Decimal128
  });

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        const { data } = await clienteAxios.get(`/productos/${idProducto}`);
        setProducto({
          descripcion: data.descripcion || '',
          tipo_prenda: Array.isArray(data.tipo_prenda) ? (data.tipo_prenda[0] || '') : (data.tipo_prenda || ''),
          cantidad: data.cantidad ?? '',
          precio: data.precio ?? '',
          descuento: data.descuento ? (Number(data.descuento) || '') : ''
        });
      } catch (err) {
        console.error('Error al obtener producto:', err);
        Swal.fire('Error', 'No se pudo cargar el producto', 'error');
      }
    };
    if (idProducto) cargarProducto();
  }, [idProducto]);

  const manejarCambio = (e) => {
    setProducto({
      ...producto,
      [e.target.name]: e.target.value
    });
  };

  const validarFormulario = () => {
    const { descripcion, tipo_prenda, cantidad, precio } = producto;
    return !descripcion || !tipo_prenda || cantidad === '' || precio === '';
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        descripcion: producto.descripcion,
        tipo_prenda: [producto.tipo_prenda], // el schema espera array
        cantidad: Number(producto.cantidad),
        precio: Number(producto.precio),
        // si descuento viene vacío, no lo mandamos (evita problemas con Decimal128)
        ...(producto.descuento !== '' ? { descuento: producto.descuento } : {})
      };

      await clienteAxios.put(`/productos/${idProducto}`, payload);
      Swal.fire('Correcto', 'Producto actualizado correctamente', 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
    }
  };

  if (!idProducto) return <div>Falta el id del producto</div>;
  if (!producto.descripcion && producto.cantidad === '' && producto.precio === '') {
    // estado inicial antes de cargar
    return <div>Cargando producto...</div>;
  }

  return (
    <React.Fragment>
      <h1>Editar Producto</h1>
      <form onSubmit={manejarEnvio}>
        <legend>Modifica los datos del producto</legend>

        <div className="campo">
          <label>Descripción:</label>
          <input
            type="text"
            placeholder="Descripción"
            name="descripcion"
            onChange={manejarCambio}
            value={producto.descripcion}
          />
        </div>

        <div className="campo">
          <label>Tipo de prenda:</label>
          <select name="tipo_prenda" onChange={manejarCambio} value={producto.tipo_prenda}>
            <option value="">-- Selecciona --</option>
            {OPCIONES_PRENDA.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Cantidad:</label>
          <input
            type="number"
            placeholder="Cantidad"
            name="cantidad"
            onChange={manejarCambio}
            value={producto.cantidad}
            min="0"
          />
        </div>

        <div className="campo">
          <label>Precio:</label>
          <input
            type="number"
            placeholder="Precio"
            name="precio"
            onChange={manejarCambio}
            value={producto.precio}
            min="0"
            step="0.01"
          />
        </div>

        <div className="campo">
          <label>Descuento:</label>
          <input
            type="number"
            placeholder="Descuento (opcional)"
            name="descuento"
            onChange={manejarCambio}
            value={producto.descuento}
            step="0.01"
          />
        </div>

        <button type="submit" className="btn btn-azul" disabled={validarFormulario()}>
          Guardar Cambios
        </button>
      </form>
    </React.Fragment>
  );
}

export default EditarProducto;
