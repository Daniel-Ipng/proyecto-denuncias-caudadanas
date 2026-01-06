// Model: Categoria
// Encapsula la lógica de acceso a datos de categorías

const db = require('../config/db');

class Categoria {
    // Obtener todas las categorías
    static findAll() {
        return new Promise((resolve, reject) => {
            db.query('CALL sp_obtener_categorias()', (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    // Buscar categoría por ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre FROM categorias WHERE id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Buscar categoría por nombre
    static findByNombre(nombre) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre FROM categorias WHERE nombre = ?';
            db.query(query, [nombre], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Crear nueva categoría
    static create(nombre) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO categorias (nombre) VALUES (?)';
            db.query(query, [nombre], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId, nombre });
            });
        });
    }

    // Actualizar categoría
    static update(id, nombre) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE categorias SET nombre = ? WHERE id = ?';
            db.query(query, [nombre, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Eliminar categoría
    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM categorias WHERE id = ?';
            db.query(query, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }
}

module.exports = Categoria;
