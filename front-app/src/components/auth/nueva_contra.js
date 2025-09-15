import React, { useState } from "react";

function NewPassword() {
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
      // 🟢 Corregir la URL y los campos de la solicitud
      const res = await fetch("http://localhost:4000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "un_token_de_prueba", nuevaPassword: newPassword })
      });

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
    <div className="form-container">
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
