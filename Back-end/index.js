require('dotenv').config();

const cors = require("cors");
const express = require("express");
const routes = require("./routes");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const authcontroller = require("./controllers/authcontroller");

mongoose.set("strictQuery", true);

// Conexión a MongoDB
const DB_URL = process.env.DB_MONGO;

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("✅ Conectado a MongoDB");
    console.log("📊 Base de datos:", DB_URL.split('/').pop());
  })
  .catch((err) => {
    console.log("❌ Error conectando a MongoDB:", err);
    process.exit(1);
  });

// Crear servidor
const app = express();

// =========================
// 🚨 CORS CORREGIDO
// =========================
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,                    
    "http://localhost:3000",                     
    /\.railway\.app$/                            
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middlewares
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '🚀 GaiaFact Backend funcionando correctamente',
    version: '1.0.0',
    puerto: process.env.PORT,
    ambiente: process.env.NODE_ENV
  });
});

// Rutas de autenticación 
app.post("/api/auth/login", authcontroller.login);
app.post("/api/auth/recover", authcontroller.recoverPassword);
app.post("/api/auth/reset-password", authcontroller.resetPassword);

// Rutas principales
console.log('📦 Montando rutas en /api');
app.use("/api", routes());

// Servir imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Puerto
const port = process.env.PORT;
app.listen(port, () => {
  console.log("🚀 Servidor ejecutándose en el puerto " + port);
  console.log("🌐 URL pública: proporcionada por Railway");
  console.log("📱 Ambiente:", process.env.NODE_ENV);
});
