// Model: Usuario
// Encapsula toda la lógica de acceso a datos de usuarios

const db = require('../config/db');

class Usuario {
    // Buscar usuario por email
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM usuarios WHERE email = ?';
            db.query(query, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Buscar usuario por ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre, apellido, dni, email, rol, fecha_creacion FROM usuarios WHERE id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Buscar usuario por DNI
    static findByDni(dni) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM usuarios WHERE dni = ?';
            db.query(query, [dni], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Crear nuevo usuario
    static create(userData) {
        return new Promise((resolve, reject) => {
            const { nombre, apellido, dni, email, password_hash, rol } = userData;
            const query = 'INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)';
            
            db.query(query, [nombre, apellido, dni, email, password_hash, rol], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId, ...userData });
            });
        });
    }

    // Obtener todos los usuarios
    static findAll() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre, apellido, dni, email, rol, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC';
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Obtener usuarios por rol
    static findByRol(rol) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre, apellido, dni, email, rol, fecha_creacion FROM usuarios WHERE rol = ?';
            db.query(query, [rol], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Actualizar usuario
    static update(id, userData) {
        return new Promise((resolve, reject) => {
            const { nombre, apellido, email } = userData;
            const query = 'UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?';
            
            db.query(query, [nombre, apellido, email, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Actualizar contraseña
    static updatePassword(id, password_hash) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET password_hash = ? WHERE id = ?';
            db.query(query, [password_hash, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Eliminar usuario
    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM usuarios WHERE id = ?';
            db.query(query, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Contar usuarios por rol
    static countByRol() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN rol = 'ciudadano' THEN 1 ELSE 0 END) as ciudadanos,
                    SUM(CASE WHEN rol = 'autoridad' THEN 1 ELSE 0 END) as autoridades
                FROM usuarios
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Obtener todos los usuarios con estadísticas de denuncias
    static findAllWithStats() {
        return new Promise((resolve, reject) => {
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
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Obtener usuario por ID con estadísticas completas
    static findByIdWithStats(id) {
        return new Promise((resolve, reject) => {
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
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Actualizar rol de usuario
    static updateRol(id, rol) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET rol = ? WHERE id = ?';
            db.query(query, [rol, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Obtener estadísticas generales de usuarios
    static getEstadisticasGenerales() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_usuarios,
                    SUM(CASE WHEN rol = 'ciudadano' THEN 1 ELSE 0 END) as total_ciudadanos,
                    SUM(CASE WHEN rol = 'autoridad' THEN 1 ELSE 0 END) as total_autoridades,
                    SUM(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as nuevos_mes
                FROM usuarios
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Buscar usuarios con filtros
    static search(searchTerm, rol) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    u.id, u.nombre, u.apellido, u.dni, u.email, u.rol, u.fecha_creacion,
                    COUNT(DISTINCT d.id) as total_denuncias
                FROM usuarios u
                LEFT JOIN denuncias d ON u.id = d.id_usuario
                WHERE 1=1
            `;
            const params = [];

            if (searchTerm) {
                query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR u.dni LIKE ?)`;
                const term = `%${searchTerm}%`;
                params.push(term, term, term, term);
            }

            if (rol && ['ciudadano', 'autoridad'].includes(rol)) {
                query += ` AND u.rol = ?`;
                params.push(rol);
            }

            query += ` GROUP BY u.id ORDER BY u.fecha_creacion DESC`;

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = Usuario;
