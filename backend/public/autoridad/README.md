## Sistema de Denuncias - Carpeta Autoridad

### Descripción
Se ha creado una carpeta `autoridad` en `frontend/autoridad/` con un dashboard dinámico para autoridades con colores diferenciados (Rojo #DC143C y Naranja #FF8C00).

### Estructura Creada

```
frontend/autoridad/
├── dashboard.html       - Panel principal con estadísticas y denuncias prioritarias
├── denuncias.html       - Gestor de todas las denuncias del sistema
├── mapa.html           - Visualización geográfica de denuncias (Leaflet)
├── reportes.html       - Gráficos y análisis estadísticos (Chart.js)
└── configuracion.html  - Gestión de perfil y preferencias
```

### Características

#### 1. Dashboard (dashboard.html)
- **Estadísticas dinámicas**: Total, Por Revisar, En Atención, Resueltas
- **Denuncias prioritarias**: Muestra las 4 denuncias más recientes/pendientes
- **Colores autoridad**: Gradiente rojo-naranja
- **Script**: `autoridad-dashboard.js` - Carga datos de API `/todas`

#### 2. Gestor de Denuncias (denuncias.html)
- **Vista completa**: Todas las denuncias del sistema
- **Filtros**: Por estado (Por Revisar, En Atención, Resueltas)
- **Búsqueda**: Por título, descripción o folio
- **Información adicional**: Muestra datos del ciudadano reportante
- **Script**: `autoridad-denuncias.js`

#### 3. Mapa (mapa.html)
- **Integración Leaflet**: Mapa interactivo con marcadores
- **Geolocalización**: Muestra todas las denuncias con coordenadas
- **Popup**: Información al hacer clic en marcador

#### 4. Reportes (reportes.html)
- **Gráficos Chart.js**:
  - Gráfico de estados (Doughnut)
  - Gráfico de categorías (Bar)
- **Análisis visual**: Distribución de denuncias

#### 5. Configuración (configuracion.html)
- **Perfil de autoridad**: Nombre, email, dependencia
- **Cambio de contraseña**: Con validaciones
- **Estilo**: Coherente con el resto del dashboard

### Estilos Diferenciados

**Colores de Autoridad:**
- Primary: `#DC143C` (Rojo Carmesí)
- Dark: `#B22222` (Rojo Oscuro)
- Accent: `#FF8C00` (Naranja Oscuro)

**Cambios en CSS:**
- Sidebar con gradiente rojo-naranja
- Badges de estado con colores rojos
- Botones con tonos rojos/naranjas

### Integración Backend

**Endpoints utilizados:**
- `GET /api/denuncias/todas` - Obtiene todas las denuncias (solo autoridades)
- `GET /api/denuncias/categorias` - Obtiene categorías disponibles

**Validaciones:**
- Verifica que el usuario tenga rol "autoridad"
- Redirige a login si no tiene permiso
- Token requerido en todas las peticiones

### Flujo de Acceso

1. Usuario se autentica con rol "autoridad"
2. Sistema redirige a `autoridad/dashboard.html`
3. Dashboard carga todas las denuncias del sistema
4. Autoridad puede gestionar y atender denuncias

### Cambios Principales vs Ciudadano

| Aspecto | Ciudadano | Autoridad |
|---------|-----------|-----------|
| Color | Azul | Rojo/Naranja |
| Datos | Propias | Del sistema |
| Vista | "Mis Denuncias" | "Todas las Denuncias" |
| API | `/mis-denuncias` | `/todas` |
| Acciones | Reportar | Atender/Gestionar |
| Permisos | Solo propios | Todas las denuncias |

### Notas Técnicas

- JavaScript dinámico: Carga datos desde API en tiempo real
- Responsive: Adaptable a dispositivos móviles
- Seguridad: Validación de rol en cliente y servidor
- UI Consistente: Mismo diseño base que ciudadano, solo cambio de colores
