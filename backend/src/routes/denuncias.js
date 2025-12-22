const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Para proteger las rutas
const denunciaController = require('../controllers/denunciaController');

// Rutas públicas (sin autenticación)
router.get('/categorias', denunciaController.obtenerCategorias);
router.get('/todas', denunciaController.obtenerTodasDenuncias);

// Aplicamos el middleware a todas las rutas de este archivo
router.use(authMiddleware);

// Rutas protegidas (requieren autenticación)
router.get('/estadisticas', denunciaController.obtenerEstadisticasUsuario);
router.get('/mis-denuncias', denunciaController.obtenerDenunciasUsuario);
router.post('/crear', denunciaController.upload.single('imagen'), denunciaController.crearDenuncia);

// Nuevas rutas para gestionar denuncias (autoridad)
router.get('/:id', denunciaController.obtenerDetalleDenuncia);
router.put('/:id', denunciaController.actualizarDenuncia);
router.post('/:id/comentarios', denunciaController.agregarComentario);
router.get('/:id/comentarios', denunciaController.obtenerComentarios);

module.exports = router;