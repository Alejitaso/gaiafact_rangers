import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const tipoUsuario = (localStorage.getItem("tipo_usuario") || "").toUpperCase();

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no tiene el rol adecuado, redirige a /inicio
  if (!allowedRoles.includes(tipoUsuario)) {
    return <Navigate to="/inicio" replace />;
  }

  // Si pasa las validaciones, muestra la vista
  return children;
};

export default ProtectedRoute;
