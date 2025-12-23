# 🚂 Guía de Despliegue en Railway

## 📋 Pasos para Desplegar

### 1️⃣ Conectar Repositorio de GitHub
- ✅ Ya conectado: `Daniel-Ipng/proyecto-denuncias-caudadanas`
- Branch: `main`

### 2️⃣ Agregar Base de Datos MySQL
1. En tu proyecto Railway, clic en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente las variables de conexión

### 3️⃣ Configurar Variables de Entorno
Ve a la pestaña **"Variables"** y agrega:

```env
# Railway proporciona estas automáticamente al agregar MySQL:
# MYSQLHOST
# MYSQLUSER
# MYSQLPASSWORD
# MYSQLDATABASE=railway
# MYSQLPORT=3306

# Necesitas agregar MANUALMENTE estas variables:
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=railway
PORT=3001
NODE_ENV=production
JWT_SECRET=tu_clave_secreta_muy_segura_cambiala_por_algo_aleatorio_de_64_caracteres
```

💡 **Tip**: Para JWT_SECRET genera algo aleatorio como:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4️⃣ Importar Base de Datos
Tienes dos opciones:

#### Opción A: Usando Railway CLI
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Conectar a MySQL
railway connect mysql

# Copiar y pegar el contenido de "base de datos.txt"
```

#### Opción B: Desde phpMyAdmin o MySQL Workbench
1. Obtén las credenciales de conexión de Railway (pestaña Variables)
2. Conecta usando un cliente MySQL
3. Importa el archivo `base de datos.txt`

### 5️⃣ Generar Dominio Público
1. Ve a **Settings** → **Networking**
2. Clic en **"Generate Domain"**
3. Obtendrás una URL como: `https://proyecto-denuncias-caudadanas-production.up.railway.app`

### 6️⃣ Configuración de Build y Deploy

#### ✅ Build Command (Automático desde railway.json)
```bash
cd backend && npm install
```

#### ✅ Start Command (Automático desde railway.json)
```bash
cd backend && npm start
```

Railway detecta automáticamente el `railway.json`, **no necesitas configurar esto manualmente**.

### 7️⃣ Verificar Configuración

Revisa que tengas configurado:

**Builder:**
- ✅ Railpack (default)

**Restart Policy:**
- ✅ On Failure
- ✅ Max restart retries: 10

**Region:**
- ✅ US West (California) o la región que prefieras

### 8️⃣ Deploy
1. Haz push a tu repositorio de GitHub
2. Railway detectará los cambios automáticamente
3. Verás el proceso de build en la pestaña **"Deployments"**
4. Espera a que termine el deploy (unos 2-3 minutos)

## 🔍 Verificar que Funciona

Una vez desplegado:

1. **Verifica que el servidor esté corriendo:**
   ```
   https://tu-dominio.railway.app/
   ```
   Deberías ver tu página de registro

2. **Verifica el API:**
   ```
   https://tu-dominio.railway.app/api/auth/login
   ```
   Deberías ver un error de credenciales (es normal)

3. **Prueba el login:**
   - Ve a `https://tu-dominio.railway.app/login.html`
   - Intenta iniciar sesión con un usuario que hayas creado

## ⚠️ Problemas Comunes

### Error: "Cannot connect to database"
- Verifica que hayas agregado el servicio MySQL
- Verifica las variables de entorno (DB_HOST, DB_USER, DB_PASSWORD)

### Error: "Port already in use"
- No configures el PORT en Railway, déjalo automático
- Railway asigna el puerto automáticamente

### Error 404 en todas las páginas
- Verifica que el startCommand sea: `cd backend && npm start`
- Verifica que el código esté en el branch `main`

### El login no funciona
- Verifica que hayas importado la base de datos
- Verifica que JWT_SECRET esté configurado
- Verifica que tengas usuarios en la tabla `usuarios`

## 📊 Logs y Debugging

Para ver los logs en tiempo real:

```bash
railway logs
```

O desde el panel de Railway: **Deployments** → Clic en el deployment activo → Ver logs

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
```
https://tu-dominio.railway.app
```

## 💰 Costos

Railway ofrece:
- **Plan Free**: $5 de crédito gratis al mes
- **Plan Pro**: $20/mes con más recursos

Este proyecto en producción puede consumir aproximadamente $3-5 al mes en el plan gratuito.

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a tu rama `main`, Railway desplegará automáticamente los cambios.

```bash
git add .
git commit -m "Actualización"
git push origin main
```

Railway detectará el push y desplegará en ~2-3 minutos.
