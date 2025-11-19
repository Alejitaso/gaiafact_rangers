import React, { useState, useEffect, useRef } from "react";
import styles from './style_loguin.module.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estados para las transiciones mejoradas
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  
  const videoRef = useRef(null);

  // Carga inicial con transición suave
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setFadeOut(true);
      
      // Después de que comience el fade-out, mostrar el contenido
      setTimeout(() => {
        setIsLoaded(true);
        setShowContent(true);
        
        // Ocultar completamente la pantalla de carga
        setTimeout(() => {
          setLoadingComplete(true);
        }, 500);
      }, 750); 
    }, 2500); 

    return () => clearTimeout(initialTimer);
  }, []);

  // Configuración del video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5; 
    }
  }, []);

  // Estados para el sistema de bloqueo
  const [attempts, setAttempts] = useState(() => {
    return parseInt(localStorage.getItem("attempts")) || 0;
  });
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem("isLocked") === "true";
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    return parseInt(localStorage.getItem("timeLeft")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("attempts", attempts);
    localStorage.setItem("isLocked", isLocked);
    localStorage.setItem("timeLeft", timeLeft);
  }, [attempts, isLocked, timeLeft]);

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

    setIsNavigating(true);

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

        // 🟢 Guardar token y tipo_usuario para controlar vistas
        localStorage.setItem("token", data.token);
        localStorage.setItem("tipo_usuario", data.usuario.tipo_usuario);

        // Redirigir tras un breve delay
        setTimeout(() => {
          window.location.href = "/inicio";
        }, 2000);
        
      } else {
        // Error en login - restaurar estado
        setError(data.message || "Correo o contraseña incorrectos");
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setTimeLeft(60 * 5);
          localStorage.setItem("isLocked", "true");
          localStorage.setItem("timeLeft", 60 * 5);
        }
        
        // Restaurar visibilidad del contenido con transición
        setTimeout(() => {
          setIsNavigating(false);
          setShowContent(true);
        }, 500);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      
      // Restaurar visibilidad del contenido
      setTimeout(() => {
        setIsNavigating(false);
        setShowContent(true);
      }, 500);
    }
  };

  // Pantalla de carga inicial
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
        <div className={styles.contrasegnaContainer}>
          <i
            className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.IconoContrasegna}`}  // 👈 cambia el ícono
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          ></i>
          <input
            type={showPassword ? "text" : "password"}   
            id="password"
            placeholder="Ingresa tu clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLocked}
          />
          
        </div>

        
        <a className={styles.link} href="/recuperar">
          ¿Olvidaste tu contraseña?
        </a>

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