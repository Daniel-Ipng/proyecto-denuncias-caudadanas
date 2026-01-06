const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configurar Cloudinary con las credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Función para subir imagen a Cloudinary
const subirImagen = async (fileBuffer, folder = 'denuncias') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
                    { quality: 'auto' } // Optimizar calidad automáticamente
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(fileBuffer);
    });
};

// Función para eliminar imagen de Cloudinary
const eliminarImagen = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error al eliminar imagen de Cloudinary:', error);
        throw error;
    }
};

module.exports = {
    cloudinary,
    subirImagen,
    eliminarImagen
};
