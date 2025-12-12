// components/admin/LogsViewer.js
import React, { useEffect, useState, useRef } from 'react';
import ClientesAxios from '../../config/axios'; // ✅ cliente con token automático
import styles from './LogsViewer.module.css';

// Componente para visualizar los registros de actividad del sistema
const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [fecha, setFecha] = useState('');
  const [rol, setRol] = useState('');
  const [usuario, setUsuario] = useState('');

  const anuncioRef = useRef(null);
  const anunciar = (msg) => {
    if (anuncioRef.current) {
      anuncioRef.current.textContent = msg;
      setTimeout(() => (anuncioRef.current.textContent = ''), 1500);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // ✅ No necesitas headers: el interceptor ya agrega el token
        const res = await ClientesAxios.get('api/logs');
        setLogs(res.data);
        setFiltrados(res.data);
        anunciar(`${res.data.length} actividades registradas`);
      } catch (err) {
        anunciar('Error al cargar los registros');
      } finally {
        setCargando(false);
      }
    };
    fetchLogs();
  }, []);


// Filtrado de logs según fecha, rol y usuario
  useEffect(() => {
    let resultado = logs;

    if (fecha) {
      resultado = resultado.filter(l =>
        new Date(l.fecha).toISOString().slice(0, 10) === fecha
      );
    }
    if (rol) {
      resultado = resultado.filter(l =>
        (l.usuarioId?.tipo_usuario || '').toLowerCase() === rol.toLowerCase()
      );
    }
    if (usuario) {
      const lower = usuario.toLowerCase();
      resultado = resultado.filter(l =>
        `${l.usuarioId?.nombre} ${l.usuarioId?.apellido}`.toLowerCase().includes(lower)
      );
    }

    setFiltrados(resultado);
    anunciar(`${resultado.length} resultado${resultado.length === 1 ? '' : 's'}`);
  }, [fecha, rol, usuario, logs]);

  // Renderiza la lista de logs filtrados
  return (
    <div className={styles.logsWrapper}>
      <div ref={anuncioRef} role="status" aria-live="polite" className="sr-only" />

      <h3 className={styles.titulo}>📋 Registro de actividad</h3>

      <div className={styles.filtros}>
        <input
          type="date"
          aria-label="Filtrar por fecha"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
        <select
          aria-label="Filtrar por rol"
          value={rol}
          onChange={e => setRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="SUPERADMIN">Superadmin</option>
          <option value="USUARIO">Usuario</option>
          <option value="CLIENTE">Cliente</option>
        </select>
        <input
          type="search"
          aria-label="Filtrar por nombre de usuario"
          placeholder="Nombre de usuario..."
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
        />
      </div>

      <div className={styles.lista}>
        {cargando ? (
          <p className={styles.cargando}>Cargando actividad...</p>
        ) : filtrados.length === 0 ? (
          <p className={styles.vacio}>No hay registros con esos filtros.</p>
        ) : (
          <ul className={styles.ul}>
            {filtrados.map(l => (
              <li key={l._id} className={styles.item}>
                <div className={styles.fila}>
                  <span className={styles.fecha}>
                    {new Date(l.fecha).toLocaleString('es-CO')}
                  </span>
                  <span className={styles.accion}>{l.accion}</span>
                </div>

                <div className={styles.fila}>
                  <span className={styles.rol}>
                    {l.usuarioId?.tipo_usuario || 'N/A'}
                  </span>
                  <span className={styles.usuario}>
                    {l.usuarioId
                      ? `${l.usuarioId.nombre} ${l.usuarioId.apellido}`
                      : 'Anónimo'}
                  </span>
                </div>

                {l.recursoId && (
                  <div className={styles.fila}>
                    <span className={styles.recurso}>Recurso: {l.recursoId}</span>
                  </div>
                )}

                {l.cambios && (
                  <div className={styles.fila}>
                    <pre className={styles.cambios}>{JSON.stringify(l.cambios, null, 2)}</pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LogsViewer;