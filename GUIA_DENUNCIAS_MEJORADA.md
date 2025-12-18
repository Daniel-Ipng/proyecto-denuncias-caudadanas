# 🎯 Sistema Mejorado de Gestión de Denuncias - Guía de Implementación

## ✅ Cambios Realizados

### 1. **Frontend - Interfaz Mejorada de Denuncias** ✨
Ubicación: `/frontend/autoridad/denuncias.html`

**Características Nuevas:**
- ✅ **Modal Detallado**: Abre una ventana modal elegante con todos los detalles de la denuncia
- ✅ **Visualización de Imagen**: Muestra la imagen de la denuncia en alta calidad
- ✅ **Calificación con Estrellas**: Sistema interactivo de 5 estrellas para calificar denuncias
- ✅ **Cambio de Estado**: Dropdown para cambiar el estado (Recibido, En Progreso, Resuelto, Rechazado)
- ✅ **Sistema de Comentarios**: Ver todos los comentarios previos y agregar nuevos
- ✅ **Tarjetas Mejoradas**: Diseño visual más profesional y atractivo
- ✅ **Colores Personalizados**: Tema rojo/naranja para la autoridad

**Diseño:**
- Modal con 2 columnas (imagen/detalles + descripción/comentarios)
- Animaciones suaves y transiciones elegantes
- Interfaz responsive para móviles
- Colores modernos con gradientes

### 2. **JavaScript - Lógica Frontend** 🔧
Ubicación: `/frontend/js/autoridad-denuncias-mejorado.js`

**Funcionalidades:**
- Carga dinámica de denuncias con API
- Abrir/cerrar modal con datos de denuncia específica
- Sistema de calificación con estrellas interactivas
- Cargar y mostrar comentarios
- Enviar nuevos comentarios en tiempo real
- Guardar cambios (estado y calificación)
- Búsqueda y filtros de denuncias
- Manejo de errores y notificaciones
- Auto-actualización cada 30 segundos

### 3. **Backend - Nuevos Endpoints API** 🚀
Ubicación: `/backend/src/controllers/denunciaController.js`

**Nuevos Métodos:**
```
GET  /api/denuncias/:id                    - Obtener detalle completo de denuncia
PUT  /api/denuncias/:id                    - Actualizar estado y calificación
POST /api/denuncias/:id/comentarios        - Agregar comentario
GET  /api/denuncias/:id/comentarios        - Obtener comentarios de denuncia
```

**Funcionalidades del Backend:**
- Obtener datos completos de denuncia con ciudadano, categoría e imagen
- Actualizar estado de denuncia con validación
- Guardar calificación (1-5 estrellas)
- Registrar comentarios con usuario y timestamp
- Recuperar historial de comentarios ordenados por fecha

### 4. **Rutas Actualizadas** 📍
Ubicación: `/backend/src/routes/denuncias.js`

Nuevas rutas agregadas para soporte completo:
```javascript
router.get('/:id', denunciaController.obtenerDetalleDenuncia);
router.put('/:id', denunciaController.actualizarDenuncia);
router.post('/:id/comentarios', denunciaController.agregarComentario);
router.get('/:id/comentarios', denunciaController.obtenerComentarios);
```

### 5. **Base de Datos - Nueva Columna** 📊
Se agrega columna `calificacion` a tabla denuncias

## 📋 Pasos de Instalación

### Paso 1: Actualizar Base de Datos
```sql
ALTER TABLE denuncias ADD COLUMN calificacion INT DEFAULT NULL AFTER estado;
```

**O usar el archivo SQL incluido:**
1. Abrir MySQL Workbench
2. Abrir archivo: `database_updates.sql`
3. Ejecutar el script

### Paso 2: Reiniciar Backend
```bash
cd backend
npm start
```

El servidor estará en: `http://localhost:3001`

### Paso 3: Acceder a la Interfaz
1. Ir a: `http://localhost:3000` (o tu puerto fronted)
2. Iniciar sesión como autoridad
3. Ir a "Denuncias"
4. Hacer clic en "Ver Detalle" en cualquier tarjeta

## 🎮 Cómo Usar

### Para Autoridad - Gestionar Denuncia:

1. **Abrir Detalle**
   - Click en botón "Ver Detalle" en tarjeta de denuncia

2. **Ver Información Completa**
   - Imagen de la denuncia (si existe)
   - Folio único
   - Categoría
   - Ubicación GPS
   - Ciudadano que reportó
   - Título y descripción

3. **Calificar Denuncia**
   - Hacer hover sobre estrellas
   - Click en estrella deseada (1-5)
   - Las estrellas se activan con efecto visual

4. **Cambiar Estado**
   - Seleccionar en dropdown:
     - Recibido: Denuncia recién llegada
     - En Progreso: Siendo atendida
     - Resuelto: Ya solucionada
     - Rechazado: No procede

5. **Comunicarse con Ciudadano**
   - Ver comentarios previos en lista
   - Escribir mensaje en textarea
   - Click "Enviar Comentario"
   - El ciudadano verá tu respuesta

6. **Guardar Cambios**
   - Click "Guardar Cambios"
   - Se actualiza BD automáticamente
   - Se recarga la lista
   - Notificación de éxito

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────┐
│ Frontend: Tabla de Denuncias                    │
├─────────────────────────────────────────────────┤
│ • GET /api/denuncias/todas                      │
│ • Carga todas las denuncias del sistema         │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ Click "Ver Detalle" → Abre Modal                │
├─────────────────────────────────────────────────┤
│ • GET /api/denuncias/:id                        │
│ • GET /api/denuncias/:id/comentarios            │
│ • Carga datos completos + comentarios           │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ Usuario Interactúa en Modal                     │
├─────────────────────────────────────────────────┤
│ 1. Selecciona calificación (estrellas)          │
│ 2. Cambia estado (dropdown)                     │
│ 3. Escribe comentario                           │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ Enviar Cambios al Backend                       │
├─────────────────────────────────────────────────┤
│ • POST /api/denuncias/:id/comentarios           │
│ • PUT /api/denuncias/:id (estado + calificación)│
│ • Actualiza MySQL                               │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│ Notificación & Actualización                    │
├─────────────────────────────────────────────────┤
│ • Mostrar confirmación al usuario               │
│ • Recargar lista de denuncias                   │
│ • Cerrar modal automáticamente                  │
└─────────────────────────────────────────────────┘
```

## 📊 Estructura de Datos

### Tabla: `denuncias` (modificada)
```sql
ALTER TABLE denuncias 
ADD COLUMN calificacion INT DEFAULT NULL AFTER estado;
-- Valores: 1-5 (NULL si no está calificada)
```

### Tabla: `comentarios_seguimiento` (existente)
```sql
CREATE TABLE comentarios_seguimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_denuncia INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_denuncia) REFERENCES denuncias(id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);
```

## 🎨 Estilos Personalizados

**Colores Autoridad:**
- Principal: `#DC143C` (Rojo Crimson)
- Secundario: `#B22234` (Rojo Oscuro)
- Acento: `#FF8C00` (Naranja)

**Componentes:**
- Modal con shadow elegante
- Tarjetas con hover effect
- Estrellas de calificación con efecto glow
- Status badges con colores dinámicos
- Transiciones suaves (0.3s)

## 🔒 Seguridad

- ✅ Autenticación JWT requerida
- ✅ Verificación de rol (solo autoridad)
- ✅ Validación de datos en backend
- ✅ Parámetros validados
- ✅ Manejo de errores seguro

## 🐛 Troubleshooting

### Modal no abre
- Verificar que el archivo `autoridad-denuncias-mejorado.js` esté cargado
- Revisar consola del navegador (F12) para errores

### Comentarios no aparecen
- Verificar que la tabla `comentarios_seguimiento` existe
- Revisar token JWT válido

### Cambios no se guardan
- Verificar conexión a backend
- Revisar estado del servidor (npm start)
- Verificar que DB está actualizada

### Imagen no se muestra
- Verificar ruta de imagen en BD
- Revisar que carpeta `/public/uploads` existe
- Verificar permisos de archivo

## 📞 Soporte

Para problemas contactar a desarrollador con:
- Logs del navegador (F12 → Console)
- Logs del backend (terminal)
- Descripción del error
- Pasos para reproducir

---

**Versión:** 1.0  
**Fecha:** 26 de Noviembre 2025  
**Estado:** ✅ Listo para Producción
