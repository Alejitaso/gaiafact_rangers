import React, { useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './registro.module.css';
import { Link } from "react-router-dom";

// Funciones de validación
const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarSoloLetras = (text) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text.trim());

function RegistroUsuario() {
  const [usuario, setUsuario] = useState({
    nombre: '',
    apellido: '',
    correo_electronico: '',
    tipo_documento: '',
    numero_documento: '',
    telefono: '',
    estado: 'Activo',
    tipo_usuario: '',
    password: 'temporal123'
  });

  const rolLogueado = localStorage.getItem('tipo_usuario'); 

  // Definir opciones del select según el rol
  let opcionesTipoUsuario = [];
  if (rolLogueado === 'SUPERADMIN') {
    opcionesTipoUsuario = ['SUPERADMIN', 'ADMINISTRADOR', 'USUARIO', 'CLIENTE'];
  } else if (rolLogueado === 'ADMINISTRADOR') {
    opcionesTipoUsuario = ['USUARIO', 'CLIENTE'];
  } else if (rolLogueado === 'USUARIO') {
    opcionesTipoUsuario = ['CLIENTE'];
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'nombre' || name === 'apellido') {
      newValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    } else if (name === 'telefono') {
      newValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'numero_documento') {
      newValue = value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (name === 'correo_electronico') {
      newValue = value.replace(/[^a-zA-Z0-9@._-]/g, '');
    }

    setUsuario({ ...usuario, [name]: newValue });
  };

  const validarFormulario = () => {
    const { nombre, apellido, correo_electronico, tipo_documento, numero_documento, telefono, tipo_usuario } = usuario;
    return !nombre || !apellido || !correo_electronico || !tipo_documento || !numero_documento || !telefono || !tipo_usuario;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (
      (rolLogueado === 'ADMINISTRADOR' && ['SUPERADMIN', 'ADMINISTRADOR'].includes(usuario.tipo_usuario)) ||
      (rolLogueado === 'USUARIO' && usuario.tipo_usuario !== 'CLIENTE')
    ) {
      Swal.fire('Error', 'No tienes permisos para crear este tipo de usuario', 'error');
      return;
    }

    try {
      await clienteAxios.post('/api/Usuario', usuario);
      Swal.fire('Correcto', 'Usuario registrado correctamente', 'success');
      setUsuario({
        nombre: '',
        apellido: '',
        correo_electronico: '',
        tipo_documento: '',
        numero_documento: '',
        telefono: '',
        estado: 'Activo',
        tipo_usuario: '',
        password: 'temporal123'
      });
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Swal.fire('Error', error?.response?.data?.mensaje || 'No se pudo registrar el usuario', 'error');
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles['login-box']}>
        <h2>Registro</h2>

        <p>
          ¿Ya tienes una cuenta?{' '}
          <Link className={styles.link} to="/">
            Iniciar sesión
          </Link>
        </p>

        <form className={styles['register-form']} id="registro-form" onSubmit={manejarEnvio}>
          <label htmlFor="nombre">NOMBRE</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Ingresa tu nombre"
            value={usuario.nombre}
            onChange={manejarCambio}
            required
          />

          <label htmlFor="apellido">APELLIDO</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            placeholder="Ingresa tu apellido"
            value={usuario.apellido}
            onChange={manejarCambio}
            required
          />

          <label htmlFor="correo_electronico">CORREO ELECTRÓNICO</label>
          <input
            type="email"
            id="correo_electronico"
            name="correo_electronico"
            placeholder="Ingresa tu correo"
            value={usuario.correo_electronico}
            onChange={manejarCambio}
            required
          />

          <label htmlFor="tipo-documento">TIPO DE DOCUMENTO</label>
          <select
            id="tipo-documento"
            name="tipo_documento"
            value={usuario.tipo_documento}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccione...</option>
            <option value="Cedula de ciudadania">Cédula de Ciudadanía (CC)</option>
            <option value="Cedula extranjeria">Cédula de Extranjería (CE)</option>
            <option value="Pasaporte">Pasaporte (PA)</option>
            <option value="Nit">NIT</option>
          </select>

          <label htmlFor="documento">NÚMERO DE DOCUMENTO</label>
          <input
            type="text"
            id="documento"
            name="numero_documento"
            placeholder="Número de documento"
            value={usuario.numero_documento}
            onChange={manejarCambio}
            required
          />

          <label htmlFor="telefono">TELÉFONO</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            placeholder="Ingresa tu número"
            value={usuario.telefono}
            onChange={manejarCambio}
            required
          />

          <label htmlFor="tipo-usuario">TIPO DE USUARIO</label>
          <select
            id="tipo-usuario"
            name="tipo_usuario"
            value={usuario.tipo_usuario}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccione...</option>
            {opcionesTipoUsuario.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <button type="submit" disabled={validarFormulario()}>
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistroUsuario;
