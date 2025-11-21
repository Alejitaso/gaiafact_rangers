import React, { useState, useRef } from "react";
import styles from './style_rec_contr.module.css';
import Swal from 'sweetalert2';

function RecoverPassword() {
  const [correo_electronico, setCorreoElectronico] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica si el campo de correo electrónico está vacío.
    if (!correo_electronico) {
      setError("Por favor ingresa un correo válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/recover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo_electronico })
        }
      );


      const data = await res.json();

      //Bloque de Manejo de Respuesta Exitosa
      if (data.success) {
        // ✅ SweetAlert2 con configuración de accesibilidad
        await Swal.fire({
          icon: 'success',
          title: 'Correo Enviado',
          text: `Se envió un correo de recuperación a ${correo_electronico}.`,
          customClass: { 
            popup: 'swal-contorno-interior',
            confirmButton: 'swal-button-focus' // Para mejor focus visible
          },
          // ✅ Atributos de accesibilidad
          didOpen: () => {
            const popup = Swal.getPopup();
            if (popup) {
              popup.setAttribute('role', 'alertdialog');
              popup.setAttribute('aria-live', 'assertive');
            }
          }
        });
        setError(null);
        setCorreoElectronico("");
        
        // ✅ Regresar el foco al input después de cerrar el modal
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || "Error al enviar correo de recuperación",
          customClass: { 
            popup: 'swal-contorno-interior',
            confirmButton: 'swal-button-focus'
          },
          didOpen: () => {
            const popup = Swal.getPopup();
            if (popup) {
              popup.setAttribute('role', 'alertdialog');
              popup.setAttribute('aria-live', 'assertive');
            }
          }
        });
        
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.',
        customClass: { 
          popup: 'swal-contorno-interior',
          confirmButton: 'swal-button-focus'
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) {
            popup.setAttribute('role', 'alertdialog');
            popup.setAttribute('aria-live', 'assertive');
          }
        }
      });
      
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Contenedor principal con estilos.
    <div className={styles.recoveryform}>
      {/* ✅ Región para anuncios en vivo */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {error && error}
      </div>

      <h1>Recuperación de contraseña</h1>
      <p>Ingresa tu correo electrónico para recuperar tu cuenta</p>

      <form 
        onSubmit={handleSubmit}
        aria-label="Formulario de recuperación de contraseña"
      >
        {/* ✅ Label asociado al input */}
        <label htmlFor="correo_electronico" className="sr-only">
          Correo electrónico
        </label>
        <input
          ref={emailInputRef}
          type="email"
          id="correo_electronico"
          name="correo_electronico"
          placeholder="Tu correo electrónico"
          value={correo_electronico}
          onChange={(e) => setCorreoElectronico(e.target.value)}
          required
          disabled={isLoading}
          aria-describedby={error ? "error-message" : undefined}
          aria-invalid={error ? "true" : "false"}
        />

        {/* ✅ Mensaje de error visible */}
        {error && (
          <p 
            id="error-message"
            role="alert"
            className={styles.errorMessage}
          >
            {error}
          </p>
        )}

        {/* Contenedor para el botón de envío con estilos específicos */}
        <div className={styles.boton}>
          <button 
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>

      <br />
      <a href="/login">Volver al inicio de sesión</a>
    </div>
  );
}

export default RecoverPassword;