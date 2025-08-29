import React from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import "./App.css";

// Importamos pantallas
import Login from "./auth/Login";
import RecoverPassword from "./auth/RecoverPassword";
import NewPassword from "./auth/NewPassword";

// Rutas protegidas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/recover" element={<RecoverPassword />} />
        <Route path="/reset-password" element={<NewPassword />} />

        {/* 404 */}
        <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
