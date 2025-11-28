import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../../config/axios';
import Swal from 'sweetalert2';
import styles from './registro.module.css';

const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validarSoloLetras = (text) => {
    const letrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    return letrasRegex.test(text.trim());
};

function RegistroUsuario() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensajeEstado, setMensajeEstado] = useState('');
  const firstInputRef = useRef(null);
  const announceRef = useRef(null);
  
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

  // Anunciar cambios de estado
  useEffect(() => {
    const numErrores = Object.keys(errores).length;
    if (numErrores > 0) {
      setMensajeEstado(`Formulario con ${numErrores} error${numErrores > 1 ? 'es' : ''}. Por favor revisa los campos marcados.`);
    } else {
      setMensajeEstado('');
    }
  }, [errores]);

 const manejarCambio = (e) => {
  const { name, value } = e.target;
  let newValue = value;

  // Filtrado en vivo según el campo
  if (name === 'nombre' || name === 'apellido') {
      newValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  } 
  else if (name === 'telefono') {
      let v = value.replace(/[^0-9]/g, "").slice(0, 10);

      if (/^(\d)\1{9}$/.test(v)) {
        setErrores({
          ...errores,
          telefono: "No puedes ingresar 10 números iguales consecutivos"
        });
      } else {
        if (errores.telefono) {
          setErrores({ ...errores, telefono: null });
        }
      }

      newValue = v;
  } 
  else if (name === 'numero_documento') {
      const tipo = usuario.tipo_documento;

      if (tipo === "Pasaporte") {
        let v = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // Primeras 3 posiciones deben ser SOLO letras
        if (v.length <= 3) {
          v = v.replace(/[^A-Z]/g, "");
        } 
        // De la 4 en adelante solo números
        else {
          let primeras3 = v.slice(0, 3).replace(/[^A-Z]/g, "");
          let resto = v.slice(3).replace(/[^0-9]/g, "");
          v = primeras3 + resto;
        }

        newValue = v.slice(0, 12);
      } 
      else if (
          tipo === "Cedula de ciudadania" ||
          tipo === "Cedula extranjeria" ||
          tipo === "Nit"
      ) {
        let v = value.replace(/[^0-9]/g, "").slice(0, 10);

        if (/^(\d)\1{9}$/.test(v)) {
          setErrores({
            ...errores,
            numero_documento: "No puedes ingresar 10 números iguales consecutivos"
          });
        } else {
          if (errores.numero_documento) {
            setErrores({ ...errores, numero_documento: null });
          }
        }

        newValue = v;
      } 
      else {
        newValue = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
      }
  }
  else if (name === "correo_electronico") {
    newValue = value.replace(/[^a-zA-Z0-9@._-]/g, "");
  }

  setUsuario({
    ...usuario,
    [name]: newValue
  });

  // Limpiar error del campo cuando el usuario escribe
  if (errores[name]) {
    setErrores({
      ...errores,
      [name]: null
    });
  }
};

  const validarFormulario = () => {
    const { nombre, apellido, correo_electronico, tipo_documento, numero_documento, telefono, tipo_usuario } = usuario;
    const nuevosErrores = {};

    if (!nombre || !validarSoloLetras(nombre)) {
      nuevosErrores.nombre = "El nombre es requerido y solo debe contener letras";
    }

    if (!apellido || !validarSoloLetras(apellido)) {
      nuevosErrores.apellido = "El apellido es requerido y solo debe contener letras";
    }

    if (!correo_electronico || !validarEmail(correo_electronico)) {
      nuevosErrores.correo_electronico = "Ingresa un correo válido";
    }

    if (!tipo_documento) {
      nuevosErrores.tipo_documento = "Selecciona un tipo de documento";
    }

    if (!numero_documento) {
      nuevosErrores.numero_documento = "El número de documento es requerido";
    } else {
      if (tipo_documento === "Pasaporte") {
        if (!/^[A-Z]{3}[0-9]{1,9}$/.test(numero_documento)) {
          nuevosErrores.numero_documento =
            "El pasaporte debe iniciar con 3 letras y continuar solo con números";
        }
      }

      if (
        tipo_documento === "Cedula de ciudadania" ||
        tipo_documento === "Cedula extranjeria" ||
        tipo_documento === "Nit"
      ) {
        if (!/^[0-9]{10}$/.test(numero_documento)) {
          nuevosErrores.numero_documento = "Debe tener exactamente 10 números";
        }
      }
    }

    if (!telefono || !/^[0-9]{10}$/.test(telefono)) {
      nuevosErrores.telefono = "El teléfono debe tener 10 dígitos";
    }

    if (!tipo_usuario) {
      nuevosErrores.tipo_usuario = "Selecciona un tipo de usuario";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      const primerError = Object.keys(errores)[0];
      const elemento = document.getElementById(primerError);
      if (elemento) {
        elemento.focus();
        setMensajeEstado(`Error en el campo ${primerError.replace('_', ' ')}. ${errores[primerError]}`);
      }
      return;
    }

    setIsLoading(true);
    setMensajeEstado('Registrando usuario, por favor espera...');

    try {
      await clienteAxios.post('/api/Usuario', usuario);
      
      setMensajeEstado('Usuario registrado exitosamente');
      
      await Swal.fire({
        icon: 'success',
        title: 'Correcto',
        text: 'Usuario registrado correctamente',
        customClass: { 
          popup: 'swal-contorno-interior',
          confirmButton: 'swal-button-focus'
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) {
            popup.setAttribute('role', 'alertdialog');
            popup.setAttribute('aria-live', 'assertive');
            popup.setAttribute('aria-modal', 'true');
            
            const confirmButton = Swal.getConfirmButton();
            if (confirmButton) {
              confirmButton.focus();
            }
          }
        }
      });

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
      
      // Regresar foco al primer campo
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
      
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      const mensajeError = error?.response?.data?.mensaje || 'No se pudo registrar el usuario';
      setMensajeEstado(`Error: ${mensajeError}`);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensajeError,
        customClass: { 
          popup: 'swal-contorno-interior',
          confirmButton: 'swal-button-focus'
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) {
            popup.setAttribute('role', 'alertdialog');
            popup.setAttribute('aria-live', 'assertive');
            popup.setAttribute('aria-modal', 'true');
            
            const confirmButton = Swal.getConfirmButton();
            if (confirmButton) {
              confirmButton.focus();
            }
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/');
  };

  const formInvalido = !usuario.nombre || !usuario.apellido || !usuario.correo_electronico || 
                       !usuario.tipo_documento || !usuario.numero_documento || 
                       !usuario.telefono || !usuario.tipo_usuario;

  return (
    <div className={styles.content}>
      {/* Región para anuncios dinámicos */}
      <div 
        ref={announceRef}
        role="status"
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {mensajeEstado}
      </div>

      <main className={styles['login-box']} role="main" aria-labelledby="page-title">
        <h1 id="page-title">Registro de Usuario</h1>
        <p>
          ¿Ya tienes una cuenta?{' '}
          <button
            type="button"
            className={styles.link}
            onClick={handleNavigateToLogin}
            aria-label="Ir a la página de inicio de sesión"
          >
            Iniciar sesión
          </button>
        </p>

        <form 
          className={styles['register-form']} 
          id="registro-form" 
          onSubmit={manejarEnvio}
          aria-label="Formulario de registro de usuario"
          noValidate
        >
          {/* Instrucciones generales del formulario */}
          <div id="form-instructions" className="sr-only">
            Completa todos los campos marcados con asterisco. 
            Los errores se anunciarán en cada campo.
          </div>

          {/* NOMBRE */}
          <div className={styles['form-group']}>
            <label htmlFor="nombre">
              Nombre <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              id="nombre"
              name="nombre"
              placeholder="Ingresa tu nombre"
              value={usuario.nombre}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.nombre ? "nombre-error" : "nombre-hint"}
              aria-invalid={errores.nombre ? "true" : "false"}
              aria-required="true"
              autoComplete="given-name"
            />
            <span id="nombre-hint" className="sr-only">
              Solo se permiten letras y espacios
            </span>
            {errores.nombre && (
              <span id="nombre-error" role="alert" className={styles.errorText}>
                {errores.nombre}
              </span>
            )}
          </div>

          {/* APELLIDO */}
          <div className={styles['form-group']}>
            <label htmlFor="apellido">
              Apellido <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              placeholder="Ingresa tu apellido"
              value={usuario.apellido}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.apellido ? "apellido-error" : "apellido-hint"}
              aria-invalid={errores.apellido ? "true" : "false"}
              aria-required="true"
              autoComplete="family-name"
            />
            <span id="apellido-hint" className="sr-only">
              Solo se permiten letras y espacios
            </span>
            {errores.apellido && (
              <span id="apellido-error" role="alert" className={styles.errorText}>
                {errores.apellido}
              </span>
            )}
          </div>

          {/* CORREO */}
          <div className={styles['form-group']}>
            <label htmlFor="correo_electronico">
              Correo Electrónico <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <input
              type="email"
              id="correo_electronico"
              name="correo_electronico"
              placeholder="ejemplo@correo.com"
              value={usuario.correo_electronico}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.correo_electronico ? "email-error" : "email-hint"}
              aria-invalid={errores.correo_electronico ? "true" : "false"}
              aria-required="true"
              autoComplete="email"
            />
            <span id="email-hint" className="sr-only">
              Formato: usuario@dominio.com
            </span>
            {errores.correo_electronico && (
              <span id="email-error" role="alert" className={styles.errorText}>
                {errores.correo_electronico}
              </span>
            )}
          </div>

          {/* TIPO DOCUMENTO */}
          <div className={styles['form-group']}>
            <label htmlFor="tipo_documento">
              Tipo de Documento <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <select
              id="tipo_documento"
              name="tipo_documento"
              value={usuario.tipo_documento}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.tipo_documento ? "tipo-doc-error" : undefined}
              aria-invalid={errores.tipo_documento ? "true" : "false"}
              aria-required="true"
            >
              <option value="">Seleccione una opción</option>
              <option value="Cedula de ciudadania">Cédula de Ciudadanía (CC)</option>
              <option value="Cedula extranjeria">Cédula de Extranjería (CE)</option>
              <option value="Pasaporte">Pasaporte (PA)</option>
              <option value="Nit">NIT</option>
            </select>
            {errores.tipo_documento && (
              <span id="tipo-doc-error" role="alert" className={styles.errorText}>
                {errores.tipo_documento}
              </span>
            )}
          </div>

          {/* NÚMERO DOCUMENTO */}
          <div className={styles['form-group']}>
            <label htmlFor="numero_documento">
              Número de Documento <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <input
              type="text"
              id="numero_documento"
              name="numero_documento"
              placeholder="Número de documento"
              value={usuario.numero_documento}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.numero_documento ? "num-doc-error" : "num-doc-hint"}
              aria-invalid={errores.numero_documento ? "true" : "false"}
              aria-required="true"
            />
            <span id="num-doc-hint" className="sr-only">
              Letras y números solamente
            </span>
            {errores.numero_documento && (
              <span id="num-doc-error" role="alert" className={styles.errorText}>
                {errores.numero_documento}
              </span>
            )}
          </div>

          {/* TELÉFONO */}
          <div className={styles['form-group']}>
            <label htmlFor="telefono">
              Teléfono <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              placeholder="Ingresa tu número"
              value={usuario.telefono}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.telefono ? "telefono-error" : "telefono-hint"}
              aria-invalid={errores.telefono ? "true" : "false"}
              aria-required="true"
              autoComplete="tel"
            />
            <span id="telefono-hint" className="sr-only">
              Mínimo 7 dígitos, solo números
            </span>
            {errores.telefono && (
              <span id="telefono-error" role="alert" className={styles.errorText}>
                {errores.telefono}
              </span>
            )}
          </div>

          {/* TIPO USUARIO */}
          <div className={styles['form-group']}>
            <label htmlFor="tipo_usuario">
              Tipo de Usuario <abbr title="requerido" aria-label="campo requerido">*</abbr>
            </label>
            <select
              id="tipo_usuario"
              name="tipo_usuario"
              value={usuario.tipo_usuario}
              onChange={manejarCambio}
              required
              disabled={isLoading}
              aria-describedby={errores.tipo_usuario ? "tipo-usuario-error" : undefined}
              aria-invalid={errores.tipo_usuario ? "true" : "false"}
              aria-required="true"
            >
              <option value="">Seleccione una opción</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="USUARIO">Usuario</option>
              <option value="CLIENTE">Cliente</option>
              <option value="SUPERADMIN">Super Administrador</option>
            </select>
            {errores.tipo_usuario && (
              <span id="tipo-usuario-error" role="alert" className={styles.errorText}>
                {errores.tipo_usuario}
              </span>
            )}
          </div>

          {/* BOTÓN DE ENVÍO */}
          <button 
            type="submit" 
            disabled={formInvalido || isLoading}
            aria-busy={isLoading}
            aria-describedby={formInvalido && !isLoading ? "button-hint" : undefined}
            aria-label={isLoading ? "Registrando usuario, por favor espera" : "Registrar nuevo usuario"}
          >
            {isLoading ? "Registrando..." : "Registrar"}
          </button>
          
          {formInvalido && !isLoading && (
            <span id="button-hint" className={styles.helpText} role="status">
              Completa todos los campos requeridos para continuar
            </span>
          )}
        </form>
      </main>
    </div>
  );
}

export default RegistroUsuario;