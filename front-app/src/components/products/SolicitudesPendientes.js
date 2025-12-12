import React, { useEffect, useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from "./SolicitudesPendientes.module.css";

function SolicitudesPendientes() {
  const [solicitudes, setSolicitudes] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const cargar = async () => {
      const res = await clienteAxios.get('/api/solicitudes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSolicitudes(res.data);
    };
    cargar();
  }, []);

  const aprobar = async (id) => {
    await clienteAxios.post(`/api/solicitudes/${id}/aprobar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    Swal.fire('Aprobado', 'Los cambios fueron aplicados', 'success');
    setSolicitudes(solicitudes.filter(s => s._id !== id));
  };

  const rechazar = async (id) => {
    await clienteAxios.post(`/api/solicitudes/${id}/rechazar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    Swal.fire('Rechazado', 'La solicitud fue descartada', 'info');
    setSolicitudes(solicitudes.filter(s => s._id !== id));
  };

  return (
    <div className={styles.solicitudescontainer}>
    <h2 className="solicitudes-title">Solicitudes Pendientes</h2>

    <table className={styles.tablasolicitudes}>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Solicitante</th>
          <th>Cambio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {solicitudes.map(s => (
          <tr key={s._id}>
            <td>{s.productoId.nombre}</td>
            <td>{s.solicitante.nombre}</td>

            <td>
              <div className={styles.cambiosbox}>
                <div>Precio: {s.cambios.precioAnterior} → <b>{s.cambios.precioNuevo}</b></div>
                <div>Cantidad: {s.cambios.cantidadAnterior} → <b>{s.cambios.cantidadNuevo}</b></div>
              </div>
            </td>

            <td className={styles.estadopendiente}>{s.estado}</td>estado-pendiente

            <td>
              <button 
                className="btn-accion btn-aprobar"
                onClick={() => aprobar(s._id)}
              >
                ✔
              </button>

              <button 
                className="btn-accion btn-rechazar"
                onClick={() => rechazar(s._id)}
              >
                ✖
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
}

export default SolicitudesPendientes;
