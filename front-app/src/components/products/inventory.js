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
        const res = await clienteAxios.get('/api/productos');

        // El servidor responde con un arreglo, así que res.data es el arreglo de productos.
        setProductos(res.data);
        setProductosFiltrados(res.data);

        setCargando(false);
    } catch (error) {
        console.log(error);
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
            const filtrados = productos.filter(producto =>
                producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
                producto.tipoPrenda.toLowerCase().includes(busqueda.toLowerCase()) ||
                producto._id.toLowerCase().includes(busqueda.toLowerCase())
            );
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
                type: 'warning',
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
                
                if (res.data.success) {
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
                    type: 'error',
                    title: 'Error al eliminar',
                    text: 'No se pudo eliminar el producto. Intente nuevamente.'
                });
            }
        }
    }

    // Formatear precio
    const formatearPrecio = (precio) => {
        return `$${precio.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    }

    // Truncar texto largo
    const truncarTexto = (texto, limite = 50) => {
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
                                            <td>{producto._id.substring(producto._id.length - 6).toUpperCase()}</td>
                                            <td>{producto.nombre}</td>
                                            <td>{formatearPrecio(producto.precio)}</td>
                                            <td>
                                                <span className={producto.cantidad <= 10 ? styles.stock_bajo : styles.stock_normal}>
                                                    {producto.cantidad}
                                                </span>
                                            </td>
                                            <td>{producto.tipoPrenda}</td>
                                            <td title={producto.descripcion}>
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
                                {productos.filter(p => p.cantidad <= 10).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

export default Inventario;