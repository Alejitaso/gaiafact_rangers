
// este módulo exporta una función que obtiene un filtro de facturas basado en el tipo de usuario
function obtenerFiltroFacturas(tipoUsuario) {
  const hoy = new Date();
  const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const rol = tipoUsuario?.toUpperCase();

  if (['SUPERADMIN', 'ADMINISTRADOR'].includes(rol)) {
    return {
      filtroFecha: {},
      puedeVerHistorico: true
    };
  }

  return {
    filtroFecha: { createdAt: { $gte: inicioDelDia } },
    puedeVerHistorico: false
  };
}

module.exports = obtenerFiltroFacturas;