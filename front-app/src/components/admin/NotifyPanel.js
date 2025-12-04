import React, { useEffect, useState } from 'react';
import clienteAxios from '../../config/axios';
import styles from './NotifyPanel.module.css';

const NotificacionesPanel = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarNotificaciones();
  }, [busqueda]);

  const cargarNotificaciones = async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append('q', busqueda.trim());
      const res = await clienteAxios.get(`/api/notificaciones?${params.toString()}`);
      setNotificaciones(res.data);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <aside className={styles.panel} aria-label="Panel de notificaciones enviadas">
      <h3 className={styles.titulo}>📬 Notificaciones Enviadas</h3>

      <div className={styles.barraBusqueda} aria-label="Buscar notificaciones">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por factura, documento o correo..."
          aria-label="Campo de búsqueda de notificaciones"
        />
        <i className="fas fa-search" aria-hidden="true"></i>
      </div>

      <ul className={styles.lista}>
        {notificaciones.length === 0 && (
          <li className={styles.vacio}>No hay notificaciones para mostrar</li>
        )}
        {notificaciones.map((notif) => (
          <li key={notif._id} className={styles.item}>
            <div className={styles.fila}>
              <span className={styles.factura}>{notif.numero_factura}</span>
              <span className={styles.fecha}>{formatearFecha(notif.fecha_envio)}</span>
            </div>
            <div className={styles.fila}>
              <small>De: <strong>{notif.documento_emisor}</strong></small>
            </div>
            <div className={styles.fila}>
              <small>Para: <strong>{notif.documento_receptor}</strong> ({notif.correo_receptor})</small>
            </div>
            <div className={styles.fila}>
              <span className={styles.tipo}>{notif.tipo === 'automatico' ? '🤖 Auto' : '👤 Manual'}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default NotificacionesPanel;