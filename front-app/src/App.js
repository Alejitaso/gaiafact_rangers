import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/sidebar.js';
import Header from './components/layout/Header.js';
import Footer from './components/layout/footer.js';
import VisFactura from './components/billing/visFactura.js';
import Facturacion from './components/billing/facturacion.js';
import Inicio from './components/onset/inicio.js';
import Img from './components/utils/loadImg.js';


function App() {
  return (
  <Router>
      <Fragment>
        <Sidebar />
        <div id="main">
          <Header title="GaiaFact" />
          <div className="content">
            <Routes>
              <Route exact path="/" component={Inicio}/>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/vis-factura" element={<VisFactura />} />
              <Route path="/facturacion" element={<Facturacion />} />
              <Route path="/Img" element={<Img />} />
              
              {/* Agrega más rutas aquí según sea necesario */}
            </Routes>
          </div>
          <Footer />
        </div>
      </Fragment>
    </Router>
  );
}

export default App;
