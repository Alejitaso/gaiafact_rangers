import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientesAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './listadoUsuario.module.css'; 

const ListadoUsuarios = () => {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lógica encapsulada para obtener la lista de usuarios del backend.
    const fetchUsuarios = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ClientesAxios.get('/api/Usuario'); 
            setUsuarios(response.data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            if (error.response && error.response.status === 403) {
                Swal.fire("Acceso Restringido", "No tienes permisos de Superadmin/Admin.", "error");
                navigate('/inicio');
            } else {
                Swal.fire("Error", "No se pudo cargar el listado de usuarios.", "error");
            }
        }
    }, [navigate]);

    // Llama a la función de fetch al montar el componente.
    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    const verPerfil = (idUsuarioSeleccionado) => {
        navigate(`/perfil/${idUsuarioSeleccionado}`); 
    };

    // Muestra mensajes mientras se esperan datos o si la lista está vacía.
    if (loading) {
        return (
            <div className={styles['listado-container']}>
                <h1>Cargando usuarios...</h1>
            </div>
        );
    }

    if (usuarios.length === 0) {
        return (
            <div className={styles['listado-container']}>
                <h1>Listado de Usuarios del Sistema</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-cuatro)', marginTop: '50px' }}>
                    No se encontraron usuarios.
                </p>
                <div className={styles['botones-container']}>
                    <button onClick={fetchUsuarios} className={styles.btn}>
                        Recargar Lista
                    </button>
                </div>
            </div>
        );
    }
    // Muestra la lista de usuarios en formato de tabla.
    return (
        <div className={styles['listado-container']}>
            <h1>Listado de Usuarios del Sistema</h1>
            
            {/* Contenedor de botones de acción general */}
            <div className={styles['botones-container']}>
                {/*Aplicamos la clase btn */}
                <button onClick={() => navigate('/registro')} className={styles.btn}>
                    Crear Nuevo Usuario
                </button>
                <button onClick={fetchUsuarios} className={styles.btn}>
                    Recargar Lista
                </button>
            </div>

            {/* Contenedor de la tabla con scroll horizontal en móviles */}
            <div className={styles['tabla-wrapper']}>
                {/* Aplicamos la clase tabla-usuarios */}
                <table className={styles['tabla-usuarios']}>
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Correo Electrónico</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(usuario => (
                            <tr key={usuario._id}>
                                <td>{usuario.nombre} {usuario.apellido}</td>
                                <td>{usuario.correo_electronico}</td>
                                <td>{usuario.tipo_usuario}</td>
                                <td>{usuario.estado || 'Activo'}</td> 
                                <td>
                                    {/*Aplicamos la clase action-btn-primary */}
                                    <button 
                                        onClick={() => verPerfil(usuario._id)} 
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

export default ListadoUsuarios;// Exporta el componente
