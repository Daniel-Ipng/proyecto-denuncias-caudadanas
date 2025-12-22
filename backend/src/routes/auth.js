const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', authController.registrarUsuario);
router.post('/login', authController.iniciarSesion);

// Rutas protegidas
router.get('/me', authMiddleware, authController.obtenerPerfil);
router.put('/update-profile', authMiddleware, authController.actualizarPerfil);
router.post('/change-password', authMiddleware, authController.cambiarContrasena);

module.exports = router;