import React, { useState, Fragment, useRef } from 'react';
import Swal from 'sweetalert2';
import NotificacionesPanel from '../admin/NotifyPanel.js';  
import clienteAxios from '../../config/axios';
import styles from './notify.module.css';

function NotificacionesMejorado() {
   // ESTADOS DEL COMPONENTE
  const [numeroFactura, setNumeroFactura] = useState('');
  const [facturaData, setFacturaData] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // ✅ Referencias para accesibilidad
  const inputRef = useRef(null);
  const anuncioRef = useRef(null);

  // ✅ Anunciar mensajes a lectores de pantalla
  const anunciar = (mensaje) => {
    if (anuncioRef.current) {
      anuncioRef.current.textContent = mensaje;
      setTimeout(() => (anuncioRef.current.textContent = ''), 1000);
    }
  };

  // ✅ Focus al cargar
  useState(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const calcularSubtotalReal = (factura) => {
    const subtotalConDescuento = factura.subtotal || 0;
    const descuentoTotal = Math.abs(factura.descuento_total || 0);
    return subtotalConDescuento + descuentoTotal;
  };

  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      setError('Por favor ingrese un número de factura');
      anunciar('Error: por favor ingrese un número de factura');
      return;
    }
    //estado de carga
    setBuscando(true);
    setError('');
    setFacturaData(null);
    setClienteData(null);
    anunciar('Buscando factura...');

    try {
      const resFactura = await clienteAxios.get(`/api/facturas/buscar-factura/${numeroFactura}`);
      if (!resFactura.data) throw new Error('Factura no encontrada');

      const factura = resFactura.data;
      setFacturaData(factura);

      let cliente = factura.usuario;
      if (factura.usuario?.numero_documento) {
        try {
          const resCliente = await clienteAxios.get(`api/Usuario/documento/${factura.usuario.numero_documento}`);
          setClienteData(resCliente.data.usuario);
        } catch (err) {
          console.warn('Cliente no encontrado en base de datos, usando datos de factura');
          setClienteData(factura.usuario);
        }
      }
      setClienteData(cliente);

      const correo = cliente?.correo_electronico;
      if (!correo) {
        anunciar('Cliente sin correo electrónico');
        const result = await Swal.fire({
          title: 'Sin correo electrónico',
          text: 'Este cliente no tiene correo registrado. ¿Desea ingresarlo?',
          input: 'email',
          inputPlaceholder: 'correo@ejemplo.com',
          showCancelButton: true,
          confirmButtonText: 'Guardar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#276177',
        });
        if (result.isConfirmed && result.value) {
          setClienteData({ ...cliente, correo_electronico: result.value });
          anunciar('Correo agregado');
        }
      } else {
        anunciar(`Factura encontrada. Cliente: ${cliente.nombre} ${cliente.apellido}`);
      }
    } catch (error) {
      //manejo de errores en la busqueda
      console.error('Error al buscar factura:', error);
      setError(error.response?.data?.mensaje || 'Factura no encontrada');
      anunciar('Error: factura no encontrada');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró la factura. Verifique el número e intente nuevamente.',
        confirmButtonColor: '#276177',
      });
    } finally {
      setBuscando(false);
    }
  };

  const enviarNotificacion = async () => {
    if (!facturaData || !clienteData) return;

    const correo = clienteData.correo_electronico;
    if (!correo) {
      anunciar('Error: no se puede enviar sin correo');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede enviar la factura sin un correo electrónico',
        confirmButtonColor: '#276177',
      });
      return;
    }

    anunciar(`Preparando envío al correo ${correo}`);
    const result = await Swal.fire({
      title: '¿Enviar factura?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Factura:</strong> ${facturaData.numero_factura}</p>
          <p><strong>Cliente:</strong> ${clienteData.nombre} ${clienteData.apellido}</p>
          <p><strong>Correo:</strong> ${correo}</p>
          <p><strong>Total:</strong> $${formatearPrecio(facturaData.total)}</p>
        </div>
        <p style="margin-top: 15px; color: #666;">Se enviará la factura en formato PDF adjunta al correo</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#276177',
      cancelButtonColor: '#d33',
    });

    if (!result.isConfirmed) return;

    setEnviando(true);
    anunciar('Enviando factura por correo...');

    try {
      await clienteAxios.post('/api/facturas/enviar-correo', {
        idFactura: facturaData._id,
        emailCliente: correo,
      });

      anunciar('Factura enviada exitosamente');
      Swal.fire({
        icon: 'success',
        title: '¡Enviado!',
        html: `
          <div style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 60px; color: #28a745; margin-bottom: 15px;"></i>
            <p style="font-size: 16px; margin: 10px 0;">La factura ha sido enviada correctamente a:</p>
            <p style="font-size: 18px; font-weight: bold; color: #276177;">${correo}</p>
          </div>
        `,
        confirmButtonColor: '#276177',
      });

      setNumeroFactura('');
      setFacturaData(null);
      setClienteData(null);
      inputRef.current?.focus();
    } catch (error) {
      //error al enviar correo 
      console.error('Error al enviar correo:', error);
      anunciar('Error al enviar el correo');
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: error.response?.data?.mensaje || 'No se pudo enviar el correo. Intente nuevamente.',
        confirmButtonColor: '#276177',
      });
    } finally {
      setEnviando(false);
    }
  };
// peticion para cancelar y reiniciar el formulario
  const cancelarAccion = () => {
    Swal.fire({
      title: '¿Cancelar?',
      text: 'Se perderá la información cargada',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#276177',
    }).then((result) => {
      if (result.isConfirmed) {
        //reset de todos los estados
        setNumeroFactura('');
        setFacturaData(null);
        setClienteData(null);
        setError('');
        anunciar('Acción cancelada');
        inputRef.current?.focus();
      }
    });
  };
//formateadores (precio y fecha)
  const formatearPrecio = (precio) => {
    return precio.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
//render del componente 
  return (
    <Fragment>
      {/* ✅ Región de anuncios en vivo */}
      <div
        ref={anuncioRef}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      ></div>

      <div className={styles.content}>
          <div className={styles.mainContainer} role="main" aria-label="Enviar factura por correo">
          <h2 className={styles.header}>
            <i className="fas fa-envelope" aria-hidden="true"></i> Enviar Factura por Correo
          </h2>

          {/* Formulario de búsqueda */}
          <section className={styles.formSection} aria-label="Buscar factura">
            <div className={styles.inputGroup}>
              <label htmlFor="numeroFactura" className={styles.label}>
                <i className="fas fa-file-invoice" aria-hidden="true"></i> Número de Factura:
              </label>
              <input
                ref={inputRef}
                id="numeroFactura"
                type="text"
                className={styles.input}
                value={numeroFactura}
                onChange={(e) => {
                  setNumeroFactura(e.target.value);
                  setError('');
                }}
                placeholder="Ej: F12345"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') buscarFactura();
                }}
                aria-describedby={error ? 'error-message' : undefined}
                aria-invalid={error ? 'true' : 'false'}
              />
              {error && (
                <p id="error-message" className={styles.errorText} role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              className={styles.searchButton}
              onClick={buscarFactura}
              disabled={buscando}
              aria-busy={buscando}
              aria-label={buscando ? 'Buscando factura' : 'Buscar factura'}
            >
              {buscando ? (
                <>
                  <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Buscando...
                </>
              ) : (
                <>
                  <i className="fas fa-search" aria-hidden="true"></i> Buscar Factura
                </>
              )}
            </button>
          </section>

          {/* Cargando */}
          {buscando && (
            <div className={styles.loadingContainer} role="status">
              <div className={styles.spinner} aria-hidden="true">
                <i className="fa fa-spinner fa-spin"></i>
              </div>
              <p>Cargando información de la factura...</p>
            </div>
          )}

          {/* Previsualización */}
          {facturaData && clienteData && !buscando && (
            <>
              <section className={styles.previewSection} aria-label="Datos de la factura">
                {/* Cliente */}
                <article className={styles.previewCard}>
                  <h3 className={styles.previewTitle}>
                    <i className="fas fa-user" aria-hidden="true"></i> Información del Cliente
                  </h3>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Nombre:</span>
                    <span className={styles.infoValue}>
                      {clienteData.nombre} {clienteData.apellido}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Documento:</span>
                    <span className={styles.infoValue}>
                      {clienteData.tipo_documento} {clienteData.numero_documento}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Teléfono:</span>
                    <span className={styles.infoValue}>
                      {clienteData.telefono || 'No registrado'}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Correo:</span>
                    <span className={styles.infoValue}>
                      {clienteData.correo_electronico || 'No registrado'}
                      {clienteData.correo_electronico && (
                        <span className={styles.successBadge}>✓ Verificado</span>
                      )}
                    </span>
                  </div>
                </article>

                {/* Factura */}
                <article className={styles.previewCard}>
                  <h3 className={styles.previewTitle}>
                    <i className="fas fa-file-invoice-dollar" aria-hidden="true"></i> Datos de la Factura
                  </h3>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Número:</span>
                    <span className={styles.infoValue}>{facturaData.numero_factura}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Fecha:</span>
                    <span className={styles.infoValue}>{formatearFecha(facturaData.fecha_emision)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Productos:</span>
                    <span className={styles.infoValue}>{facturaData.productos_factura?.length || 0} items</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Subtotal (real):</span>
                    <span className={styles.infoValue}>
                      ${formatearPrecio(calcularSubtotalReal(facturaData))}
                    </span>
                  </div>

                  {facturaData.descuento_total !== 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Descuento total:</span>
                      <span className={styles.infoValue} style={{ color: '#d9534f' }}>
                        -${formatearPrecio(Math.abs(facturaData.descuento_total))}
                      </span>
                    </div>
                  )}

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>IVA (19%):</span>
                    <span className={styles.infoValue}>
                      ${formatearPrecio(facturaData.iva || 0)}
                    </span>
                  </div>

                  <div className={`${styles.infoRow} ${styles.totalRow}`}>
                    <span className={styles.infoLabel}>TOTAL:</span>
                    <span className={`${styles.infoValue} ${styles.fontSize18} ${styles.colorPrimary}`}>
                      ${formatearPrecio(facturaData.total)}
                    </span>
                  </div>
                </article>
              </section>

              {/* Productos */}
              <section className={`${styles.previewCard} ${styles.productosCard}`} aria-label="Productos de la factura">
                <h3 className={styles.previewTitle}>
                  <i className="fas fa-shopping-cart" aria-hidden="true"></i> Productos de la Factura
                </h3>
                <table className={styles.productosTable} role="table">
                  <thead>
                    <tr>
                      <th scope="col" className={styles.tableHeader}>Producto</th>
                      <th scope="col" className={`${styles.tableHeader} ${styles.tableHeaderCenter}`}>Cantidad</th>
                      <th scope="col" className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>Precio Unit.</th>
                      <th scope="col" className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaData.productos_factura?.map((prod, idx) => (
                      <tr key={idx}>
                        <td className={styles.tableCell}>{prod.producto}</td>
                        <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>{prod.cantidad}</td>
                        <td className={`${styles.tableCell} ${styles.tableCellRight}`}>${formatearPrecio(prod.precio)}</td>
                        <td className={`${styles.tableCell} ${styles.tableCellRight}`}>${formatearPrecio(prod.precio * prod.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Botones */}
              <div className={styles.buttonGroup} role="group" aria-label="Acciones de factura">
                <button
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={cancelarAccion}
                  disabled={enviando}
                  aria-label="Cancelar y limpiar formulario"
                >
                  <i className="fas fa-times" aria-hidden="true"></i> Cancelar
                </button>
                <button
                  className={`${styles.button} ${styles.sendButton}`}
                  onClick={enviarNotificacion}
                  disabled={enviando || !clienteData.correo_electronico}
                  aria-busy={enviando}
                  aria-label={enviando ? 'Enviando factura' : 'Enviar factura por correo'}
                >
                  {enviando ? (
                    <>
                      <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane" aria-hidden="true"></i> Enviar Factura
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        <div>
          {["ADMINISTRADOR", "SUPERADMIN"].includes((localStorage.getItem("tipo_usuario") || "").toUpperCase()) &&<NotificacionesPanel />}
        </div>
      </div>
    </Fragment>
  );
}

export default NotificacionesMejorado;