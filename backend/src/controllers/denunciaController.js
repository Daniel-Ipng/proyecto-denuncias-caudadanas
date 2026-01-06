const multer = require('multer');
const { subirImagen, eliminarImagen } = require('../config/cloudinary');
const { Denuncia, Categoria, Comentario } = require('../models');

// Configurar almacenamiento en memoria para subir a Cloudinary
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Máximo 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// =================================================================
// FUNCIONES QUE USAN MODELOS
// =================================================================

// Obtener todas las denuncias del usuario logueado
exports.obtenerDenunciasUsuario = async (req, res) => {
    try {
        const denuncias = await Denuncia.findByUsuario(req.user.id);
        res.json(denuncias);
    } catch (err) {
        console.error('Error al obtener denuncias del usuario:', err);
        res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
    }
};

// Obtener todas las denuncias (para autoridades)
exports.obtenerTodasDenuncias = async (req, res) => {
    try {
        const denuncias = await Denuncia.findAll();
        res.json(denuncias);
    } catch (err) {
        console.error('Error al obtener todas las denuncias:', err);
        res.status(500).json({ message: 'Error del servidor al obtener las denuncias.' });
    }
};

// Obtener categorías
exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll();
        res.json(categorias);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ message: 'Error del servidor al obtener las categorías.' });
    }
};

// Crear nueva denuncia
exports.crearDenuncia = async (req, res) => {
    const userId = req.user.id;
    const { folio, titulo, descripcion, placa, id_categoria, latitud, longitud } = req.body;

    // Validaciones básicas (placa es opcional)
    if (!folio || !titulo || !descripcion || !id_categoria || !latitud || !longitud) {
        return res.status(400).json({ 
            message: 'Todos los campos son requeridos: folio, titulo, descripcion, id_categoria, latitud, longitud' 
        });
    }
    
    // La placa es opcional, si viene vacía la convertimos a null
    const placaValue = placa && placa.trim() !== '' ? placa.trim().toUpperCase() : null;

    // Subir imagen a Cloudinary si existe
    let imagenUrl = null;
    let cloudinaryPublicId = null;
    
    if (req.file) {
        try {
            const resultado = await subirImagen(req.file.buffer, 'denuncias');
            imagenUrl = resultado.secure_url;
            cloudinaryPublicId = resultado.public_id;
        } catch (error) {
            console.error('Error al subir imagen a Cloudinary:', error);
            return res.status(500).json({ message: 'Error al subir la imagen' });
        }
    }

    try {
        // Crear denuncia usando el modelo
        const denunciaId = await Denuncia.create({
            folio, titulo, descripcion, 
            placa: placaValue, 
            id_categoria, latitud, longitud, 
            id_usuario: userId
        });

        // Si hay imagen, agregarla a la denuncia
        if (imagenUrl) {
            await Denuncia.agregarImagen(denunciaId, imagenUrl);
        }

        res.status(201).json({
            message: 'Denuncia creada exitosamente',
            folio: folio,
            denunciaId: denunciaId,
            imagenUrl: imagenUrl
        });
    } catch (err) {
        console.error('Error al crear denuncia:', err);
        
        // Si hay error y se subió imagen a Cloudinary, eliminarla
        if (cloudinaryPublicId) {
            try {
                await eliminarImagen(cloudinaryPublicId);
            } catch (deleteErr) {
                console.error('Error al eliminar imagen de Cloudinary:', deleteErr);
            }
        }
        
        res.status(500).json({ message: 'Error del servidor al crear la denuncia.' });
    }
};

// Obtener estadísticas del usuario logueado
exports.obtenerEstadisticasUsuario = async (req, res) => {
    try {
        const estadisticas = await Denuncia.getEstadisticasUsuario(req.user.id);
        res.json(estadisticas);
    } catch (err) {
        console.error('Error al obtener estadísticas del usuario:', err);
        res.status(500).json({ message: 'Error del servidor al obtener las estadísticas.' });
    }
};

// Exportar multer para usar en rutas
exports.upload = upload;

// Obtener detalle completo de una denuncia
exports.obtenerDetalleDenuncia = async (req, res) => {
    const { id } = req.params;
    
    try {
        const denuncia = await Denuncia.findById(id);
        
        if (!denuncia) {
            return res.status(404).json({ message: 'Denuncia no encontrada' });
        }
        
        res.json(denuncia);
    } catch (err) {
        console.error('Error al obtener detalle de denuncia:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Actualizar estado de una denuncia
exports.actualizarDenuncia = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
        return res.status(400).json({ message: 'El estado es requerido' });
    }
    
    const estadosValidos = ['recibido', 'en_progreso', 'resuelto', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
    }
    
    try {
        const actualizado = await Denuncia.updateEstado(id, estado);
        
        if (!actualizado) {
            return res.status(404).json({ message: 'Denuncia no encontrada' });
        }
        
        res.json({ message: 'Denuncia actualizada correctamente' });
    } catch (err) {
        console.error('Error al actualizar denuncia:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Agregar comentario a una denuncia
exports.agregarComentario = async (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    if (!texto || texto.trim() === '') {
        return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }
    
    try {
        const idComentario = await Comentario.create({
            texto,
            id_denuncia: id,
            id_usuario: userId
        });
        
        res.status(201).json({
            id: idComentario,
            texto: texto,
            fecha: new Date(),
            es_autoridad: userRole === 'autoridad'
        });
    } catch (err) {
        console.error('Error al agregar comentario:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Obtener comentarios de una denuncia
exports.obtenerComentarios = async (req, res) => {
    const { id } = req.params;
    
    try {
        const comentarios = await Comentario.findByDenuncia(id);
        res.json(comentarios);
    } catch (err) {
        console.error('Error al obtener comentarios:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Buscar denuncias por placa
exports.buscarPorPlaca = async (req, res) => {
    const { placa } = req.query;
    
    if (!placa || placa.trim() === '') {
        return res.status(400).json({ message: 'Debe proporcionar una placa para buscar' });
    }
    
    try {
        const denuncias = await Denuncia.findByPlaca(placa.trim());
        res.json(denuncias);
    } catch (err) {
        console.error('Error al buscar por placa:', err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};