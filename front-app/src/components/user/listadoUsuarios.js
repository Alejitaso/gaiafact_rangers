import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './listadoUsuario.module.css';

/* ----------------------------------------------------------
   Helper: formatear fecha a dd/mm/yyyy
-----------------------------------------------------------*/
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

/* ==========================================================
   COMPONENTE PRINCIPAL
========================================================== */
const ListadoUsuarios = () => {
    const navigate = useNavigate();

    // -------------------- ESTADOS BÁSICOS --------------------
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // ---------------- ACCESIBILIDAD ----------------
    const anuncioRef = useRef(null);
    const recargarBtnRef = useRef(null);

    // ---------------- ROL DEL USUARIO AUTENTICADO (para mostrar/ocultar botones admin)
    const rolActual = localStorage.getItem('tipo_usuario'); // "SUPERADMIN" | "ADMINISTRADOR" | etc.

    /* ------------------------------------------------------
       Anunciar cambios a lectores de pantalla
    -------------------------------------------------------*/
    const anunciar = (mensaje) => {
        if (anuncioRef.current) {
            anuncioRef.current.textContent = mensaje;
            setTimeout(() => (anuncioRef.current.textContent = ''), 1000);
        }
    };

    /* ------------------------------------------------------
       CARGA inicial de usuarios
    -------------------------------------------------------*/
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

    /* ------------------------------------------------------
       Búsqueda en tiempo real
    -------------------------------------------------------*/
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const usuariosFiltrados = usuarios.filter((usuario) => {
        const term = searchTerm.toLowerCase().trim();
        if (term === '') return true;

        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase();
        const correo = String(usuario.correo_electronico || '').toLowerCase();
        const estado = String(usuario.estado || 'activo').toLowerCase();
        const rol = String(usuario.tipo_usuario || '').toLowerCase();
        const documento = String(usuario.numero_documento || '').toLowerCase();
        const fechaRegistro = formatDate(usuario.createdAt).toLowerCase();

        const esEstado = term === 'activo' || term === 'inactivo';
        if (esEstado) return estado === term;

        return (
            nombreCompleto.includes(term) ||
            correo.includes(term) ||
            rol.includes(term) ||
            estado.includes(term) ||
            documento.includes(term) ||
            fechaRegistro.includes(term)
        );
    });

    /* ==========================================================
       FUNCIONES DE ACCIÓN
    ========================================================== */
    const verPerfil = (id) => {
        navigate(`/perfil/${id}`);
    };

    const handleReenviarCorreo = async (idUsuario) => {
        const confirmar = await Swal.fire({
            title: '¿Reenviar correo de verificación?',
            text: 'El usuario recibirá un nuevo enlace en su bandeja.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, reenviar',
            cancelButtonText: 'Cancelar',
        });

        if (!confirmar.isConfirmed) return;

        try {
            await ClientesAxios.post(
                `/api/usuario/reenviar-verificacion/${idUsuario}`,
                {}, 
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            Swal.fire('Enviado', 'Correo de verificación reenviado correctamente.', 'success');
        } catch (error) {
            const msg = error.response?.data?.mensaje || 'No se pudo reenviar el correo';
            Swal.fire('Error', msg, 'error');
        }
    };

    /* ==========================================================
       RENDER
    ========================================================== */
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

    return (
        <div className={styles['listado-container']} role="main" aria-label="Listado de usuarios">
            {/* Anuncios en vivo para lectores de pantalla */}
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1>Listado de Usuarios del Sistema</h1>

            {/* Botones superiores y buscador */}
            <div className={styles['botones-container']}>
                <div className={styles['action-buttons-group']}>
                    <button onClick={() => navigate('/registro')} className={styles.btn} aria-label="Crear nuevo usuario">
                        Crear Nuevo Usuario
                    </button>
                    <button onClick={fetchUsuarios} className={styles.btn} aria-label="Recargar lista de usuarios">
                        Recargar Lista
                    </button>
                </div>

                <div className={styles['search-container']}>
                    <div className={styles['search-input-wrapper']}>
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, Correo Electrónico o Estado..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={styles['search-input']}
                            aria-label="Campo de búsqueda de usuarios por nombre, correo o estado"
                        />
                        <i className={`fas fa-search ${styles['search-icon']}`}></i>
                    </div>
                </div>
            </div>

            {/* Mensaje si no hay resultados */}
            {usuariosFiltrados.length === 0 && searchTerm !== '' && (
                <p style={{ textAlign: 'center', color: 'var(--color-cuatro)', marginTop: '20px' }}>
                    No se encontraron resultados para "{searchTerm}".
                </p>
            )}

            {/* Tabla con scroll horizontal en móviles */}
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
                                <td>{usuario.numero_documento || 'N/A'}</td>
                                <td>{usuario.correo_electronico}</td>
                                <td>{usuario.tipo_usuario}</td>
                                <td>{usuario.estado || 'Activo'}</td>
                                <td>{formatDate(usuario.createdAt)}</td>
                                <td>
                                    {/* Botón Ver Perfil */}
                                    <button
                                        onClick={() => verPerfil(usuario._id)}
                                        className={styles['action-btn-primary']}
                                    >
                                        Ver Perfil
                                    </button>

                                    {/*Reenviar correo de verificación*/}
                                    {!usuario.isVerified &&
                                     ['SUPERADMIN', 'ADMINISTRADOR'].includes(rolActual) && (
                                        <button
                                            onClick={() => handleReenviarCorreo(usuario._id)}
                                            className={styles['action-btn-secondary']}
                                            style={{ marginLeft: '5px' }}
                                            title="Reenviar correo de verificación"
                                            aria-label={`Reenviar correo a ${usuario.nombre} ${usuario.apellido}`}
                                        >
                                            Reenviar
                                        </button>
                                    )}
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