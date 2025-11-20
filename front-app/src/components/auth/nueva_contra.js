import React, { useState } from "react";
import { useParams } from "react-router-dom"; 
import styles from './style_new_contr.module.css';

// Define el componente principal NewPassword
function NewPassword() {
  const { token } = useParams(); 
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  //Bloque de Manejador de Envío
  const handleSubmit = async (e) => {                     
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

    //Bloque de Llamada a la API
    try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/reset/${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nuevaPassword: newPassword })
          }
        );


      const data = await res.json();

      // Bloque de Manejo de Respuesta de la API
      // Si la respuesta del servidor indica éxito.
      if (data.success) {
        setSuccess("✅ Contraseña actualizada correctamente");
        setError(null);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "❌ Error al actualizar la contraseña");
      }
    } catch (err) {
      setError("❌ Error de conexión con el servidor");
    }
  };

  // Retorna la estructura JS que define la interfaz de usuario del componente
  return (
    <div className={styles.formcontainer}>
      <h2>Recuperación de contraseña</h2>

      {/* Formulario con el manejador de envío */}
      <form onSubmit={handleSubmit}>
        <p>Contraseña nueva</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        {/* Etiqueta/párrafo para el campo de confirmación de contraseña */}
        <p>Confirmar contraseña</p>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Bloque de Mensaje de Error (se muestra si 'error' no es null) */}
        {error && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        {/* Bloque de Mensaje de Éxito (se muestra si 'success' no es null) */}
        {success && (
          <div style={{ color: "green", textAlign: "center", fontWeight: "bold" }}>
            {success}
          </div>
        )}

        <button type="submit">Confirmar</button>
      </form>

      <br />
      <a href="/login">Volver al inicio de sesión</a>
    </div>
  );
}

export default NewPassword;