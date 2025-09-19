import React, { useState } from "react";
import styles from './style_rec_contr.module.css';

function RecoverPassword() {
  const [correo_electronico, setCorreoElectronico] = useState("");
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(false);

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
        body: JSON.stringify({ correo_electronico }) // 👈 coincide con backend
      });

      const data = await res.json();

      if (data.success) {
        setPopup(true);
        setError(null);
      } else {
        setError(data.message || "Error al enviar correo de recuperación");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
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

      {/* Popup */}
      {popup && (
        <div className={styles.popupcontainer} style={{ marginTop: "20px" }}>
          <p>✅ Se envió un correo de recuperación a {correo_electronico}</p>
        </div>
      )}
    </div>
  );
}

export default RecoverPassword;