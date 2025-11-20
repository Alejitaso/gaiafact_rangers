import React, { useState } from "react";
import { useParams } from "react-router-dom"; 
import styles from './style_new_contr.module.css';

function NewPassword() {
  const { token } = useParams(); 
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {                     
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

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

  return (
    <div className={styles.formcontainer}>
      <h2>Recuperación de contraseña</h2>

      <form onSubmit={handleSubmit}>
        <p>Contraseña nueva</p>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <p>Confirmar contraseña</p>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </div>
        )}

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