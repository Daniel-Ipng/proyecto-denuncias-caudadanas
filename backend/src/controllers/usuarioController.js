const { Usuario, Denuncia } = require('../models');

// Obtener todos los usuarios con estadísticas
exports.obtenerTodosUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAllWithStats();
        res.json(usuarios);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios.' });
    }
};

// Obtener detalles de un usuario específico
exports.obtenerDetalleUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findByIdWithStats(id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        res.json(usuario);
    } catch (err) {
        console.error('Error al obtener detalle de usuario:', err);
        res.status(500).json({ message: 'Error del servidor al obtener el detalle.' });
    }
};

// Actualizar rol de usuario
exports.actualizarRolUsuario = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    // Validar que el rol sea válido
    if (!['ciudadano', 'autoridad'].includes(rol)) {
        return res.status(400).json({ message: 'Rol inválido. Debe ser "ciudadano" o "autoridad".' });
    }

    // No permitir que el usuario se cambie su propio rol
    if (req.user.id === parseInt(id)) {
        return res.status(403).json({ message: 'No puedes cambiar tu propio rol.' });
    }

    try {
        const actualizado = await Usuario.updateRol(id, rol);

        if (!actualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ message: 'Rol actualizado exitosamente.', rol });
    } catch (err) {
        console.error('Error al actualizar rol:', err);
        res.status(500).json({ message: 'Error del servidor al actualizar el rol.' });
    }
};

// Obtener estadísticas generales de usuarios
exports.obtenerEstadisticasGenerales = async (req, res) => {
    try {
        const estadisticas = await Usuario.getEstadisticasGenerales();
        res.json(estadisticas);
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ message: 'Error del servidor al obtener estadísticas.' });
    }
};

// Obtener denuncias de un usuario específico
exports.obtenerDenunciasUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const denuncias = await Denuncia.findByUsuario(id);
        res.json(denuncias);
    } catch (err) {
        console.error('Error al obtener denuncias del usuario:', err);
        res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
    }
};

// Buscar usuarios
exports.buscarUsuarios = async (req, res) => {
    const { q, rol } = req.query;
    
    try {
        const usuarios = await Usuario.search(q, rol);
        res.json(usuarios);
    } catch (err) {
        console.error('Error al buscar usuarios:', err);
        res.status(500).json({ message: 'Error del servidor al buscar usuarios.' });
    }
};

module.exports = exports;
