import React, { useState } from "react";
import styles from './style_rec_contr.module.css';
import Swal from 'sweetalert2'; // 👈 Importa SweetAlert2

function RecoverPassword() {
  const [correo_electronico, setCorreoElectronico] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!correo_electronico) {
      setError("❌ Por favor ingresa un correo válido");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico })
      });

      const data = await res.json();

      if (data.success) {
        // 🚨 Reemplaza el popup de React con SweetAlert2
        Swal.fire({
          icon: 'success', // Muestra un ícono de éxito ✅
          title: 'Correo Enviado',
          text: `Se envió un correo de recuperación a ${correo_electronico}.`,
          customClass: { popup: 'swal-contorno-interior-avanzado' }
        });
        setError(null);
      } else {
        // 🚨 También puedes usar SweetAlert2 para el error
        Swal.fire({
          icon: 'error', // Muestra un ícono de error ❌
          title: 'Error',
          text: data.message || "Error al enviar correo de recuperación",
          customClass: { popup: 'swal-contorno-interior' }
        });
        setError(null);
      }
    } catch (err) {
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
    <div className={styles.recoveryform}>
      <h2>Ingrese su correo electrónico</h2>

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