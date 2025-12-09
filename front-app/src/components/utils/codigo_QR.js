import React, { Fragment, useState, useRef } from "react";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import QRCode from "qrcode";
import styles from './codigoQR.module.css';

// Componente para generar y descargar código QR de una factura
function GeneradorQR() {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [codigoQR, setCodigoQR] = useState("");
  const [cargando, setCargando] = useState(false);
  const [datosFactura, setDatosFactura] = useState(null);
  const qrCanvasRef = useRef(null);
  const [mensajeEstado, setMensajeEstado] = useState("");

  // Anuncios para lectores de pantalla
  const anunciar = (mensaje) => {
    setMensajeEstado(mensaje);
  };

  // Genera el código QR con los datos de la factura
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

      // Datos estructurados para factura electrónica
      const datosFacturaElectronica = {
        numeroFactura: datosCompletos.numero_factura,
        fecha: fechaFormato,
        hora: horaFormato,
        nit: "900123456-1",
        cliente: `${datosCompletos.usuario.nombre} ${datosCompletos.usuario.apellido}`,
        documento: `${datosCompletos.usuario.tipo_documento || 'CC'} ${datosCompletos.usuario.numero_documento}`,
        cufe: datosCompletos.codigo_CUFE || 'TEMP-' + datosCompletos.numero_factura
      };

      return { qrImage: qrCodeURL, datosCompletos: datosFacturaElectronica };
    } catch (error) {
      console.error("Error generando QR:", error);
      throw error;
    }
  };

  // Busca la factura por número y genera el código QR
  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      anunciar("Error: número de factura vacío");
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
      anunciar(`Buscando factura ${numeroFactura}`);
      
      const res = await clienteAxios.get(`/api/facturas/buscar-factura/${numeroFactura}`);
      
      if (res.data) {
        const factura = res.data;
        setDatosFactura(factura);
        const { qrImage } = await generarCodigoQR(factura);
        setCodigoQR(qrImage);
        anunciar(`Factura ${numeroFactura} encontrada y QR generado`);
      }
    } catch (error) {
      anunciar("Error al buscar factura");
      setCodigoQR("");
      setDatosFactura(null);
      const mensajeError = error.response?.data?.mensaje || "No se encontró ninguna factura con ese número";
      Swal.fire({
        title: "Factura no encontrada",
        html: `<p>${mensajeError}: <strong>${numeroFactura}</strong></p>`,
        icon: "error",
        confirmButtonColor: "#276177",
        confirmButtonText: "Entendido"
      });
    } finally {
      setCargando(false);
    }
  };

  // Descarga el código QR como imagen PNG
  const descargarCodigoQR = () => {
    if (!codigoQR) {
      anunciar("No hay código QR para descargar");
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
    link.download = `QR_Factura_${numeroFactura || 'SIMPLE'}_${Date.now()}.png`;
    link.href = codigoQR;
    link.click();
    anunciar("Código QR descargado");
  };

  //  Limpia el formulario y el código QR generado
  const limpiarFormulario = () => {
    if (codigoQR) {
      Swal.fire({
        title: "¿Cancelar?",
        text: "¿Desea limpiar el formulario y eliminar el código QR generado?",
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
          anunciar("Formulario limpiado");
        }
      });
    } else {
      setNumeroFactura("");
      setCodigoQR("");
      setDatosFactura(null);
      anunciar("Formulario limpiado");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && numeroFactura.trim()) {
      buscarFactura();
    }
  };

  // Renderizado del componente
  return (
    <Fragment>
      {/* Anuncios para lectores de pantalla */}
      <div role="status" aria-live="polite" className={styles.srOnly}>{mensajeEstado}</div>

      <main className={styles.content} role="main" aria-labelledby="qr-title">
        <h1 id="qr-title" className={styles.srOnly}>Generador de Código QR para Facturas</h1>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.campo}>
            <label htmlFor="numeroFactura">
              {cargando ? 'Buscando factura...' : 'Número de Factura'}
            </label>
            <input
              id="numeroFactura"
              type="text"
              placeholder="Ingrese el número de factura"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={cargando}
              aria-describedby="factura-hint"
              aria-invalid={!numeroFactura.trim() && numeroFactura.length > 0}
            />
            <span id="factura-hint" className={styles.srOnly}>Ingrese el número de factura para generar el código QR</span>
          </div>

          <div className={styles.campo}>
            <button
              type="button"
              onClick={buscarFactura}
              disabled={!numeroFactura.trim() || cargando}
              className={styles.btnBuscar}
              aria-busy={cargando}
              aria-label="Buscar factura y generar código QR"
            >
              <i className="fas fa-search" aria-hidden="true"></i>
              {cargando ? 'Buscando...' : 'Buscar Factura'}
            </button>
          </div>
        </form>

        {/* Vista previa del QR */}
        <section aria-label="Vista previa del código QR">
          {codigoQR ? (
            <div className={styles.campo}>
              <label htmlFor="qr-preview">Código QR Generado</label>
              <div id="qr-preview" className={styles.QR}>
                <img
                  ref={qrCanvasRef}
                  src={codigoQR}
                  alt={`Código QR de la factura ${numeroFactura}`}
                  className={styles.qrImage}
                />
                {datosFactura && (
                  <div className={styles.qrInfo} aria-live="polite">
                    <p>Factura: <strong>{datosFactura.numero_factura}</strong></p>
                    <p>Cliente: {datosFactura.usuario.nombre} {datosFactura.usuario.apellido}</p>
                    <p>Total: <strong>${datosFactura.total.toLocaleString('es-CO')}</strong></p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.campo}>
              <label>Vista Previa</label>
              <div className={styles.QR}>
                <div className={styles.mensajeVacio} role="status">
                  {cargando ? '⏳ Generando código QR...' : '📱 Ingrese un número de factura para generar el código QR'}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Botones */}
        <div className={styles.botones}>
          <button
            type="button"
            onClick={() => Swal.fire({ title: 'Información', html: 'Función no implementada aún', icon: 'info' })}
            disabled={!datosFactura}
            aria-label="Ver información detallada de la factura"
          >
            <i className="fas fa-info-circle" aria-hidden="true"></i> Ver Info
          </button>
          <button
            type="button"
            onClick={descargarCodigoQR}
            disabled={!codigoQR}
            aria-label="Descargar código QR como imagen PNG"
          >
            <i className="fas fa-download" aria-hidden="true"></i> Descargar
          </button>
          <button
            type="button"
            onClick={limpiarFormulario}
            disabled={cargando}
            aria-label="Limpiar formulario y eliminar código QR"
          >
            <i className="fas fa-times" aria-hidden="true"></i> Cancelar
          </button>
        </div>
      </main>
    </Fragment>
  );
}

export default GeneradorQR;