import React, { useState, useEffect } from "react";

function Login() {
  const [correo_electronico, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Estado para manejar intentos fallidos
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Temporizador de bloqueo
  useEffect(() => {
    let timer;
    if (isLocked && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isLocked && timeLeft === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
    return () => clearInterval(timer);
  }, [isLocked, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) return;

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico, password })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Login exitoso");
        setError(null);
        setAttempts(0); // Reiniciar intentos
      } else {
        setError(data.message || "Correo o contraseña incorrectos");
        setAttempts((prev) => prev + 1);

        if (attempts + 1 >= 3) {
          setIsLocked(true);
          setTimeLeft(60 * 5); // 5 minutos de bloqueo
        }
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-box">
      <h2>Ingresa a tu cuenta</h2>
      <p>
        ¿No estás registrado?{" "}
        <a className="link" href="/registro">
          Registrarse
        </a>
      </p>
      <div className="logog">
        <i
          className="fa-solid fa-circle-user fa-7x"
          style={{ color: "#f0f4f8" }}
        ></i>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">CORREO ELECTRÓNICO</label>
        <input
          type="email"
          id="email"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLocked}
        />

        <label htmlFor="password">CLAVE</label>
        <input
          type="password"
          id="password"
          placeholder="Ingresa tu clave"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLocked}
        />

        {/* Mensajes */}
        {error && !isLocked && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        {isLocked && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold" }}>
            Demasiados intentos. Intenta de nuevo en {formatTime(timeLeft)}
          </div>
        )}

        <button type="submit" disabled={isLocked}>
          Ingresar
        </button>
      </form>
    </div>
  );
}

export default Login;
