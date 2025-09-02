import React, { Fragment, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './editarProducto.module.css';

const OPCIONES_PRENDA = [
  'Camisetas', 'Camisas', 'Pantalones', 'Jeans', 'Vestidos',
  'Faldas', 'Chaquetas', 'Buzos', 'Ropa interior', 'Accesorios'
];

function EditarProducto() {
  const { id } = useParams(); // Obtener ID desde URL params
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion_detallada: '',
    tipo_prenda: '',
    cantidad: '',
    precio: '',
    descuento: ''
  });

  const [cargando, setCargando] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // Para saber si estamos editando o creando

  useEffect(() => {
    const cargarProducto = async () => {
      // Si no hay ID, estamos en modo creación
      if (!id) {
        setModoEdicion(false);
        setCargando(false);
        return;
      }

      // Si hay ID, estamos en modo edición
      setModoEdicion(true);
      
      try {
        setCargando(true);
        const { data } = await clienteAxios.get(`/productos/${id}`);
        setProducto({
          nombre: data.nombre || data.descripcion || '',
          descripcion_detallada: data.descripcion_detallada || '',
          tipo_prenda: Array.isArray(data.tipo_prenda)
            ? (data.tipo_prenda[0] || '')
            : (data.tipo_prenda || ''),
          cantidad: data.cantidad ?? '',
          precio: data.precio ?? '',
          descuento: data.descuento ? (Number(data.descuento) || '') : ''
        });
      } catch (err) {
        console.error('Error cargando producto:', err);
        Swal.fire('Error', 'No se pudo cargar el producto', 'error');
        navigate('/');
      } finally {
        setCargando(false);
      }
    };

    cargarProducto();
  }, [id, navigate]);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const { nombre, tipo_prenda, cantidad, precio } = producto;
    return !nombre.trim() || !tipo_prenda || cantidad === '' || precio === '';
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      Swal.fire('Error', 'Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    try {
      const payload = {
        nombre: producto.nombre.trim(),
        descripcion: producto.nombre.trim(), // Para compatibilidad con backend
        descripcion_detallada: producto.descripcion_detallada.trim(),
        tipo_prenda: [producto.tipo_prenda],
        cantidad: Number(producto.cantidad),
        precio: Number(producto.precio),
        ...(producto.descuento !== '' ? { descuento: Number(producto.descuento) } : {})
      };

      if (modoEdicion) {
        // Actualizar producto existente
        await clienteAxios.put(`/productos/${id}`, payload);
        setMostrarPopup(true);
      } else {
        // Crear nuevo producto
        await clienteAxios.post('/productos', payload);
        Swal.fire('Éxito', 'Producto creado correctamente', 'success');
        navigate('/productos'); // O donde quieras redirigir después de crear
      }
    } catch (err) {
      console.error('Error procesando producto:', err);
      const mensaje = err.response?.data?.mensaje || 
        `No se pudo ${modoEdicion ? 'actualizar' : 'crear'} el producto`;
      Swal.fire('Error', mensaje, 'error');
    }
  };

  const cerrarPopup = () => {
    setMostrarPopup(false);
    navigate('/productos'); // O la ruta que corresponda
  };

  const manejarSalir = () => {
    navigate(-1); // Volver atrás en el historial
  };

  if (cargando) {
    return (
      <div className={styles.registerForm}>
        <p>Cargando producto...</p>
      </div>
    );
  }

  return (
    <Fragment>

      <form className={styles.registerForm} onSubmit={manejarEnvio}>
        <div className={styles.text}>
          <input
            type="text"
            placeholder="NOMBRE DEL PRODUCTO"
            name="nombre"
            onChange={manejarCambio}
            value={producto.nombre}
            required
          />
        </div>

        <div className={styles.text}>
          <input
            type="number"
            placeholder="CANTIDAD"
            name="cantidad"
            onChange={manejarCambio}
            value={producto.cantidad}
            min="0"
            required
          />
        </div>

        <div className={styles.text}>
          <input
            type="number"
            placeholder="PRECIO UNITARIO"
            name="precio"
            onChange={manejarCambio}
            value={producto.precio}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className={styles.text}>
          <input
            type="number"
            placeholder="DESCUENTO (%)"
            name="descuento"
            onChange={manejarCambio}
            value={producto.descuento}
            min="0"
            max="100"
          />
        </div>

        <div className={styles.text}>
          <select
            name="tipo_prenda"
            onChange={manejarCambio}
            value={producto.tipo_prenda}
            required
          >
            <option value="" disabled>TIPO DE PRENDA</option>
            {OPCIONES_PRENDA.map(opcion => (
              <option key={opcion} value={opcion}>{opcion}</option>
            ))}
          </select>
        </div>

        <div className={styles.text}>
          <textarea
            className={styles.textarea1}
            placeholder="DESCRIPCIÓN DETALLADA DEL PRODUCTO"
            name="descripcion_detallada"
            value={producto.descripcion_detallada}
            onChange={manejarCambio}
            rows="4"
          />
        </div>

        <div className={styles.botons}>
          <button 
            type="submit" 
            id="Modificar"
            disabled={validarFormulario()}
          >
            {modoEdicion ? 'Modificar' : 'Crear Producto'}
          </button>
          <button 
            type="button" 
            id="afuera"
            onClick={manejarSalir}
          >
            Salir
          </button>
        </div>
      </form>

      {mostrarPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContainer}>
            <p>{modoEdicion ? 'Se modificó correctamente' : 'Producto creado correctamente'}</p>
            <button onClick={cerrarPopup}>Aceptar</button>
          </div>
        </div>
      )}
    </Fragment>
  );
}

export default EditarProducto;

