const multer = require('multer');
const path = require('path');
const fsSync = require('fs');
const fs = require('fs').promises;

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fsSync.existsSync(uploadPath)) {
            fsSync.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const extension = file.originalname.split('.').pop();
        const nombreUnico = `imagen_${Date.now()}.${extension}`;
        cb(null, nombreUnico);
    }
});

// Middleware de multer
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Solo se permiten archivos de imagen.'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Subir o reemplazar imagen
const subirImagenCarousel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ exito: false, mensaje: 'No se recibió ninguna imagen.' });
        }

        const uploadPath = path.join(__dirname, '../uploads');
        const archivos = await fs.readdir(uploadPath);
        const imagenes = archivos.filter(a => /\.(jpg|jpeg|png|gif|webp)$/i.test(a));

        const nuevaImagen = req.file.filename;
        const rutaNueva = `/uploads/${nuevaImagen}`;
        const index = req.body.index ? parseInt(req.body.index) : null;

        if (index !== null && !isNaN(index)) {
            //asignar numero a una imagen
            if (index < 0 || index >= 10) {
                await fs.unlink(path.join(uploadPath, nuevaImagen));
                return res.status(400).json({ exito: false, mensaje: 'Índice fuera del rango permitido (0–9).' });
            }

            if (index < imagenes.length) {
                // reemplaza archivo existente
                const anterior = imagenes[index];
                await fs.unlink(path.join(uploadPath, anterior));
                imagenes[index] = nuevaImagen;
            } else {
                imagenes.push(nuevaImagen);
            }
        } 
        else {
            // Si ya hay 10 imágenes y no se está reemplazando, no deja subir más
            if (imagenes.length >= 10) {
                await fs.unlink(path.join(uploadPath, nuevaImagen)); 
                return res.status(400).json({ 
                    exito: false, 
                    mensaje: 'Límite alcanzado: solo se permiten 10 imágenes en el carrusel.' 
                });
            }

            imagenes.push(nuevaImagen);
        }

        return res.status(200).json({
            exito: true,
            mensaje: index !== null ? 'Imagen reemplazada correctamente.' : 'Imagen subida correctamente.',
            archivo: { nombre: nuevaImagen, ruta: rutaNueva },
            total: imagenes.length
        });

    } catch (error) {
        console.error('❌ Error al subir/reemplazar imagen:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al subir imagen.', error: error.message });
    }
};

// Obtener imágenes del carrusel
const obtenerImagenesCarousel = async (req, res) => {
    try {
        const uploadPath = path.join(__dirname, '../uploads');
        const archivos = await fs.readdir(uploadPath);
        const imagenes = archivos.filter(a => /\.(jpg|jpeg|png|gif|webp)$/i.test(a));
        const rutas = imagenes.map(img => `/uploads/${img}`);

        return res.status(200).json({
            exito: true,
            cantidad: rutas.length,
            imagenes: rutas
        });
    } catch (error) {
        console.error('❌ Error al obtener imágenes:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error al obtener imágenes.', error: error.message });
    }
};

module.exports = { upload, subirImagenCarousel, obtenerImagenesCarousel };
