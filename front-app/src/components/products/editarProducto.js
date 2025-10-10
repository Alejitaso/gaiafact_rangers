import React, { Fragment, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './editarProducto.module.css';

const OPCIONES_PRENDA = [
  'Camisetas', 'Camisas', 'Pantalones', 'Jeans', 'Vestidos',
  'Faldas', 'Chaquetas', 'Buzos', 'Ropa interior', 'Accesorios'
];

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion_detallada: '',
    tipo_prenda: '',
    cantidad: '',
    precio: '',
    descuento: ''
  });

  const [cargando, setCargando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // ✅ Limpieza de popups al montar o cambiar ruta
  useEffect(() => {
    cerrarForzadoSweetAlert();
  }, [location.pathname]);

  useEffect(() => {
    const cargarProducto = async () => {
      if (!id) {
        setModoEdicion(false);
        setCargando(false);
        return;
      }

      setModoEdicion(true);
      
      try {
        setCargando(true);
        console.log('Cargando producto con ID:', id);
        const { data } = await clienteAxios.get(`/api/productos/${id}`);
        console.log('Datos recibidos:', data);
        
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
        console.log('Producto cargado correctamente');
      } catch (err) {
        console.error('Error cargando producto:', err);
        console.error('Detalles del error:', err.response?.data);
        Swal.fire('Error', 'No se pudo cargar el producto', 'error');
        navigate('/inventario');
      } finally {
        setCargando(false);
      }
    };

    cargarProducto();
  }, [id, navigate]);

  const cerrarForzadoSweetAlert = () => {
    try {
      Swal.close();
      const containers = document.querySelectorAll('.swal2-container');
      containers.forEach(c => c.remove());
      const popups = document.querySelectorAll('.swal2-popup');
      popups.forEach(p => p.remove());
    } catch (e) {
      console.warn("No había popups para cerrar");
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const { nombre, tipo_prenda, cantidad, precio } = producto;
    return !nombre.trim() || !tipo_prenda || cantidad === '' || precio === '';
  };

  const formatearPrecio = (precio) => {
    return Number(precio).toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const mostrarPopupPreview = (datosProducto) => {
    cerrarForzadoSweetAlert();
    
    const precioFinal = datosProducto.descuento 
      ? datosProducto.precio * (1 - datosProducto.descuento / 100)
      : datosProducto.precio;

    console.log('Mostrando popup de preview con datos:', datosProducto);

    Swal.fire({
      title: modoEdicion ? '¿Confirmar modificación?' : '¿Confirmar creación?',
      html: `
        <div style="text-align: left; margin: 15px 0;">
          <h4><i class="fas fa-box"></i> ${datosProducto.nombre}</h4>
          <p><strong>Cantidad:</strong> ${datosProducto.cantidad} unidades</p>
          <p><strong>Precio:</strong> ${formatearPrecio(datosProducto.precio)}</p>
          ${datosProducto.descuento ? `
            <p><strong>Descuento:</strong> ${datosProducto.descuento}%</p>
            <p><strong>Precio final:</strong> ${formatearPrecio(precioFinal)}</p>
          ` : ''}
          <p><strong>Tipo:</strong> ${datosProducto.tipo_prenda[0] || datosProducto.tipo_prenda}</p>
          <p><strong>Descripción:</strong> ${datosProducto.descripcion_detallada || 'Sin descripción'}</p>
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button id="btnConfirmar" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            <i class="fas fa-check"></i> Confirmar
          </button>
          <button id="btnCancelar" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      showCloseButton: false,
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html'
      },
      didOpen: () => {
        console.log('Popup abierto, configurando eventos...');
        
        const btnConfirmar = document.getElementById('btnConfirmar');
        const btnCancelar = document.getElementById('btnCancelar');
        
        if (btnConfirmar) {
          console.log('Botón confirmar encontrado');
          btnConfirmar.addEventListener('click', () => {
            console.log('Click en confirmar');
            Swal.close();
            enviarDatos(datosProducto);
          });
        } else {
          console.error('No se encontró el botón confirmar');
        }
        
        if (btnCancelar) {
          console.log('Botón cancelar encontrado');
          btnCancelar.addEventListener('click', () => {
            console.log('Click en cancelar');
            Swal.close();
          });
        } else {
          console.error('No se encontró el botón cancelar');
        }
      }
    });
  };

  const enviarDatos = async (datosProducto) => {
    try {
      setCargando(true);

      if (modoEdicion) {
        await clienteAxios.put(`/api/productos/${id}`, datosProducto);
        mostrarPopupExito(datosProducto);
      } else {
        await clienteAxios.post('/api/productos', datosProducto);
        mostrarPopupExito(datosProducto);
      }
    } catch (err) {
      console.error('Error procesando producto:', err);
      console.error('Detalles:', err.response?.data);
      const mensaje = err.response?.data?.mensaje || 
        `No se pudo ${modoEdicion ? 'actualizar' : 'crear'} el producto`;
      Swal.fire('Error', mensaje, 'error');
    } finally {
      setCargando(false);
    }
  };

  const mostrarPopupExito = (productoGuardado) => {
    cerrarForzadoSweetAlert();
    
    Swal.fire({
      title: modoEdicion ? '¡Producto modificado correctamente!' : '¡Producto creado correctamente!',
      html: `
        <div style="text-align: left; margin: 15px 0;">
          <h4><i class="fas fa-check-circle" style="color: #28a745;"></i> ${productoGuardado.nombre}</h4>
          <p><strong>Cantidad:</strong> ${productoGuardado.cantidad} unidades</p>
          <p><strong>Precio:</strong> $${formatearPrecio(productoGuardado.precio)}</p>
          <p><strong>Tipo:</strong> ${productoGuardado.tipo_prenda}</p>
        </div>
        <div>
          <button id="btnInventario" class="swal2-custom-btn">
            <i class="fas fa-boxes"></i> Ir a Inventario
          </button>
          <button id="btnContinuar" class="swal2-custom-btn">
            <i class="fas fa-plus"></i> ${modoEdicion ? 'Editar Otro' : 'Crear Otro'}
          </button>
        </div>
      `,
      showConfirmButton: false,
      backdrop: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-html'
      },
      willClose: cerrarForzadoSweetAlert,
      didOpen: () => {
        const cerrarYNavegar = (ruta) => {
          cerrarForzadoSweetAlert();
          setTimeout(() => navigate(ruta), 100);
        };

        document.getElementById('btnInventario').addEventListener('click', () => {
          cerrarYNavegar('/inventario');
        });
        
        document.getElementById('btnContinuar').addEventListener('click', () => {
          cerrarForzadoSweetAlert();
          if (!modoEdicion) {
            // Si estamos creando, limpiar el formulario
            setProducto({
              nombre: '',
              descripcion_detallada: '',
              tipo_prenda: '',
              cantidad: '',
              precio: '',
              descuento: ''
            });
          }
        });
      }
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      Swal.fire('Error', 'Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    const payload = {
      nombre: producto.nombre.trim(),
      descripcion: producto.nombre.trim(),
      descripcion_detallada: producto.descripcion_detallada.trim(),
      tipo_prenda: [producto.tipo_prenda],
      cantidad: Number(producto.cantidad),
      precio: Number(producto.precio),
      ...(producto.descuento !== '' ? { descuento: Number(producto.descuento) } : {})
    };

    console.log('Mostrando preview con datos:', payload);
    mostrarPopupPreview(payload);
  };

  const manejarSalir = () => {
    navigate('/inventario');
  };

  if (cargando && modoEdicion) {
    return (
      <div className={styles.registerForm}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: '24px' }}></i>
          <p>Cargando producto...</p>
        </div>
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
            disabled={validarFormulario() || cargando}
          >
            {cargando ? (
              <>
                <i className="fa fa-spinner fa-spin"></i>
                {' '}Procesando...
              </>
            ) : (
              modoEdicion ? 'Modificar' : 'Editar'
            )}
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
    </Fragment>
  );
}

export default EditarProducto;