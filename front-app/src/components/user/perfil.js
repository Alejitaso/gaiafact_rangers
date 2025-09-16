import React, { useState, useEffect } from 'react';
import usuarioAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './perfil.module.css';

function Perfil({ idUsuario }) {
    const [perfil, setPerfil] = useState({
        nombre: '',
        apellido: '',
        email: '',
        tipo_documento: '',
        numero_documento: '',
        telefono: '',
        estado: '',
        tipo_usuario: ''
    });

    const [editando, setEditando] = useState(false);

    // Función para buscar usuario por id
    useEffect(() => {
        const obtenerPerfil = async () => {
            try {
                const response = await usuarioAxios.get(`/usuarios/${idUsuario}`);
                setPerfil(response.data);
            } catch (error) {
                console.error("Error al obtener el perfil:", error);
                Swal.fire({
                    title: "Error",
                    text: "No se pudo cargar el perfil del usuario",
                    icon: "error"
                });
            }
        };
        
        if (idUsuario) {
            obtenerPerfil();
        }
    }, [idUsuario]);

    const manejarCambio = e => {
        setPerfil({
            ...perfil,
            [e.target.name]: e.target.value
        });
    };

    const manejarEnvio = async e => {
        e.preventDefault();
        try {
            await usuarioAxios.put(`/usuarios/${idUsuario}`, perfil);
            Swal.fire(
                'Correcto',
                'Perfil actualizado correctamente',
                'success'
            );
            setEditando(false);
        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            Swal.fire({
                title: "Error",
                text: "Hubo un error al actualizar el perfil",
                icon: "error"
            });
        }
    };

    const habilitarDeshabilitarUsuario = async () => {
        const nuevoEstado = perfil.estado === 'activo' ? 'inactivo' : 'activo';
        const accion = nuevoEstado === 'activo' ? 'habilitar' : 'deshabilitar';

        // Confirmación antes de cambiar el estado
        const result = await Swal.fire({
            title: `¿Estás seguro?`,
            text: `¿Deseas ${accion} este usuario?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await usuarioAxios.put(`/usuarios/${idUsuario}/estado`, { estado: nuevoEstado });
            Swal.fire(
                'Actualizado!',
                `El usuario ha sido ${nuevoEstado === 'activo' ? 'habilitado' : 'deshabilitado'}.`,
                'success'
            );
            setPerfil({ ...perfil, estado: nuevoEstado });
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            Swal.fire(
                'Error',
                'Hubo un error al actualizar el estado del usuario.',
                'error'
            );
        }
    };

    const validarFormulario = () => {
        const { nombre, apellido, email, telefono } = perfil;
        return !nombre?.trim() || !apellido?.trim() || !email?.trim() || !telefono?.trim();
    };

    const cancelarEdicion = () => {
        setEditando(false);
        // Opcional: recargar datos originales
        // obtenerPerfil();
    };

    // Mostrar mensaje de carga
    if (!perfil.nombre && !perfil.apellido) {
        return (
            <div className={styles['perfil-container']}>
                <div className={styles['loading-message']}>
                    Cargando perfil...
                </div>
            </div>
        );
    }

    return (
        <div className={styles['perfil-container']}>
            <h1>Mi Perfil</h1>
            
            {editando ? (
                <form onSubmit={manejarEnvio}>
                    <legend>Edita tu perfil</legend>
                    
                    <div className={styles.campo}>
                        <label>Nombre:</label>
                        <input 
                            type="text" 
                            placeholder="Nombre" 
                            name="nombre" 
                            onChange={manejarCambio} 
                            value={perfil.nombre || ''} 
                            required
                        />
                    </div>

                    <div className={styles.campo}>
                        <label>Apellido:</label>
                        <input 
                            type="text" 
                            placeholder="Apellido" 
                            name="apellido" 
                            onChange={manejarCambio} 
                            value={perfil.apellido || ''} 
                            required
                        />
                    </div>

                    <div className={styles.campo}>
                        <label>Email:</label>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            name="email" 
                            onChange={manejarCambio} 
                            value={perfil.email || ''} 
                            required
                        />
                    </div>

                    <div className={styles.campo}>
                        <label>Teléfono:</label>
                        <input 
                            type="tel" 
                            placeholder="Teléfono" 
                            name="telefono" 
                            onChange={manejarCambio} 
                            value={perfil.telefono || ''} 
                            required
                        />
                    </div>

                    <div className={styles['botones-container']}>
                        <button 
                            type="submit" 
                            className={`${styles.btn} ${styles['btn-verde']}`}
                            disabled={validarFormulario()}
                        >
                            Guardar Cambios
                        </button>
                        <button 
                            type="button" 
                            className={`${styles.btn} ${styles['btn-rojo']}`}
                            onClick={cancelarEdicion}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className={styles['info-perfil']}>
                    <p className={styles.nombre}>{perfil.nombre} {perfil.apellido}</p>
                    <p className={styles.email}>{perfil.email}</p>
                    <p className={styles.documento}>
                        {perfil.tipo_documento}: {perfil.numero_documento}
                    </p>
                    <p className={styles.telefono}>Teléfono: {perfil.telefono}</p>
                    <p className={styles.estado}>
                        Estado: <strong>{perfil.estado}</strong>
                    </p>

                    <div className={styles['botones-container']}>
                        <button 
                            type="button" 
                            className={`${styles.btn} ${styles['btn-azul']}`}
                            onClick={() => setEditando(true)}
                        >
                            <i className="fas fa-pen-alt"></i> Editar Perfil
                        </button>
                        <button
                            type="button"
                            className={`${styles.btn} ${perfil.estado === 'activo' ? styles['btn-rojo'] : styles['btn-verde']}`}
                            onClick={habilitarDeshabilitarUsuario}
                        >
                            {perfil.estado === 'activo' ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Perfil;