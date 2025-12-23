# 🚀 Cómo Ejecutar el Proyecto Correctamente

## ⚠️ IMPORTANTE - NO USES LIVE SERVER

Este proyecto **NO funciona** con Live Server porque necesita un servidor backend activo.

## ✅ Forma Correcta de Ejecutar

### 1. Abre una terminal en VS Code (Ctrl + `)

### 2. Ejecuta:
```bash
npm start
```

### 3. Espera a ver estos mensajes:
```
🚀 Servidor backend corriendo en puerto 3001
✅ Conectado exitosamente a la base de datos MySQL.
```

### 4. Abre tu navegador en:
```
http://localhost:3001
```

### 5. URLs disponibles:
- `http://localhost:3001/` - Registro
- `http://localhost:3001/login.html` - Login
- `http://localhost:3001/ciudadano/dashboard.html` - Dashboard ciudadano
- `http://localhost:3001/autoridad/dashboard.html` - Dashboard autoridad

## ❌ NO HAGAS ESTO:

- ❌ No uses el botón "Go Live" de Live Server
- ❌ No abras los archivos HTML directamente desde el explorador
- ❌ No uses `http://127.0.0.1:5500`
- ❌ No uses extensiones de servidor estático

## 🔧 Si algo no funciona:

1. Verifica que el servidor esté corriendo (deberías ver los mensajes en la terminal)
2. Verifica que la base de datos MySQL esté activa
3. Verifica que el archivo `.env` esté configurado en `backend/.env`
4. Reinicia el servidor: Presiona `Ctrl+C` en la terminal y vuelve a ejecutar `npm start`

## 📝 Scripts Disponibles:

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run install-all` - Instala todas las dependencias

## 🎯 Flujo de Trabajo:

```
1. Abrir VS Code
2. Abrir terminal (Ctrl + `)
3. Ejecutar: npm start
4. Abrir navegador: http://localhost:3001
5. Trabajar en tu proyecto
6. Para detener: Ctrl + C en la terminal
```

## 💡 Tip para VS Code:

Crea un archivo de tareas `.vscode/tasks.json` para iniciar el servidor rápidamente con `Ctrl+Shift+B`
