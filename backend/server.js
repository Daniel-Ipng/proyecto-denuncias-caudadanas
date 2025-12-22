const express = require('express');
const cors = require('cors');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Importar rutas
const authRoutes = require('./src/routes/auth');
const denunciaRoutes = require('./src/routes/denuncias');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);

// Test
app.get('/', (req, res) => {
    res.send('✅ Backend del Sistema de Denuncias está funcionando.');
});

// Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
