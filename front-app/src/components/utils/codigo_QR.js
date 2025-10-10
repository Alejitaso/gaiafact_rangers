import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import clienteAxios from "../../config/axios";
import QRCode from "qrcode";
import styles from './codigoQR.module.css';

function GeneradorQR() {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [codigoQR, setCodigoQR] = useState("");
  const [cargando, setCargando] = useState(false);
  const [datosFactura, setDatosFactura] = useState(null);

  const navigate = useNavigate();

  // Función para generar código QR
  const generarCodigoQR = async (texto) => {
    try {
      const qrCodeURL = await QRCode.toDataURL(texto, {
        width: 200,
        height: 200,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
      });
      return qrCodeURL;
    } catch (error) {
      console.error("Error generando QR:", error);
      throw error;
    }
  };

  // Buscar factura en backend
  const buscarFactura = async () => {
    if (!numeroFactura.trim()) {
      Swal.fire("Número requerido", "Ingrese un número de factura válido.", "warning");
      return;
    }
    try {
      setCargando(true);
      const res = await clienteAxios.get(`/api/facturas/${numeroFactura}`);
      if (res.data.success) {
        const factura = res.data.factura;
        setDatosFactura(factura);

        const datosQR = {
          numeroFactura: factura.numero || numeroFactura,
          fecha: factura.fecha,
          cliente: factura.cliente,
          total: factura.total,
          productos: factura.productos,
          empresa: "Athena'S Store",
        };

        const qrGenerado = await generarCodigoQR(JSON.stringify(datosQR));
        setCodigoQR(qrGenerado);

        Swal.fire("Éxito", "Código QR generado correctamente.", "success");
      } else {
        throw new Error(res.data.mensaje || "Factura no encontrada");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se encontró la factura.", "error");
      setCodigoQR("");
      setDatosFactura(null);
    } finally {
      setCargando(false);
    }
  };

  // Generar QR simple
  const generarQRSimple = async () => {
    if (!numeroFactura.trim()) {
      Swal.fire("Número requerido", "Ingrese un número de factura válido.", "warning");
      return;
    }
    try {
      setCargando(true);
      const datosQR = {
        numeroFactura,
        fecha: new Date().toISOString(),
        empresa: "Athena'S Store",
        generado: new Date().toLocaleString("es-CO"),
      };
      const qrGenerado = await generarCodigoQR(JSON.stringify(datosQR));
      setCodigoQR(qrGenerado);
      Swal.fire("Éxito", "Código QR generado correctamente.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo generar el QR.", "error");
    } finally {
      setCargando(false);
    }
  };

  // Guardar QR
  const guardarCodigoQR = async () => {
    if (!codigoQR) {
      Swal.fire("Atención", "Primero genere un código QR.", "warning");
      return;
    }
    try {
      const datosGuardar = {
        numeroFactura,
        codigoQR,
        datosFactura,
        fechaGeneracion: new Date(),
      };
      const res = await clienteAxios.post("/api/codigos-qr", datosGuardar);
      if (res.data.success) {
        Swal.fire({
          title: "Guardado",
          text: "El QR se guardó correctamente.",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Generar otro",
          cancelButtonText: "Ver lista",
        }).then((result) => {
          if (result.isConfirmed) {
            limpiarFormulario();
          } else {
            navigate("/codigos-qr/lista");
          }
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar el QR.", "error");
    }
  };

  const descargarCodigoQR = () => {
    if (!codigoQR) {
      Swal.fire("Atención", "No hay QR para descargar.", "warning");
      return;
    }
    const link = document.createElement("a");
    link.download = `QR_Factura_${numeroFactura}.png`;
    link.href = codigoQR;
    link.click();
  };

  const limpiarFormulario = () => {
    setNumeroFactura("");
    setCodigoQR("");
    setDatosFactura(null);
  };

  return (
    <Fragment>
      <div className={styles.content}>
        <h2>Generador de Códigos QR</h2>

        <div className={styles.form}>
          <label>N° de Factura</label>
          <input
            type="text"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            disabled={cargando}
          />
          <button onClick={buscarFactura} disabled={!numeroFactura || cargando}>
            Buscar
          </button>
        </div>

        {codigoQR && (
          <div className={styles.QR}>
            <img src={codigoQR} alt="Código QR" />
            <button onClick={descargarCodigoQR}>Descargar</button>
          </div>
        )}

        <div className={styles.botones}>
          <button onClick={generarQRSimple} disabled={!numeroFactura || cargando}>
            Generar QR Simple
          </button>
          <button onClick={guardarCodigoQR} disabled={!codigoQR}>
            Guardar
          </button>
          <button onClick={limpiarFormulario}>Cancelar</button>
        </div>
      </div>
    </Fragment>
  );
}

export default GeneradorQR;
