import React, { useState, useEffect } from "react";
import styles from './style_loguin.module.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Nuevo estado para la pantalla de carga inicial del componente
  const [isLoaded, setIsLoaded] = useState(false);
  // Nuevo estado para la pantalla de carga al navegar
  const [isNavigating, setIsNavigating] = useState(false);

  // Muestra la pantalla de carga inicial solo cuando el componente se monta
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000); // 2 segundos para la pantalla de carga inicial
    return () => clearTimeout(timer);
  }, []);

  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem("attempts")) || 0;
  });
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem("isLocked") === "true";
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    return parseInt(localStorage.getItem("timeLeft")) || 0;
  });

  // Guardar cambios en localStorage
  useEffect(() => {
    localStorage.setItem("attempts", attempts);
    localStorage.setItem("isLocked", isLocked);
    localStorage.setItem("timeLeft", timeLeft);
  }, [attempts, isLocked, timeLeft]);

  // Temporizador de bloqueo
  useEffect(() => {
    let timer;
    if (isLocked && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          localStorage.setItem("timeLeft", newTime);
          if (newTime <= 0) {
            setIsLocked(false);
            setAttempts(0);
            localStorage.removeItem("isLocked");
            localStorage.removeItem("timeLeft");
            localStorage.removeItem("attempts");
          }
          return newTime;
        });
      }, 1000);
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

    setIsNavigating(true); // Activa la pantalla de carga al iniciar el login

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico: email, password })
      });

      const data = await res.json();

      if (data.success) {
        setError(null);
        setAttempts(0);
        localStorage.removeItem("attempts");
        
        // La redirección ocurrirá después del temporizador
        setTimeout(() => {
            window.location.href = "/inicio";
        }, 2000); 
        
      } else {
        setError(data.message || "Correo o contraseña incorrectos");
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setTimeLeft(60 * 5); // 5 minutos
          localStorage.setItem("isLocked", "true");
          localStorage.setItem("timeLeft", 60 * 5);
        }
        setIsNavigating(false); // Desactiva la pantalla de carga si hay un error
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      setIsNavigating(false); // Desactiva la pantalla de carga si hay un error
    }
  };

  // Renderizado condicional: muestra la pantalla de carga inicial o la de navegación si están activas
  if (!isLoaded || isNavigating) {
    return (
      <div className="loading-screen">
        <video 
          className="loading-video" 
          autoPlay 
          muted
          // El video se repetirá mientras isLoading o isNavigating sea true
          onEnded={(e) => {
            e.target.play(); 
          }}
        >
          <source src="/videos/loading.mp4" type="video/mp4" />
          Tu navegador no soporta el video.
        </video>
      </div>
    );
  }

  // De lo contrario, renderiza el formulario de login
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
        <i className="fa-solid fa-circle-user fa-7x" style={{ color: "#f0f4f8" }}></i>
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
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Ingresa tu clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLocked}
          />
          <i
            className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.passwordIcon}`}
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          ></i>
        </div>

        <a className={styles.link} href="/recuperar">
          ¿Olvidaste tu contraseña?
        </a>

        {error && !isLocked && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold", fontSize: "20px" }}>
            {error}
          </div>
        )}

        {isLocked && (
          <div style={{ color: "red", textAlign: "center", fontWeight: "bold", fontSize: "20px" }}>
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