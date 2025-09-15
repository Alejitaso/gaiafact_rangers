const express = require("express");
const routes = require("./routes");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const authController = require("./controllers/authController");

mongoose.set("strictQuery", true);

// conexion a mongo
mongoose
  .connect("mongodb://0.0.0.0:27017/almacen")
  .then(() => {
    console.log("✅ Se conectó correctamente a la BD Mongo");
  })
  .catch((err) => {
    console.log("❌ No se conectó correctamente a la BD Mongo", err);
  });

  
// crear servidor
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//Rutas de autenticación 
app.post("/api/auth/login", authController.login);
app.post("/api/auth/recover", authController.recoverPassword);
app.post("/api/auth/reset-password", authController.resetPassword);

//Rutas principales (clientes, productos, facturas, etc.)
app.use("/api", routes());

// definir el puerto
const port = 4000;

app.listen(port, () => {
  console.log("🚀 El servidor está ejecutándose en el puerto " + port);
});
