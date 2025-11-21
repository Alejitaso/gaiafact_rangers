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
    const [perfil, setPerfil] = useState({
        nombre: "", apellido: "", tipo_documento: "", numero_documento: "",
        correo_electronico: "", telefono: "", estado: "", tipo_usuario: "", imagen: ""
    });
    const [isEditable, setIsEditable] = useState(false);

    // ✅ Accesibilidad
    const anuncioRef = useRef(null);
    const guardarBtnRef = useRef(null);

    const anunciar = (mensaje) => {
        if (anuncioRef.current) {
            anuncioRef.current.textContent = mensaje;
            setTimeout(() => (anuncioRef.current.textContent = ''), 1000);
        }
    };

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
                estado: datos.estado || "", tipo_usuario: datos.tipo_usuario || "", imagen: datos.imagen || ""
            });
            setIsEditable(finalUserId === idUsuarioToken);
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
    }, [finalUserId, idUsuarioToken, navigate]);

    useEffect(() => {
        if (finalUserId) obtenerPerfil();
    }, [obtenerPerfil, finalUserId]);

    const handleChange = (e) => {
        if (isEditable) setPerfil({ ...perfil, [e.target.name]: e.target.value });
    };

    const actualizarPerfil = async () => {
        if (!isEditable) {
            Swal.fire("Acción denegada", "Solo puedes editar tu propio perfil.", "warning");
            return;
        }
        try {
            anunciar('Actualizando perfil');
            await ClientesAxios.put(`/api/Usuario/${idUsuarioToken}`, perfil);
            anunciar('Perfil actualizado');
            Swal.fire("¡Perfil actualizado!", "Los cambios se guardaron correctamente", "success");
        } catch (error) {
            anunciar('Error al actualizar perfil');
            Swal.fire("Error", "No se pudo actualizar el perfil", "error");
        }
    };

    if (loading || !finalUserId) {
        return (
            <div className={styles["perfil-container"]} role="main" aria-label="Cargando perfil">
                <h1>Cargando perfil...</h1>
            </div>
        );
    }

    return (
        <div className={styles["perfil-container"]} role="main" aria-label={`Perfil de ${perfil.nombre}`}>
            <div ref={anuncioRef} role="status" aria-live="assertive" aria-atomic="true" className="sr-only"></div>

            <h1 className={styles["perfil-title"]}>{isEditable ? 'Mi Perfil' : `Perfil de ${perfil.nombre}`}</h1>

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
                        readOnly={!isEditable}
                        className={styles.input}
                        aria-describedby={!isEditable ? "correo-locked" : undefined}
                    />
                    {!isEditable && <span id="correo-locked" className="sr-only">Campo de solo lectura</span>}
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        value={perfil.telefono}
                        onChange={handleChange}
                        readOnly={!isEditable}
                        className={styles.input}
                        aria-describedby={!isEditable ? "telefono-locked" : undefined}
                    />
                    {!isEditable && <span id="telefono-locked" className="sr-only">Campo de solo lectura</span>}
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Rol:</label>
                    <p className={styles.displayValue}>{perfil.tipo_usuario}</p>
                </div>

                <div className={styles.campo}>
                    <label className={styles.label}>Estado:</label>
                    <p className={styles.displayValue}>{perfil.estado}</p>
                </div>

                {(perfil.tipo_usuario?.toUpperCase() === 'SUPERADMIN' || perfil.tipo_usuario?.toUpperCase() === 'ADMINISTRADOR') && (
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