const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la base de datos con soporte para Railway
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    // Configuraciones del pool para Railway y manejo de conexiones
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections
    idleTimeout: 60000, // idle connections timeout, in milliseconds
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Timeouts
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Verificar la conexión inicial
pool.getConnection((err, connection) => {
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
    connection.release(); // Liberar la conexión al pool
});

// Manejar errores del pool
pool.on('error', (err) => {
    console.error('Error de base de datos:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('⚠️  Conexión perdida - el pool manejará la reconexión automáticamente');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('⚠️  La base de datos tiene demasiadas conexiones');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('⚠️  Conexión rechazada a la base de datos');
    } else {
        console.error('⚠️  Error no manejado:', err.code);
    }
});

// Exportar el pool
module.exports = pool;