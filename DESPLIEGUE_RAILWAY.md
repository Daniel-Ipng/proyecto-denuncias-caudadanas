# 🚀 Guía de Despliegue en Railway

## Archivos Configurados

✅ He preparado tu proyecto para Railway con los siguientes cambios:

### 1. `.gitignore`
Excluye node_modules, .env y archivos temporales del repositorio.

### 2. `backend/.env.example`
Plantilla de variables de entorno necesarias.

### 3. `backend/src/config/db.js`
Actualizado para soportar las variables de Railway (MYSQLHOST, MYSQLUSER, etc.)

### 4. `railway.json`
Configuración del despliegue para Railway.

### 5. `backend/package.json`
Agregado engines para especificar versión de Node.js.

---

## 📋 Pasos para Desplegar

### 1️⃣ Preparar el Repositorio Git

```bash
# Inicializar git si no lo has hecho
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Configuración para despliegue en Railway"

# Crear repositorio en GitHub y subir
git remote add origin tu-repositorio-github
git push -u origin main
```

### 2️⃣ Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway y selecciona tu repositorio

### 3️⃣ Agregar Base de Datos MySQL

1. En tu proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "Add MySQL"
3. Railway creará automáticamente las variables:
   - `MYSQLHOST`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `MYSQLPORT`

### 4️⃣ Configurar Variables de Entorno

En el servicio de tu aplicación (no en la base de datos):

1. Ve a la pestaña "Variables"
2. **IMPORTANTE:** Conecta las variables de MySQL haciendo clic en "+ Variable" → "Add Reference"
3. Agrega las siguientes referencias al servicio MySQL:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
```

4. Luego agrega estas variables adicionales:

```
NODE_ENV=production
JWT_SECRET=tu_secret_key_super_segura_aqui
```

**Nota:** Railway nombra el servicio MySQL como "MySQL" por defecto. Si le pusiste otro nombre, usa ese nombre en las referencias (ej: `${{MiBaseDatos.MYSQLHOST}}`).

### 5️⃣ Configurar la Base de Datos

Necesitas crear las tablas. Tienes dos opciones:

#### Opción A: Usar Railway CLI
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Conectar a MySQL
railway connect mysql

# Ejecutar tu script SQL
# (pega el contenido de base de datos.txt)
```

#### Opción B: Usar un cliente MySQL
Conecta con las credenciales que Railway te proporciona en las variables de entorno.

### 6️⃣ Desplegar

Railway desplegará automáticamente cuando hagas push a tu repositorio:

```bash
git add .
git commit -m "Actualización"
git push
```

---

## 🔍 Verificar el Despliegue / ECONNREFUSED / host: undefined
**Causa:** Las variables de entorno de MySQL no están conectadas.

**Solución:**
1. Ve a tu servicio de aplicación en Railway
2. Pestaña "Variables" → "+ Variable" → "Add Reference"
3. Selecciona el servicio MySQL
4. Agrega las referencias: `DB_HOST=${{MySQL.MYSQLHOST}}`, etc.
5. Espera a que redespliegue automáticamente
6. Verifica los logs - deberías ver: "✅ Conectado exitosamente a la base de datos MySQL."s://tu-app.railway.app/`
3. Deberías ver: "✅ Backend del Sistema de Denuncias está funcionando."

---

## ⚠️ Problemas Comunes

### Error: Cannot connect to database
- Verifica que el servicio MySQL esté corriendo
- Verifica que las variables de entorno estén configuradas
- Revisa los logs en Railway

### Error: Module not found
- Asegúrate de que `node_modules` esté en `.gitignore`
- Railway instalará las dependencias automáticamente

### Error: Port already in use
- No es necesario configurar PORT manualmente, Railway lo asigna automáticamente
- El código ya usa `process.env.PORT || 3001`

---

## 📱 Conectar el Frontend

Una vez desplegado el backend, actualiza la URL de la API en tu frontend:

```javascript
// frontend/js/api.js
const API_URL = 'https://tu-app.railway.app/api';
```

Luego puedes desplegar el frontend en:
- Vercel
- Netlify
- GitHub Pages
- O también en Railway

---

## 🔐 Seguridad

Antes de producción:
- [ ] Cambia `JWT_SECRET` por un valor aleatorio y seguro
- [ ] Configura CORS para permitir solo tu dominio frontend
- [ ] Revisa que `.env` esté en `.gitignore`
- [ ] No compartas las credenciales de la base de datos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway (pestaña "Deployments")
2. Verifica las variables de entorno
3. Asegúrate de que la base de datos tenga las tablas creadas
