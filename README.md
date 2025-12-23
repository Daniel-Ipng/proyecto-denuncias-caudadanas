# Sistema de Denuncias Ciudadanas

Sistema web completo para la gestión de denuncias ciudadanas con roles de ciudadano y autoridad.

## 📁 Estructura del Proyecto

```
proyecto-denuncias-ciudadanas/
├── backend/                    # Servidor Node.js + Express
│   ├── src/                   # Código fuente del backend
│   │   ├── config/           # Configuración de BD
│   │   ├── controllers/      # Lógica de negocio
│   │   ├── middleware/       # Middleware de autenticación
│   │   └── routes/           # Rutas de la API
│   ├── public/               # Frontend (archivos estáticos)
│   │   ├── index.html       # Página principal
│   │   ├── login.html       # Login
│   │   ├── autoridad/       # Panel de autoridades
│   │   ├── ciudadano/       # Panel de ciudadanos
│   │   ├── css/             # Estilos
│   │   ├── js/              # JavaScript del frontend
│   │   └── uploads/         # Imágenes subidas (no en Git)
│   ├── server.js            # Punto de entrada del servidor
│   └── package.json         # Dependencias del backend
├── package.json              # Scripts principales
├── railway.json              # Configuración para Railway
├── .gitignore               # Archivos ignorados por Git
└── README.md                # Este archivo
```

## 🚀 Instalación

### Requisitos Previos
- Node.js 18 o superior
- MySQL 8.0 o superior

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd proyecto-denuncias-ciudadanas
```

2. **Instalar dependencias**
```bash
npm run install-all
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la carpeta `backend/`:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=denuncias_db
JWT_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=development
```

4. **Crear la base de datos**
Ejecutar el script SQL que se encuentra en `base de datos.txt`

5. **Iniciar el servidor**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

⚠️ **IMPORTANTE**: Debes acceder a la aplicación a través de `http://localhost:3001`, NO uses Live Server ni abras los archivos HTML directamente. El servidor Express debe estar corriendo para que funcione correctamente.

## 🌐 Despliegue en Producción

### Railway / Render / Heroku

1. El proyecto ya está configurado con `railway.json`
2. Asegúrate de configurar las variables de entorno en el panel de Railway
3. El servidor automáticamente servirá el frontend y el backend

### Variables de Entorno Requeridas en Producción
```
PORT (automático en Railway)
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
NODE_ENV=production
```

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run install-all` - Instala todas las dependencias

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT
- ✅ Middleware de protección de rutas
- ✅ CORS configurado
- ✅ Variables de entorno para datos sensibles
- ✅ Archivos sensibles en .gitignore

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- Bcrypt
- Multer (upload de archivos)

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Leaflet (mapas)

## 📦 Estructura de la Base de Datos

- **usuarios** - Información de ciudadanos y autoridades
- **categorias** - Tipos de denuncias
- **denuncias** - Denuncias registradas
- **comentarios** - Comentarios en las denuncias
- **historial_estados** - Seguimiento de cambios de estado

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC

## ✨ Características

- ✅ Registro e inicio de sesión
- ✅ Roles de usuario (ciudadano/autoridad)
- ✅ Crear denuncias con imágenes
- ✅ Geolocalización en mapa
- ✅ Panel de administración para autoridades
- ✅ Seguimiento de estado de denuncias
- ✅ Sistema de comentarios
- ✅ Reportes y estadísticas
