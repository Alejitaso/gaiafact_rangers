import React, { useEffect, useState, useCallback } from "react";
import ClientesAxios from "../../config/axios";
import Swal from "sweetalert2";
import { jwtDecode } from 'jwt-decode';
import styles from './perfil.module.css';
import { useParams, useNavigate } from 'react-router-dom';

const Perfil = () => {
    // Inicialización de hooks y estados
    const { idUsuario: idParam } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [idUsuarioToken, setIdUsuarioToken] = useState(null);
    const [perfil, setPerfil] = useState({
        nombre: "", apellido: "", tipo_documento: "", numero_documento: "", 
        correo_electronico: "", telefono: "", estado: "", tipo_usuario: "", imagen: ""
    });
    
    // Indica si el perfil actual puede ser editado (solo el propio usuario)
    const [isEditable, setIsEditable] = useState(false);

    // Extrae el ID del usuario logueado del token JWT en localStorage.
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId || decoded._id || decoded.id; 
                setIdUsuarioToken(userId);
            } catch (error) {
                console.error("Error decodificando el token. Sesión expirada.", error);
                localStorage.removeItem('token');
            }
        }
    }, []); 

    const finalUserId = idParam || idUsuarioToken; 

    // Lógica de petición y manejo de errores de autenticación/autorización.
    const obtenerPerfil = useCallback(async () => {
        if (!finalUserId) {
            setLoading(false);
            return; 
        }

        try {
            const response = await ClientesAxios.get(`/api/Usuario/${finalUserId}`);
            const datos = response.data;
            
            setPerfil({
                nombre: datos.nombre || "", apellido: datos.apellido || "", 
                tipo_documento: datos.tipo_documento || "", numero_documento: datos.numero_documento || "",
                correo_electronico: datos.correo_electronico || "", telefono: datos.telefono || "",
                estado: datos.estado || "", tipo_usuario: datos.tipo_usuario || "", imagen: datos.imagen || ""
            }); 

            // Determinar si es editable: solo si el ID del token coincide con el ID de la URL/perfil
            setIsEditable(finalUserId === idUsuarioToken);
            setLoading(false);

        } catch (error) {
            setLoading(false);
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
        }
    }, [finalUserId, idUsuarioToken, navigate]); 

    // Ejecuta el fetch y define la lógica para editar y guardar cambios.
    useEffect(() => {
        if (finalUserId) {
            obtenerPerfil();
        }
    }, [obtenerPerfil, finalUserId]); 


    const handleChange = (e) => {
        // Solo permitir cambios si el perfil es editable (propio usuario)
        if (isEditable) {
            setPerfil({ ...perfil, [e.target.name]: e.target.value });
        }
    };

    const actualizarPerfil = async () => {
        // La validación de permisos de edición se hace aquí y también debe estar en el backend
        if (!isEditable) {
            Swal.fire("Acción denegada", "Solo puedes editar tu propio perfil.", "warning");
            return;
        }
        
        try {
            await ClientesAxios.put(`/api/Usuario/${idUsuarioToken}`, perfil); 
            Swal.fire("¡Perfil actualizado!", "Los cambios se guardaron correctamente", "success");
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar el perfil", "error");
        }
    };

    // Muestra el perfil, campos solo lectura/editables y botones condicionales.
    if (loading || !finalUserId) {
        return <div className={styles["perfil-container"]}><h1>Cargando perfil...</h1></div>;
    }

    return (
        <div className={styles["perfil-container"]}>
            <h1 className={styles["perfil-title"]}>{isEditable ? 'Mi Perfil' : `Perfil de ${perfil.nombre}`}</h1> 

            <div className={styles["info-perfil"]}>
                
                {/* CAMPO: Nombre (SOLO LECTURA) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Nombre</label>
                    <input type="text" value={perfil.nombre} readOnly={true} className={styles.input} />
                </div>
                
                {/* CAMPO: Apellido (SOLO LECTURA) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Apellido</label>
                    <input type="text" value={perfil.apellido} readOnly={true} className={styles.input} />
                </div>

                {/* CAMPO: Documento (SOLO LECTURA) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Documento</label>
                    <input 
                        type="text" 
                        value={`${perfil.tipo_documento} ${perfil.numero_documento}`} 
                        readOnly={true} 
                        className={styles.input}
                    />
                </div>

                {/* CAMPO: Correo (EDITABLE: SOLO si es su propio perfil) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Correo</label>
                    <input
                        type="email"
                        name="correo_electronico"
                        value={perfil.correo_electronico}
                        onChange={handleChange}
                        readOnly={!isEditable} 
                        className={styles.input}
                    />
                </div>

                {/* CAMPO: Teléfono (EDITABLE: SOLO si es su propio perfil) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Teléfono</label>
                    <input 
                        type="text" 
                        name="telefono" 
                        value={perfil.telefono} 
                        onChange={handleChange}
                        readOnly={!isEditable} 
                        className={styles.input}
                    />
                </div>

                {/* CAMPO: Rol (SOLO LECTURA) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Rol:</label>
                    <p className={styles.displayValue}>{perfil.tipo_usuario}</p>
                </div>

                {/* CAMPO: Estado (SOLO LECTURA) */}
                <div className={styles.campo}>
                    <label className={styles.label}>Estado:</label>
                    <p className={styles.displayValue}>{perfil.estado}</p>
                </div>

                {/* BOTÓN DE GESTIÓN DE USUARIOS (CONDICIONAL) */}
                {(perfil.tipo_usuario && (
                    perfil.tipo_usuario.toUpperCase() === 'SUPERADMIN' || 
                    perfil.tipo_usuario.toUpperCase() === 'ADMINISTRADOR' // 👈 Cambio implementado aquí
                )) && (
                    <div className={styles["botones-container"]} style={{ marginTop: '20px' }}>
                        <button 
                            onClick={() => navigate('/usuarios')}
                            className={styles.btn}
                        >
                            Ir a la Gestión de Usuarios
                        </button>
                    </div>
                )}
                
                {/* Botón de Guardar Cambios (solo si es editable) */}
                {isEditable && (
                    <div className={styles["botones-container"]}>
                        <button onClick={actualizarPerfil} className={styles.btn}>
                            Guardar cambios
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Perfil;
