const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_denuncias'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const sql = "ALTER TABLE denuncias ADD COLUMN calificacion INT DEFAULT NULL AFTER estado";

    connection.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column calificacion already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column calificacion added successfully.');
        }
        connection.end();
    });
});
