const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'denuncia-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Máximo 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// =================================================================
// FUNCIONES QUE USAN PROCEDIMIENTOS ALMACENADOS
// =================================================================

// Obtener todas las denuncias del usuario logueado
exports.obtenerDenunciasUsuario = (req, res) => {
    const userId = req.user.id;

    db.query('CALL sp_obtener_denuncias_usuario(?)', [userId], (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_denuncias_usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
        }
        // Los resultados de un CALL vienen en results[0]
        res.json(results[0]);
    });
};

// Obtener todas las denuncias (para autoridades)
exports.obtenerTodasDenuncias = (req, res) => {
    db.query('CALL sp_obtener_todas_denuncias()', (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_todas_denuncias:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
        }
        res.json(results[0]);
    });
};

// Obtener categorías
exports.obtenerCategorias = (req, res) => {
    db.query('CALL sp_obtener_categorias()', (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_categorias:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las categorías.' });
        }
        res.json(results[0]);
    });
};

// Crear nueva denuncia
exports.crearDenuncia = async (req, res) => {
    const userId = req.user.id;
    const { folio, titulo, descripcion, id_categoria, latitud, longitud } = req.body;

    if (!folio || !titulo || !descripcion || !id_categoria || !latitud || !longitud) {
        return res.status(400).json({ 
            message: 'Todos los campos son requeridos: folio, titulo, descripcion, id_categoria, latitud, longitud' 
        });
    }

    let imagenUrl = null;
    if (req.file) {
        try {
            // Subir imagen a Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'denuncias_ciudadanas'
            });
            imagenUrl = result.secure_url;
            // Eliminar imagen local después de subir
            fs.unlink(req.file.path, () => {});
        } catch (err) {
            return res.status(500).json({ message: 'Error al subir imagen a Cloudinary.' });
        }
    }

    db.query(
        'CALL sp_crear_denuncia(?, ?, ?, ?, ?, ?, ?)',
        [folio, titulo, descripcion, latitud, longitud, userId, id_categoria],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error del servidor al crear la denuncia.' });
            }
            const denunciaId = results[0][0].insertId;
            if (imagenUrl) {
                db.query('CALL sp_insertar_imagen_denuncia(?, ?)', [imagenUrl, denunciaId], (err) => {
                    if (err) {
                        console.error('Error al ejecutar sp_insertar_imagen_denuncia:', err);
                        // No retornar error fatal, la denuncia se creó igual
                    }

                    res.status(201).json({
                        message: 'Denuncia creada exitosamente',
                        folio: folio,
                        denunciaId: denunciaId,
                        imagenUrl: imagenUrl
                    });
                });
            } else {
                res.status(201).json({
                    message: 'Denuncia creada exitosamente',
                    folio: folio,
                    denunciaId: denunciaId
                });
            }
        }
    );
};

// Obtener estadísticas del usuario logueado
exports.obtenerEstadisticasUsuario = (req, res) => {
    const userId = req.user.id;

    db.query('CALL sp_obtener_estadisticas_usuario(?)', [userId], (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_estadisticas_usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las estadísticas.' });
        }
        res.json(results[0][0]); // Devuelve la primera fila del primer result set
    });
};

// Exportar multer para usar en rutas
exports.upload = upload;

// Obtener detalle completo de una denuncia
exports.obtenerDetalleDenuncia = (req, res) => {
    const { id } = req.params;
    
    db.query('CALL sp_obtener_detalle_denuncia(?)', [id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_detalle_denuncia:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        if (results[0].length === 0) {
            return res.status(404).json({ message: 'Denuncia no encontrada' });
        }
        
        res.json(results[0][0]);
    });
};

// Actualizar estado de una denuncia
exports.actualizarDenuncia = (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
        return res.status(400).json({ message: 'El estado es requerido' });
    }
    
    const estadosValidos = ['recibido', 'en_progreso', 'resuelto', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
    }
    
    db.query(
        'CALL sp_actualizar_estado_denuncia(?, ?)',
        [id, estado],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar sp_actualizar_estado_denuncia:', err);
                return res.status(500).json({ message: 'Error del servidor' });
            }
            
            // El procedimiento devuelve las filas afectadas en el primer result set
            const filasAfectadas = results[0][0].filas_afectadas;
            
            if (filasAfectadas === 0) {
                return res.status(404).json({ message: 'Denuncia no encontrada' });
            }
            
            res.json({ message: 'Denuncia actualizada correctamente' });
        }
    );
};

// Agregar comentario a una denuncia
exports.agregarComentario = (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    if (!texto || texto.trim() === '') {
        return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }
    
    db.query(
        'CALL sp_agregar_comentario(?, ?, ?)',
        [texto, id, userId],
        (err, results) => {
            if (err) {
                console.error('Error al ejecutar sp_agregar_comentario:', err);
                return res.status(500).json({ message: 'Error del servidor' });
            }
            
            // El procedimiento devuelve el ID en el primer result set
            const idComentario = results[0][0].id_comentario;
            
            res.status(201).json({
                id: idComentario,
                texto: texto,
                fecha: new Date(),
                es_autoridad: userRole === 'autoridad'
            });
        }
    );
};

// Obtener comentarios de una denuncia
exports.obtenerComentarios = (req, res) => {
    const { id } = req.params;
    
    db.query('CALL sp_obtener_comentarios(?)', [id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar sp_obtener_comentarios:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        const comentarios = results[0].map(c => ({
            id: c.id,
            texto: c.texto,
            fecha: c.fecha,
            autor: `${c.nombre} ${c.apellido}`,
            es_autoridad: c.rol === 'autoridad'
        }));
        
        res.json(comentarios);
    });
};