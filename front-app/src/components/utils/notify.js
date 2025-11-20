import React, { useState, Fragment } from 'react';
import Swal from 'sweetalert2';
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

  // Buscar factura y cliente
  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      setError('Por favor ingrese un número de factura');
      return;
    }
    //estado de carga
    setBuscando(true);
    setError('');
    setFacturaData(null);
    setClienteData(null);

    try {
      // Buscar factura
      const resFactura = await clienteAxios.get(`/api/facturas/buscar/${numeroFactura}`);
      
      if (!resFactura.data) {
        throw new Error('Factura no encontrada');
      }

      const factura = resFactura.data;
      setFacturaData(factura);

      // Buscar datos del cliente
      if (factura.usuario?.numero_documento) {
        try {
          const resCliente = await clienteAxios.get(`/Usuario/documento/${factura.usuario.numero_documento}`);
          setClienteData(resCliente.data.usuario);
        } catch (err) {
          console.warn('Cliente no encontrado en base de datos, usando datos de factura');
          setClienteData(factura.usuario);
        }
      } else { 
        setClienteData(factura.usuario);
      }

      // Verificar que tenga correo
      const correoCliente = factura.usuario.correo_electronico || clienteData?.correo_electronico;
      
      if (!correoCliente) {
        const result = await Swal.fire({
          icon: 'warning',
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
          setClienteData({ ...factura.usuario, correo_electronico: result.value });
        }
      }

    } catch (error) {
      //manejo de errores en la busqueda
      console.error('Error al buscar factura:', error);
      setError(error.response?.data?.mensaje || 'Factura no encontrada. Verifique el número.');
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

  // Enviar correo con la factura
  const enviarNotificacion = async () => {
    if (!facturaData || !clienteData) return;

    const correo = clienteData.correo_electronico;
    
    if (!correo) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede enviar la factura sin un correo electrónico',
        confirmButtonColor: '#276177',
      });
      return;
    }

    // Confirmar envío
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

    try {
      //peticion al backend para envio del correo 
      const res = await clienteAxios.post('/api/facturas/enviar-correo', {
        idFactura: facturaData._id,
        emailCliente: correo,
      });

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

      // Limpiar formulario
      setNumeroFactura('');
      setFacturaData(null);
      setClienteData(null);

    } catch (error) {
      //error al enviar correo 
      console.error('Error al enviar correo:', error);
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
        Swal.fire({
          title: 'Cancelado',
          text: 'Se limpió la información',
          icon: 'info',
          confirmButtonColor: '#276177',
        });
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
      <div className={styles.mainContainer}>
        <h2 className={styles.header}>
          <i className="fas fa-envelope"></i> Enviar Factura por Correo
        </h2>

        {/* Formulario de búsqueda */}
        <div className={styles.formSection}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <i className="fas fa-file-invoice"></i> Número de Factura:
            </label>
            <input
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
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <button
            className={styles.searchButton}
            onClick={buscarFactura}
            disabled={buscando}
          >
            {buscando ? (
              <>
                <i className="fa fa-spinner fa-spin"></i> Buscando...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i> Buscar Factura
              </>
            )}
          </button>
        </div>

        {/* Cargando */}
        {buscando && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}>
              <i className="fa fa-spinner fa-spin"></i>
            </div>
            <p>Cargando información de la factura...</p>
          </div>
        )}

        {/* Previsualización */}
        {facturaData && clienteData && !buscando && (
          <>
            <div className={styles.previewSection}>
              <div className={styles.previewCard}>
                <h3 className={styles.previewTitle}>
                  <i className="fas fa-user"></i> Información del Cliente
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
              </div>

              {/* Información de la Factura */}
              <div className={styles.previewCard}>
                <h3 className={styles.previewTitle}>
                  <i className="fas fa-file-invoice-dollar"></i> Datos de la Factura
                </h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Número:</span>
                  <span className={styles.infoValue}>{facturaData.numero_factura}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Fecha:</span>
                  <span className={styles.infoValue}>
                    {formatearFecha(facturaData.fecha_emision)}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Productos:</span>
                  <span className={styles.infoValue}>
                    {facturaData.productos_factura?.length || 0} items
                  </span>
                </div>
                <div className={`${styles.infoRow} ${styles.totalRow}`}>
                  <span className={styles.infoLabel}>TOTAL:</span>
                  <span className={`${styles.infoValue} ${styles.fontSize18} ${styles.colorPrimary}`}>
                    ${formatearPrecio(facturaData.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className={`${styles.previewCard} ${styles.productosCard}`}>
              <h3 className={styles.previewTitle}>
                <i className="fas fa-shopping-cart"></i> Productos de la Factura
              </h3>
              <table className={styles.productosTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>Producto</th>
                    <th className={`${styles.tableHeader} ${styles.tableHeaderCenter}`}>Cantidad</th>
                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>Precio Unit.</th>
                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {facturaData.productos_factura?.map((prod, idx) => (
                    <tr key={idx}>
                      <td className={styles.tableCell}>{prod.producto}</td>
                      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>{prod.cantidad}</td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        ${formatearPrecio(prod.precio)}
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        ${formatearPrecio(prod.precio * prod.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botones de Acción */}
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={cancelarAccion}
                disabled={enviando}
              >
                <i className="fas fa-times"></i> Cancelar
              </button>
              <button
                className={`${styles.button} ${styles.sendButton}`}
                onClick={enviarNotificacion}
                disabled={enviando || !clienteData.correo_electronico}
              >
                {enviando ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i> Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Enviar Factura
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Fragment>
  );
}

export default NotificacionesMejorado;