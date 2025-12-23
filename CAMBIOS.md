# Reestructuración del Proyecto - Resumen de Cambios

## 📅 Fecha: 22 de Diciembre de 2025

## 🎯 Objetivo
Reorganizar el proyecto para que sea deployable en servidores de producción (Railway, Render, Heroku, etc.) siguiendo las mejores prácticas.

## ✅ Cambios Realizados

### 1. **Estructura de Archivos**
- ✅ **Movido frontend dentro de backend**: Todos los archivos de `frontend/` ahora están en `backend/public/`
- ✅ **Eliminada carpeta frontend**: Ya no existe la carpeta separada `frontend/`
- ✅ **Frontend servido como archivos estáticos**: El servidor Express ahora sirve automáticamente el frontend

### 2. **Servidor (backend/server.js)**
```javascript
// ANTES: Solo servía la API
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);
app.get('/', (req, res) => {
    res.send('✅ Backend funcionando');
});

// AHORA: Sirve la API Y el frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);
app.use('/api/denuncias', denunciaRoutes);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

### 3. **Configuración de Railway (railway.json)**
```json
// ANTES: Copiaba frontend manualmente
"buildCommand": "npm run install && cp -r frontend backend/"

// AHORA: Solo instala dependencias (frontend ya está dentro)
"buildCommand": "cd backend && npm install"
```

### 4. **Scripts de npm (package.json raíz)**
```json
// ANTES
"start": "cd backend && npm start"
"install": "cd backend && npm install"

// AHORA
"start": "cd backend && npm start"
"dev": "cd backend && npm run dev"
"install-all": "cd backend && npm install"
```

### 5. **API URL Dinámica (backend/public/js/api.js)**
```javascript
// ANTES: Hardcodeado
const API_URL = 'http://localhost:3001/api';

// AHORA: Se adapta al entorno
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : `${window.location.origin}/api`;
```

### 6. **.gitignore Mejorado**
- ✅ Agregado `base de datos.txt` para no subir scripts SQL
- ✅ Agregado `*.sql` para ignorar todos los archivos SQL
- ✅ Mejorada documentación de qué se ignora y por qué

### 7. **Nuevos Archivos**
- ✅ **README.md**: Documentación completa del proyecto
- ✅ **backend/public/uploads/.gitkeep**: Mantiene la carpeta uploads en Git sin las imágenes

## 📂 Estructura Final

```
proyecto-denuncias-ciudadanas/
├── backend/                          # TODO el código del proyecto
│   ├── src/                          # Backend (API)
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── public/                       # Frontend (estático)
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── autoridad/
│   │   ├── ciudadano/
│   │   ├── css/
│   │   ├── js/
│   │   └── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── package.json                      # Scripts raíz
├── railway.json                      # Config deploy
├── .gitignore
├── README.md
├── CAMBIOS.md (este archivo)
├── DESPLIEGUE_RAILWAY.md
└── GUIA_DENUNCIAS_MEJORADA.md
```

## 🚀 Ventajas de la Nueva Estructura

1. **✅ Un solo comando para iniciar**: `npm start` inicia todo (API + Frontend)
2. **✅ Deployment simplificado**: Un solo puerto, una sola URL
3. **✅ CORS simplificado**: Al estar en el mismo origen, no hay problemas de CORS
4. **✅ Production-ready**: Estructura estándar usada en la industria
5. **✅ Mejor rendimiento**: Express sirve archivos estáticos optimizados
6. **✅ SPA Support**: Redirige rutas no encontradas a index.html
7. **✅ Seguridad mejorada**: .gitignore más completo

## 🔄 Cómo Usar la Nueva Estructura

### Desarrollo Local
```bash
# 1. Instalar dependencias
npm run install-all

# 2. Configurar .env en backend/
cp backend/.env.example backend/.env
# Editar backend/.env con tus datos

# 3. Iniciar servidor
npm start

# 4. Abrir navegador
# http://localhost:3001
```

### Deployment en Railway
```bash
# 1. Push a GitHub
git add .
git commit -m "Estructura optimizada para producción"
git push

# 2. En Railway
# - Conectar repositorio
# - Configurar variables de entorno
# - Deploy automático ✅
```

## ⚠️ Importante

1. **No subir al repositorio**:
   - `.env` (credenciales)
   - `base de datos.txt` (script SQL puede tener datos sensibles)
   - `backend/public/uploads/*` (imágenes de usuarios)
   - `node_modules/` (dependencias)

2. **Configurar en producción**:
   - Variables de entorno (DB, JWT_SECRET)
   - Base de datos MySQL
   - Puerto automático (Railway lo asigna)

## 📝 Notas Adicionales

- La carpeta `uploads/` mantiene su estructura pero no sube imágenes a Git
- Las rutas relativas del frontend (`../login.html`, etc.) siguen funcionando correctamente
- El archivo `base de datos.txt` puede mantenerse localmente pero no se subirá a Git
- Los archivos `.md` de documentación se mantienen en la raíz para fácil acceso

## ✨ Resultado

**El proyecto ahora está listo para ser desplegado en cualquier servidor de producción siguiendo las mejores prácticas de la industria.**
