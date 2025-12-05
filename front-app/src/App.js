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
import ColorBlindToggle from './components/utils/ColorBlindToggle';
import './colorblind-themes.css';
import Swal from 'sweetalert2';
import './App.css';

const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const tipoUsuario = (localStorage.getItem("tipo_usuario") || "").toUpperCase();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(tipoUsuario)) {
      return <Navigate to="/inicio" replace />;
    }
  }

  return element;
};

function AppContent() {
  const location = useLocation();
  const rutasSinSidebar = ['/', '/login', '/recuperar'];
  const ocultarSidebar = rutasSinSidebar.includes(location.pathname) || location.pathname.startsWith('/nueva_contra');
  useKeyboardShortcuts();

  useEffect(() => {
    const saved = localStorage.getItem('colorblind-mode');
    if (saved && saved !== 'normal') {
      document.body.classList.add(`colorblind-${saved}`);
    }
  }, []);

  const [tipoUsuario, setTipoUsuario] = useState(
    (localStorage.getItem("tipo_usuario") || "").toUpperCase()
  );

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const tipo = (localStorage.getItem("tipo_usuario") || "").toUpperCase();
    if (token && tipo && location.pathname === "/") {
      window.location.href = "/inicio";
    }
  }, [location.pathname]);

  const rutasPublicas = [
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/recuperar", element: <Recuperar /> },
    { path: "/nueva_contra/:token", element: <Nueva_contra /> },
  ];

  const todasLasRutas = [
    { path: "/inicio", element: <Inicio />, roles: [] },
    { path: "/perfil/:idUsuario?", element: <Perfil />, roles: [] },
    { path: "/vis-factura", element: <VisFactura />, roles: ['CLIENTE', 'USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/notify", element: <Notify />, roles: ['CLIENTE', 'USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/facturacion", element: <Facturacion />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/codigoqr", element: <Codigo_QR />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/codigoBarras", element: <CodigoBarras />, roles: ['USUARIO', 'ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/inventario", element: <Inventario />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/Img", element: <Img />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/registro", element: <RegistroUsuario />, roles: ['ADMINISTRADOR', 'SUPERADMIN', 'USUARIO'] },
    { path: "/registroproduct", element: <Registro_product />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/productos/editar/:idProducto", element: <EditProduct />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
    { path: "/usuarios", element: <ListadoUsuarios />, roles: ['ADMINISTRADOR', 'SUPERADMIN'] },
  ];

  return (
    <Fragment>
      <div className="app-wrapper">
        {!ocultarSidebar && <Sidebar />}

        <div id="main" className={ocultarSidebar ? 'full-width' : ''}>
          <Header title="GaiaFact" />

          <div className="content">
            <Routes>
              {rutasPublicas.map((ruta, i) => (
                <Route key={i} path={ruta.path} element={ruta.element} />
              ))}

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

              {/* ✅ RUTA 404 CORREGIDA - DENTRO de Routes y con lógica correcta */}
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
        </div>
      </div>
      
      {/* Los botones fixed van FUERA del wrapper que tiene filtros */}
      <div className="fixed-utils">
        {!ocultarSidebar && <KeyboardShortcutsHelp />}
        <ColorBlindToggle key="colorblind" />
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