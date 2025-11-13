import React, { Fragment, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import './App.css';


// 🔒 Componente para proteger rutas
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Login />;
};

function AppContent() {
  const location = useLocation();
  const rutasSinSidebar = ['/', '/login', '/recuperar', '/nueva_contra'];
  const ocultarSidebar = rutasSinSidebar.includes(location.pathname);
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

  // 🔹 Rutas públicas
  const rutasPublicas = [
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/recuperar", element: <Recuperar /> },
    { path: "/nueva_contra/:token", element: <Nueva_contra /> },
  ];

  // 🔹 Rutas base para todos los usuarios logueados
  const rutasBase = [
    { path: "/inicio", element: <Inicio /> },
    { path: "/perfil/:idUsuario?", element: <Perfil /> },
  ];

  // 🔹 Rutas por rol
  const rutasPorRol = {
    CLIENTE: [
      { path: "/vis-factura", element: <VisFactura /> },
      { path: "/notify", element: <Notify /> }, 
    ],
    USUARIO: [
      { path: "/facturacion", element: <Facturacion /> },
      { path: "/vis-factura", element: <VisFactura /> },
      { path: "/codigoqr", element: <Codigo_QR /> },
      { path: "/codigoBarras", element: <CodigoBarras /> },
      { path: "/notify", element: <Notify /> },
    ],
    ADMINISTRADOR: [
      { path: "/facturacion", element: <Facturacion /> },
      { path: "/vis-factura", element: <VisFactura /> },
      { path: "/codigoqr", element: <Codigo_QR /> },
      { path: "/codigoBarras", element: <CodigoBarras /> },
      { path: "/inventario", element: <Inventario /> },
      { path: "/Img", element: <Img /> },
      { path: "/registro", element: <RegistroUsuario /> },
      { path: "/registroproduct", element: <Registro_product /> },
      { path: "/productos/editar/:idProducto", element: <EditProduct /> },
      { path: "/usuarios", element: <ListadoUsuarios /> },
      { path: "/notify", element: <Notify /> },
    ],
    SUPERADMIN: [
      { path: "/facturacion", element: <Facturacion /> },
      { path: "/vis-factura", element: <VisFactura /> },
      { path: "/codigoqr", element: <Codigo_QR /> },
      { path: "/codigoBarras", element: <CodigoBarras /> },
      { path: "/inventario", element: <Inventario /> },
      { path: "/Img", element: <Img /> },
      { path: "/registro", element: <RegistroUsuario /> },
      { path: "/registroproduct", element: <Registro_product /> },
      { path: "/productos/editar/:idProducto", element: <EditProduct /> },
      { path: "/usuarios", element: <ListadoUsuarios /> },
      { path: "/notify", element: <Notify /> },
    ],
  };

  // Combinar rutas base con las del rol actual
  const rutasUsuario = [...rutasBase, ...(rutasPorRol[tipoUsuario] || [])];

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

            {/* Rutas protegidas según rol */}
            {rutasUsuario.map((ruta, i) => (
              <Route key={i} path={ruta.path} element={<ProtectedRoute element={ruta.element} />} />
            ))}

            {/* Ruta por defecto */}
            <Route path="*" element={<Inicio />} />
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
