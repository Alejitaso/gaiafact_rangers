import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/sidebar.js';
import Header from './components/layout/Header.js';
import Footer from './components/layout/footer.js';
import VisFactura from './components/billing/visFactura.js';
import Facturacion from './components/billing/facturacion.js';
import Inicio from './components/onset/inicio.js';
<<<<<<< HEAD
import RegistroUsuario from './components/auth/registroUsuario.js';
import EditarProducto from './components/products/editarProducto.js';
import CodigoBarras from './components/utils/codigoBarras.js';
=======
import Img from './components/utils/loadImg.js';
import Perfil from './components/user/perfil.js';
import Notify from './components/utils/notify.js';

>>>>>>> 1135f7406947c319e311c9328442de19bae1a572

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
<<<<<<< HEAD
              <Route path="/registro" element={<RegistroUsuario />} />
              {/* Ruta actualizada para recibir el ID como parámetro */}
              <Route path="/editar/:id" element={<EditarProducto />} />
              {/* Ruta alternativa si quieres mantener la original */}
              <Route path="/editar" element={<EditarProducto />} />
              <Route path="/codbarras" element={<CodigoBarras />} />
=======
              <Route path="/Img" element={<Img />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/notificaciones" element={<Notify />} />
              
              {/* Agrega más rutas aquí según sea necesario */}
>>>>>>> 1135f7406947c319e311c9328442de19bae1a572
            </Routes>
          </div>
          <Footer />
        </div>
      </Fragment>
    </Router>
  );
}

export default App;