const IP_EMPRESA = "181.237.111.210"; // Cambia esta IP

module.exports = function securityNetworkMiddleware(req, res, next) {
  try {
    const userType = req.user?.tipo_usuario;

    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const cleanIP = ip.replace("::ffff:", "");

    console.log("🔍 Seguridad de red:");
    console.log("➡ UserType:", userType);
    console.log("➡ IP:", cleanIP);

    // ✅ 1. Modo desarrollo → acceso libre
    if (process.env.NODE_ENV !== "production") {
      console.log("✔ Modo desarrollo — seguridad desactivada");
      return next();
    }

    // 🟢 2. Cliente → acceso libre siempre
    if (userType === "CLIENTE") {
      return next();
    }

    // 🟢 3. Permitir acceso desde localhost en producción (seguridad)
    if (cleanIP === "127.0.0.1" || cleanIP === "::1") {
      console.log("✔ Acceso local permitido");
      return next();
    }

    // 🔒 4. Resto de roles → debe ser la IP de la empresa
    if (cleanIP !== IP_EMPRESA) {
      console.log("⛔ Acceso bloqueado — IP no autorizada");
      return res.status(403).json({
        error: "Acceso restringido a la red autorizada",
        tuIP: cleanIP,
        ipPermitida: IP_EMPRESA
      });
    }

    console.log("✔ IP autorizada — acceso concedido");
    next();

  } catch (error) {
    console.error("❌ Error en securityNetworkMiddleware:", error);
    res.status(500).json({ error: "Error interno en seguridad de red" });
  }
};
