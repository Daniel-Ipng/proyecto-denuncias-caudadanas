const express = require('express');
const cors = require('cors');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Importar rutas
const authRoutes = require('./src/routes/auth');
const denunciaRoutes = require('./src/routes/denuncias');
const usuarioRoutes = require('./src/routes/usuarios');
const reniecRoutes = require('./src/routes/reniec');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/reniec', reniecRoutes);

// Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
