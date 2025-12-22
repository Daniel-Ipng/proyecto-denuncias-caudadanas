const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// --- Registro de Usuario ---
exports.registrarUsuario = async (req, res) => {
    const { nombre, apellido, dni, email, password, rol } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !rol) {
        return res.status(400).json({ message: 'Todos los campos, incluyendo el rol, son obligatorios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.query(query, [nombre, apellido, dni, email, password_hash, rol], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El email o DNI ya existen' });
                return res.status(500).json({ message: 'Error del servidor' });
            }
            res.status(201).json({ message: 'Usuario creado' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al procesar la contraseña' });
    }
};

// --- Iniciar Sesión ---
exports.iniciarSesion = (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Error del servidor' });
        if (results.length === 0) return res.status(401).json({ message: 'Credenciales inválidas' });
        const usuario = results[0];
        const esValida = await bcrypt.compare(password, usuario.password_hash);
        if (!esValida) return res.status(401).json({ message: 'Credenciales inválidas' });
        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login OK', token, rol: usuario.rol, usuario: { id: usuario.id, nombre: usuario.nombre } });
    });
};

// --- Obtener Datos del Usuario (Perfil) ---
exports.obtenerPerfil = (req, res) => {
    const usuarioId = req.usuario.id;
    const query = 'SELECT id, nombre, apellido, email, dni, rol, fecha_creacion FROM usuarios WHERE id = ?';
    
    db.query(query, [usuarioId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error del servidor' });
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        res.json(results[0]);
    });
};

// --- Actualizar Perfil de Usuario ---
exports.actualizarPerfil = (req, res) => {
    const usuarioId = req.usuario.id;
    const { nombre, apellido, email } = req.body;

    if (!nombre || !apellido || !email) {
        return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' });
    }

    const query = 'UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?';
    
    db.query(query, [nombre, apellido, email, usuarioId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El email ya está en uso' });
            }
            return res.status(500).json({ message: 'Error del servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Perfil actualizado correctamente' });
    });
};

// --- Cambiar Contraseña ---
exports.cambiarContrasena = (req, res) => {
    const usuarioId = req.usuario.id;
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
    }

    if (passwordNueva.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener la contraseña actual del usuario
    const query = 'SELECT password_hash FROM usuarios WHERE id = ?';
    
    db.query(query, [usuarioId], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Error del servidor' });
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        const usuario = results[0];
        
        // Verificar que la contraseña actual sea correcta
        const esValida = await bcrypt.compare(passwordActual, usuario.password_hash);
        if (!esValida) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        try {
            // Hashear la nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(passwordNueva, salt);

            // Actualizar la contraseña en la BD
            const updateQuery = 'UPDATE usuarios SET password_hash = ? WHERE id = ?';
            db.query(updateQuery, [password_hash, usuarioId], (err, result) => {
                if (err) return res.status(500).json({ message: 'Error del servidor' });
                res.json({ message: 'Contraseña actualizada correctamente' });
            });
        } catch (error) {
            res.status(500).json({ message: 'Error al procesar la contraseña' });
        }
    });
};