const db = require('../config/db');

// Obtener todos los usuarios con estadísticas
exports.obtenerTodosUsuarios = (req, res) => {
    const query = `
        SELECT 
            u.id, u.nombre, u.apellido, u.dni, u.email, u.rol, u.fecha_creacion,
            COUNT(DISTINCT d.id) as total_denuncias,
            SUM(CASE WHEN d.estado = 'resuelto' THEN 1 ELSE 0 END) as denuncias_resueltas,
            SUM(CASE WHEN d.estado = 'recibido' THEN 1 ELSE 0 END) as denuncias_pendientes
        FROM usuarios u
        LEFT JOIN denuncias d ON u.id = d.id_usuario
        GROUP BY u.id
        ORDER BY u.fecha_creacion DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener usuarios.' });
        }
        res.json(results);
    });
};

// Obtener detalles de un usuario específico
exports.obtenerDetalleUsuario = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            u.id, u.nombre, u.apellido, u.dni, u.email, u.rol, u.fecha_creacion,
            COUNT(DISTINCT d.id) as total_denuncias,
            SUM(CASE WHEN d.estado = 'resuelto' THEN 1 ELSE 0 END) as denuncias_resueltas,
            SUM(CASE WHEN d.estado = 'en_progreso' THEN 1 ELSE 0 END) as denuncias_en_progreso,
            SUM(CASE WHEN d.estado = 'recibido' THEN 1 ELSE 0 END) as denuncias_pendientes,
            COUNT(DISTINCT c.id) as total_comentarios
        FROM usuarios u
        LEFT JOIN denuncias d ON u.id = d.id_usuario
        LEFT JOIN comentarios_seguimiento c ON u.id = c.id_usuario
        WHERE u.id = ?
        GROUP BY u.id
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener detalle de usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener el detalle.' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        res.json(results[0]);
    });
};

// Actualizar rol de usuario
exports.actualizarRolUsuario = (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    // Validar que el rol sea válido
    if (!['ciudadano', 'autoridad'].includes(rol)) {
        return res.status(400).json({ message: 'Rol inválido. Debe ser "ciudadano" o "autoridad".' });
    }

    // No permitir que el usuario se cambie su propio rol
    if (req.user.id === parseInt(id)) {
        return res.status(403).json({ message: 'No puedes cambiar tu propio rol.' });
    }

    const query = 'UPDATE usuarios SET rol = ? WHERE id = ?';

    db.query(query, [rol, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar rol:', err);
            return res.status(500).json({ message: 'Error del servidor al actualizar el rol.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ message: 'Rol actualizado exitosamente.', rol });
    });
};

// Obtener estadísticas generales de usuarios
exports.obtenerEstadisticasGenerales = (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_usuarios,
            SUM(CASE WHEN rol = 'ciudadano' THEN 1 ELSE 0 END) as total_ciudadanos,
            SUM(CASE WHEN rol = 'autoridad' THEN 1 ELSE 0 END) as total_autoridades,
            SUM(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as nuevos_mes
        FROM usuarios
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener estadísticas.' });
        }
        res.json(results[0]);
    });
};

// Obtener denuncias de un usuario específico
exports.obtenerDenunciasUsuario = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud,
            c.nombre AS categoria,
            (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        WHERE d.id_usuario = ?
        ORDER BY d.fecha_creacion DESC
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener denuncias del usuario:', err);
            return res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
        }
        res.json(results);
    });
};

// Buscar usuarios
exports.buscarUsuarios = (req, res) => {
    const { q, rol } = req.query;
    
    let query = `
        SELECT 
            u.id, u.nombre, u.apellido, u.dni, u.email, u.rol, u.fecha_creacion,
            COUNT(DISTINCT d.id) as total_denuncias
        FROM usuarios u
        LEFT JOIN denuncias d ON u.id = d.id_usuario
        WHERE 1=1
    `;
    
    const params = [];

    if (q) {
        query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR u.dni LIKE ?)`;
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (rol && ['ciudadano', 'autoridad'].includes(rol)) {
        query += ` AND u.rol = ?`;
        params.push(rol);
    }

    query += ` GROUP BY u.id ORDER BY u.fecha_creacion DESC`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al buscar usuarios:', err);
            return res.status(500).json({ message: 'Error del servidor al buscar usuarios.' });
        }
        res.json(results);
    });
};

module.exports = exports;
