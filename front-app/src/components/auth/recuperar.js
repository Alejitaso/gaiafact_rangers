import React, { useState } from "react";
import styles from './style_rec_contr.module.css';

function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("❌ Por favor ingresa un correo válido");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          <p>✅ Se envió un correo de recuperación a {email}</p>
        </div>
      )}
    </div>
  );
}

export default RecoverPassword;
