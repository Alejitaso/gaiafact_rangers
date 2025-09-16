import React, { useState } from 'react';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './registro.module.css';

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

  const manejarCambio = (e) => {
    setUsuario({
      ...usuario,
      [e.target.name]: e.target.value
    });
  };

const validarFormulario = () => {
    const { nombre, apellido, correo_electronico, tipo_documento, numero_documento, telefono, tipo_usuario } = usuario;
    return !nombre || !apellido || !correo_electronico || !tipo_documento || !numero_documento || !telefono || !tipo_usuario;
};

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('', usuario);
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
          <a className={styles.link} onClick={() => (window.location.href = 'login.html')}>
            Iniciar sesión
          </a>
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
            id="email"
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
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="USUARIO">USUARIO</option>
            <option value="CLIENTE">CLIENTE</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </select>

          <button type="submit" disabled={validarFormulario()}>
            Registrar
          </button>

          {/* Modal */}
          <div id="modal" className={styles.modal}>
            <div id="modalContenido" className={styles['modal-contenido']}>
              <h2>Usuario registrado correctamente</h2>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistroUsuario;



