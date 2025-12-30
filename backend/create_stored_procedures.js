/**
 * Script para crear procedimientos almacenados en MySQL
 * Ejecutar con: node create_stored_procedures.js
 */

require('dotenv').config();
const mysql = require('mysql2');

const procedures = [
    // 1. Obtener denuncias de un usuario específico
    `CREATE PROCEDURE sp_obtener_denuncias_usuario(IN p_id_usuario INT)
    BEGIN
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria,
            (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        WHERE d.id_usuario = p_id_usuario
        ORDER BY d.fecha_creacion DESC;
    END`,

    // 2. Obtener todas las denuncias (para autoridades)
    `CREATE PROCEDURE sp_obtener_todas_denuncias()
    BEGIN
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria, c.id AS id_categoria,
            u.nombre AS ciudadano_nombre, u.apellido AS ciudadano_apellido,
            (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS foto_url
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        JOIN usuarios u ON d.id_usuario = u.id
        ORDER BY d.fecha_creacion DESC;
    END`,

    // 3. Obtener todas las categorías
    `CREATE PROCEDURE sp_obtener_categorias()
    BEGIN
        SELECT id, nombre FROM categorias ORDER BY nombre;
    END`,

    // 4. Crear nueva denuncia (devuelve el ID insertado)
    `CREATE PROCEDURE sp_crear_denuncia(
        IN p_folio VARCHAR(20),
        IN p_titulo VARCHAR(150),
        IN p_descripcion TEXT,
        IN p_id_categoria INT,
        IN p_latitud DECIMAL(10, 8),
        IN p_longitud DECIMAL(11, 8),
        IN p_id_usuario INT
    )
    BEGIN
        INSERT INTO denuncias (folio, titulo, descripcion, id_categoria, latitud, longitud, id_usuario, estado)
        VALUES (p_folio, p_titulo, p_descripcion, p_id_categoria, p_latitud, p_longitud, p_id_usuario, 'recibido');
        SELECT LAST_INSERT_ID() AS id_denuncia;
    END`,

    // 5. Insertar imagen de denuncia
    `CREATE PROCEDURE sp_insertar_imagen_denuncia(
        IN p_url_imagen VARCHAR(255),
        IN p_id_denuncia INT
    )
    BEGIN
        INSERT INTO imagenes_denuncia (url_imagen, id_denuncia)
        VALUES (p_url_imagen, p_id_denuncia);
    END`,

    // 6. Obtener estadísticas de un usuario
    `CREATE PROCEDURE sp_obtener_estadisticas_usuario(IN p_id_usuario INT)
    BEGIN
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'recibido' THEN 1 ELSE 0 END) as pendientes,
            SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
            SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltas,
            SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazadas
        FROM denuncias
        WHERE id_usuario = p_id_usuario;
    END`,

    // 7. Obtener detalle completo de una denuncia
    `CREATE PROCEDURE sp_obtener_detalle_denuncia(IN p_id_denuncia INT)
    BEGIN
        SELECT 
            d.id, d.folio, d.titulo, d.descripcion, d.estado, d.fecha_creacion,
            d.latitud, d.longitud, d.fecha_actualizacion,
            c.nombre AS categoria, c.id AS id_categoria,
            u.nombre AS ciudadano_nombre, u.apellido AS ciudadano_apellido, u.id AS id_usuario,
            (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
        FROM denuncias d
        JOIN categorias c ON d.id_categoria = c.id
        JOIN usuarios u ON d.id_usuario = u.id
        WHERE d.id = p_id_denuncia;
    END`,

    // 8. Actualizar estado de una denuncia (devuelve filas afectadas)
    `CREATE PROCEDURE sp_actualizar_estado_denuncia(
        IN p_id_denuncia INT,
        IN p_estado VARCHAR(20)
    )
    BEGIN
        UPDATE denuncias 
        SET estado = p_estado, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = p_id_denuncia;
        SELECT ROW_COUNT() AS filas_afectadas;
    END`,

    // 9. Agregar comentario a una denuncia (devuelve el ID insertado)
    `CREATE PROCEDURE sp_agregar_comentario(
        IN p_texto TEXT,
        IN p_id_denuncia INT,
        IN p_id_usuario INT
    )
    BEGIN
        INSERT INTO comentarios_seguimiento (texto, id_denuncia, id_usuario)
        VALUES (p_texto, p_id_denuncia, p_id_usuario);
        SELECT LAST_INSERT_ID() AS id_comentario;
    END`,

    // 10. Obtener comentarios de una denuncia
    `CREATE PROCEDURE sp_obtener_comentarios(IN p_id_denuncia INT)
    BEGIN
        SELECT 
            cs.id, cs.texto, cs.fecha, cs.id_usuario,
            u.nombre, u.apellido, u.rol
        FROM comentarios_seguimiento cs
        JOIN usuarios u ON cs.id_usuario = u.id
        WHERE cs.id_denuncia = p_id_denuncia
        ORDER BY cs.fecha ASC;
    END`
];

const dropStatements = [
    'DROP PROCEDURE IF EXISTS sp_obtener_denuncias_usuario',
    'DROP PROCEDURE IF EXISTS sp_obtener_todas_denuncias',
    'DROP PROCEDURE IF EXISTS sp_obtener_categorias',
    'DROP PROCEDURE IF EXISTS sp_crear_denuncia',
    'DROP PROCEDURE IF EXISTS sp_insertar_imagen_denuncia',
    'DROP PROCEDURE IF EXISTS sp_obtener_estadisticas_usuario',
    'DROP PROCEDURE IF EXISTS sp_obtener_detalle_denuncia',
    'DROP PROCEDURE IF EXISTS sp_actualizar_estado_denuncia',
    'DROP PROCEDURE IF EXISTS sp_agregar_comentario',
    'DROP PROCEDURE IF EXISTS sp_obtener_comentarios'
];

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true
});

console.log('✅ Conectando a la base de datos...');

// Función para ejecutar queries secuencialmente
function executeSequentially(queries, index = 0) {
    if (index >= queries.length) {
        console.log('\n✅ ¡Todos los procedimientos creados exitosamente!');
        
        // Verificar procedimientos creados
        connection.query(
            "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_SCHEMA = ?",
            [process.env.DB_NAME],
            (err, rows) => {
                if (!err) {
                    console.log(`\n📋 Procedimientos en la base de datos (${rows.length}):`);
                    rows.forEach(row => console.log(`   - ${row.ROUTINE_NAME}`));
                }
                connection.end();
            }
        );
        return;
    }

    const query = queries[index];
    const name = query.match(/(?:DROP PROCEDURE IF EXISTS|CREATE PROCEDURE)\s+(\w+)/i)?.[1] || `Query ${index}`;
    
    connection.query(query, (err) => {
        if (err) {
            console.error(`   ❌ ${name}: ${err.message}`);
        } else {
            if (query.startsWith('CREATE')) {
                console.log(`   ✅ ${name}`);
            }
        }
        executeSequentially(queries, index + 1);
    });
}

// Primero eliminar, luego crear
console.log('🔄 Eliminando procedimientos existentes...');
const allQueries = [...dropStatements, ...procedures];

connection.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err.message);
        return;
    }
    console.log('✅ Conectado a la base de datos\n');
    console.log('🔄 Creando procedimientos almacenados...\n');
    executeSequentially(allQueries);
});
