import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './listadoUsuario.module.css';

const ListadoUsuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Accesibilidad
    const anuncioRef = useRef(null);
    const recargarBtnRef = useRef(null);

    const anunciar = (mensaje) => {
        if (anuncioRef.current) {
            anuncioRef.current.textContent = mensaje;
            setTimeout(() => (anuncioRef.current.textContent = ''), 1000);
        }
    };

    const fetchUsuarios = useCallback(async () => {
        anunciar('Cargando usuarios');
        setLoading(true);
        try {
            const response = await ClientesAxios.get('/api/Usuario');
            setUsuarios(response.data);
            anunciar(`${response.data.length} usuarios cargados`);
        } catch (error) {
            anunciar('Error al cargar usuarios');
            if (error.response?.status === 403) {
                Swal.fire("Acceso Restringido", "No tienes permisos de Superadmin/Admin.", "error");
                navigate('/inicio');
            } else {
                Swal.fire("Error", "No se pudo cargar el listado de usuarios.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    if (loading) {
        return (
            <div className={styles['listado-container']} role="main" aria-label="Cargando usuarios">
                <h1>Cargando usuarios...</h1>
            </div>
        );
    }

    if (usuarios.length === 0) {
        return (
            <div className={styles['listado-container']} role="main" aria-label="Sin usuarios">
                <h1>Listado de Usuarios del Sistema</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-cuatro)', marginTop: '50px' }}>
                    No se encontraron usuarios.
                </p>
                <div className={styles['botones-container']}>
                    <button ref={recargarBtnRef} onClick={fetchUsuarios} className={styles.btn}>
                        Recargar Lista
                    </button>
                </div>
            </div>
        );
    }
    // Muestra la lista de usuarios en formato de tabla.
    return (
        <div className={styles['listado-container']} role="main" aria-label="Listado de usuarios">
            {/* ✅ Anuncios en vivo */}
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1>Listado de Usuarios del Sistema</h1>

            <div className={styles['botones-container']}>
                <button onClick={() => navigate('/registro')} className={styles.btn} aria-label="Crear nuevo usuario">
                    Crear Nuevo Usuario
                </button>
                <button onClick={fetchUsuarios} className={styles.btn} aria-label="Recargar lista de usuarios">
                    Recargar Lista
                </button>
            </div>

            {/* ✅ Contenedor con scroll horizontal en móviles */}
            <div className={styles['tabla-wrapper']} role="region" aria-label="Tabla de usuarios" tabIndex={0}>
                <table className={styles['tabla-usuarios']} role="table">
                    <thead>
                        <tr role="row">
                            <th scope="col">Nombre Completo</th>
                            <th scope="col">Correo Electrónico</th>
                            <th scope="col">Rol</th>
                            <th scope="col">Estado</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(usuario => (
                            <tr key={usuario._id} role="row">
                                <td>{usuario.nombre} {usuario.apellido}</td>
                                <td>{usuario.correo_electronico}</td>
                                <td>{usuario.tipo_usuario}</td>
                                <td>{usuario.estado || 'Activo'}</td>
                                <td>
                                    <button
                                        onClick={() => navigate(`/perfil/${usuario._id}`)}
                                        className={styles['action-btn-primary']}
                                        aria-label={`Ver perfil de ${usuario.nombre} ${usuario.apellido}`}
                                    >
                                        Ver Perfil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListadoUsuarios;
