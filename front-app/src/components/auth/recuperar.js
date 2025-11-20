import React, { useState } from "react";
import styles from './style_rec_contr.module.css';
import Swal from 'sweetalert2'; 

function RecoverPassword() {
  const [correo_electronico, setCorreoElectronico] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica si el campo de correo electrónico está vacío.
    if (!correo_electronico) {
      setError("❌ Por favor ingresa un correo válido");
      return;
    }

    // Bloque de Llamada a la API
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
        Swal.fire({
          icon: 'success', 
          title: 'Correo Enviado',
          text: `Se envió un correo de recuperación a ${correo_electronico}.`,
          customClass: { popup: 'swal-contorno-interior' }
        });
        setError(null);
      } else {
        //Bloque de Manejo de Error
        Swal.fire({
          icon: 'error', 
          title: 'Error',
          text: data.message || "Error al enviar correo de recuperación",
          customClass: { popup: 'swal-contorno-interior' }
        });
        setError(null);
      }
    } catch (err) {
      //Bloque de Manejo de Error de Conexión
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.',
        customClass: { popup: 'swal-contorno-interior' }
      });
      setError(null);
    }
  };

  return (
    // Contenedor principal con estilos.
    <div className={styles.recoveryform}>
      <h2>Ingrese su correo electrónico</h2>

      {/* Formulario con el manejador de envío */}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Tu correo"
          value={correo_electronico}
          onChange={(e) => setCorreoElectronico(e.target.value)}
          required
        />

        {error && (
          <p style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </p>
        )}

        {/* Contenedor para el botón de envío con estilos específicos */}
        <div className={styles.boton}>
          <button type="submit">Enviar</button>
        </div>
      </form>

      <br />
      <a href="/login">Volver al inicio de sesión</a>
    </div>
  );
}

export default RecoverPassword;