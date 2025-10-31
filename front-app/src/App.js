import React, { Fragment } from 'react';
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


// Importar el hook de atajos de teclado
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts.js';
import KeyboardShortcutsHelp from './components/utils/KeyboardShortcutsHelp';

import './App.css'; 

// Componente interno que usa useLocation
function AppContent() {
  const location = useLocation();
  
  // Activar los atajos de teclado
  useKeyboardShortcuts();
  
  // Rutas donde NO se debe mostrar el sidebar
  const rutasSinSidebar = ['/', '/login', '/recuperar', '/nueva_contra'];
  
  // Verificar si la ruta actual está en la lista de rutas sin sidebar
  const ocultarSidebar = rutasSinSidebar.includes(location.pathname);

  return (
    <Fragment>
      {/* Mostrar sidebar solo si no está en rutas de autenticación */}
      {!ocultarSidebar && <Sidebar />}
      
      <div id="main" className={ocultarSidebar ? 'full-width' : ''}>
        <Header title="GaiaFact" />
        
        <div className="content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/vis-factura" element={<VisFactura />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/Img" element={<Img />} />
            <Route path="/perfil/:idUsuario?" element={<Perfil />} />
            <Route path="/notify" element={<Notify />} />
            <Route path="/codigoBarras" element={<CodigoBarras />} />
            <Route path="/codigoqr" element={<Codigo_QR />} />
            <Route path="/registro" element={<RegistroUsuario />} />
            <Route path="/registroproduct" element={<Registro_product />} />
            <Route path="/productos/editar/:idProducto" element={<EditProduct />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/nueva_contra/:token" element={<Nueva_contra />} />
            <Route path="/usuarios" element={<ListadoUsuarios />} />
          </Routes>
        </div>
        
        <Footer />
        {!ocultarSidebar && <KeyboardShortcutsHelp />}
      </div>
    </Fragment>
  );
}

// Componente principal App
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;