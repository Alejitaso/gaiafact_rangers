// src/componentes/RegistroUsuario.js
import React, { useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';

function RegistroUsuario() {
  const [usuario, setUsuario] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: '',
    numero_documento: '',
    correo_electronico: '',
    contraseña: '',
    estado: 'Activo',
    tipo_usuario: 'Superadmin'
  });

  const manejarCambio = (e) => {
    setUsuario({
      ...usuario,
      [e.target.name]: e.target.value
    });
  };

  const validarFormulario = () => {
    const { nombre, apellido, tipo_documento, numero_documento, correo_electronico, contraseña } = usuario;
    return !nombre || !apellido || !tipo_documento || !numero_documento || !correo_electronico || !contraseña;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/usuarios', usuario);
      Swal.fire('Correcto', 'Usuario registrado correctamente', 'success');
      setUsuario({
        nombre: '',
        apellido: '',
        tipo_documento: '',
        numero_documento: '',
        correo_electronico: '',
        contraseña: '',
        estado: 'Activo',
        tipo_usuario: 'Superadmin'
      });
    } catch (error) {
      Swal.fire('Error', error?.response?.data?.mensaje || 'No se pudo registrar el usuario', 'error');
    }
  };

  return (
    <React.Fragment>
      <h1>Registrar Super Admin</h1>
      <form onSubmit={manejarEnvio}>
        <legend>Llena todos los campos</legend>

        <div className="campo">
          <label>Nombre:</label>
          <input type="text" placeholder="Nombre" name="nombre" onChange={manejarCambio} value={usuario.nombre} />
        </div>

        <div className="campo">
          <label>Apellido:</label>
          <input type="text" placeholder="Apellido" name="apellido" onChange={manejarCambio} value={usuario.apellido} />
        </div>

        <div className="campo">
          <label>Tipo Documento:</label>
          <select name="tipo_documento" onChange={manejarCambio} value={usuario.tipo_documento}>
            <option value="">-- Selecciona --</option>
            <option value="Cedula de ciudadania">Cédula de ciudadanía</option>
            <option value="Cedula extranjeria">Cédula de extranjería</option>
            <option value="Nit">NIT</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>

        <div className="campo">
          <label>Número Documento:</label>
          <input type="text" placeholder="Número de documento" name="numero_documento" onChange={manejarCambio} value={usuario.numero_documento} />
        </div>

        <div className="campo">
          <label>Correo Electrónico:</label>
          <input type="email" placeholder="Correo electrónico" name="correo_electronico" onChange={manejarCambio} value={usuario.correo_electronico} />
        </div>

        <div className="campo">
          <label>Contraseña:</label>
          <input type="password" placeholder="Contraseña" name="contraseña" onChange={manejarCambio} value={usuario.contraseña} />
        </div>

        <div className="campo">
          <label>Estado:</label>
          <select name="estado" onChange={manejarCambio} value={usuario.estado}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <div className="campo">
          <label>Tipo de Usuario:</label>
          <select name="tipo_usuario" onChange={manejarCambio} value={usuario.tipo_usuario}>
            <option value="Superadmin">Superadmin</option>
            <option value="Admin">Admin</option>
            <option value="cliente">Cliente</option>
            <option value="Usuario">Usuario</option>
          </select>
        </div>

        <button type="submit" className="btn btn-azul" disabled={validarFormulario()}>Registrar</button>
      </form>
    </React.Fragment>
  );
}

export default RegistroUsuario;
