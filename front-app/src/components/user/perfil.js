import React, { useState, useEffect } from 'react';
import usuarioAxios from '../../config/axios';
import Swal from 'sweetalert2';

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

    useEffect(() => {
        const obtenerPerfil = async () => {
            try {
                const response = await usuarioAxios.get(`/usuarios/${idUsuario}`);
                setPerfil(response.data);
            } catch (error) {
                console.error("Error al obtener el perfil:", error);
            }
        };
        obtenerPerfil();
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
            Swal.fire({
                title: "Error",
                text: "Hubo un error al actualizar el perfil",
                icon: "error"
            });
        }
    };

    const habilitarDeshabilitarUsuario = async () => {
        const nuevoEstado = perfil.estado === 'activo' ? 'inactivo' : 'activo';

        try {
            await usuarioAxios.put(`/usuarios/${idUsuario}/estado`, { estado: nuevoEstado });
            Swal.fire(
                'Actualizado!',
                `El usuario ha sido ${nuevoEstado === 'activo' ? 'habilitado' : 'deshabilitado'}.`,
                'success'
            );
            setPerfil({ ...perfil, estado: nuevoEstado });
        } catch (error) {
            Swal.fire(
                'Error',
                'Hubo un error al actualizar el estado del usuario.',
                'error'
            );
        }
    };

    const validarFormulario = () => {
        const { nombre, apellido, email, tipo_documento, numero_documento, telefono } = perfil;
        return !nombre.length || !apellido.length || !email.length || !tipo_documento.length || !numero_documento.length || !telefono.length;
    };

    if (!perfil.nombre) return <div>Cargando perfil...</div>;

    return (
        <React.Fragment>
            <h1>Mi Perfil</h1>
            {editando ? (
                <form onSubmit={manejarEnvio}>
                    <legend>Edita tu perfil</legend>
                    <div className="campo">
                        <label>Telefono:</label>
                        <input type="text" placeholder="Telefono" name="telefono" onChange={manejarCambio} value={perfil.telefono} />
                    </div>
                    <div className="campo">
                        <label>Email:</label>
                        <input type="email" placeholder="Email" name="email" onChange={manejarCambio} value={perfil.email} />
                    </div>
                    <button type="submit" className="btn btn-azul" disabled={validarFormulario()}>Guardar Cambios</button>
                    <button type="button" className="btn btn-rojo" onClick={() => setEditando(false)}>Cancelar</button>
                </form>
            ) : (
                <div className="info-perfil">
                    <p className="nombre">{perfil.nombre} {perfil.apellido}</p>
                    <p className="email">{perfil.email}</p>
                    <p className="documento">{perfil.tipo_documento}: {perfil.numero_documento}</p>
                    <p className="telefono">{perfil.telefono}</p>
                    <p className="estado">Estado: **{perfil.estado}**</p>
                    <button type="button" className="btn btn-azul" onClick={() => setEditando(true)}>
                        <i className="fas fa-pen-alt"></i> Editar Perfil
                    </button>
                    <button
                        type="button"
                        className={perfil.estado === 'activo' ? 'btn btn-rojo' : 'btn btn-verde'}
                        onClick={habilitarDeshabilitarUsuario}
                    >
                        {perfil.estado === 'activo' ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                </div>
            )}
        </React.Fragment>
    );
}

export default Perfil;
