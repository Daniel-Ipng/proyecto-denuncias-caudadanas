# Análisis del Patrón MVC en el Proyecto de Denuncias Ciudadanas

## 📋 Índice
1. [¿Qué es MVC?](#qué-es-mvc)
2. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
3. [Implementación Actual de MVC](#implementación-actual-de-mvc)
4. [Análisis Detallado](#análisis-detallado)
5. [Mejoras Recomendadas](#mejoras-recomendadas)
6. [Implementación de Modelos](#implementación-de-modelos)
7. [Ventajas de una Arquitectura MVC Completa](#ventajas-de-una-arquitectura-mvc-completa)

---

## 🎯 ¿Qué es MVC?

**MVC (Model-View-Controller)** es un patrón de arquitectura de software que separa la aplicación en tres componentes principales:

### 📦 **Model (Modelo)**
- **Responsabilidad**: Gestiona los datos y la lógica de negocio
- **Funciones**:
  - Acceso y manipulación de la base de datos
  - Validación de datos
  - Reglas de negocio
  - Estado de la aplicación
- **Independencia**: No conoce las vistas ni los controladores

### 🎨 **View (Vista)**
- **Responsabilidad**: Presenta la información al usuario
- **Funciones**:
  - Interfaz de usuario (HTML, CSS)
  - Renderizado de datos
  - Captura de entrada del usuario
- **Independencia**: No contiene lógica de negocio

### 🎮 **Controller (Controlador)**
- **Responsabilidad**: Gestiona la comunicación entre Modelo y Vista
- **Funciones**:
  - Recibe peticiones del usuario
  - Procesa la entrada
  - Coordina el modelo y la vista
  - Maneja las respuestas

---

## 📊 Estado Actual del Proyecto

### Estructura Actual
```
backend/
├── server.js                    # Punto de entrada (Router principal)
├── src/
│   ├── config/
│   │   └── db.js               # Configuración de DB (parcialmente Modelo)
│   ├── controllers/
│   │   ├── authController.js   # ✅ Controlador de autenticación
│   │   └── denunciaController.js # ✅ Controlador de denuncias
│   ├── middleware/
│   │   └── authMiddleware.js   # Middleware de autenticación
│   └── routes/
│       ├── auth.js             # ✅ Rutas de autenticación
│       └── denuncias.js        # ✅ Rutas de denuncias
└── public/                      # ✅ Vistas (Frontend)
    ├── *.html                   # Archivos HTML (Vistas)
    ├── css/                     # Estilos
    └── js/                      # Lógica del cliente
```

---

## 🔍 Implementación Actual de MVC

### ✅ **Lo que SÍ tienes implementado**

#### 1. **Controllers (Controladores)** - ✅ COMPLETO

**Ubicación**: `backend/src/controllers/`

```javascript
// authController.js
exports.registrarUsuario = async (req, res) => {
    const { nombre, apellido, dni, email, password, rol } = req.body;
    // Lógica de procesamiento
    db.query(query, [params], callback);
};

// denunciaController.js
exports.crearDenuncia = (req, res) => {
    const userId = req.user.id;
    // Procesa la petición y coordina con la DB
};
```

**✅ Características**:
- Manejan la lógica de las peticiones HTTP
- Coordinan con la base de datos
- Procesan y validan entrada
- Envían respuestas JSON
- Bien organizados por dominio (auth, denuncias)

#### 2. **Views (Vistas)** - ✅ COMPLETO

**Ubicación**: `backend/public/`

- **HTML**: `index.html`, `login.html`, `dashboard.html`, etc.
- **CSS**: Estilos en `css/`
- **JavaScript del cliente**: `js/api.js`, `auth.js`, etc.

**✅ Características**:
- Interfaz de usuario separada del backend
- Comunicación mediante API REST
- Single Page Application (SPA) con JavaScript

#### 3. **Routes (Rutas)** - ✅ COMPLETO

**Ubicación**: `backend/src/routes/`

```javascript
// auth.js
router.post('/register', authController.registrarUsuario);
router.post('/login', authController.iniciarSesion);

// denuncias.js
router.get('/mis-denuncias', denunciaController.obtenerDenunciasUsuario);
router.post('/crear', denunciaController.crearDenuncia);
```

**✅ Características**:
- Separación clara de rutas por módulo
- Middleware de autenticación aplicado correctamente
- RESTful API design

---

### ❌ **Lo que FALTA: Models (Modelos)**

#### Situación Actual

**Actualmente, la lógica del modelo está MEZCLADA en los controladores:**

```javascript
// ❌ Controlador con lógica de acceso a datos directa
exports.obtenerDenunciasUsuario = (req, res) => {
    const userId = req.user.id; 
    const query = `SELECT d.id, d.folio, ... FROM denuncias d ...`;
    
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error' });
        res.json(results);
    });
};
```

**❌ Problemas**:
1. **Violación del principio de responsabilidad única**: El controlador conoce SQL
2. **Código duplicado**: Mismas consultas en múltiples controladores
3. **Difícil de testear**: No puedes probar la lógica de datos sin el controlador
4. **Difícil de mantener**: Cambios en la DB requieren editar múltiples archivos
5. **Acoplamiento fuerte**: El controlador está acoplado a MySQL

---

## 📐 Análisis Detallado

### Flujo Actual de una Petición

```
1. Cliente (Vista)
   ↓ HTTP Request
2. server.js (Router principal)
   ↓ Ruteo
3. routes/denuncias.js (Definición de rutas)
   ↓ Middleware
4. authMiddleware.js (Autenticación)
   ↓ Si autenticado
5. controllers/denunciaController.js (Controlador)
   ↓ Consulta SQL directa
6. db.js (Conexión a DB)
   ↓ Resultado
7. Controlador procesa y responde
   ↓ HTTP Response
8. Cliente (Vista) actualiza UI
```

### ¿Dónde está el Modelo?

**Actualmente**: La capa de modelo está **implícita** y **distribuida**:
- Consultas SQL en controladores ❌
- Validaciones mezcladas ❌
- Lógica de negocio en controladores ❌
- `db.js` solo es configuración, no es un modelo completo

---

## 🚀 Mejoras Recomendadas

### Crear una Capa de Modelos Explícita

#### Estructura Propuesta

```
backend/src/
├── models/
│   ├── Usuario.js       # Modelo de Usuario
│   ├── Denuncia.js      # Modelo de Denuncia
│   ├── Categoria.js     # Modelo de Categoría
│   └── Comentario.js    # Modelo de Comentario
├── controllers/         # Controladores (ya existen)
├── routes/             # Rutas (ya existen)
├── middleware/         # Middleware (ya existe)
└── config/
    └── db.js           # Configuración (ya existe)
```

---

## 💡 Implementación de Modelos

### Ejemplo 1: Modelo de Usuario

**Crear**: `backend/src/models/Usuario.js`

```javascript
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class Usuario {
    /**
     * Buscar usuario por email
     * @param {string} email 
     * @returns {Promise<Object|null>}
     */
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM usuarios WHERE email = ?';
            db.query(query, [email], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    /**
     * Buscar usuario por ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre, apellido, email, dni, rol, fecha_creacion FROM usuarios WHERE id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    /**
     * Crear nuevo usuario
     * @param {Object} userData 
     * @returns {Promise<number>} ID del usuario creado
     */
    static async create(userData) {
        const { nombre, apellido, dni, email, password, rol } = userData;
        
        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [nombre, apellido, dni, email, password_hash, rol], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    }

    /**
     * Actualizar datos del usuario
     * @param {number} id 
     * @param {Object} userData 
     * @returns {Promise<boolean>}
     */
    static async update(id, userData) {
        const { nombre, apellido, email } = userData;
        
        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?';
            db.query(query, [nombre, apellido, email, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    /**
     * Cambiar contraseña
     * @param {number} id 
     * @param {string} newPassword 
     * @returns {Promise<boolean>}
     */
    static async changePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET password_hash = ? WHERE id = ?';
            db.query(query, [password_hash, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    /**
     * Verificar contraseña
     * @param {string} plainPassword 
     * @param {string} hashedPassword 
     * @returns {Promise<boolean>}
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = Usuario;
```

### Ejemplo 2: Modelo de Denuncia

**Crear**: `backend/src/models/Denuncia.js`

```javascript
const db = require('../config/db');

class Denuncia {
    /**
     * Obtener todas las denuncias de un usuario
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    d.id, d.folio, d.titulo, d.descripcion, d.estado, 
                    d.fecha_creacion, d.latitud, d.longitud, d.fecha_actualizacion,
                    c.nombre AS categoria
                FROM denuncias d
                JOIN categorias c ON d.id_categoria = c.id
                WHERE d.id_usuario = ?
                ORDER BY d.fecha_creacion DESC
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    /**
     * Obtener todas las denuncias
     * @returns {Promise<Array>}
     */
    static async findAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    d.id, d.folio, d.titulo, d.descripcion, d.estado, 
                    d.fecha_creacion, d.latitud, d.longitud, d.fecha_actualizacion,
                    c.nombre AS categoria, c.id AS id_categoria,
                    u.nombre, u.apellido
                FROM denuncias d
                JOIN categorias c ON d.id_categoria = c.id
                JOIN usuarios u ON d.id_usuario = u.id
                ORDER BY d.fecha_creacion DESC
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    /**
     * Obtener denuncia por ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    d.*, c.nombre AS categoria,
                    u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                FROM denuncias d
                JOIN categorias c ON d.id_categoria = c.id
                JOIN usuarios u ON d.id_usuario = u.id
                WHERE d.id = ?
            `;
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    /**
     * Crear nueva denuncia
     * @param {Object} denunciaData 
     * @returns {Promise<number>} ID de la denuncia creada
     */
    static async create(denunciaData) {
        const { 
            id_usuario, folio, titulo, descripcion, 
            id_categoria, latitud, longitud, imagen_url 
        } = denunciaData;

        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO denuncias 
                (id_usuario, folio, titulo, descripcion, id_categoria, latitud, longitud, imagen_url, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')
            `;
            db.query(
                query, 
                [id_usuario, folio, titulo, descripcion, id_categoria, latitud, longitud, imagen_url],
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result.insertId);
                }
            );
        });
    }

    /**
     * Actualizar denuncia
     * @param {number} id 
     * @param {Object} updateData 
     * @returns {Promise<boolean>}
     */
    static async update(id, updateData) {
        const { estado, titulo, descripcion } = updateData;
        
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE denuncias 
                SET estado = ?, titulo = ?, descripcion = ?, fecha_actualizacion = NOW()
                WHERE id = ?
            `;
            db.query(query, [estado, titulo, descripcion, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    /**
     * Actualizar solo el estado
     * @param {number} id 
     * @param {string} estado 
     * @returns {Promise<boolean>}
     */
    static async updateStatus(id, estado) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE denuncias 
                SET estado = ?, fecha_actualizacion = NOW()
                WHERE id = ?
            `;
            db.query(query, [estado, id], (err, result) => {
                if (err) return reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    /**
     * Obtener estadísticas de denuncias por usuario
     * @param {number} userId 
     * @returns {Promise<Object>}
     */
    static async getStatsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) as en_proceso,
                    SUM(CASE WHEN estado = 'Resuelta' THEN 1 ELSE 0 END) as resueltas,
                    SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) as rechazadas
                FROM denuncias
                WHERE id_usuario = ?
            `;
            db.query(query, [userId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || {});
            });
        });
    }
}

module.exports = Denuncia;
```

### Ejemplo 3: Modelo de Categoría

**Crear**: `backend/src/models/Categoria.js`

```javascript
const db = require('../config/db');

class Categoria {
    /**
     * Obtener todas las categorías
     * @returns {Promise<Array>}
     */
    static async findAll() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, nombre FROM categorias ORDER BY nombre';
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    /**
     * Buscar categoría por ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM categorias WHERE id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }
}

module.exports = Categoria;
```

---

### Controlador Refactorizado con Modelos

**Antes** (`authController.js`):
```javascript
// ❌ Controlador con SQL directo
exports.iniciarSesion = (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Error del servidor' });
        if (results.length === 0) return res.status(401).json({ message: 'Credenciales inválidas' });
        
        const usuario = results[0];
        const esValida = await bcrypt.compare(password, usuario.password_hash);
        // ... resto del código
    });
};
```

**Después** (con Modelo):
```javascript
// ✅ Controlador usando el Modelo
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

exports.iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }
        
        // Usar el modelo
        const usuario = await Usuario.findByEmail(email);
        
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // Verificar contraseña usando el modelo
        const esValida = await Usuario.verifyPassword(password, usuario.password_hash);
        
        if (!esValida) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // Generar token
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        
        res.json({ 
            message: 'Login OK', 
            token, 
            rol: usuario.rol, 
            usuario: { 
                id: usuario.id, 
                nombre: usuario.nombre 
            } 
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};
```

**Refactorización de `denunciaController.js`**:
```javascript
// ✅ Controlador usando los Modelos
const Denuncia = require('../models/Denuncia');
const Categoria = require('../models/Categoria');

exports.obtenerDenunciasUsuario = async (req, res) => {
    try {
        const denuncias = await Denuncia.findByUserId(req.user.id);
        res.json(denuncias);
    } catch (error) {
        console.error('Error al obtener denuncias:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.obtenerTodasDenuncias = async (req, res) => {
    try {
        const denuncias = await Denuncia.findAll();
        res.json(denuncias);
    } catch (error) {
        console.error('Error al obtener denuncias:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll();
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.obtenerEstadisticasUsuario = async (req, res) => {
    try {
        const stats = await Denuncia.getStatsByUserId(req.user.id);
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};
```

---

## 🎯 Ventajas de una Arquitectura MVC Completa

### ✅ Beneficios Inmediatos

1. **Separación de Responsabilidades**
   - Cada capa tiene una función específica
   - Más fácil de entender y mantener

2. **Reutilización de Código**
   ```javascript
   // Puedes usar el mismo modelo en diferentes controladores
   const usuario = await Usuario.findById(id); // En múltiples lugares
   ```

3. **Testing Más Fácil**
   ```javascript
   // Puedes testear el modelo independientemente
   const usuario = await Usuario.findByEmail('test@test.com');
   assert(usuario !== null);
   ```

4. **Cambios Centralizados**
   ```javascript
   // Si cambias la estructura de la DB, solo modificas el modelo
   // No necesitas buscar en todos los controladores
   ```

5. **Mejor Escalabilidad**
   - Fácil agregar nuevas funcionalidades
   - Estructura clara para el equipo

6. **Independencia de Base de Datos**
   ```javascript
   // Si cambias de MySQL a PostgreSQL, solo modificas los modelos
   ```

---

## 📊 Diagrama del Flujo MVC Completo

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE (Navegador)                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              VISTA (View)                            │   │
│  │  - HTML (index.html, dashboard.html, etc.)           │   │
│  │  - CSS (estilos)                                     │   │
│  │  - JavaScript (api.js, auth.js, etc.)                │   │
│  └────────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP Request (API REST)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       SERVIDOR (Backend)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              server.js (Entry Point)                  │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 ROUTES (Rutas)                        │  │
│  │  - routes/auth.js                                     │  │
│  │  - routes/denuncias.js                                │  │
│  │  (Definen endpoints y aplican middleware)             │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          MIDDLEWARE (authMiddleware.js)               │  │
│  │  (Autenticación, validación, etc.)                    │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            CONTROLLERS (Controladores)                │  │
│  │  - authController.js                                  │  │
│  │  - denunciaController.js                              │  │
│  │  (Lógica de procesamiento de peticiones)              │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               MODELS (Modelos) ⭐ NUEVO               │  │
│  │  - models/Usuario.js                                  │  │
│  │  - models/Denuncia.js                                 │  │
│  │  - models/Categoria.js                                │  │
│  │  (Lógica de negocio y acceso a datos)                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ↓                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              DATABASE (Base de Datos)                 │  │
│  │  - MySQL                                              │  │
│  │  - config/db.js (Conexión)                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Resumen y Próximos Pasos

### ✅ Lo que ya tienes (80% de MVC)

1. **Views** ✅ - Frontend completo con HTML/CSS/JS
2. **Controllers** ✅ - Controladores bien organizados
3. **Routes** ✅ - Sistema de rutas estructurado
4. **Middleware** ✅ - Autenticación implementada

### ⚠️ Lo que falta (20% restante)

1. **Models** ❌ - Capa de modelos explícita
   - Crear `models/Usuario.js`
   - Crear `models/Denuncia.js`
   - Crear `models/Categoria.js`
   - Crear `models/Comentario.js` (si aplica)

### 🚀 Plan de Implementación

#### Paso 1: Crear carpeta de modelos
```bash
mkdir backend/src/models
```

#### Paso 2: Implementar modelos básicos
1. `Usuario.js` (ejemplo completo arriba)
2. `Denuncia.js` (ejemplo completo arriba)
3. `Categoria.js` (ejemplo completo arriba)

#### Paso 3: Refactorizar controladores
1. Importar los modelos
2. Reemplazar consultas SQL directas por métodos del modelo
3. Usar async/await en lugar de callbacks

#### Paso 4: Testing
1. Probar cada endpoint
2. Verificar que todo funciona igual
3. Agregar manejo de errores mejorado

---

## 🎓 Conclusión

Tu proyecto **YA ESTÁ USANDO MVC**, pero de forma **incompleta**. Tienes:
- ✅ **Vistas** (frontend)
- ✅ **Controladores** (backend/src/controllers)
- ❌ **Modelos** (mezclados en controladores)

**Para completar MVC**, necesitas:
1. Crear una capa de **Modelos explícita**
2. **Refactorizar los controladores** para usar esos modelos
3. **Centralizar** la lógica de acceso a datos

**Resultado**: Código más limpio, mantenible, testeable y escalable.

---

## 📚 Recursos Adicionales

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js MVC Pattern](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/deployment)
- [Clean Architecture in Node.js](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Fecha**: Diciembre 2025  
**Proyecto**: Sistema de Denuncias Ciudadanas  
**Arquitectura**: Express.js + MySQL + MVC Pattern
