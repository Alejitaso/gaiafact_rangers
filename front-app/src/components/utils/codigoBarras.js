// src/componentes/CodigoBarras.js
import React, { useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';

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
    <React.Fragment>
      <h1>Generar Código de Barras</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <legend>Usa el generador y aplícalo a una factura</legend>

        <div className="campo">
          <label>Código de Barras:</label>
          <input
            type="text"
            placeholder="Genera el código"
            name="codigo_barras"
            value={codigo}
            readOnly
          />
          <button type="button" className="btn btn-azul" onClick={generarCodigo}>
            Generar Código
          </button>
          <button type="button" className="btn btn-azul" onClick={copiar} disabled={!codigo}>
            Copiar
          </button>
        </div>

        <div className="campo">
          <label>ID de Factura:</label>
          <input
            type="text"
            placeholder="ID de la factura (MongoID)"
            name="idFactura"
            value={idFactura}
            onChange={(e) => setIdFactura(e.target.value)}
          />
        </div>

        <button type="button" className="btn btn-azul" onClick={guardarEnFactura} disabled={!codigo || !idFactura}>
          Guardar en Factura
        </button>
      </form>
    </React.Fragment>
  );
}

export default CodigoBarras;
