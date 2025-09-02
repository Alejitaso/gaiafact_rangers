import React, { useState, Fragment } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './codigoBr.module.css';

function CodigoBarras() {
  const [codigo, setCodigo] = useState('');
  const [idFactura, setIdFactura] = useState('');

  const generarCodigo = () => {
    const cod = `789${Date.now()}`.substring(0, 13);
    setCodigo(cod);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      Swal.fire('Copiado', 'Código de barras copiado al portapapeles', 'success');
    } catch {
      Swal.fire('Atención', 'No se pudo copiar automáticamente', 'warning');
    }
  };

  const guardarEnFactura = async () => {
    if (!idFactura || !codigo) {
      Swal.fire('Faltan datos', 'Genera el código y escribe el ID de la factura', 'warning');
      return;
    }
    try {
      await clienteAxios.put(`/facturas/${idFactura}`, { codigo_barras: codigo });
      Swal.fire('Correcto', 'Código de barras guardado en la factura', 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar la factura', 'error');
    }
  };

  return (
    <Fragment>
      <div className={styles.content}>
        <div className={styles.form}>
          {/* Campo para N° de factura */}
          <div>
            <div>
              <label htmlFor="numfactura">Ingrese N° de factura</label>
            </div>
            <input
              type="text"
              id="res_factura"
              name="numfactura"
              value={idFactura}
              onChange={(e) => setIdFactura(e.target.value)}
            />
          </div>

          {/* Sección para código de barras */}
          <div>
            <label htmlFor="codebr">Código De Barras</label>
            <div className={styles.QR} name="codebr">
              <div id="BRCode">
                {codigo ? <img src={`https://barcodeapi.org/api/128/${codigo}`} alt="Código de barras" /> : null}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className={styles.botones}>
            <div className={styles.boton}>
              <button type="button" onClick={() => { setCodigo(''); setIdFactura(''); }}>
                Cancelar
              </button>
            </div>
            <div className={styles.boton}>
              <button type="button" onClick={guardarEnFactura} disabled={!codigo || !idFactura}>
                Guardar
              </button>
            </div>
          </div>

          {/* Botones extra: generar y copiar */}
          <div className={styles.botones}>
            <div className={styles.boton}>
              <button type="button" onClick={generarCodigo}>
                Generar Código
              </button>
            </div>
            <div className={styles.boton}>
              <button type="button" onClick={copiar} disabled={!codigo}>
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default CodigoBarras;
