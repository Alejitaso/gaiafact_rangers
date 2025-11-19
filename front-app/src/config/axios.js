import axios from "axios";

const ClientesAxios = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// ✅ Interceptor para agregar token a TODAS las peticiones
ClientesAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    console.log("🔑 Token encontrado:", token ? "SÍ" : "NO");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("📤 Enviando petición a:", config.url);
      console.log("🔐 Header Authorization:", config.headers.Authorization.substring(0, 50) + "...");
    } else {
      console.warn("⚠️ No hay token en localStorage");
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Error en request interceptor:", error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor para manejar respuestas y errores
ClientesAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo de errores
    if (error.response) {
      const { status, data } = error.response;
      
      console.error(`❌ Error ${status}:`, data.mensaje || data);
      
      if (status === 401) {
        console.warn("🔒 Token inválido o expirado. Limpiando localStorage...");
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("tipo_usuario");
      }
    } else if (error.request) {
      console.error("📡 No se recibió respuesta del servidor:", error.request);
    } else {
      console.error("⚙️ Error al configurar la petición:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default ClientesAxios;