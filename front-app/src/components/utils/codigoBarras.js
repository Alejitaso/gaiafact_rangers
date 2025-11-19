import React, { useState, useEffect, Fragment, useRef } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './codigoBr.module.css';

function CodigoBarras() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [codigoInput, setCodigoInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  
  const codigoInputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    obtenerProductos();
  }, []);

  useEffect(() => {
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, []);

  const obtenerProductos = async () => {
    try {
      setCargando(true);
      const res = await clienteAxios.get('/api/productos');
      
      let productosData;
      if (Array.isArray(res.data)) {
        productosData = res.data;
      } else if (res.data && Array.isArray(res.data.productos)) {
        productosData = res.data.productos;
      } else if (res.data && Array.isArray(res.data.data)) {
        productosData = res.data.data;
      } else {
        productosData = [];
      }
      
      setProductos(productosData);
      setCargando(false);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setCargando(false);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: 'No se pudieron cargar los productos. Intente nuevamente.',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCodigoInput = (value) => {
    setCodigoInput(value);
  };

  const buscarProductoPorCodigo = async (codigo) => {
    if (!codigo.trim()) {
      Swal.fire({
        title: 'Campo vacío',
        text: 'Por favor ingrese un código de barras',
        icon: 'warning',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      setBuscando(true);
      
      // Buscar producto por código de barras
      const producto = productos.find(p => 
        p.codigo_barras_datos === codigo.trim()
      );

      setBuscando(false);

      if (producto) {
        // Verificar si ya está seleccionado
        const yaSeleccionado = productosSeleccionados.find(p => p._id === producto._id);
        
        if (yaSeleccionado) {
          Swal.fire({
            title: 'Producto ya seleccionado',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p style="color: #666; line-height: 1.6;">
                  <strong>${producto.nombre}</strong> ya está en la lista de códigos seleccionados.
                </p>
              </div>
            `,
            icon: 'info',
            confirmButtonColor: '#276177',
            confirmButtonText: 'Entendido',
            timer: 2000,
            showConfirmButton: true
          });
        } else {
          const result = await Swal.fire({
            title: '¿Agregar códigos de barras?',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <h4 style="color: #254454; margin-bottom: 15px;">
                  <i class="fas fa-box"></i> ${producto.nombre}
                </h4>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Código:</strong> ${producto.codigo_barras_datos}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Stock disponible:</strong> ${producto.cantidad} unidades
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Tipo:</strong> ${producto.tipo_prenda || 'N/A'}
                </p>
                <div style="margin-top: 15px;">
                  <label style="display: block; margin-bottom: 5px;">
                    <strong>¿Cuántos códigos desea generar?</strong>
                  </label>
                  <input 
                    type="number" 
                    id="cantidadCodigos" 
                    value="1" 
                    min="1" 
                    max="100"
                    style="width: 80px; padding: 5px; border: 2px solid #276177; border-radius: 4px;"
                  />
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#276177',
            cancelButtonColor: '#d33',
            didOpen: () => {
              const input = document.getElementById('cantidadCodigos');
              input.focus();
              input.select();
            },
            preConfirm: () => {
              const cantidadInput = document.getElementById('cantidadCodigos');
              const cantidad = parseInt(cantidadInput.value);
              
              if (cantidad <= 0) {
                Swal.showValidationMessage('La cantidad debe ser mayor a 0');
                return false;
              }
              
              if (cantidad > 100) {
                Swal.showValidationMessage('La cantidad máxima es 100');
                return false;
              }
              
              return cantidad;
            }
          });

          if (result.isConfirmed) {
            const cantidad = result.value;
            
            for (let i = 0; i < cantidad; i++) {
              setProductosSeleccionados(prev => [...prev, { ...producto, uniqueId: `${producto._id}-${Date.now()}-${i}` }]);
            }
            
            Swal.fire({
              icon: 'success',
              title: '¡Códigos agregados!',
              text: `${cantidad} código(s) de ${producto.nombre} agregados a la lista`,
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
        
        // Limpiar input
        setCodigoInput('');
        codigoInputRef.current?.focus();
      } else {
        Swal.fire({
          title: 'Producto no encontrado',
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p style="color: #666; line-height: 1.6;">
                No se encontró ningún producto con código: <strong>${codigo}</strong>
              </p>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#276177',
          confirmButtonText: 'Entendido'
        });
        setCodigoInput('');
      }
    } catch (error) {
      setBuscando(false);
      console.error('Error al buscar producto:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al buscar el producto',
        icon: 'error',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarProductoPorCodigo(codigoInput);
    }
  };

  const eliminarProducto = (uniqueId) => {
    setProductosSeleccionados(prev => prev.filter(p => p.uniqueId !== uniqueId));
  };

  const eliminarTodosDeUnProducto = (productoId) => {
    const producto = productosSeleccionados.find(p => p._id === productoId);
    const cantidad = productosSeleccionados.filter(p => p._id === productoId).length;
    
    Swal.fire({
      title: '¿Eliminar todos los códigos?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ¿Desea eliminar <strong>${cantidad} código(s)</strong> de barras de:<br/>
            <strong>${producto?.nombre || 'este producto'}</strong>?
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">
            Esta acción no se puede deshacer.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todos',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setProductosSeleccionados(prev => prev.filter(p => p._id !== productoId));
        Swal.fire({
          icon: 'success',
          title: 'Eliminados',
          text: 'Todos los códigos fueron eliminados',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  const cancelar = () => {
    if (productosSeleccionados.length > 0) {
      Swal.fire({
        title: '¿Cancelar selección?',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">
              Tiene <strong>${productosSeleccionados.length} código(s)</strong> seleccionados.
            </p>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
              ¿Desea eliminar todos los códigos seleccionados?
            </p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, continuar'
      }).then((result) => {
        if (result.isConfirmed) {
          setProductosSeleccionados([]);
          setCodigoInput('');
          codigoInputRef.current?.focus();
          Swal.fire({
            icon: 'success',
            title: 'Cancelado',
            text: 'Los códigos han sido eliminados',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    } else {
      setProductosSeleccionados([]);
      setCodigoInput('');
      codigoInputRef.current?.focus();
    }
  };

  const descargarCodigos = async () => {
    if (productosSeleccionados.length === 0) {
      Swal.fire({
        title: 'Sin productos',
        text: 'No hay productos seleccionados para descargar',
        icon: 'warning',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      for (const producto of productosSeleccionados) {
        if (producto.codigo_barras_datos) {
          const urlCodigoBarras = `https://barcodeapi.org/api/128/${producto.codigo_barras_datos}`;
          const response = await fetch(urlCodigoBarras);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `codigo-${producto.nombre}-${producto.codigo_barras_datos}.png`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
      Swal.fire({
        icon: 'success',
        title: '¡Descarga completada!',
        text: `Se descargaron ${productosSeleccionados.length} códigos de barras`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      Swal.fire({
        title: 'Error en la descarga',
        text: 'No se pudieron descargar algunos códigos',
        icon: 'error',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const imprimirCodigos = () => {
    if (productosSeleccionados.length === 0) {
      Swal.fire({
        title: 'Sin productos',
        text: 'No hay productos seleccionados para imprimir',
        icon: 'warning',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Códigos de Barras - Impresión</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            padding: 20px;
            background: white;
          }
          .codigo-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: flex-start;
          }
          .codigo-item {
            border: 2px solid #254454;
            padding: 15px;
            text-align: center;
            page-break-inside: avoid;
            width: 280px;
            background: white;
            border-radius: 8px;
          }
          .codigo-item h3 {
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: bold;
            color: #254454;
            word-wrap: break-word;
          }
          .codigo-item img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
          }
          .codigo-item p {
            margin: 10px 0 0 0;
            font-size: 12px;
            font-weight: bold;
            color: #254454;
            font-family: monospace;
          }
          @media print {
            body {
              padding: 10px;
            }
            .codigo-item {
              margin-bottom: 15px;
            }
            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="codigo-container">
          ${productosSeleccionados.map(producto => `
            <div class="codigo-item">
              <h3>${producto.nombre}</h3>
              <img src="https://barcodeapi.org/api/128/${producto.codigo_barras_datos}" alt="Código de barras" />
              <p>${producto.codigo_barras_datos}</p>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
  };

  return (
    <Fragment>
      <div className={styles.content}>
        <div className={styles.form}>
          
          <div className={styles.campo}>
            <label htmlFor="codigoBusqueda">
              {buscando ? (
                <><i className="fas fa-search fa-spin"></i> Buscando producto...</>
              ) : (
                'Escanee o ingrese código de barras del producto'
              )}
            </label>
            <input
              ref={codigoInputRef}
              type="text"
              id="codigoBusqueda"
              name="codigoBusqueda"
              placeholder="Código de barras del producto..."
              value={codigoInput}
              onChange={(e) => handleCodigoInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={cargando || buscando}
            />
          </div>

          {/* Botón de búsqueda */}
          <div className={styles.campo}>
            <button
              type="button"
              onClick={() => buscarProductoPorCodigo(codigoInput)}
              disabled={cargando || buscando || !codigoInput.trim()}
              className={styles.btnBuscar}
            >
              <i className="fas fa-search"></i> Buscar Producto
            </button>
          </div>

          {/* Previsualización de códigos seleccionados */}
          {productosSeleccionados.length > 0 ? (
            <div className={styles.campo}>
              <label>Códigos de Barras ({productosSeleccionados.length} seleccionados)</label>
              <div className={styles.qr}>
                <div className={styles.previsualizacion}>
                  {(() => {
                    const productosAgrupados = productosSeleccionados.reduce((acc, producto) => {
                      if (!acc[producto._id]) {
                        acc[producto._id] = {
                          producto: producto,
                          cantidad: 0,
                          items: []
                        };
                      }
                      acc[producto._id].cantidad++;
                      acc[producto._id].items.push(producto);
                      return acc;
                    }, {});

                    return Object.values(productosAgrupados).map(({ producto, cantidad, items }) => (
                      <div key={producto._id} className={styles.grupoProducto}>
                        <div className={styles.headerGrupo}>
                          <span className={styles.cantidadBadge}>{cantidad}x</span>
                          <button 
                            className={styles.btnEliminarTodos}
                            onClick={() => eliminarTodosDeUnProducto(producto._id)}
                            title="Eliminar todos los códigos de este producto"
                          >
                            🗑️ Eliminar todos
                          </button>
                        </div>
                        <div className={styles.codigoPreview}>
                          <p className={styles.nombreProducto}>
                            {producto.nombre}
                          </p>
                          {producto.codigo_barras_datos && (
                            <>
                              <img
                                src={`https://barcodeapi.org/api/128/${producto.codigo_barras_datos}`}
                                alt="Código de barras"
                              />
                              <p className={styles.codigoNumero}>
                                {producto.codigo_barras_datos}
                              </p>
                            </>
                          )}
                        </div>
                        <div className={styles.listaItems}>
                          {items.map((item, index) => (
                            <button
                              key={item.uniqueId}
                              className={styles.itemTag}
                              onClick={() => eliminarProducto(item.uniqueId)}
                              title="Eliminar este código"
                            >
                              #{index + 1} ✕
                            </button>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.campo}>
              <label>Vista Previa</label>
              <div className={styles.qr}>
                <div className={styles.mensajeVacio}>
                  {cargando ? (
                    <>⏳ Cargando productos...</>
                  ) : (
                    <>
                      📊 Escanee códigos de barras para agregarlos
                      <br />
                      <small>Los productos aparecerán aquí</small>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información */}
          <div className={styles.infoContador}>
            <span>Total productos: <strong>{productos.length}</strong></span>
            <span>Seleccionados: <strong>{productosSeleccionados.length}</strong></span>
          </div>

          {/* Botones */}
          <div className={styles.botones}>
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={cancelar}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={descargarCodigos} 
                disabled={productosSeleccionados.length === 0 || cargando}
              >
                Descargar
              </button>
            </div>
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={imprimirCodigos}
                disabled={productosSeleccionados.length === 0 || cargando}
              >
                Imprimir
              </button>
            </div>
          </div>

        </div>
      </div>
    </Fragment>
  );
}

export default CodigoBarras;  