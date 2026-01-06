const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// --- Registro de Usuario ---
exports.registrarUsuario = async (req, res) => {
    const { nombre, apellido, dni, email, password, rol } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !rol) {
        return res.status(400).json({ message: 'Todos los campos, incluyendo el rol, son obligatorios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await Usuario.create({ nombre, apellido, dni, email, password_hash, rol });
        res.status(201).json({ message: 'Usuario creado' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email o DNI ya existen' });
        }
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// --- Iniciar Sesión ---
exports.iniciarSesion = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    
    try {
        const usuario = await Usuario.findByEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const esValida = await bcrypt.compare(password, usuario.password_hash);
        
        if (!esValida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({ 
            message: 'Login OK', 
            token, 
            rol: usuario.rol, 
            usuario: { 
                id: usuario.id, 
                nombre: usuario.nombre 
            } 
        });
    } catch (err) {
        console.error('Error de base de datos:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// --- Obtener Datos del Usuario (Perfil) ---
exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(usuario);
    } catch (err) {
        console.error('Error al obtener perfil:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// --- Actualizar Perfil de Usuario ---
exports.actualizarPerfil = async (req, res) => {
    const { nombre, apellido, email } = req.body;

    if (!nombre || !apellido || !email) {
        return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' });
    }

    try {
        const actualizado = await Usuario.update(req.usuario.id, { nombre, apellido, email });

        if (!actualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Perfil actualizado correctamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está en uso' });
        }
        console.error('Error al actualizar perfil:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// --- Cambiar Contraseña ---
exports.cambiarContrasena = async (req, res) => {
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
    }

    if (passwordNueva.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // Obtener usuario con contraseña
        const usuarioBase = await Usuario.findById(req.usuario.id);
        if (!usuarioBase) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        const usuario = await Usuario.findByEmail(usuarioBase.email);

        // Verificar contraseña actual
        const esValida = await bcrypt.compare(passwordActual, usuario.password_hash);
        if (!esValida) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        // Hashear nueva contraseña y actualizar
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(passwordNueva, salt);
        
        await Usuario.updatePassword(req.usuario.id, password_hash);
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error('Error al cambiar contraseña:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};