import React, { useState, useEffect, useRef } from "react";
import styles from './style_loguin.module.css';

function Login() {
  //Declaración de Estados de Formulario y UI
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showFirstTimeWarning, setShowFirstTimeWarning] = useState(false);

  // Estados para las transiciones mejoradas
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  
  const videoRef = useRef(null);
  const emailInputRef = useRef(null);
  const announceRef = useRef(null); 

  //Lógica de Carga Inicial (Simulación de Pre-Carga)
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setFadeOut(true);
      
      setTimeout(() => {
        setIsLoaded(true);
        setShowContent(true);
        
        setTimeout(() => {
          setLoadingComplete(true);
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        }, 500);
      }, 750);
    }, 2500);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
    }
  }, []);

    useEffect(() => {
      if (!email) return;

      const timeout = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verificar-correo?email=${encodeURIComponent(email)}`);
          const data = await res.json();

          if (data.success && data.verificado) {
            setShowFirstTimeWarning(true);
          } else {
            setShowFirstTimeWarning(false);
          }
        } catch (err) {
          console.error("❌ Error verificando correo:", err);
          setShowFirstTimeWarning(false);
        }
      }, 500);

      return () => clearTimeout(timeout);
    }, [email]);
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

  //Temporizador de cuenta regresiva para el bloqueo
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

  //Función de utilidad para formatear el tiempo restante
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_electronico: email, password })
      });

      const data = await res.json();

       if (data.success) {
        setError(null);
        setAttempts(0);
        localStorage.removeItem("attempts");

        localStorage.setItem("token", data.token);
        localStorage.setItem("tipo_usuario", data.usuario.tipo_usuario);

        setTimeout(() => {
          window.location.href = "/inicio";
        }, 2000);
      } 
      else {

        if (res.status === 403) {

          let displayMessage = "";

          if (data.message === "no_verificado") {
            displayMessage = "Tu cuenta aún no ha sido verificada. Por favor revisa tu correo.";
          }

          else if (data.message === "Inactivo") {
            displayMessage = "Tu cuenta está inactiva o ha sido bloqueada. Por favor, contacta a soporte.";
          }

          else {
            displayMessage = "Error de autenticación. Contacte a soporte.";
          }

          setError(displayMessage);

          setTimeout(() => {
            setIsNavigating(false);
            setShowContent(true);
            if (emailInputRef.current) {
              emailInputRef.current.focus();
            }
          }, 500);

          return; 
        }

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setTimeLeft(300);
          localStorage.setItem("isLocked", "true");
          localStorage.setItem("timeLeft", 300);
        }

        setError(data.message || "Correo o contraseña incorrectos");

        setTimeout(() => {
          setIsNavigating(false);
          setShowContent(true);
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        }, 500);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      
      setTimeout(() => {
        setIsNavigating(false);
        setShowContent(true);
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 500);
    }
  };

  // Pantalla de carga inicial
  if (!isLoaded || isNavigating) {
    return (
      <div 
        className="loading-screen"
        role="status" 
        aria-live="polite" 
      >
        <span className="sr-only">Cargando, por favor espere...</span>
        <video 
          className="loading-video" 
          autoPlay 
          muted
          aria-hidden="true" 
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

  return (
    <div className={styles.loginbox}>
      {/* ✅ Región para anuncios en vivo */}
      <div 
        ref={announceRef}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {error && error}
        {isLocked && `Cuenta bloqueada. Intenta de nuevo en ${formatTime(timeLeft)}`}
      </div>

      <h1>Ingresa a tu cuenta</h1>
      
      <div className={styles.logog} aria-hidden="true">
        <i className="fa-solid fa-circle-user fa-7x" style={{ color: "#f0f4f8" }}></i>
      </div>

      {showFirstTimeWarning && (
        <div className={styles.firstTimeWarning}>
          <span>
            ⚠️ Si es tu primera vez, tu contraseña es tu documento. Si ya la cambiaste, ignora esto.
          </span>
          <button
            type="button"
            className={styles.closeWarning}
            onClick={() => setShowFirstTimeWarning(false)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <form 
        className={styles.loginform} 
        onSubmit={handleSubmit}
        aria-label="Formulario de inicio de sesión"
      >
        <label htmlFor="email">
          CORREO ELECTRÓNICO
        </label>
        {/* ✅ Icono decorativo oculto */}
        <i className="fa-regular fa-user fa-2x" aria-hidden="true"></i>
        <input
          ref={emailInputRef}
          type="email"
          id="email"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLocked}
          aria-describedby={error && !isLocked ? "error-message" : undefined}
          aria-invalid={error && !isLocked ? "true" : "false"}
        />

        <label htmlFor="password">
          CLAVE
        </label>
        <i className="fa-solid fa-lock fa-2x" aria-hidden="true"></i>
        
        <div className={styles.contrasegnaContainer}>
          {/* ✅ Botón accesible para mostrar/ocultar contraseña */}
          <button
            type="button"
            className={styles.IconoContrasegna}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            disabled={isLocked}
            tabIndex={0}
          >
            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              aria-hidden="true"
            ></i>
          </button>
          
          <input
            type={showPassword ? "text" : "password"}   
            id="password"
            placeholder="Ingresa tu clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLocked}
            aria-describedby={error && !isLocked ? "error-message" : undefined}
            aria-invalid={error && !isLocked ? "true" : "false"}
          />
        </div>

        <a className={styles.link} href="/recuperar">
          ¿Olvidaste tu contraseña?
        </a>

        {/* ✅ Mensajes de error con ID para aria-describedby */}
        {error && !isLocked && (
          <div 
            id="error-message"
            role="alert"
            style={{ color: "red", textAlign: "center", fontWeight: "bold" }}
          >
            {error}
          </div>
        )}

        {isLocked && (
          <div 
            role="alert"
            style={{ color: "red", textAlign: "center", fontWeight: "bold" }}
          >
            Demasiados intentos. Intenta de nuevo en {formatTime(timeLeft)}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLocked}
          aria-disabled={isLocked}
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}

export default Login;