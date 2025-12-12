import React, { useEffect, useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from "./SolicitudesPendientes.module.css";

function SolicitudesPendientes() {
  const [solicitudes, setSolicitudes] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
      const cargar = async () => {
        try {
          const res = await clienteAxios.get('/api/solicitudes', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("📌 SOLICITUDES RECIBIDAS:", res.data);
          setSolicitudes(res.data);
        } catch (e) {
          console.error("❌ ERROR CARGANDO SOLICITUDES", e.response?.status, e.response?.data);
          Swal.fire('Error','No se pudieron cargar las solicitudes','error');
        }
      };
      cargar();
    }, []);

  const aprobar = async (id) => {
      try {
        const res = await clienteAxios.post(`/api/solicitudes/${id}/aprobar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (res.data?.ok) {
          Swal.fire('Aprobado', res.data.mensaje || 'Solicitud aprobada', 'success');
          setSolicitudes(prev => prev.filter(s => s._id !== id));
        } else {
          Swal.fire('Error', res.data?.mensaje || 'No se pudo aprobar', 'error');
        }
      } catch (err) {
        console.error("Error aprobar:", err.response?.status, err.response?.data);
        const msg = err.response?.data?.mensaje || 'Error al aprobar';
        Swal.fire('Error', msg, 'error');
      }
  };

  const rechazar = async (id) => {
      try {
        const res = await clienteAxios.post(`/api/solicitudes/${id}/rechazar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (res.data?.ok) {
          Swal.fire('Rechazado', res.data.mensaje || 'Solicitud rechazada', 'info');
          setSolicitudes(prev => prev.filter(s => s._id !== id));
        } else {
          Swal.fire('Error', res.data?.mensaje || 'No se pudo rechazar', 'error');
        }
      } catch (err) {
        console.error("Error rechazar:", err.response?.status, err.response?.data);
        const msg = err.response?.data?.mensaje || 'Error al rechazar';
        Swal.fire('Error', msg, 'error');
      }
  };

return (
  <div className={styles.solicitudescontainer}>
    <h2 className="solicitudes-title">Solicitudes Pendientes</h2>

    <table className={styles.tablasolicitudes}>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Solicitante</th>
          <th>Tipo de Solicitud</th>
          <th>Detalles</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
      {solicitudes.map(s => (
        <tr key={s._id}>
          
          {/* Producto */}
          <td>{s.productoId?.nombre || "Producto no disponible"}</td>

          {/* Solicitante */}
          <td>{s.solicitante?.nombre || "Usuario no disponible"}</td>

          {/* Tipo de solicitud */}
          <td>
            {s.tipoAccion === "ELIMINACION" ? (
              <span className={styles.eliminacionTag}>Eliminación</span>
            ) : (
              <span className={styles.cambioTag}>Modificación</span>
            )}
          </td>

          {/* Detalles */}
          <td>
            {s.tipoAccion === "ELIMINACION" ? (
              <strong>Eliminación del producto</strong>
            ) : (
              <div className={styles.cambiosbox}>
                <div>Precio: {s.cambios?.precioAnterior ?? "-"} → <b>{s.cambios?.precioNuevo ?? "-"}</b></div>
                <div>Cantidad: {s.cambios?.cantidadAnterior ?? "-"} → <b>{s.cambios?.cantidadNuevo ?? "-"}</b></div>
              </div>
            )}
          </td>

          {/* Estado */}
          <td className={styles.estadopendiente}>{s.estado}</td>

          {/* Acciones */}
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
