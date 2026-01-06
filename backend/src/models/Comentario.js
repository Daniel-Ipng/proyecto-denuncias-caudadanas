// Model: Comentario
// Encapsula la lógica de acceso a datos de comentarios de seguimiento

const db = require('../config/db');

class Comentario {
    // Crear nuevo comentario
    static create(comentarioData) {
        return new Promise((resolve, reject) => {
            const { texto, id_denuncia, id_usuario } = comentarioData;
            
            db.query(
                'CALL sp_agregar_comentario(?, ?, ?)',
                [texto, id_denuncia, id_usuario],
                (err, results) => {
                    if (err) return reject(err);
                    // Devuelve solo el ID del comentario
                    resolve(results[0][0].id_comentario);
                }
            );
        });
    }

    // Obtener comentarios de una denuncia (formateados)
    static findByDenuncia(id_denuncia) {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_comentarios(?)', [id_denuncia], (err, results) => {
                if (err) return reject(err);
                
                // Formatear los comentarios para la respuesta
                const comentarios = results[0].map(c => ({
                    id: c.id,
                    texto: c.texto,
                    fecha: c.fecha,
                    autor: `${c.nombre} ${c.apellido}`,
                    es_autoridad: c.rol === 'autoridad'
                }));
                
                resolve(comentarios);
            });
        });
    }

    // Buscar comentario por ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT cs.*, u.nombre, u.apellido, u.rol
                FROM comentarios_seguimiento cs
                JOIN usuarios u ON cs.id_usuario = u.id
                WHERE cs.id = ?
            `;
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Eliminar comentario
    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM comentarios_seguimiento WHERE id = ?';
            db.query(query, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Contar comentarios de una denuncia
    static countByDenuncia(id_denuncia) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as total FROM comentarios_seguimiento WHERE id_denuncia = ?';
            db.query(query, [id_denuncia], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].total);
            });
        });
    }
}

module.exports = Comentario;
