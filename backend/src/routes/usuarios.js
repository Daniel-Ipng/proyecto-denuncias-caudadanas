const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const usuarioController = require('../controllers/usuarioController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los usuarios con estadísticas
router.get('/', usuarioController.obtenerTodosUsuarios);

// Obtener estadísticas generales
router.get('/estadisticas', usuarioController.obtenerEstadisticasGenerales);

// Buscar usuarios
router.get('/buscar', usuarioController.buscarUsuarios);

// Obtener detalle de un usuario específico
router.get('/:id', usuarioController.obtenerDetalleUsuario);

// Obtener denuncias de un usuario específico
router.get('/:id/denuncias', usuarioController.obtenerDenunciasUsuario);

// Actualizar rol de usuario (solo autoridades)
router.put('/:id/rol', usuarioController.actualizarRolUsuario);

module.exports = router;
