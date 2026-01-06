// Controlador para consultas a la API de RENIEC
const fetch = require('node-fetch');

const RENIEC_API_URL = 'https://api.decolecta.com/v1/reniec/dni';
const RENIEC_TOKEN = process.env.RENIEC_API_TOKEN;

// Consultar datos de persona por DNI
exports.consultarDNI = async (req, res) => {
    const { dni } = req.params;

    // Validar formato de DNI (8 dígitos)
    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({ 
            success: false,
            message: 'El DNI debe tener exactamente 8 dígitos numéricos' 
        });
    }

    // Verificar que el token esté configurado
    if (!RENIEC_TOKEN) {
        return res.status(500).json({ 
            success: false,
            message: 'Token de RENIEC no configurado en el servidor' 
        });
    }

    try {
        const response = await fetch(`${RENIEC_API_URL}?numero=${dni}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RENIEC_TOKEN}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({ 
                    success: false,
                    message: 'DNI no encontrado en RENIEC' 
                });
            }
            if (response.status === 401) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token de RENIEC inválido o expirado' 
                });
            }
            throw new Error(`Error de API: ${response.status}`);
        }

        const data = await response.json();

        // Formatear respuesta
        res.json({
            success: true,
            data: {
                nombres: data.first_name || '',
                apellido_paterno: data.first_last_name || '',
                apellido_materno: data.second_last_name || '',
                nombre_completo: data.full_name || '',
                dni: data.document_number || dni,
                // Combinar apellidos para el campo 'apellido' del sistema
                apellidos: `${data.first_last_name || ''} ${data.second_last_name || ''}`.trim()
            }
        });

    } catch (error) {
        console.error('Error al consultar RENIEC:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al consultar el servicio de RENIEC',
            error: error.message 
        });
    }
};

// Validar si un DNI existe (sin devolver datos completos)
exports.validarDNI = async (req, res) => {
    const { dni } = req.params;

    if (!dni || !/^\d{8}$/.test(dni)) {
        return res.status(400).json({ 
            valid: false,
            message: 'Formato de DNI inválido' 
        });
    }

    if (!RENIEC_TOKEN) {
        // Si no hay token, no validamos contra RENIEC pero permitimos continuar
        return res.json({ 
            valid: true,
            verified: false,
            message: 'Validación de RENIEC no disponible' 
        });
    }

    try {
        const response = await fetch(`${RENIEC_API_URL}?numero=${dni}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RENIEC_TOKEN}`
            }
        });

        if (response.ok) {
            return res.json({ 
                valid: true,
                verified: true,
                message: 'DNI verificado en RENIEC' 
            });
        }

        return res.json({ 
            valid: false,
            verified: true,
            message: 'DNI no encontrado en RENIEC' 
        });

    } catch (error) {
        console.error('Error validando DNI:', error);
        return res.json({ 
            valid: true,
            verified: false,
            message: 'No se pudo verificar con RENIEC' 
        });
    }
};
