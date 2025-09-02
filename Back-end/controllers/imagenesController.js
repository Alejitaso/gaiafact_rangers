const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/onset/img');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const nombreUnico = req.body.nombre || `imagen_${Date.now()}.${file.originalname.split('.').pop()}`;
        cb(null, nombreUnico);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Funciones del controller
const subirImagenCarousel = async (req, res) => {
    // Tu lógica actual aquí
};

const obtenerImagenesCarousel = async (req, res) => {
    // Tu lógica actual aquí
};

module.exports = {
    upload,
    subirImagenCarousel,
    obtenerImagenesCarousel
};