require('dotenv').config();

const cors = require("cors");
const express = require("express");
const routes = require("./routes");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path"); // 👈 agregado aquí
const authcontroller = require("./controllers/authcontroller");

mongoose.set("strictQuery", true);

// Conexión a MongoDB
const DB_URL = process.env.DB_MONGO || "mongodb://0.0.0.0:27017/tienda";

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("✅ Se conectó correctamente a la BD Mongo");
    console.log("📊 Base de datos:", DB_URL.split('/').pop());
  })
  .catch((err) => {
    console.log("❌ No se conectó correctamente a la BD Mongo", err);
    process.exit(1);
  });

// Crear servidor
const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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

// Rutas principales
app.use("/api", routes());

// 👇👇 Agrega esta parte después de tus rutas API
// 📸 Servir imágenes desde la carpeta /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    mensaje: 'Error interno del servidor', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Puerto
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("🚀 El servidor está ejecutándose en el puerto " + port);
  console.log("🌐 URL: http://localhost:" + port);
  console.log("📱 Ambiente:", process.env.NODE_ENV || 'development');
});
