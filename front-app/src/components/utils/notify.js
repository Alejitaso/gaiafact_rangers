import React, { useState, useEffect, Fragment } from 'react';
import usuarioAxios from '../../config/axios';
import Swal from 'sweetalert2';

function Notificaciones({ idUsuario }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

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

    const marcarComoLeida = async (idNotificacion) => {
        try {
            await usuarioAxios.put(`/notificaciones/${idNotificacion}/leida`);
            Swal.fire(
                'Notificación',
                'Marcada como leída',
                'success'
            );
            setNotificaciones(notificaciones.map(notif =>
                notif._id === idNotificacion ? { ...notif, leida: true } : notif
            ));
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "Hubo un error al marcar la notificación como leída",
                icon: "error"
            });
        }
    };

    if (cargando) {
        return <div>Cargando notificaciones...</div>;
    }

    if (notificaciones.length === 0) {
        return <div>No tienes notificaciones.</div>;
    }

    return (
        <Fragment>
            <h1>Notificaciones</h1>
            <ul className="listado-notificaciones">
                {notificaciones.map(notif => (
                    <li key={notif._id} className={notif.leida ? 'notificacion notificacion-leida' : 'notificacion notificacion-no-leida'}>
                        <div className="info-notificacion">
                            <p className="titulo"><strong>{notif.titulo}</strong></p>
                            <p className="mensaje">{notif.mensaje}</p>
                            <p className="fecha">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="acciones">
                            {!notif.leida && (
                                <button type="button" className="btn btn-azul" onClick={() => marcarComoLeida(notif._id)}>
                                    <i className="fas fa-check"></i> Marcar como leída
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </Fragment>
    );
}

export default Notificaciones;

