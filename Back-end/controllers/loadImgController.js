// ===== CONTROLLERS/imagenController.js =====
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');

// ===== ESQUEMA DE IMAGEN =====
const imagenSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    nombreOriginal: {
        type: String,
        required: true
    },
    ruta: {
        type: String,
        required: true
    },
    tamaño: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    fechaSubida: {
        type: Date,
        default: Date.now
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Imagen = mongoose.model('Imagen', imagenSchema);

// ===== CONFIGURACIÓN DE MULTER =====
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/imagenes');
        
        // Crear directorio si no existe
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // Generar nombre único: timestamp_originalname
        const extension = path.extname(file.originalname);
        const nombreSinExtension = path.basename(file.originalname, extension);
        const nombreUnico = `${Date.now()}_${nombreSinExtension}${extension}`;
        cb(null, nombreUnico);
    }
});

// Filtro para solo aceptar imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Un archivo por vez
    },
    fileFilter: fileFilter
});

// ===== FUNCIONES DEL CONTROLLER =====

// Subir imagen
const subirImagen = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se proporcionó ningún archivo'
            });
        }

        // Crear URL para acceder a la imagen
        const urlImagen = `/uploads/imagenes/${req.file.filename}`;

        // Guardar información en la base de datos
        const nuevaImagen = new Imagen({
            nombre: req.file.filename,
            nombreOriginal: req.file.originalname,
            ruta: req.file.path,
            tamaño: req.file.size,
            tipo: req.file.mimetype,
            url: urlImagen
        });

        const imagenGuardada = await nuevaImagen.save();

        res.status(201).json({
            success: true,
            mensaje: 'Imagen subida correctamente',
            imagen: {
                id: imagenGuardada._id,
                nombre: imagenGuardada.nombre,
                nombreOriginal: imagenGuardada.nombreOriginal,
                url: imagenGuardada.url,
                tamaño: imagenGuardada.tamaño,
                tipo: imagenGuardada.tipo,
                fechaSubida: imagenGuardada.fechaSubida
            }
        });

    } catch (error) {
        console.error('Error subiendo imagen:', error);
        
        // Eliminar archivo si hubo error guardando en BD
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error eliminando archivo:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Obtener todas las imágenes
const obtenerImagenes = async (req, res) => {
    try {
        const { page = 1, limit = 10, tipo } = req.query;
        
        const filtro = { activa: true };
        if (tipo) {
            filtro.tipo = { $regex: tipo, $options: 'i' };
        }

        const opciones = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { fechaSubida: -1 }
        };

        const imagenes = await Imagen.find(filtro)
            .sort(opciones.sort)
            .limit(opciones.limit * 1)
            .skip((opciones.page - 1) * opciones.limit)
            .select('-ruta -__v');

        const total = await Imagen.countDocuments(filtro);

        res.json({
            success: true,
            imagenes,
            pagination: {
                currentPage: opciones.page,
                totalPages: Math.ceil(total / opciones.limit),
                totalItems: total,
                itemsPerPage: opciones.limit
            }
        });

    } catch (error) {
        console.error('Error obteniendo imágenes:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error obteniendo imágenes',
            error: error.message
        });
    }
};

// Obtener imagen por ID
const obtenerImagenPorId = async (req, res) => {
    try {
        const imagen = await Imagen.findById(req.params.id).select('-__v');
        
        if (!imagen || !imagen.activa) {
            return res.status(404).json({
                success: false,
                mensaje: 'Imagen no encontrada'
            });
        }

        res.json({
            success: true,
            imagen
        });

    } catch (error) {
        console.error('Error obteniendo imagen:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error obteniendo imagen',
            error: error.message
        });
    }
};

// Eliminar imagen
const eliminarImagen = async (req, res) => {
    try {
        const imagen = await Imagen.findById(req.params.id);
        
        if (!imagen || !imagen.activa) {
            return res.status(404).json({
                success: false,
                mensaje: 'Imagen no encontrada'
            });
        }

        // Soft delete - marcar como inactiva
        imagen.activa = false;
        await imagen.save();

        // Opcional: eliminar archivo físico
        try {
            await fs.unlink(imagen.ruta);
        } catch (unlinkError) {
            console.warn('No se pudo eliminar el archivo físico:', unlinkError.message);
        }

        res.json({
            success: true,
            mensaje: 'Imagen eliminada correctamente'
        });

    } catch (error) {
        console.error('Error eliminando imagen:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error eliminando imagen',
            error: error.message
        });
    }
};

// Función para obtener estadísticas de imágenes
const obtenerEstadisticas = async (req, res) => {
    try {
        const totalImagenes = await Imagen.countDocuments({ activa: true });
        const tamañoTotal = await Imagen.aggregate([
            { $match: { activa: true } },
            { $group: { _id: null, total: { $sum: '$tamaño' } } }
        ]);

        const imagenesPorTipo = await Imagen.aggregate([
            { $match: { activa: true } },
            { $group: { _id: '$tipo', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            estadisticas: {
                totalImagenes,
                tamañoTotal: tamañoTotal[0]?.total || 0,
                imagenesPorTipo
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error obteniendo estadísticas',
            error: error.message
        });
    }
};

// ===== MIDDLEWARE DE MANEJO DE ERRORES DE MULTER =====
const manejarErroresMulter = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                mensaje: 'El archivo es demasiado grande. Máximo 5MB permitido.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se permite un archivo por vez.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                mensaje: 'Campo de archivo no esperado.'
            });
        }
    }

    if (error.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({
            success: false,
            mensaje: 'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP).'
        });
    }

    next(error);
};

// ===== EXPORTAR =====
module.exports = {
    upload,
    subirImagen,
    obtenerImagenes,
    obtenerImagenPorId,
    eliminarImagen,
    obtenerEstadisticas,
    manejarErroresMulter,
    Imagen
};