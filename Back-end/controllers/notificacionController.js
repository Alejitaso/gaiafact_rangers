const Notificacion = require("../models/notificacion");

exports.crearNotificacion = async (req, res) => {
    try {
        const nuevaNotificacion = new Notificacion(req.body);
        await nuevaNotificacion.save();
        res.status(201).json(nuevaNotificacion);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear la notificación", error });
    }
};

// Obtener todas las notificaciones
exports.obtenerNotificaciones = async (req, res) => {
    try {
        const notificaciones = await Notificacion.find()
            .populate('factura')
            .populate('cliente');
        res.json(notificaciones);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener las notificaciones", error });
    }
};

// Obtener una notificacion por ID
exports.obtenerNotificacionPorId = async (req, res) => {
    try {
        const notificacion = await Notificacion.findById(req.params.id)
            .populate('factura')
            .populate('cliente');

        if (!notificacion) {
            return res.status(404).json({ mensaje: "Notificación no encontrada" });
        }

        res.json(notificacion);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la notificación", error });
    }
};

// Actualizar una notificacion
exports.actualizarNotificacion = async (req, res) => {
    try {
        const notificacion = await Notificacion.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!notificacion) {
            return res.status(404).json({ mensaje: "Notificación no encontrada" });
        }

        res.json(notificacion);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar la notificación", error });
    }
};

// Eliminar una notificacion
exports.eliminarNotificacion = async (req, res) => {
    try {
        const notificacion = await Notificacion.findByIdAndDelete(req.params.id);

        if (!notificacion) {
            return res.status(404).json({ mensaje: "Notificación no encontrada" });
        }

        res.json({ mensaje: "Notificación eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar la notificación", error });
    }
};
