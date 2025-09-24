import React, { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import styles from "./inventory.module.css";

function Inventario() {
    // Hooks para la navegación
    const navigate = useNavigate();

    // Estados del componente
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    // Cargar productos al montar el componente
    useEffect(() => {
        obtenerProductos();
    }, []);

    // Filtrar productos cuando cambia la búsqueda
    useEffect(() => {
        filtrarProductos();
    }, [busqueda, productos]);

    // Función para obtener todos los productos
    const obtenerProductos = async () => {
        try {
            setCargando(true);
            console.log('🔍 Obteniendo productos...');
            const res = await clienteAxios.get('/api/productos');
            
            console.log('📦 Respuesta del servidor:', res.data);
            console.log('📦 Tipo de datos:', typeof res.data);
            console.log('📦 Es array?:', Array.isArray(res.data));
            
            // Manejar diferentes estructuras de respuesta
            let productosData;
            if (Array.isArray(res.data)) {
                productosData = res.data;
            } else if (res.data && Array.isArray(res.data.productos)) {
                productosData = res.data.productos;
            } else if (res.data && Array.isArray(res.data.data)) {
                productosData = res.data.data;
            } else {
                console.warn('⚠️ Estructura de respuesta inesperada');
                productosData = [];
            }
            
            console.log('✅ Productos cargados:', productosData.length);
            setProductos(productosData);
            setProductosFiltrados(productosData);
            setCargando(false);
            
        } catch (error) {
            console.error('❌ Error al obtener productos:', error);
            setCargando(false);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar productos',
                text: 'No se pudieron cargar los productos. Intente nuevamente.'
            });
        }
    };

    // Función para filtrar productos
    const filtrarProductos = () => {
        if (!busqueda.trim()) {
            setProductosFiltrados(productos);
        } else {
            const filtrados = productos.filter(producto => {
                // Verificar que las propiedades existan antes de usar toLowerCase()
                const nombre = producto.nombre || '';
                const descripcion = producto.descripcion || '';
                // CAMBIO IMPORTANTE: usar producto.tipo_prenda en lugar de producto.tipoPrenda
                const tipoPrenda = producto.tipo_prenda || producto.tipoPrenda || '';
                const id = producto._id || '';
                
                return nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                       descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
                       tipoPrenda.toLowerCase().includes(busqueda.toLowerCase()) ||
                       id.toLowerCase().includes(busqueda.toLowerCase());
            });
            setProductosFiltrados(filtrados);
        }
    }

    // Manejar cambio en el input de búsqueda
    const manejarBusqueda = (e) => {
        setBusqueda(e.target.value);
    }

    // Seleccionar producto (para modificar)
    const seleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        // Cambiar el estilo visual del producto seleccionado
        const filas = document.querySelectorAll(`.${styles.inventory_table} tbody tr`);
        filas.forEach(fila => fila.classList.remove(styles.selected));
        
        const filaSeleccionada = document.querySelector(`tr[data-id="${producto._id}"]`);
        if (filaSeleccionada) {
            filaSeleccionada.classList.add(styles.selected);
        }
    }

    // Función para modificar producto
    const modificarProducto = () => {
        if (!productoSeleccionado) {
            Swal.fire({
                icon: 'warning', // CAMBIO: 'type' por 'icon'
                title: 'No hay producto seleccionado',
                text: 'Por favor selecciona un producto de la tabla para modificar.'
            });
            return;
        }
        
        // Redirigir a la página de modificación con el ID del producto
        navigate(`/productos/modificar/${productoSeleccionado._id}`);
    }

    // Función para agregar nuevo producto
    const agregarProducto = () => {
        navigate('/registroproduct');
    }

    // Función para eliminar producto
    const eliminarProducto = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar el producto "${nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const res = await clienteAxios.delete(`/api/productos/${id}`);
                
                // CAMBIO: Verificar tanto success como status 200
                if (res.data.success || res.status === 200) {
                    Swal.fire(
                        'Eliminado',
                        'El producto ha sido eliminado correctamente.',
                        'success'
                    );
                    // Recargar la lista de productos
                    obtenerProductos();
                    setProductoSeleccionado(null);
                }
            } catch (error) {
                console.log(error);
                Swal.fire({
                    icon: 'error', // CAMBIO: 'type' por 'icon'
                    title: 'Error al eliminar',
                    text: 'No se pudo eliminar el producto. Intente nuevamente.'
                });
            }
        }
    }

    // Formatear precio
    const formatearPrecio = (precio) => {
        // CAMBIO: Manejar casos donde precio sea null/undefined
        const precioNum = Number(precio) || 0;
        return `$${precioNum.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    }

    // Truncar texto largo
    const truncarTexto = (texto, limite = 50) => {
        // CAMBIO: Verificar que texto exista
        if (!texto) return '';
        return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
    }

    return (
        <Fragment>
            <div className={styles.content}>
                <div className={styles.table_box}>
                    {/* Barra de búsqueda */}
                    <div className={styles.search_bar}>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, descripción, tipo o ID..."
                            value={busqueda}
                            onChange={manejarBusqueda}
                        />
                        <i className="fa-solid fa-search"></i>
                    </div>

                    {/* Información del inventario */}
                    <div className="inventory-info">
                        <p>Total de productos: <strong>{productosFiltrados.length}</strong></p>
                        {busqueda && (
                            <p>Mostrando resultados para: "<strong>{busqueda}</strong>"</p>
                        )}
                        {productoSeleccionado && (
                            <p>Producto seleccionado: <strong>{productoSeleccionado.nombre}</strong></p>
                        )}
                    </div>

                    {/* Tabla de inventario */}
                    {cargando ? (
                        <div className={styles.loading}>
                            <i className="fa fa-spinner fa-spin"></i>
                            <p>Cargando inventario...</p>
                        </div>
                    ) : (
                        <table className={styles.inventory_table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Precio</th>
                                    <th>Cantidad</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className={styles.no_productos}>
                                            {busqueda ? 
                                                'No se encontraron productos que coincidan con la búsqueda.' : 
                                                'No hay productos registrados.'
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    productosFiltrados.map(producto => (
                                        <tr 
                                            key={producto._id}
                                            data-id={producto._id}
                                            onClick={() => seleccionarProducto(producto)}
                                            className={productoSeleccionado && productoSeleccionado._id === producto._id ? styles.selected : ''}
                                        >
                                            <td>
                                                {/* CAMBIO: Verificar que _id exista */}
                                                {producto._id ? producto._id.substring(producto._id.length - 6).toUpperCase() : 'N/A'}
                                            </td>
                                            <td>{producto.nombre || 'N/A'}</td>
                                            <td>{formatearPrecio(producto.precio)}</td>
                                            <td>
                                                <span className={(producto.cantidad || 0) <= 10 ? styles.stock_bajo : styles.stock_normal}>
                                                    {producto.cantidad || 0}
                                                </span>
                                            </td>
                                            <td>{producto.tipo_prenda || 'N/A'}</td>
                                            <td title={producto.descripcion || ''}>
                                                {truncarTexto(producto.descripcion)}
                                            </td>
                                            <td className={styles.acciones}>
                                                <button 
                                                    className={`${styles.btn_accion} ${styles.btn_eliminar}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        eliminarProducto(producto._id, producto.nombre);
                                                    }}
                                                    title="Eliminar producto"
                                                >
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Botones de acción */}
                    <div className={styles.botones}>
                        <div className={styles.boton}>
                            <button 
                                className={`${styles.enviar} ${styles.btn_modificar}`} 
                                onClick={modificarProducto}
                                disabled={!productoSeleccionado}
                            >
                                <i className="fa fa-edit"></i>
                                {' '}Modificar Seleccionado
                            </button>
                        </div>
                        <div className={styles.boton}>
                            <button 
                                className={`${styles.enviar} ${styles.btn_agregar}`} 
                                onClick={agregarProducto}
                            >
                                <i className="fa fa-plus"></i>
                                {' '}Agregar Nuevo
                            </button>
                        </div>
                        <div className={styles.boton}>
                            <button 
                                className={`${styles.enviar} ${styles.btn_actualizar}`} 
                                onClick={obtenerProductos}
                            >
                                <i className="fa fa-refresh"></i>
                                {' '}Actualizar Lista
                            </button>
                        </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className={styles.estadisticas}>
                        <div className={styles.stat_card}>
                            <h4>Total Productos</h4>
                            <p>{productos.length}</p>
                        </div>
                        <div className={styles.stat_card}>
                            <h4>Stock Bajo</h4>
                            <p className={styles.stock_bajo}>
                                {productos.filter(p => (p.cantidad || 0) <= 10).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

export default Inventario;