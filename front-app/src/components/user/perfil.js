import React, { useEffect, useState, useCallback, useRef } from "react";
import ClientesAxios from "../../config/axios";
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';
import styles from './perfil.module.css';
import { useParams, useNavigate } from 'react-router-dom';

const Perfil = () => {
    const { idUsuario: idParam } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [idUsuarioToken, setIdUsuarioToken] = useState(null);
    const [rolUsuarioToken, setRolUsuarioToken] = useState(null); 
    const [perfil, setPerfil] = useState({
        nombre: "", apellido: "", tipo_documento: "", numero_documento: "",
        correo_electronico: "", telefono: "", estado: "", tipo_usuario: "", imagen: "", 
        fecha_registro: null
    });
    const [isEditable, setIsEditable] = useState(false);
    const [canEditOther, setCanEditOther] = useState(false); 

    // ✅ Accesibilidad
    const anuncioRef = useRef(null);
    const guardarBtnRef = useRef(null);

    const anunciar = (mensaje) => {
        if (anuncioRef.current) {
            anuncioRef.current.textContent = mensaje;
            setTimeout(() => (anuncioRef.current.textContent = ''), 1000);
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "No disponible";
        // Asume que la fecha viene en formato ISO de la base de datos
        return new Date(fecha).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId || decoded._id || decoded.id;
                const userRole = decoded.tipo_usuario?.toUpperCase(); 
                setIdUsuarioToken(userId);
                setRolUsuarioToken(userRole); 

                if (userRole === 'SUPERADMIN' || userRole === 'ADMINISTRADOR') { 
                    setCanEditOther(true);
                } else {
                    setCanEditOther(false);
                }

            } catch (error) {
                console.error("Error decodificando el token. Sesión expirada.", error);
                localStorage.removeItem('token');
                navigate('/'); 
            }
        } else {
             navigate('/'); 
        }
    }, [navigate]); 

    const finalUserId = idParam || idUsuarioToken;

    const obtenerPerfil = useCallback(async () => {
        if (!finalUserId) {
            setLoading(false);
            return;
        }
        try {
            anunciar('Cargando perfil');
            const response = await ClientesAxios.get(`/api/Usuario/${finalUserId}`);
            const datos = response.data;
            setPerfil({
                nombre: datos.nombre || "", apellido: datos.apellido || "",
                tipo_documento: datos.tipo_documento || "", numero_documento: datos.numero_documento || "",
                correo_electronico: datos.correo_electronico || "", telefono: datos.telefono || "",
                estado: datos.estado || "", tipo_usuario: datos.tipo_usuario || "", imagen: datos.imagen || "",
                fecha_registro: datos.createdAt || null
            });

            const isOwnProfile = finalUserId === idUsuarioToken;
            const canEdit = isOwnProfile || canEditOther;

            setIsEditable(canEdit);

            anunciar('Perfil cargado');
        } catch (error) {
            anunciar('Error al cargar perfil');
            if (error.response?.status === 403) {
                Swal.fire("Acceso Restringido", "No tienes permisos para ver este perfil.", "error");
                navigate('/usuarios');
            } else if (error.response?.status === 401) {
                Swal.fire("Sesión expirada", "Inicia sesión nuevamente", "warning");
                localStorage.removeItem("token");
                navigate('/');
            } else {
                Swal.fire("Error", "No se pudo cargar el perfil", "error");
            }
        } finally {
            setLoading(false);
        }

    }, [finalUserId, idUsuarioToken, canEditOther, navigate]); 

    useEffect(() => {
        if (idUsuarioToken !== null) { 
            obtenerPerfil();
        }
    }, [obtenerPerfil, idUsuarioToken]);

    const handleChange = (e) => {
        if (isEditable) {
            setPerfil({ ...perfil, [e.target.name]: e.target.value });
        } else {
             Swal.fire("Acción denegada", "No tienes permisos para editar este perfil.", "warning");
        }
    };

    const actualizarPerfil = async () => {
        if (!isEditable) {
            Swal.fire("Acción denegada", "No tienes permisos para editar este perfil.", "warning");
            return;
        }

        const idToUpdate = finalUserId; 

        if (perfil.tipo_usuario?.toUpperCase() === 'SUPERADMIN' && perfil.estado === 'Inactivo' && idToUpdate === idUsuarioToken) {
            Swal.fire("Operación no permitida", "Un Superadmin no puede inactivarse a sí mismo.", "error");
            return;
        }

        try {
            anunciar('Actualizando perfil');
            await ClientesAxios.put(`/api/Usuario/${idToUpdate}`, perfil); 
            anunciar('Perfil actualizado');
            Swal.fire("¡Perfil actualizado!", "Los cambios se guardaron correctamente", "success");
            
            if (idToUpdate !== idUsuarioToken) {
                 obtenerPerfil();
            }

        } catch (error) {
            anunciar('Error al actualizar perfil');
            if (error.response?.status === 403) {
                 Swal.fire("Acceso Restringido", "No tienes permisos para realizar esta acción.", "error");
            } else {
                 Swal.fire("Error", "No se pudo actualizar el perfil", "error");
            }
        }
    };

    if (loading || !idUsuarioToken) { 
        return (
            <div className={styles["perfil-container"]} role="main" aria-label="Cargando perfil">
                <h1>Cargando perfil...</h1>
            </div>
        );
    }
    const isFieldEditable = isEditable;

    const canEditOtherOnly = canEditOther; 
    
    const canEditOwnStatus = idParam === undefined || idParam === null;


    return (
        <div className={styles["perfil-container"]} role="main" aria-label={`Perfil de ${perfil.nombre}`}>
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1 className={styles["perfil-title"]}>{finalUserId === idUsuarioToken ? 'Mi Perfil' : `Perfil de ${perfil.nombre}`}</h1>

            <div className={styles["info-perfil"]}>
                <div className={styles.campo}>
                    <label className={styles.label}>Nombre</label>
                    <input type="text" value={perfil.nombre} readOnly className={styles.input} aria-readonly="true" />
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Apellido</label>
                    <input type="text" value={perfil.apellido} readOnly className={styles.input} aria-readonly="true" />
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Documento</label>
                    <input type="text" value={`${perfil.tipo_documento} ${perfil.numero_documento}`} readOnly className={styles.input} aria-readonly="true" />
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Correo</label>
                    <input
                        type="email"
                        name="correo_electronico"
                        value={perfil.correo_electronico}
                        onChange={handleChange}
                        readOnly={!isFieldEditable} 
                        className={styles.input}
                        aria-describedby={!isFieldEditable ? "correo-locked" : undefined}
                    />
                    {!isFieldEditable && <span id="correo-locked" className="sr-only">Campo de solo lectura</span>}
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={perfil.telefono}
                        onChange={handleChange}
                        readOnly={!isFieldEditable} 
                        className={styles.input}
                        aria-describedby={!isFieldEditable ? "telefono-locked" : undefined}
                    />
                    {!isFieldEditable && <span id="telefono-locked" className="sr-only">Campo de solo lectura</span>}
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Rol:</label>
                    <p className={styles.displayValue}>{perfil.tipo_usuario}</p>
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Fecha de Registro:</label>
                    <p className={styles.displayValue}>{formatearFecha(perfil.fecha_registro)}</p>
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Estado:</label>
                    {canEditOtherOnly && !canEditOwnStatus ? ( 
                        <select
                            name="estado"
                            value={perfil.estado}
                            onChange={handleChange}
                            className={styles.input}
                            aria-label="Estado del usuario"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    ) : (
                        <p className={styles.displayValue}>{perfil.estado}</p> 
                    )}
                </div>

                {(rolUsuarioToken === 'SUPERADMIN' || rolUsuarioToken === 'ADMINISTRADOR') && ( 
                    <div className={styles["botones-container"]}>
                        <button onClick={() => navigate('/usuarios')} className={styles.btn} aria-label="Ir a gestión de usuarios">
                            Ir a la Gestión de Usuarios
                        </button>
                    </div>
                )}

                {isEditable && ( 
                    <div className={styles["botones-container"]}>
                        <button ref={guardarBtnRef} onClick={actualizarPerfil} className={styles.btn} aria-label="Guardar cambios del perfil">
                            Guardar cambios
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Perfil;