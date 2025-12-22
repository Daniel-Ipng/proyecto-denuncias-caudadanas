const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        req.user = decoded; // Mantener ambos para compatibilidad
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no es válido' });
    }
};