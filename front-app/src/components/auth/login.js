import React, { useState, useEffect } from "react";
import styles from './style_loguin.module.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // Estado para manejar intentos fallidos
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Usuario por defecto
  const defaultUser = {
    email: "lisisotomonsalve@gmail.com",
    password: "1234"
  };

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

    // 🔹 Validar usuario por defecto sin ir al backend
    if (email === defaultUser.email && password === defaultUser.password) {
      alert("✅ Login exitoso con usuario por defecto");
      setError(null);
      setAttempts(0);
      return;
    }

    // 🔹 Si no coincide con el usuario por defecto, consulta al backend
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
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
    <div className={styles.loginbox}>
      <h2>Ingresa a tu cuenta</h2>
      <p>
        ¿No estás registrado?{" "}
        <a className={styles.link} href="/registro">
          Registrarse
        </a>
      </p>
      <div className={styles.logog}>
        <i
          className="fa-solid fa-circle-user fa-7x"
          style={{ color: "#f0f4f8" }}
        ></i>
      </div>

      <form className={styles.loginform} onSubmit={handleSubmit}>
        <label htmlFor="email">CORREO ELECTRÓNICO</label>
        <i className="fa-regular fa-user fa-2x"></i>
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
        <i className="fa-solid fa-lock fa-2x"></i>
        <input
          type="password"
          id="password"
          placeholder="Ingresa tu clave"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLocked}
        />
        <a className={styles.link} href="/recuperar">
          ¿Olvidaste tu contraseña?
        </a>

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
