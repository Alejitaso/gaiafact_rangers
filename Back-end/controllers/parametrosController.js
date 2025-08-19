const Parametros = require("../models/parametros");

// Crear parametros
exports.crearParametros = async (req, res) => {
    try {
        const nuevosParametros = new Parametros(req.body);
        await nuevosParametros.save();
        res.status(201).json(nuevosParametros);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear los parámetros", error });
    }
};

// Obtener todos los parametros
exports.obtenerParametros = async (req, res) => {
    try {
        const parametros = await Parametros.find();
        res.json(parametros);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener los parámetros", error });
    }
};

// Obtener un parametro por ID
exports.obtenerParametrosPorId = async (req, res) => {
    try {
        const parametros = await Parametros.findById(req.params.id);

        if (!parametros) {
            return res.status(404).json({ mensaje: "Parámetros no encontrados" });
        }

        res.json(parametros);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener los parámetros", error });
    }
};

// Actualizar parametros
exports.actualizarParametros = async (req, res) => {
    try {
        const parametros = await Parametros.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!parametros) {
            return res.status(404).json({ mensaje: "Parámetros no encontrados" });
        }

        res.json(parametros);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar los parámetros", error });
    }
};

// Eliminar parametros
exports.eliminarParametros = async (req, res) => {
    try {
        const parametros = await Parametros.findByIdAndDelete(req.params.id);

        if (!parametros) {
            return res.status(404).json({ mensaje: "Parámetros no encontrados" });
        }

        res.json({ mensaje: "Parámetros eliminados correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar los parámetros", error });
    }
};
