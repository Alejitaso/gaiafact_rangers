import React, { Fragment, useState, useRef } from "react";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import QRCode from "qrcode";
import styles from './codigoQR.module.css';

function GeneradorQR() {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [codigoQR, setCodigoQR] = useState("");
  const [cargando, setCargando] = useState(false);
  const [datosFactura, setDatosFactura] = useState(null);
  const qrCanvasRef = useRef(null);

  // Función para generar código QR con datos mínimos
  const generarCodigoQR = async (datosCompletos) => {
    try {
      const fecha = new Date(datosCompletos.fecha_emision);
      const fechaFormato = fecha.toLocaleDateString('es-CO');
      const horaFormato = fecha.toLocaleTimeString('es-CO');
      
      const qrData = `Número de Factura: ${datosCompletos.numero_factura}
Fecha: ${fechaFormato}
Hora: ${horaFormato}
NIT: 900123456-1
Cliente: ${datosCompletos.usuario.nombre} ${datosCompletos.usuario.apellido}
Documento: ${datosCompletos.usuario.tipo_documento || 'CC'} ${datosCompletos.usuario.numero_documento}
CUFE: ${datosCompletos.codigo_CUFE || 'TEMP-' + datosCompletos.numero_factura}`;

      const qrCodeURL = await QRCode.toDataURL(qrData, {
        width: 400,
        height: 400,
        color: { dark: "#276177", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 1,
        margin: 2,
      });

      const datosFacturaElectronica = {
        numeroFactura: datosCompletos.numero_factura,
        fecha: fechaFormato,
        hora: horaFormato,
        nit: "900123456-1",
        cliente: `${datosCompletos.usuario.nombre} ${datosCompletos.usuario.apellido}`,
        documento: `${datosCompletos.usuario.tipo_documento || 'CC'} ${datosCompletos.usuario.numero_documento}`,
        cufe: datosCompletos.codigo_CUFE || 'TEMP-' + datosCompletos.numero_factura
      };

      return {
        qrImage: qrCodeURL,
        datosCompletos: datosFacturaElectronica
      };
    } catch (error) {
      console.error("Error generando QR:", error);
      throw error;
    }
  };

  // Buscar factura en backend
  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      Swal.fire({
        title: "Número requerido",
        text: "Ingrese un número de factura válido",
        icon: "warning",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
      return;
    }

    try {
      setCargando(true);
      console.log("Buscando factura:", numeroFactura);
      
      const res = await clienteAxios.get(`/api/facturas/buscar-factura/${numeroFactura}`);
      
      console.log("Respuesta del servidor:", res.data);
      
      if (res.data) {
        const factura = res.data;
        setDatosFactura(factura);

        // Generar el QR con todos los datos de la factura
        const { qrImage, datosCompletos } = await generarCodigoQR(factura);
        setCodigoQR(qrImage);

        Swal.fire({
          icon: "success",
          title: "¡Factura encontrada!",
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p style="margin: 8px 0;">
                <strong>Factura:</strong> ${factura.numero_factura}
              </p>
              <p style="margin: 8px 0;">
                <strong>Cliente:</strong> ${factura.usuario.nombre} ${factura.usuario.apellido}
              </p>
              <p style="margin: 8px 0;">
                <strong>Total:</strong> $${factura.total.toLocaleString('es-CO')}
              </p>
              <p style="margin: 8px 0; color: #5a6c7d; font-size: 13px;">
                Código QR generado exitosamente
              </p>
            </div>
          `,
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Error en buscarFactura:", error);
      setCodigoQR("");
      setDatosFactura(null);
      
      const mensajeError = error.response?.data?.mensaje || "No se encontró ninguna factura con ese número";
      
      Swal.fire({
        title: "Factura no encontrada",
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">
              ${mensajeError}: <strong>${numeroFactura}</strong>
            </p>
          </div>
        `,
        icon: "error",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
    } finally {
      setCargando(false);
    }
  };

  // Generar QR simple
  const generarQRSimple = async () => {
    if (!numeroFactura.trim()) {
      Swal.fire({
        title: "Número requerido",
        text: "Ingrese un número de factura válido",
        icon: "warning",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
      return;
    }

    try {
      setCargando(true);
      
      const datosSimples = {
        tipo: "FACTURA ELECTRÓNICA DE VENTA",
        numeroFactura: numeroFactura,
        fecha: new Date().toISOString(),
        empresa: "Athena'S Store",
        generado: new Date().toLocaleString("es-CO"),
        cufe: `SIMPLE-${numeroFactura}-${Date.now()}`
      };

      const qrCodeURL = await QRCode.toDataURL(JSON.stringify(datosSimples), {
        width: 400,
        height: 400,
        color: { dark: "#276177", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 1,
        margin: 2,
      });

      setCodigoQR(qrCodeURL);
      
      Swal.fire({
        icon: "success",
        title: "¡QR generado!",
        text: "Código QR simple generado correctamente",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el código QR",
        icon: "error",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
    } finally {
      setCargando(false);
    }
  };

  // Ver información del QR
  const verInformacionQR = () => {
    if (!datosFactura) {
      Swal.fire({
        title: "Sin información",
        text: "Primero busque una factura para ver su información",
        icon: "info",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
      return;
    }

    const productosHTML = datosFactura.productos_factura
      .map(p => `
        <tr>
          <td style="padding: 5px; border-bottom: 1px solid #e2e8f0;">${p.producto}</td>
          <td style="padding: 5px; border-bottom: 1px solid #e2e8f0; text-align: center;">${p.cantidad}</td>
          <td style="padding: 5px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${(p.precio * p.cantidad).toLocaleString('es-CO')}</td>
        </tr>
      `).join('');

    Swal.fire({
      title: "Información de la Factura",
      html: `
        <div style="text-align: left; margin: 20px 0; max-height: 400px; overflow-y: auto;">
          <h4 style="color: #276177; margin: 15px 0 10px 0;">
            <i class="fas fa-file-invoice"></i> Datos Generales
          </h4>
          <p style="margin: 5px 0;"><strong>Tipo:</strong> Factura Electrónica de Venta</p>
          <p style="margin: 5px 0;"><strong>Número:</strong> ${datosFactura.numero_factura}</p>
          <p style="margin: 5px 0;"><strong>CUFE:</strong> ${datosFactura.codigo_CUFE || 'TEMP-' + datosFactura.numero_factura}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(datosFactura.fecha_emision).toLocaleString('es-CO')}</p>
          
          <h4 style="color: #276177; margin: 15px 0 10px 0;">
            <i class="fas fa-user"></i> Cliente
          </h4>
          <p style="margin: 5px 0;"><strong>Nombre:</strong> ${datosFactura.usuario.nombre} ${datosFactura.usuario.apellido}</p>
          <p style="margin: 5px 0;"><strong>Documento:</strong> ${datosFactura.usuario.tipo_documento || 'CC'} ${datosFactura.usuario.numero_documento}</p>
          <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${datosFactura.usuario.telefono || 'N/A'}</p>
          
          <h4 style="color: #276177; margin: 15px 0 10px 0;">
            <i class="fas fa-box"></i> Productos
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f5f7fa;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #276177;">Descripción</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #276177;">Cant.</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #276177;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosHTML}
            </tbody>
          </table>
          
          <h4 style="color: #276177; margin: 15px 0 10px 0;">
            <i class="fas fa-dollar-sign"></i> Valores
          </h4>
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${datosFactura.productos_factura.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toLocaleString('es-CO')}</p>
          <p style="margin: 5px 0;"><strong>IVA:</strong> $${(datosFactura.iva || 0).toLocaleString('es-CO')}</p>
          <p style="margin: 5px 0; font-size: 16px; color: #276177;"><strong>TOTAL:</strong> $${datosFactura.total.toLocaleString('es-CO')}</p>
        </div>
      `,
      width: '600px',
      confirmButtonColor: "#276177",
      confirmButtonText: "Cerrar"
    });
  };

  // Descargar código QR
  const descargarCodigoQR = () => {
    if (!codigoQR) {
      Swal.fire({
        title: "Atención",
        text: "No hay código QR para descargar",
        icon: "warning",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
      return;
    }

    const link = document.createElement("a");
    link.download = `QR_Factura_${numeroFactura || 'TEMP'}_${Date.now()}.png`;
    link.href = codigoQR;
    link.click();

    Swal.fire({
      icon: "success",
      title: "¡Descargado!",
      text: "El código QR se descargó correctamente",
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    if (codigoQR) {
      Swal.fire({
        title: "¿Cancelar?",
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p style="color: #666; line-height: 1.6;">
              ¿Desea limpiar el formulario y eliminar el código QR generado?
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, limpiar",
        cancelButtonText: "No, continuar"
      }).then((result) => {
        if (result.isConfirmed) {
          setNumeroFactura("");
          setCodigoQR("");
          setDatosFactura(null);
          Swal.fire({
            icon: "success",
            title: "Limpiado",
            text: "Formulario limpiado correctamente",
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    } else {
      setNumeroFactura("");
      setCodigoQR("");
      setDatosFactura(null);
    }
  };

  // Manejar Enter en el input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && numeroFactura.trim()) {
      buscarFactura();
    }
  };

  return (
    <Fragment>
      <div className={styles.content}>

        <div className={styles.form}>
          <div className={styles.campo}>
            <label htmlFor="numeroFactura">
              {cargando ? (
                <><i className="fas fa-spinner fa-spin"></i> Buscando factura...</>
              ) : (
                'Número de Factura'
              )}
            </label>
            <input
              type="text"
              id="numeroFactura"
              placeholder="Ingrese el número de factura..."
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={cargando}
            />
          </div>

          <div className={styles.campo}>
            <button 
              onClick={buscarFactura} 
              disabled={!numeroFactura.trim() || cargando}
              className={styles.btnBuscar}
            >
              <i className="fas fa-search"></i> Buscar Factura
            </button>
          </div>
        </div>

        {/* Previsualización del QR */}
        {codigoQR ? (
          <div className={styles.campo}>
            <label>Código QR Generado</label>
            <div className={styles.QR}>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={codigoQR} 
                  alt="Código QR" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    border: '3px solid var(--color-tres)',
                    borderRadius: '15px',
                    padding: '15px',
                    backgroundColor: 'white'
                  }}
                />
                {datosFactura && (
                  <div style={{ marginTop: '15px', color: 'var(--color-uno)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      Factura: {datosFactura.numero_factura}
                    </p>
                    <p style={{ fontSize: '13px' }}>
                      Cliente: {datosFactura.usuario.nombre} {datosFactura.usuario.apellido}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-tres)' }}>
                      Total: ${datosFactura.total.toLocaleString('es-CO')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.campo}>
            <label>Vista Previa</label>
            <div className={styles.QR}>
              <div className={styles.mensajeVacio}>
                {cargando ? (
                  <>⏳ Generando código QR...</>
                ) : (
                  <>
                    📱 Ingrese un número de factura para generar el código QR
                    <br />
                    <small>El código aparecerá aquí</small>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        

        {/* Botones */}
        <div className={styles.botones}>
          <div className={styles.boton}>
            <button 
              type="button" 
              onClick={verInformacionQR} 
              disabled={!datosFactura}
            >
              <i className="fas fa-info-circle"></i> Ver Info
            </button>
          </div>
          <div className={styles.boton}>
            <button 
              type="button" 
              onClick={descargarCodigoQR} 
              disabled={!codigoQR}
            >
              <i className="fas fa-download"></i> Descargar
            </button>
          </div>
          <div className={styles.boton}>
            <button 
              type="button" 
              onClick={limpiarFormulario}
              disabled={cargando}
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default GeneradorQR;