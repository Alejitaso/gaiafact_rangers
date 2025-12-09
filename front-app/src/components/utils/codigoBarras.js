import React, { useState, useEffect, Fragment, useRef } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './codigoBr.module.css';

// Componente para generar y descargar códigos de barras de productos
function CodigoBarras() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [codigoInput, setCodigoInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState('');
  
  const codigoInputRef = useRef(null);
  const timeoutRef = useRef(null);
  const anuncioRef = useRef(null);

  useEffect(() => {
    obtenerProductos();
  }, []);

  useEffect(() => {
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, []);

  // Anunciar cambios importantes para lectores de pantalla
  const anunciar = (mensaje, tipoAnuncio = 'polite') => {
    setMensajeEstado(mensaje);
    // Limpiar el mensaje después de un tiempo
    setTimeout(() => setMensajeEstado(''), 100);
  };

  // Obtiene la lista de productos desde el servidor
  const obtenerProductos = async () => {
    try {
      setCargando(true);
      anunciar('Cargando productos, por favor espere');
      
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
      anunciar(`${productosData.length} productos cargados exitosamente`);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setCargando(false);
      anunciar('Error al cargar productos');
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: 'No se pudieron cargar los productos. Intente nuevamente.',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Maneja el cambio en el input del código de barras
  const handleCodigoInput = (value) => {
    setCodigoInput(value);
  };

  // Busca un producto por su código de barras
  const buscarProductoPorCodigo = async (codigo) => {
    if (!codigo.trim()) {
      anunciar('Por favor ingrese un código de barras');
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
      anunciar('Buscando producto, por favor espere');
      
      // Buscar producto por código de barras
      const producto = productos.find(p => 
        p.codigo_barras_datos === codigo.trim()
      );

      setBuscando(false);

      if (producto) {
        // Verificar si ya está seleccionado
        const yaSeleccionado = productosSeleccionados.find(p => p._id === producto._id);
        
        if (yaSeleccionado) {
          anunciar(`El producto ${producto.nombre} ya está en la lista de códigos seleccionados`);
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
          anunciar(`Producto encontrado: ${producto.nombre}. Ingrese la cantidad de códigos a generar`);
          
          // Preguntar cantidad
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
                  <label for="cantidadCodigos" style="display: block; margin-bottom: 5px;">
                    <strong>¿Cuántos códigos desea generar?</strong>
                  </label>
                  <input 
                    type="number" 
                    id="cantidadCodigos" 
                    aria-label="Cantidad de códigos a generar"
                    aria-describedby="cantidadHelp"
                    value="1" 
                    min="1" 
                    max="100"
                    style="width: 80px; padding: 5px; border: 2px solid #276177; border-radius: 4px;"
                  />
                  <small id="cantidadHelp" style="display: block; margin-top: 5px; color: #666;">
                    Ingrese un número entre 1 y 100
                  </small>
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
            
            anunciar(`${cantidad} código${cantidad > 1 ? 's' : ''} de ${producto.nombre} agregado${cantidad > 1 ? 's' : ''} a la lista. Total de códigos seleccionados: ${productosSeleccionados.length + cantidad}`);
            
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
        anunciar(`No se encontró ningún producto con el código ${codigo}`);
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
      anunciar('Error al buscar el producto');
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

  // Elimina un código de la lista de seleccionados
  const eliminarProducto = (uniqueId) => {
    const producto = productosSeleccionados.find(p => p.uniqueId === uniqueId);
    setProductosSeleccionados(prev => prev.filter(p => p.uniqueId !== uniqueId));
    anunciar(`Código de ${producto?.nombre || 'producto'} eliminado. Códigos restantes: ${productosSeleccionados.length - 1}`);
  };

  // Elimina todos los códigos de un producto específico
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
        anunciar(`${cantidad} código${cantidad > 1 ? 's' : ''} de ${producto?.nombre || 'producto'} eliminado${cantidad > 1 ? 's' : ''}. Códigos restantes: ${productosSeleccionados.length - cantidad}`);
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
          anunciar('Todos los códigos han sido eliminados');
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

  // Descarga los códigos de barras seleccionados como imágenes
  const descargarCodigos = async () => {
    if (productosSeleccionados.length === 0) {
      anunciar('No hay productos seleccionados para descargar');
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
      anunciar(`Iniciando descarga de ${productosSeleccionados.length} códigos de barras`);
      
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
      
      anunciar(`Descarga completada. Se descargaron ${productosSeleccionados.length} códigos de barras`);
      
      Swal.fire({
        icon: 'success',
        title: '¡Descarga completada!',
        text: `Se descargaron ${productosSeleccionados.length} códigos de barras`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      anunciar('Error al descargar algunos códigos');
      Swal.fire({
        title: 'Error en la descarga',
        text: 'No se pudieron descargar algunos códigos',
        icon: 'error',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Imprime los códigos de barras seleccionados
  const imprimirCodigos = () => {
    if (productosSeleccionados.length === 0) {
      anunciar('No hay productos seleccionados para imprimir');
      Swal.fire({
        title: 'Sin productos',
        text: 'No hay productos seleccionados para imprimir',
        icon: 'warning',
        confirmButtonColor: '#276177',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    anunciar(`Abriendo vista de impresión para ${productosSeleccionados.length} códigos`);

    const ventanaImpresion = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              <img src="https://barcodeapi.org/api/128/${producto.codigo_barras_datos}" alt="Código de barras para ${producto.nombre}" />
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

  // Renderizado del componente
  return (
    <Fragment>
      {/* Región de anuncios en vivo para lectores de pantalla */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        ref={anuncioRef}
      >
        {mensajeEstado}
      </div>

      <div className={styles.content}>
        <div className={styles.form} role="main" aria-label="Generador de códigos de barras">
          
          {/* Título principal oculto visualmente pero accesible */}
          <h1 className="sr-only">Generador de códigos de barras</h1>
          
          <div className={styles.campo}>
            <label htmlFor="codigoBusqueda">
              {buscando ? (
                <><i className="fas fa-search fa-spin" aria-hidden="true"></i> Buscando producto...</>
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
              aria-describedby="codigoHelp"
              aria-required="true"
            />
            <span id="codigoHelp" className="sr-only">
              Ingrese el código de barras del producto y presione Enter o haga clic en el botón Buscar
            </span>
          </div>

          {/* Botón de búsqueda */}
          <div className={styles.campo}>
            <button
              type="button"
              onClick={() => buscarProductoPorCodigo(codigoInput)}
              disabled={cargando || buscando || !codigoInput.trim()}
              className={styles.btnBuscar}
              aria-label={`Buscar producto con código ${codigoInput || 'ingresado'}`}
            >
              <i className="fas fa-search" aria-hidden="true"></i> Buscar Producto
            </button>
          </div>

          {/* Previsualización de códigos seleccionados */}
          {productosSeleccionados.length > 0 ? (
            <section 
              className={styles.campo}
              aria-labelledby="seccionSeleccionados"
            >
              <h2 id="seccionSeleccionados">
                Códigos de Barras ({productosSeleccionados.length} seleccionados)
              </h2>
              <div className={styles.qr} role="region" aria-label="Lista de códigos seleccionados">
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
                      <article 
                        key={producto._id} 
                        className={styles.grupoProducto}
                        aria-label={`${producto.nombre}, ${cantidad} códigos`}
                      >
                        <div className={styles.headerGrupo}>
                          <span className={styles.cantidadBadge} aria-label={`${cantidad} códigos`}>
                            {cantidad}x
                          </span>
                          <button 
                            className={styles.btnEliminarTodos}
                            onClick={() => eliminarTodosDeUnProducto(producto._id)}
                            aria-label={`Eliminar todos los ${cantidad} códigos de ${producto.nombre}`}
                          >
                            <span aria-hidden="true">🗑️</span> Eliminar todos
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
                                alt={`Código de barras ${producto.codigo_barras_datos} para ${producto.nombre}`}
                                role="img"
                              />
                              <p className={styles.codigoNumero} aria-label={`Código: ${producto.codigo_barras_datos}`}>
                                {producto.codigo_barras_datos}
                              </p>
                            </>
                          )}
                        </div>
                        <div className={styles.listaItems} role="list" aria-label={`Lista de ${cantidad} códigos individuales`}>
                          {items.map((item, index) => (
                            <button
                              key={item.uniqueId}
                              className={styles.itemTag}
                              onClick={() => eliminarProducto(item.uniqueId)}
                              aria-label={`Eliminar código número ${index + 1} de ${producto.nombre}`}
                              role="listitem"
                            >
                              #{index + 1} <span aria-hidden="true">✕</span>
                            </button>
                          ))}
                        </div>
                      </article>
                    ));
                  })()}
                </div>
              </div>
            </section>
          ) : (
            <div className={styles.campo}>
              <h2 id="seccionVista">Vista Previa</h2>
              <div className={styles.qr} role="region" aria-labelledby="seccionVista">
                <div className={styles.mensajeVacio} role="status">
                  {cargando ? (
                    <><span aria-hidden="true">⏳</span> Cargando productos...</>
                  ) : (
                    <>
                      <span aria-hidden="true">📊</span> Escanee códigos de barras para agregarlos
                      <br />
                      <small>Los productos aparecerán aquí</small>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información */}
          <div className={styles.infoContador} role="status" aria-live="polite">
            <span>Total productos: <strong>{productos.length}</strong></span>
            <span>Seleccionados: <strong>{productosSeleccionados.length}</strong></span>
          </div>

          {/* Botones */}
          <nav className={styles.botones} aria-label="Acciones principales">
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={cancelar}
                disabled={cargando}
                aria-label="Cancelar y limpiar selección"
              >
                Cancelar
              </button>
            </div>
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={descargarCodigos} 
                disabled={productosSeleccionados.length === 0 || cargando}
                aria-label={`Descargar ${productosSeleccionados.length} códigos de barras`}
                aria-disabled={productosSeleccionados.length === 0}
              >
                Descargar
              </button>
            </div>
            <div className={styles.boton}>
              <button 
                type="button" 
                onClick={imprimirCodigos}
                disabled={productosSeleccionados.length === 0 || cargando}
                aria-label={`Imprimir ${productosSeleccionados.length} códigos de barras`}
                aria-disabled={productosSeleccionados.length === 0}
              >
                Imprimir
              </button>
            </div>
          </nav>

        </div>
      </div>
    </Fragment>
  );
}

export default CodigoBarras;