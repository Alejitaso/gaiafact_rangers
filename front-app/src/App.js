import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/sidebar.js';
import Header from './components/layout/Header.js';
import Footer from './components/layout/footer.js';
import VisFactura from './components/billing/visFactura.js';
import Facturacion from './components/billing/facturacion.js';
import Inicio from './components/onset/inicio.js';
import RegistroUsuario from './components/auth/registroUsuario.js';
import EditarProducto from './components/products/editarProducto.js';
import CodigoBarras from './components/utils/codigoBarras.js';

function App() {
  return (
    <Router>
      <Fragment>
        <Sidebar />
        <div id="main">
          <Header title="GaiaFact" />
          <div className="content">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/vis-factura" element={<VisFactura />} />
              <Route path="/facturacion" element={<Facturacion />} />
              <Route path="/registro" element={<RegistroUsuario />} />
              {/* Ruta actualizada para recibir el ID como parámetro */}
              <Route path="/editar/:id" element={<EditarProducto />} />
              {/* Ruta alternativa si quieres mantener la original */}
              <Route path="/editar" element={<EditarProducto />} />
              <Route path="/codbarras" element={<CodigoBarras />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Fragment>
    </Router>
  );
}

export default App;