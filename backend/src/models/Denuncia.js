// Model: Denuncia
// Encapsula toda la lógica de acceso a datos de denuncias

const db = require('../config/db');

class Denuncia {
    // Crear nueva denuncia usando stored procedure
    static create(denunciaData) {
        return new Promise((resolve, reject) => {
            const { folio, titulo, descripcion, placa, id_categoria, latitud, longitud, id_usuario } = denunciaData;
            
            db.query(
                'CALL sp_crear_denuncia(?, ?, ?, ?, ?, ?, ?, ?)',
                [folio, titulo, descripcion, placa || null, id_categoria, latitud, longitud, id_usuario],
                (err, results) => {
                    if (err) return reject(err);
                    // Devuelve solo el ID de la denuncia creada
                    resolve(results[0][0].id_denuncia);
                }
            );
        });
    }

    // Obtener denuncia por ID (detalle completo)
    static findById(id) {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_detalle_denuncia(?)', [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0][0] || null);
            });
        });
    }

    // Obtener denuncias de un usuario
    static findByUsuario(id_usuario) {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_denuncias_usuario(?)', [id_usuario], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Obtener todas las denuncias (para autoridades)
    static findAll() {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_todas_denuncias()', (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Actualizar estado de denuncia
    static updateEstado(id, estado) {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_actualizar_estado_denuncia(?, ?)', [id, estado], (err, results) => {
                if (err) return reject(err);
                // Devuelve true si se actualizó, false si no
                const filasAfectadas = results[0][0].filas_afectadas;
                resolve(filasAfectadas > 0);
            });
        });
    }

    // Obtener estadísticas de un usuario
    static getEstadisticasUsuario(id_usuario) {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_estadisticas_usuario(?)', [id_usuario], (err, results) => {
                if (err) return reject(err);
                resolve(results[0][0]);
            });
        });
    }

    // Obtener estadísticas globales (para autoridades)
    static getEstadisticasGlobales() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'recibido' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                    SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltas,
                    SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazadas
                FROM denuncias
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Generar folio único
    static generarFolio() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DEN-${año}${mes}-${random}`;
    }

    // Insertar imagen de denuncia
    static agregarImagen(id_denuncia, url_imagen) {
        return new Promise((resolve, reject) => {
            db.query(
                'CALL sp_insertar_imagen_denuncia(?, ?)',
                [url_imagen, id_denuncia],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(true);
                }
            );
        });
    }

    // Obtener imágenes de una denuncia
    static getImagenes(id_denuncia) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, url_imagen FROM imagenes_denuncia WHERE id_denuncia = ?';
            db.query(query, [id_denuncia], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Contar denuncias por categoría
    static countByCategoria() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.nombre as categoria, COUNT(d.id) as total
                FROM categorias c
                LEFT JOIN denuncias d ON c.id = d.id_categoria
                GROUP BY c.id, c.nombre
                ORDER BY total DESC
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Contar denuncias por estado
    static countByEstado() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT estado, COUNT(*) as total
                FROM denuncias
                GROUP BY estado
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    // Buscar denuncias por placa de vehículo
    static findByPlaca(placa) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    d.id, d.folio, d.titulo, d.descripcion, d.placa, d.estado, 
                    d.fecha_creacion, d.latitud, d.longitud,
                    c.nombre AS categoria,
                    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
                    (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
                FROM denuncias d
                JOIN categorias c ON d.id_categoria = c.id
                JOIN usuarios u ON d.id_usuario = u.id
                WHERE d.placa LIKE ?
                ORDER BY d.fecha_creacion DESC
            `;
            const searchTerm = `%${placa.toUpperCase()}%`;
            db.query(query, [searchTerm], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = Denuncia;
