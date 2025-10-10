import axios from "axios";

const ClientesAxios = axios.create({
  baseURL: "http://localhost:4000/",
});

// ✅ Interceptor para agregar token a TODAS las peticiones
ClientesAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default ClientesAxios;
