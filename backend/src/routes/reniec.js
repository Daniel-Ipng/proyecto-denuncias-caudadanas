const express = require('express');
const router = express.Router();
const reniecController = require('../controllers/reniecController');

// Consultar datos completos de una persona por DNI
// GET /api/reniec/consultar/:dni
router.get('/consultar/:dni', reniecController.consultarDNI);

// Solo validar si un DNI existe (sin datos personales)
// GET /api/reniec/validar/:dni
router.get('/validar/:dni', reniecController.validarDNI);

module.exports = router;
