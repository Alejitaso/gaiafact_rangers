import React, { useState, useEffect, Fragment } from 'react';
import usuarioAxios from '../../config/axios';
import Swal from 'sweetalert2';

function Notificaciones({ idUsuario }) {
    const [notificaciones, setNotificaciones] = useState([]);

    const [numeroFactura, setNumeroFactura] = useState("");
    const [numeroDocumentoUsuario, setNumeroDocumentoUsuario] = useState("");

    const obtenerNotificaciones = async () => {
        try {
            const response = await usuarioAxios.get(`/notificaciones/${idUsuario}`);
            setNotificaciones(response.data);
        } catch (error) {
            console.error("Error al obtener las notificaciones:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerNotificaciones();
    }, [idUsuario]);

    const crearNotificacion = async (e) => {
        e.preventDefault();
        try {
            const { data } = await usuarioAxios.post("/notificaciones/crear", {
                numeroFactura,
                numeroDocumentoUsuario
            });
            Swal.fire("Éxito", data.mensaje, "success");
            setNumeroFactura("");
            setNumeroDocumentoUsuario("");
            obtenerNotificaciones();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo crear la notificación", "error");
        }
    };

    const enviarFactura = async (idFactura) => {
        try {
            const { data } = await usuarioAxios.post(`/facturas/enviar/${idFactura}`);
            Swal.fire("Éxito", data.mensaje, "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo enviar la factura", "error");
        }
    };

    const cancelarAccion = (idNotificacion) => {
        Swal.fire("Cancelado", `Se canceló la acción para la notificación ${idNotificacion}`, "info");
    };

    return (
        <Fragment>
            <h1>Notificaciones</h1>

            {/* Formulario para crear notificación */}
            <form onSubmit={crearNotificacion} style={{ marginBottom: "2rem" }}>
                <h2>Crear Notificación</h2>
                <div>
                    <label>Número de Factura:</label>
                    <input
                        type="text"
                        value={numeroFactura}
                        onChange={(e) => setNumeroFactura(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Número de Documento del Usuario:</label>
                    <input
                        type="text"
                        value={numeroDocumentoUsuario}
                        onChange={(e) => setNumeroDocumentoUsuario(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-verde">Crear</button>
            </form>

            {/* Lista de notificaciones */}
            <ul className="listado-notificaciones">
                {notificaciones.map(notif => (
                    <li key={notif._id} className="notificacion">
                        <div className="info-notificacion">
                            <p className="titulo"><strong>{notif.titulo || "Notificación"}</strong></p>
                            <p className="mensaje">{notif.mensaje || "Se generó una nueva notificación."}</p>
                            <p className="fecha">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="acciones">
                            <button
                                type="button"
                                className="btn btn-verde"
                                onClick={() => enviarFactura(notif.factura || notif._id)}
                            >
                                <i className="fas fa-paper-plane"></i> Enviar
                            </button>
                            <button
                                type="button"
                                className="btn btn-rojo"
                                onClick={() => cancelarAccion(notif._id)}
                            >
                                <i className="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </Fragment>
    );
}

export default Notificaciones;




