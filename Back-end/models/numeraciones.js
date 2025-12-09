// numeraciones.js

const Numeracion = require('../models/Numeracion'); // 🚨 Ajuste esta ruta si es necesario

async function generarNumeroFactura(prefijo = 'F') {
    // 1. Incrementar el número de forma atómica en la base de datos.
    const numeracionActualizada = await Numeracion.findOneAndUpdate(
        { prefijo: prefijo }, 
        { $inc: { numeroActual: 1 } }, // Incrementa numeroActual en 1
        { new: true } // Devuelve el documento después de la actualización
    );

    if (!numeracionActualizada) {
        throw new Error(`La configuración de numeración para el prefijo "${prefijo}" no existe en la base de datos.`);
    }
    
    // 2. VALIDACIÓN CRÍTICA: Chequeo de límite.
    if (numeracionActualizada.numeroActual > numeracionActualizada.rangoFinal) {
        
        // 3. REVERTIR EL INCREMENTO: Si falla la validación, volvemos al estado anterior.
        await Numeracion.updateOne(
            { prefijo: prefijo }, 
            { $inc: { numeroActual: -1 } } 
        );

        // 4. Lanzar el error de alerta.
        const ultimoNumeroValido = `${numeracionActualizada.prefijo}${String(numeracionActualizada.rangoFinal).padStart(5, "0")}`;
        throw new Error(
            `❌ Se alcanzó el límite de numeración autorizado (${ultimoNumeroValido}). Debe actualizar la resolución de facturación.`
        );
    }
    
    // 5. Formatear el número (ej: F00001)
    const numeroFormateado = `${numeracionActualizada.prefijo}${String(numeracionActualizada.numeroActual).padStart(5, "0")}`;
    return numeroFormateado;
}

/**
 * 🛠️ NUEVA FUNCIÓN: Carga una nueva resolución de facturación.
 * Establece un nuevo límite superior (rangoFinal) y resetea el número inicial.
 */
async function cargarNuevaResolucion(prefijo, nuevo_rango_final, nuevo_rango_inicial, nueva_resolucion_DIAN) {
    if (nuevo_rango_inicial >= nuevo_rango_final) {
        throw new Error("El número inicial de la nueva resolución debe ser menor que el límite final.");
    }
    
    // Utilizamos findOneAndUpdate con $set para actualizar los campos de la resolución
    const numeracionActualizada = await Numeracion.findOneAndUpdate(
        { prefijo: prefijo },
        { 
            $set: { 
                // Establecemos el próximo número a generar como el inicial de la nueva resolución
                numeroActual: nuevo_rango_inicial,        
                rangoFinal: nuevo_rango_final,  // ¡El nuevo límite superior!
                resolucion_DIAN: nueva_resolucion_DIAN, 
                fechaInicio: new Date()
            }
        },
        { 
            new: true,
            upsert: true // Crea el documento si no existe
        }
    );
    
    if (!numeracionActualizada) {
        throw new Error(`No se pudo cargar la nueva resolución para el prefijo ${prefijo}.`);
    }

    return numeracionActualizada;
}


module.exports = { 
    generarNumeroFactura,
    cargarNuevaResolucion // 🚨 ¡Esta es la función que te permite subir el límite!
};