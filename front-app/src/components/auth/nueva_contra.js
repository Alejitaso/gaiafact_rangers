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
  const [isLoading, setIsLoading] = useState(false);

  //Bloque de Manejador de Envío
  const handleSubmit = async (e) => {                     
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setSuccess(null);
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setSuccess(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevaPassword: newPassword })
      });

      const data = await res.json();

      // Bloque de Manejo de Respuesta de la API
      // Si la respuesta del servidor indica éxito.
      if (data.success) {
        setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
        setError(null);
        setNewPassword("");
        setConfirmPassword("");
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        setError(data.message || "Error al actualizar la contraseña");
        setSuccess(null);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Retorna la estructura JS que define la interfaz de usuario del componente
  return (
    <div className={styles.formcontainer}>
      {/* ✅ Región para anuncios en vivo */}
      <div 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {error && error}
        {success && success}
      </div>

      <h1>Recuperación de contraseña</h1>
      <p>Ingresa tu nueva contraseña</p>

      <form 
        onSubmit={handleSubmit}
        aria-label="Formulario de cambio de contraseña"
      >
        {/* ✅ Campo de contraseña nueva con label */}
        <label htmlFor="newPassword">
          Contraseña nueva
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
          aria-describedby={error ? "error-message" : "password-requirements"}
          aria-invalid={error ? "true" : "false"}
          placeholder="Mínimo 8 caracteres"
        />
        <small id="password-requirements" className={styles.helpText}>
          La contraseña debe tener al menos 8 caracteres
        </small>

        {/* ✅ Campo de confirmación con label */}
        <label htmlFor="confirmPassword">
          Confirmar contraseña
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
          aria-describedby={error ? "error-message" : undefined}
          aria-invalid={error ? "true" : "false"}
          placeholder="Repite la contraseña"
        />

        {/* ✅ Mensaje de error con role="alert" */}
        {error && (
          <div 
            id="error-message"
            role="alert"
            className={styles.errorMessage}
          >
            {error}
          </div>
        )}

        {/* ✅ Mensaje de éxito con role="status" */}
        {success && (
          <div 
            role="status"
            className={styles.successMessage}
          >
            {success}
          </div>
        )}

        {/* ✅ Botón con estado de carga */}
        <button 
          type="submit" 
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? "Actualizando..." : "Confirmar"}
        </button>
      </form>

      <br />
      <a href="/login">Volver al inicio de sesión</a>
    </div>
  );
}

export default NewPassword;