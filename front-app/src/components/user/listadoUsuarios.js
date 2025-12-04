import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './listadoUsuario.module.css';

// Función auxiliar para formatear la fecha
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const ListadoUsuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                Swal.fire(
                    "Acceso Restringido",
                    "No tienes permisos de Superadmin/Admin.",
                    "error"
                );
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // 🔥 Filtro completo con búsqueda por fecha_registro
    const usuariosFiltrados = usuarios.filter((usuario) => {
        const term = searchTerm.toLowerCase().trim();
        if (term === '') return true;

        // Variables de búsqueda
        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase();
        const correo = String(usuario.correo_electronico || '').toLowerCase();
        const estado = String(usuario.estado || 'activo').toLowerCase();
        const rol = String(usuario.tipo_usuario || '').toLowerCase();
        const documento = String(usuario.numero_documento || '').toLowerCase();

        // Nueva: fecha formateada en texto
        const fechaRegistro = formatDate(usuario.fecha_registro).toLowerCase();

        // Detectar búsqueda exacta de estado
        const esEstado = term === 'activo' || term === 'inactivo';
        if (esEstado) return estado === term;

        // Coincidencias generales
        return (
            nombreCompleto.includes(term) ||
            correo.includes(term) ||
            rol.includes(term) ||
            estado.includes(term) ||
            documento.includes(term) ||
            fechaRegistro.includes(term) // 🔥 búsqueda por fecha
        );
    });

    if (loading) {
        return (
            <div className={styles['listado-container']} aria-label="Cargando usuarios">
                <h1>Cargando usuarios...</h1>
            </div>
        );
    }

    if (usuarios.length === 0) {
        return (
            <div className={styles['listado-container']} aria-label="Sin usuarios">
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

    return (
        <div className={styles['listado-container']} aria-label="Listado de usuarios">
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1>Listado de Usuarios del Sistema</h1>

            <div className={styles['botones-container']}>

                {/* Botones izquierda */}
                <div className={styles['action-buttons-group']}>
                    <button onClick={() => navigate('/registro')} className={styles.btn}>
                        Crear Nuevo Usuario
                    </button>

                    <button onClick={fetchUsuarios} className={styles.btn}>
                        Recargar Lista
                    </button>
                </div>

                {/* Buscador derecha */}
                <div className={styles['search-container']}>
                    <div className={styles['search-input-wrapper']}>
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, Correo, Documento, Fecha o Estado..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={styles['search-input']}
                        />
                        <i className={`fas fa-search ${styles['search-icon']}`}></i>
                    </div>
                </div>
            </div>

            {usuariosFiltrados.length === 0 && searchTerm !== '' && (
                <p style={{ textAlign: 'center', color: 'var(--color-cuatro)', marginTop: '20px' }}>
                    No se encontraron resultados para "{searchTerm}".
                </p>
            )}

            <div className={styles['tabla-wrapper']} role="region" aria-label="Tabla de usuarios" tabIndex={0}>
                <table className={styles['tabla-usuarios']} role="table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Documento</th>
                            <th>Correo Electrónico</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {usuariosFiltrados.map((usuario) => (
                            <tr key={usuario._id}>
                                <td>{usuario.nombre} {usuario.apellido}</td>

                                {/* Documento REAL */}
                                <td>{usuario.numero_documento || 'N/A'}</td>

                                <td>{usuario.correo_electronico}</td>
                                <td>{usuario.tipo_usuario}</td>
                                <td>{usuario.estado || 'Activo'}</td>

                                {/* Fecha REAL */}
                                <td>{formatDate(usuario.fecha_registro)}</td>

                                <td>
                                    <button
                                        onClick={() => navigate(`/perfil/${usuario._id}`)}
                                        className={styles['action-btn-primary']}
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
