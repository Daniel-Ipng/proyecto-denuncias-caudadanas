const mysql = require('mysql2');
require('dotenv').config();

// 1. Crear la conexión a la base de datos usando las variables del archivo .env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 2. Conectar a la base de datos y verificar si hay errores
db.connect(err => {
    if (err) {
        // Si hay un error, lo muestra en la consola y detiene la ejecución
        console.error('❌ Error de conexión a la base de datos:', err);
        return;
    }
    // Si la conexión es exitosa, muestra un mensaje de confirmación
    console.log('✅ Conectado exitosamente a la base de datos MySQL.');
});

// 3. Exportar la conexión para que otros archivos (como los controladores) puedan usarla
// ESTA LÍNEA ESENCIAL es la que soluciona el error "db.query is not a function"
module.exports = db;