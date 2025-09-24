require('dotenv').config();

const cors = require("cors");
const express = require("express");
const routes = require("./routes");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


const authcontroller = require("./controllers/authcontroller");

mongoose.set("strictQuery", true);

// Conexión a MongoDB usando variable de entorno
const DB_URL = process.env.DB_MONGO || "mongodb://0.0.0.0:27017/tienda"; // Cambiar nombre de BD

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("✅ Se conectó correctamente a la BD Mongo");
    console.log("📊 Base de datos:", DB_URL.split('/').pop());
  })
  .catch((err) => {
    console.log("❌ No se conectó correctamente a la BD Mongo", err);
    process.exit(1); // Salir si no hay conexión a BD
  });

// Crear servidor
const app = express();

// Middlewares - orden importante
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Aumentar límites para archivos PDF/XML grandes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// También usar express.json para mayor compatibilidad
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '🚀 GaiaFact Backend funcionando correctamente',
    version: '1.0.0',
    puerto: process.env.PORT || 4000,
    ambiente: process.env.NODE_ENV || 'development'
  });
});

// Rutas de autenticación 
app.post("/api/auth/login", authcontroller.login);
app.post("/api/auth/recover", authcontroller.recoverPassword);
app.post("/api/auth/reset-password", authcontroller.resetPassword);

// Rutas principales (clientes, productos, facturas, etc.)
app.use("/api", routes());

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    mensaje: 'Error interno del servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Definir el puerto desde variable de entorno
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log("🚀 El servidor está ejecutándose en el puerto " + port);
  console.log("🌐 URL: http://localhost:" + port);
  console.log("📱 Ambiente:", process.env.NODE_ENV || 'development');
});