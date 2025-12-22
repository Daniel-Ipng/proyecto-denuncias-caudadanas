const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./src/routes/auth');
const denunciaRoutes = require('./src/routes/denuncias');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares esenciales
app.use(cors());
app.use(express.json()); // Para leer JSON
app.use(express.urlencoded({ extended: true })); // Para leer formularios

// Servir archivos estáticos (para las imágenes que se suban)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('✅ Backend del Sistema de Denuncias está funcionando.');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});