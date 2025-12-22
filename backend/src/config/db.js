const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la base de datos con soporte para Railway
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    // Configuraciones adicionales para Railway
    connectTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear la conexión
const db = mysql.createConnection(dbConfig);

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('❌ Error de conexión a la base de datos:', err);
        console.error('Configuración intentada:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL.');
});

// Manejar desconexiones
db.on('error', (err) => {
    console.error('Error de base de datos:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconectando a la base de datos...');
    }
});

// Exportar la conexión
module.exports = db;