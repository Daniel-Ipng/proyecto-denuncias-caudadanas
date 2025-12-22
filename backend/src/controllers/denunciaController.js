const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Obtener todas las denuncias del usuario logueado
exports.obtenerDenunciasUsuario = (req, res) => {
    // El middleware authMiddleware añade el usuario a la petición
    const userId = req.user.id; 

    const query = `
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        WHERE d.id_usuario = ?
        ORDER BY d.fecha_creacion DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener denuncias del usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
        }
        res.json(results);
    });
};

// Obtener todas las denuncias (para reportes)
exports.obtenerTodasDenuncias = (req, res) => {
    const query = `
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria, c.id AS id_categoria,
            u.nombre, u.apellido
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        JOIN usuarios u ON d.id_usuario = u.id
        ORDER BY d.fecha_creacion DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener todas las denuncias:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
        }
        res.json(results);
    });
};

// Obtener categorías
exports.obtenerCategorias = (req, res) => {
    const query = 'SELECT id, nombre FROM categorias';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener categorías:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las categorías.' });
        }
        res.json(results);
    });
};

// Crear nueva denuncia
exports.crearDenuncia = (req, res) => {
    const userId = req.user.id;
    const { folio, titulo, descripcion, id_categoria, latitud, longitud } = req.body;

    // Validaciones básicas
    if (!folio || !titulo || !descripcion || !id_categoria || !latitud || !longitud) {
        return res.status(400).json({ 
            message: 'Todos los campos son requeridos: folio, titulo, descripcion, id_categoria, latitud, longitud' 
        });
    }

    // Ruta de la imagen si existe
    let imagenUrl = null;
    if (req.file) {
        imagenUrl = `/uploads/${req.file.filename}`;
    }

    // Insertar denuncia en la base de datos
    const queryDenuncia = `
        INSERT INTO denuncias (folio, titulo, descripcion, id_categoria, latitud, longitud, id_usuario, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'recibido')
    `;

    db.query(queryDenuncia, [folio, titulo, descripcion, id_categoria, latitud, longitud, userId], (err, results) => {
        if (err) {
            console.error('Error al crear denuncia:', err);
            
            // Si hay error y se subió imagen, eliminarla
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error('Error al eliminar imagen:', unlinkErr);
                });
            }
            
            return res.status(500).json({ message: 'Error del servidor al crear la denuncia.' });
        }

        const denunciaId = results.insertId;

        // Si hay imagen, insertarla en la tabla de imágenes
        if (imagenUrl) {
            const queryImagen = `
                INSERT INTO imagenes_denuncia (url_imagen, id_denuncia)
                VALUES (?, ?)
            `;

            db.query(queryImagen, [imagenUrl, denunciaId], (err) => {
                if (err) {
                    console.error('Error al guardar imagen:', err);
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
    });
};

// Obtener estadísticas del usuario logueado
exports.obtenerEstadisticasUsuario = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'recibido' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) en_progreso,
            SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) resueltas
        FROM denuncias
        WHERE id_usuario = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener estadísticas del usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las estadísticas.' });
        }
        res.json(results[0]); // Devuelve la primera (y única) fila de resultados
    });
};

// Exportar multer para usar en rutas
exports.upload = upload;

// Obtener detalle completo de una denuncia
exports.obtenerDetalleDenuncia = (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria, c.id AS id_categoria,
            u.nombre AS ciudadano_nombre, u.apellido AS ciudadano_apellido, u.id AS id_usuario,
            GROUP_CONCAT(img.url_imagen) AS imagen_url
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        JOIN usuarios u ON d.id_usuario = u.id
        LEFT JOIN imagenes_denuncia img ON d.id = img.id_denuncia
        WHERE d.id = ?
        GROUP BY d.id
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener detalle de denuncia:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Denuncia no encontrada' });
        }
        
        const denuncia = results[0];
        // Si hay múltiples imágenes, tomar la primera
        if (denuncia.imagen_url) {
            denuncia.imagen_url = `http://localhost:3001${denuncia.imagen_url.split(',')[0]}`;
        }
        
        res.json(denuncia);
    });
};

// Actualizar estado y calificación de una denuncia
exports.actualizarDenuncia = (req, res) => {
    const { id } = req.params;
    const { estado, calificacion } = req.body;
    
    if (!estado) {
        return res.status(400).json({ message: 'El estado es requerido' });
    }
    
    const estadosValidos = ['recibido', 'en_progreso', 'resuelto', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
    }
    
    let query = 'UPDATE denuncias SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP';
    let params = [estado];
    
    if (calificacion !== undefined) {
        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ message: 'Calificación debe estar entre 1 y 5' });
        }
        query += ', calificacion = ?';
        params.push(calificacion);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al actualizar denuncia:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Denuncia no encontrada' });
        }
        
        res.json({ message: 'Denuncia actualizada correctamente' });
    });
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
    
    const query = `
        INSERT INTO comentarios_seguimiento (texto, id_denuncia, id_usuario)
        VALUES (?, ?, ?)
    `;
    
    db.query(query, [texto, id, userId], (err, results) => {
        if (err) {
            console.error('Error al agregar comentario:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        res.status(201).json({
            id: results.insertId,
            texto: texto,
            fecha: new Date(),
            es_autoridad: userRole === 'autoridad'
        });
    });
};

// Obtener comentarios de una denuncia
exports.obtenerComentarios = (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            cs.id, cs.texto, cs.fecha, cs.id_usuario,
            u.nombre, u.apellido, u.rol
        FROM comentarios_seguimiento cs
        JOIN usuarios u ON cs.id_usuario = u.id
        WHERE cs.id_denuncia = ?
        ORDER BY cs.fecha ASC
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener comentarios:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        
        const comentarios = results.map(c => ({
            id: c.id,
            texto: c.texto,
            fecha: c.fecha,
            autor: `${c.nombre} ${c.apellido}`,
            es_autoridad: c.rol === 'autoridad'
        }));
        
        res.json(comentarios);
    });
};