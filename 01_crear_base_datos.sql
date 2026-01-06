-- =================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS PARA SISTEMA DE DENUNCIAS
-- Archivo: 01_crear_base_datos.sql
-- =================================================================

-- 1. Eliminar la base de datos si existe (CUIDADO: borra todos los datos)
DROP DATABASE IF EXISTS denuncias_db;

-- 2. Crear la base de datos
CREATE DATABASE denuncias_db;

-- 3. Usar la base de datos recién creada
USE denuncias_db;

-- 3. Crear la tabla de usuarios
-- Contiene la información de los ciudadanos y autoridades.
-- Incluye nombre, apellido, dni, email y contraseña hasheada.
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
-- Define los tipos de problemas que se pueden reportar.
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 5. Insertar categorías de ejemplo para empezar
-- Esto nos permite tener datos listos para el formulario de denuncias.
INSERT IGNORE INTO categorias (nombre) VALUES 
('Baches'), 
('Alumbrado Público'), 
('Acumulación de Basura'), 
('Parques y Jardines'),
('Vandalismo'),
('Semáforos Dañados'),
('Fugas de Agua');

-- 6. Crear la tabla principal de denuncias
-- Aquí se guarda cada reporte hecho por los ciudadanos.
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

-- 7. Crear la tabla para las imágenes de las denuncias
-- Una denuncia puede tener múltiples fotos (URLs de Cloudinary).
CREATE TABLE IF NOT EXISTS imagenes_denuncia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_imagen VARCHAR(255) NOT NULL,
    id_denuncia INT NOT NULL,
    FOREIGN KEY (id_denuncia) REFERENCES denuncias(id) ON DELETE CASCADE
);

-- 8. Crear la tabla para comentarios/seguimiento
-- Permite a autoridades y ciudadanos comunicarse sobre una denuncia.
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
-- ¡SCRIPT EJECUTADO CORRECTAMENTE!
-- =================================================================
