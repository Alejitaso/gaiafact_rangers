import React, { Fragment, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/sidebar.js';
import Header from './components/layout/Header.js';
import Footer from './components/layout/footer.js';
import VisFactura from './components/billing/visFactura.js';
import Facturacion from './components/billing/facturacion.js';
import Inicio from './components/onset/inicio.js';
import Img from './components/utils/loadImg.js';
import Perfil from './components/user/perfil.js';
import Notify from './components/utils/notify.js';
import CodigoBarras from './components/utils/codigoBarras.js';
import Codigo_QR from './components/utils/codigo_QR.js';
import RegistroUsuario from './components/auth/registroUsuario.js';
import Registro_product from './components/products/registro_product.js';
import EditProduct from './components/products/editarProducto.js';
import Login from "./components/auth/login.js";
import Recuperar from './components/auth/recuperar.js';
import Nueva_contra from './components/auth/nueva_contra.js';
import Inventario from './components/products/inventory.js';
import ListadoUsuarios from './components/user/listadoUsuarios.js';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts.js';
import KeyboardShortcutsHelp from './components/utils/KeyboardShortcutsHelp';
import Swal from 'sweetalert2';
import './App.css';

// 🔒 Componente para proteger rutas con verificación de rol
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const tipoUsuario = (localStorage.getItem("tipo_usuario") || "").toUpperCase();

  // Si no hay token, redirigir a login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta tiene roles específicos permitidos
  if (allowedRoles.length > 0) {
    // Verificar si el usuario tiene permiso
    if (!allowedRoles.includes(tipoUsuario)) {

      return <Navigate to="/inicio" replace />;
    }
  }

  // Si todo está bien, renderizar el componente
  return element;
};

function AppContent() {
  const location = useLocation();
  const rutasSinSidebar = ['/', '/login', '/recuperar'];
  const ocultarSidebar = rutasSinSidebar.includes(location.pathname) || location.pathname.startsWith('/nueva_contra');
  useKeyboardShortcuts();

  // 🟢 Estado del tipo de usuario
  const [tipoUsuario, setTipoUsuario] = useState(
    (localStorage.getItem("tipo_usuario") || "").toUpperCase()
  );

  // 🧠 Escucha cambios en el almacenamiento (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const newTipo = (localStorage.getItem("tipo_usuario") || "").toUpperCase();
      setTipoUsuario(newTipo);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("miCambioUsuario", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("miCambioUsuario", handleStorageChange);
    };
  }, []);

  // 🚀 Redirigir si el usuario ya está logueado e intenta entrar a login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const tipo = (localStorage.getItem("tipo_usuario") || "").toUpperCase();
    if (token && tipo) {
      if (location.pathname === "/" || location.pathname === "/login") {
        window.location.href = "/inicio";
      }
    }
  }, [location.pathname]);

  // 🔹 Rutas públicas (sin protección)
  const rutasPublicas = [
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/recuperar", element: <Recuperar /> },
    { path: "/nueva_contra/:token", element: <Nueva_contra /> },
  ];

  // 🔹 Definición de todas las rutas con sus roles permitidos
  const todasLasRutas = [
    // Rutas accesibles para TODOS los usuarios autenticados
    { path: "/inicio", element: <Inicio />, roles: [] },
    { path: "/perfil/:idUsuario?", element: <Perfil />, roles: [] },
    
    // Rutas para CLIENTE, USUARIO, ADMINISTRADOR y SUPERADMIN
    { path: "/vis-factura", element: <VisFactura />, roles: ['CLIENTE', 'USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/notify", element: <Notify />, roles: ['CLIENTE', 'USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    
    // Rutas para USUARIO, ADMINISTRADOR y SUPERADMIN
    { path: "/facturacion", element: <Facturacion />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/codigoqr", element: <Codigo_QR />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/codigoBarras", element: <CodigoBarras />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    
    // Rutas SOLO para ADMINISTRADOR y SUPERADMIN
    { path: "/inventario", element: <Inventario />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/Img", element: <Img />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/registro", element: <RegistroUsuario />, roles: ['ADMINISTRADOR', 'SUPERADMIN', 'USUARIO'] },
    { path: "/registroproduct", element: <Registro_product />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/productos/editar/:idProducto", element: <EditProduct />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/usuarios", element: <ListadoUsuarios />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
  ];

  return (
    <Fragment>
      {!ocultarSidebar && <Sidebar />}

      <div id="main" className={ocultarSidebar ? 'full-width' : ''}>
        <Header title="GaiaFact" />

        <div className="content">
          <Routes>
            {/* Rutas públicas */}
            {rutasPublicas.map((ruta, i) => (
              <Route key={i} path={ruta.path} element={ruta.element} />
            ))}

            {/* Rutas protegidas con verificación de rol */}
            {todasLasRutas.map((ruta, i) => (
              <Route 
                key={i} 
                path={ruta.path} 
                element={
                  <ProtectedRoute 
                    element={ruta.element} 
                    allowedRoles={ruta.roles}
                  />
                } 
              />
            ))}

            {/* Ruta por defecto - redirige al inicio si está autenticado, sino a login */}
            <Route 
              path="*" 
              element={
                localStorage.getItem("token") ? (
                  <Navigate to="/inicio" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>

        <Footer />
        {!ocultarSidebar && <KeyboardShortcutsHelp />}
      </div>
    </Fragment>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;