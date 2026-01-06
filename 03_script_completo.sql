-- =================================================================
-- SCRIPT COMPLETO: BASE DE DATOS + PROCEDIMIENTOS ALMACENADOS
-- Archivo: 03_script_completo.sql
-- Sistema de Denuncias Ciudadanas
-- =================================================================

-- =================================================================
-- PARTE 1: CREACIÓN DE BASE DE DATOS Y TABLAS
-- =================================================================

-- 1. Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS denuncias_db;

-- 2. Usar la base de datos recién creada
USE denuncias_db;

-- 3. Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ciudadano', 'autoridad') NOT NULL DEFAULT 'ciudadano',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear la tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 5. Insertar categorías de ejemplo
INSERT IGNORE INTO categorias (nombre) VALUES 
('Baches'), 
('Alumbrado Público'), 
('Acumulación de Basura'), 
('Parques y Jardines'),
('Vandalismo'),
('Semáforos Dañados'),
('Fugas de Agua');

-- 6. Crear la tabla principal de denuncias
CREATE TABLE IF NOT EXISTS denuncias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    placa VARCHAR(20) DEFAULT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    estado ENUM('recibido', 'en_progreso', 'resuelto', 'rechazado') NOT NULL DEFAULT 'recibido',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
);

-- 7. Crear la tabla para las imágenes de las denuncias (URLs de Cloudinary)
CREATE TABLE IF NOT EXISTS imagenes_denuncia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_imagen VARCHAR(255) NOT NULL,
    id_denuncia INT NOT NULL,
    FOREIGN KEY (id_denuncia) REFERENCES denuncias(id) ON DELETE CASCADE
);

-- 8. Crear la tabla para comentarios/seguimiento
CREATE TABLE IF NOT EXISTS comentarios_seguimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_denuncia INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_denuncia) REFERENCES denuncias(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- =================================================================
-- PARTE 2: PROCEDIMIENTOS ALMACENADOS
-- =================================================================

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

-- 1. Obtener denuncias de un usuario específico
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

-- 2. Obtener todas las denuncias (para autoridades)
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

-- 3. Obtener todas las categorías
CREATE PROCEDURE sp_obtener_categorias()
BEGIN
    SELECT id, nombre FROM categorias ORDER BY nombre;
END //

-- 4. Crear nueva denuncia (devuelve el ID insertado)
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

-- 5. Insertar imagen de denuncia
CREATE PROCEDURE sp_insertar_imagen_denuncia(
    IN p_url_imagen VARCHAR(255),
    IN p_id_denuncia INT
)
BEGIN
    INSERT INTO imagenes_denuncia (url_imagen, id_denuncia)
    VALUES (p_url_imagen, p_id_denuncia);
END //

-- 6. Obtener estadísticas de un usuario
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

-- 7. Obtener detalle completo de una denuncia
CREATE PROCEDURE sp_obtener_detalle_denuncia(IN p_id_denuncia INT)
BEGIN
    SELECT 
        d.id, d.folio, d.titulo, d.descripcion, d.placa, d.estado, d.fecha_creacion,
        d.latitud, d.longitud, d.fecha_actualizacion,
        c.nombre AS categoria, c.id AS id_categoria,
        u.nombre AS ciudadano_nombre, u.apellido AS ciudadano_apellido, u.id AS id_usuario,
        (SELECT url_imagen FROM imagenes_denuncia WHERE id_denuncia = d.id LIMIT 1) AS imagen_url
    FROM denuncias d
    JOIN categorias c ON d.id_categoria = c.id
    JOIN usuarios u ON d.id_usuario = u.id
    WHERE d.id = p_id_denuncia;
END //

-- 8. Actualizar estado de una denuncia (devuelve filas afectadas)
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

-- 9. Agregar comentario a una denuncia (devuelve el ID insertado)
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

-- 10. Obtener comentarios de una denuncia
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
-- ¡SCRIPT COMPLETO EJECUTADO CORRECTAMENTE!
-- Base de datos: denuncias_db
-- Tablas: usuarios, categorias, denuncias, imagenes_denuncia, comentarios_seguimiento
-- Procedimientos: 10 stored procedures creados
-- =================================================================
