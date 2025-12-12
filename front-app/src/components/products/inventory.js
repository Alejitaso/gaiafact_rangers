import React, { Fragment, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import styles from "./inventory.module.css";


// Componente de inventario de productos
function Inventario() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Accesibilidad
  const buscarRef = useRef(null);
  const anuncioRef = useRef(null);

  const anunciar = (mensaje) => {
    if (anuncioRef.current) {
      anuncioRef.current.textContent = mensaje;
      setTimeout(() => (anuncioRef.current.textContent = ""), 1000);
    }
  };

  useEffect(() => {
    obtenerProductos();
    // Focus al campo de búsqueda al cargar
    setTimeout(() => buscarRef.current?.focus(), 400);
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, productos]);

  // Obtener productos desde la API
  const obtenerProductos = async () => {
    anunciar("Cargando inventario");
    try {
      setCargando(true);
      const res = await clienteAxios.get("/api/productos");
      let productosData = [];
      if (Array.isArray(res.data)) productosData = res.data;
      else if (res.data?.productos) productosData = res.data.productos;
      else if (res.data?.data) productosData = res.data.data;
      setProductos(productosData);
      setProductosFiltrados(productosData);
      anunciar(`${productosData.length} productos cargados`);
    } catch (error) {
      anunciar("Error al cargar productos");
      Swal.fire({
        icon: "error",
        title: "Error al cargar productos",
        text: "No se pudieron cargar los productos. Intente nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };

  // Filtrar productos según búsqueda
  const filtrarProductos = () => {
    if (!busqueda.trim()) return setProductosFiltrados(productos);
    const filtrados = productos.filter((p) => {
      const texto = `${p.nombre || ""} ${p.descripcion || ""} ${p.tipo_prenda || ""} ${p.codigo_barras_datos || ""}`.toLowerCase();
      return texto.includes(busqueda.toLowerCase());
    });
    setProductosFiltrados(filtrados);
  };

  const manejarBusqueda = (e) => setBusqueda(e.target.value);

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    anunciar(`Seleccionado: ${producto.nombre}`);
  };

  // Navegar a la página de modificación del producto seleccionado
  const modificarProducto = () => {
    if (!productoSeleccionado) {
      anunciar("Error: no hay producto seleccionado");
      return Swal.fire({
        icon: "warning",
        title: "No hay producto seleccionado",
        text: "Por favor selecciona un producto de la tabla para modificar.",
      });
    }
    navigate(`/productos/editar/${productoSeleccionado._id}`);
  };

  // Navegar a la página de agregar nuevo producto
  const agregarProducto = () => navigate("/registroproduct");

  // Eliminar producto seleccionado
  const eliminarProducto = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el producto "${nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await clienteAxios.delete(`/api/productos/${id}`);
      if (res.data.success || res.status === 200) {
        anunciar(`Producto ${nombre} eliminado`);
        Swal.fire("Eliminado", "El producto ha sido eliminado correctamente.", "success");
        obtenerProductos();
        setProductoSeleccionado(null);
      }
    } catch (error) {
      anunciar("Error al eliminar producto");
      Swal.fire({ icon: "error", title: "Error al eliminar", text: "Intente nuevamente." });
    }
  };

  const formatearPrecio = (precio) => {
    const p = Number(precio) || 0;
    return `$${p.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const truncarTexto = (texto, limite = 50) => {
    if (!texto) return "";
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
  };

  //  Lógica original sin cambios de nombres
const descargarCodigoBarras = async (idProducto) => {
  try {
    const res = await clienteAxios.get(`/api/productos/${idProducto}`);
    const codigoBarras = res.data.codigo_barras_datos;

    if (!codigoBarras) {
      Swal.fire('Error', 'No hay código de barras', 'error');
      return;
    }

    const urlCodigoBarras = `https://barcodeapi.org/api/128/${codigoBarras}`;

    Swal.fire({
      title: 'Código de Barras',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${urlCodigoBarras}" alt="Código de barras" style="max-width: 400px; margin: 20px 0;" />
          <p style="color: var(--color-tres); font-weight: bold; margin: 10px 0;">
            ${codigoBarras}
          </p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      denyButtonText: 'Imprimir',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#276177',
      denyButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      backdrop: true,
      allowOutsideClick: true,
      allowEscapeKey: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(urlCodigoBarras);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `codigo-${codigoBarras}.png`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error al descargar:', error);
          Swal.fire('Error', 'No se pudo descargar la imagen', 'error');
        }
      } else if (result.isDenied) {
        try {
          const response = await fetch(urlCodigoBarras);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const ventana = window.open(url, '_blank');
          ventana.addEventListener('load', () => {
            ventana.print();
            window.URL.revokeObjectURL(url);
          });
        } catch (error) {
          console.error('Error al imprimir:', error);
          Swal.fire('Error', 'No se pudo imprimir', 'error');
        }
      }
    });
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'No se pudo obtener el código', 'error');
  }
};

  // Renderizado del componente
  return (
    <Fragment>
      {/* ✅ Anuncios en vivo */}
      <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

      <div className={styles.content} role="main" aria-label="Inventario de productos">
        <div className={styles.table_box}>
          {/* Búsqueda */}
          <div className={styles.searchArea}>
  
          {/* Búsqueda */}
          <div className={styles.search_bar}>
            <label htmlFor="busquedaInv" className="sr-only">Buscar productos</label>
            <input
              ref={buscarRef}
              id="busquedaInv"
              type="text"
              placeholder="Buscar por nombre, descripción, tipo o ID..."
              value={busqueda}
              onChange={manejarBusqueda}
              aria-describedby="resultadosCount"
            />
            <i className="fa-solid fa-search" aria-hidden="true"></i>
          </div>

          {/* Botón */}
          <button 
            className={styles.solicitudesBtn}
            onClick={() => navigate("/solicitudes")}
          >
            <i className="fa-solid fa-clipboard-check"></i>
            Solicitudes Pendientes
          </button>

        </div>


          {/* Info inventario */}
          <div className="inventory-info" role="status" id="resultadosCount">
            <p>Total de productos: <strong>{productosFiltrados.length}</strong></p>
            {busqueda && <p>Mostrando resultados para: "<strong>{busqueda}</strong>"</p>}
            {productoSeleccionado && <p>Producto seleccionado: <strong>{productoSeleccionado.nombre}</strong></p>}
          </div>

          {/* Tabla */}
          {cargando ? (
            <div className={styles.loading} role="status">
              <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
              <p>Cargando inventario...</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
            <table className={styles.inventory_table} role="table" aria-label="Tabla de productos">
              <thead>
                <tr>
                  <th scope="col">Código barras</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.no_productos}>
                      {busqueda ? "No se encontraron productos." : "No hay productos registrados."}
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => (
                    <tr
                      key={p._id}
                      data-id={p._id}
                      onClick={() => seleccionarProducto(p)}
                      className={productoSeleccionado?._id === p._id ? styles.selected : ""}
                      aria-label={`Producto ${p.nombre}`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && seleccionarProducto(p)}
                    >
                      <td>{p.codigo_barras_datos || "Sin código"}</td>
                      <td>{p.nombre || "N/A"}</td>
                      <td>
                        {formatearPrecio(p.precio)}
                        {p.descuento > 0 && (<><br /><small style={{ color: 'green' }}>-{p.descuento}% dto</small></>)}
                      </td>
                      <td>
                        <span className={(p.cantidad || 0) <= 10 ? styles.stock_bajo : styles.stock_normal}>
                          {p.cantidad || 0}
                        </span>
                      </td>
                      <td>{p.tipo_prenda || "N/A"}</td>
                      <td title={p.descripcion || ""}>{truncarTexto(p.descripcion)}</td>
                      <td className={styles.acciones}>
                        <button
                          className={`${styles.btn_accion} ${styles.btn_descargar}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            descargarCodigoBarras(p._id);
                          }}
                          aria-label={`Descargar código de barras de ${p.nombre}`}
                        >
                          <i className="fa fa-barcode" aria-hidden="true"></i>
                        </button>
                        <button
                          className={`${styles.btn_accion} ${styles.btn_eliminar}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarProducto(p._id, p.nombre);
                          }}
                          aria-label={`Eliminar producto ${p.nombre}`}
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div> 
          )}

          {/* Botones */}
          <div className={styles.botones} role="group" aria-label="Acciones de inventario">
            <div className={styles.boton}>
              <button className={`${styles.enviar} ${styles.btn_modificar}`} onClick={modificarProducto} disabled={!productoSeleccionado}>
                <i className="fa fa-edit" aria-hidden="true"></i> Modificar Seleccionado
              </button>
            </div>
            <div className={styles.boton}>
              <button className={`${styles.enviar} ${styles.btn_agregar}`} onClick={agregarProducto}>
                <i className="fa fa-plus" aria-hidden="true"></i> Agregar Nuevo
              </button>
            </div>
            <div className={styles.boton}>
              <button className={`${styles.enviar} ${styles.btn_actualizar}`} onClick={obtenerProductos}>
                <i className="fa fa-refresh" aria-hidden="true"></i> Actualizar Lista
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <section className={styles.estadisticas} aria-label="Estadísticas rápidas">
            <div className={styles.stat_card}>
              <h4>Total Productos</h4>
              <p>{productos.length}</p>
            </div>
            <div className={styles.stat_card}>
              <h4>Stock Bajo</h4>
              <p className={styles.stock_bajo}>{productos.filter((p) => (p.cantidad || 0) <= 10).length}</p>
            </div>
          </section>
        </div>
      </div>
    </Fragment>
  );
}

export default Inventario;