const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const files = [
  'authcontroller.js',
  'facturaController.js',
  'usuarioController.js',
  'productoController.js'
];

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // ✅ Reemplaza mensajes expuestos por genéricos
  const newContent = content
    .replace(/res\.status\(500\)\.json\(\{[^}]*error[^}]*\}\);?/g, 'res.status(500).json({ mensaje: "Error en el servidor. Intente más tarde." });')
    .replace(/res\.status\(500\)\.json\(\{[^}]*mensaje:[^}]*\}\);?/g, 'res.status(500).json({ mensaje: "Error en el servidor. Intente más tarde." });');

  fs.writeFileSync(filePath, newContent);
  console.log(`✅ ${file} actualizado con mensajes genéricos`);
});