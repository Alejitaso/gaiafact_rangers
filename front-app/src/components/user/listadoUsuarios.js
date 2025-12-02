import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './listadoUsuario.module.css';

const ListadoUsuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const usuariosFiltrados = usuarios.filter(usuario => {
        const term = searchTerm.toLowerCase().trim();
        if (term === '') return true; 

        // Variables de búsqueda
        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.toLowerCase();
        const correo = String(usuario.correo_electronico || '').toLowerCase(); 
        const estado = String(usuario.estado || 'activo').toLowerCase();
        const rol = String(usuario.tipo_usuario || '').toLowerCase(); 
        
        // 🛑 CORRECCIÓN DE LA LÓGICA DE BÚSQUEDA 🛑
        const esTerminoDeEstado = term === 'activo' || term === 'inactivo';

        // 1. Si el término ES un estado (activo/inactivo), fuerza la COINCIDENCIA EXACTA.
        if (esTerminoDeEstado) {
            return estado === term; 
        }

        // 2. Si NO es un estado exacto (es un nombre, correo, etc.), usa la búsqueda general 'includes'.
        return nombreCompleto.includes(term) || 
               correo.includes(term) || 
               rol.includes(term) ||
               estado.includes(term); // Permite buscar términos parciales como "admin" o "ac"
    });

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
            {/* ✅ Anuncios en vivo */}
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1>Listado de Usuarios del Sistema</h1>

           <div className={styles['botones-container']}>
            
            {/* 1. Contenedor para los botones (alineado a la izquierda) */}
            <div className={styles['action-buttons-group']}> 
                <button onClick={() => navigate('/registro')} className={styles.btn} aria-label="Crear nuevo usuario">
                    Crear Nuevo Usuario
                </button>
                <button onClick={fetchUsuarios} className={styles.btn} aria-label="Recargar lista de usuarios">
                    Recargar Lista
                </button>
            </div>

            {/* 2. Buscador (alineado a la derecha) */}
            <div className={styles['search-container']}>
                {/* Este es el contenedor clave que debe tener position: relative */}
                <div className={styles['search-input-wrapper']}> 
                    <input
                        type="text"
                        placeholder="Buscar por Nombre, Correo Electrónico o Estado..."
                        value={searchTerm} // 🛑 CLAVE 1: Muestra el valor de la variable de estado
                        onChange={handleSearchChange} // 🛑 CLAVE 2: Actualiza la variable de estado al escribir
                        className={styles['search-input']}
                        aria-label="Campo de búsqueda de usuarios por nombre, correo o estado"
                    />
                    {/* Este es el icono que debe tener position: absolute */}
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
                        {usuariosFiltrados.map(usuario => (
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