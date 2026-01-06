-- =================================================================
-- PROCEDIMIENTOS ALMACENADOS PARA SISTEMA DE DENUNCIAS
-- Archivo: 02_procedimientos_almacenados.sql
-- =================================================================

USE denuncias_db;

-- Eliminar procedimientos existentes
DROP PROCEDURE IF EXISTS sp_obtener_denuncias_usuario;
DROP PROCEDURE IF EXISTS sp_obtener_todas_denuncias;
DROP PROCEDURE IF EXISTS sp_obtener_categorias;
DROP PROCEDURE IF EXISTS sp_crear_denuncia;
DROP PROCEDURE IF EXISTS sp_insertar_imagen_denuncia;
DROP PROCEDURE IF EXISTS sp_obtener_estadisticas_usuario;
DROP PROCEDURE IF EXISTS sp_obtener_detalle_denuncia;
DROP PROCEDURE IF EXISTS sp_actualizar_estado_denuncia;
DROP PROCEDURE IF EXISTS sp_agregar_comentario;
DROP PROCEDURE IF EXISTS sp_obtener_comentarios;

DELIMITER //

-- =================================================================
-- 1. Obtener denuncias de un usuario específico
-- =================================================================
CREATE PROCEDURE sp_obtener_denuncias_usuario(IN p_id_usuario INT)
BEGIN
    SELECT 
        d.id, d.folio, d.titulo, d.descripcion, d.placa, d.estado, d.fecha_creacion,
        d.latitud, d.longitud, d.fecha_actualizacion,
        c.nombre AS categoria,
        (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
    FROM denuncias d
    JOIN categorias c ON d.id_categoria = c.id
    WHERE d.id_usuario = p_id_usuario
    ORDER BY d.fecha_creacion DESC;
END //

-- =================================================================
-- 2. Obtener todas las denuncias (para autoridades)
-- =================================================================
CREATE PROCEDURE sp_obtener_todas_denuncias()
BEGIN
    SELECT 
        d.id, d.folio, d.titulo, d.descripcion, d.placa, d.estado, d.fecha_creacion,
        d.latitud, d.longitud, d.fecha_actualizacion,
        c.nombre AS categoria, c.id AS id_categoria,
        u.nombre AS ciudadano_nombre, u.apellido AS ciudadano_apellido,
        (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS foto_url
    FROM denuncias d
    JOIN categorias c ON d.id_categoria = c.id
    JOIN usuarios u ON d.id_usuario = u.id
    ORDER BY d.fecha_creacion DESC;
END //

-- =================================================================
-- 3. Obtener todas las categorías
-- =================================================================
CREATE PROCEDURE sp_obtener_categorias()
BEGIN
    SELECT id, nombre FROM categorias ORDER BY nombre;
END //

-- =================================================================
-- 4. Crear nueva denuncia (devuelve el ID insertado)
-- =================================================================
CREATE PROCEDURE sp_crear_denuncia(
    IN p_folio VARCHAR(20),
    IN p_titulo VARCHAR(150),
    IN p_descripcion TEXT,
    IN p_placa VARCHAR(20),
    IN p_id_categoria INT,
    IN p_latitud DECIMAL(10, 8),
    IN p_longitud DECIMAL(11, 8),
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO denuncias (folio, titulo, descripcion, placa, id_categoria, latitud, longitud, id_usuario, estado)
    VALUES (p_folio, p_titulo, p_descripcion, p_placa, p_id_categoria, p_latitud, p_longitud, p_id_usuario, 'recibido');
    SELECT LAST_INSERT_ID() AS id_denuncia;
END //

-- =================================================================
-- 5. Insertar imagen de denuncia
-- =================================================================
CREATE PROCEDURE sp_insertar_imagen_denuncia(
    IN p_url_imagen VARCHAR(255),
    IN p_id_denuncia INT
)
BEGIN
    INSERT INTO imagenes_denuncia (url_imagen, id_denuncia)
    VALUES (p_url_imagen, p_id_denuncia);
END //

-- =================================================================
-- 6. Obtener estadísticas de un usuario
-- =================================================================
CREATE PROCEDURE sp_obtener_estadisticas_usuario(IN p_id_usuario INT)
BEGIN
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'recibido' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltas,
        SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazadas
    FROM denuncias
    WHERE id_usuario = p_id_usuario;
END //

-- =================================================================
-- 7. Obtener detalle completo de una denuncia (incluye datos del ciudadano)
-- =================================================================
CREATE PROCEDURE sp_obtener_detalle_denuncia(IN p_id_denuncia INT)
BEGIN
    SELECT 
        d.id, d.folio, d.titulo, d.descripcion, d.placa, d.estado, d.fecha_creacion,
        d.latitud, d.longitud, d.fecha_actualizacion,
        c.nombre AS categoria, c.id AS id_categoria,
        u.id AS id_usuario,
        u.nombre AS ciudadano_nombre, 
        u.apellido AS ciudadano_apellido,
        u.email AS ciudadano_email,
        u.dni AS ciudadano_dni,
        u.fecha_creacion AS ciudadano_fecha_registro,
        (SELECT COUNT(*) FROM denuncias WHERE id_usuario = u.id) AS ciudadano_total_denuncias,
        (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
    FROM denuncias d
    JOIN categorias c ON d.id_categoria = c.id
    JOIN usuarios u ON d.id_usuario = u.id
    WHERE d.id = p_id_denuncia;
END //

-- =================================================================
-- 8. Actualizar estado de una denuncia (devuelve filas afectadas)
-- =================================================================
CREATE PROCEDURE sp_actualizar_estado_denuncia(
    IN p_id_denuncia INT,
    IN p_estado VARCHAR(20)
)
BEGIN
    UPDATE denuncias 
    SET estado = p_estado, fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = p_id_denuncia;
    SELECT ROW_COUNT() AS filas_afectadas;
END //

-- =================================================================
-- 9. Agregar comentario a una denuncia (devuelve el ID insertado)
-- =================================================================
CREATE PROCEDURE sp_agregar_comentario(
    IN p_texto TEXT,
    IN p_id_denuncia INT,
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO comentarios_seguimiento (texto, id_denuncia, id_usuario)
    VALUES (p_texto, p_id_denuncia, p_id_usuario);
    SELECT LAST_INSERT_ID() AS id_comentario;
END //

-- =================================================================
-- 10. Obtener comentarios de una denuncia
-- =================================================================
CREATE PROCEDURE sp_obtener_comentarios(IN p_id_denuncia INT)
BEGIN
    SELECT 
        cs.id, cs.texto, cs.fecha, cs.id_usuario,
        u.nombre, u.apellido, u.rol
    FROM comentarios_seguimiento cs
    JOIN usuarios u ON cs.id_usuario = u.id
    WHERE cs.id_denuncia = p_id_denuncia
    ORDER BY cs.fecha ASC;
END //

DELIMITER ;

-- =================================================================
-- ¡PROCEDIMIENTOS CREADOS CORRECTAMENTE!
-- =================================================================
