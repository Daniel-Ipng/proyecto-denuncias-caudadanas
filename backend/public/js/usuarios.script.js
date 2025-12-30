// API Base URL
const API_URL = window.location.origin + '/api';

let currentUserId = null;
let todosLosUsuarios = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    cargarEstadisticas();
    cargarUsuarios();
    
    // Event listener para búsqueda al presionar Enter
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarUsuarios();
        }
    });
});

// Verificar autenticación
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('userRol');
    
    if (!token || userRol !== 'autoridad') {
        window.location.href = '../login.html';
        return;
    }
    
    cargarPerfil();
}

// Cargar perfil del usuario
async function cargarPerfil() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/auth/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.nombre;
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

// Cargar estadísticas generales
async function cargarEstadisticas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios/estadisticas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalUsuarios').textContent = stats.total_usuarios || 0;
            document.getElementById('totalCiudadanos').textContent = stats.total_ciudadanos || 0;
            document.getElementById('totalAutoridades').textContent = stats.total_autoridades || 0;
            document.getElementById('nuevosMes').textContent = stats.nuevos_mes || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Cargar todos los usuarios
async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            todosLosUsuarios = await response.json();
            mostrarUsuarios(todosLosUsuarios);
        } else {
            mostrarError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        mostrarError('Error de conexión');
    }
}

// Mostrar usuarios en la tabla
function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('usersTableBody');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-results">No se encontraron usuarios</td></tr>';
        return;
    }
    
    tbody.innerHTML = usuarios.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.nombre} ${user.apellido}</td>
            <td>${user.email}</td>
            <td>${user.dni}</td>
            <td><span class="badge badge-${user.rol}">${user.rol}</span></td>
            <td>${user.total_denuncias || 0}</td>
            <td>${formatearFecha(user.fecha_creacion)}</td>
            <td>
                <button class="btn-action btn-view" onclick="verDetalleUsuario(${user.id})">
                    Ver Detalle
                </button>
            </td>
        </tr>
    `).join('');
}

// Buscar usuarios
async function buscarUsuarios() {
    const searchTerm = document.getElementById('searchInput').value;
    const roleFilter = document.getElementById('roleFilter').value;
    
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        
        if (searchTerm) params.append('q', searchTerm);
        if (roleFilter) params.append('rol', roleFilter);
        
        const url = params.toString() ? `${API_URL}/usuarios/buscar?${params}` : `${API_URL}/usuarios`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const usuarios = await response.json();
            mostrarUsuarios(usuarios);
        } else {
            mostrarError('Error al buscar usuarios');
        }
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        mostrarError('Error de conexión');
    }
}

// Ver detalle de usuario
async function verDetalleUsuario(userId) {
    currentUserId = userId;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            mostrarModalUsuario(user);
        } else {
            mostrarError('Error al cargar detalle del usuario');
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        mostrarError('Error de conexión');
    }
}

// Mostrar modal con detalles del usuario
function mostrarModalUsuario(user) {
    document.getElementById('modalNombre').textContent = `${user.nombre} ${user.apellido}`;
    document.getElementById('modalEmail').textContent = user.email;
    document.getElementById('modalDni').textContent = user.dni;
    document.getElementById('modalFechaRegistro').textContent = formatearFecha(user.fecha_creacion);
    
    document.getElementById('modalTotalDenuncias').textContent = user.total_denuncias || 0;
    document.getElementById('modalDenunciasResueltas').textContent = user.denuncias_resueltas || 0;
    document.getElementById('modalDenunciasPendientes').textContent = user.denuncias_pendientes || 0;
    document.getElementById('modalComentarios').textContent = user.total_comentarios || 0;
    
    document.getElementById('modalRolSelect').value = user.rol;
    
    document.getElementById('userModal').classList.add('active');
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('userModal').classList.remove('active');
    currentUserId = null;
}

// Actualizar rol de usuario
async function actualizarRol() {
    if (!currentUserId) return;
    
    const nuevoRol = document.getElementById('modalRolSelect').value;
    
    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a "${nuevoRol}"?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios/${currentUserId}/rol`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rol: nuevoRol })
        });
        
        if (response.ok) {
            alert('Rol actualizado exitosamente');
            cerrarModal();
            cargarUsuarios();
            cargarEstadisticas();
        } else {
            const error = await response.json();
            alert(error.message || 'Error al actualizar el rol');
        }
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        alert('Error de conexión');
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '../login.html';
}

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Mostrar error
function mostrarError(mensaje) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `<tr><td colspan="8" class="no-results" style="color: #dc3545;">${mensaje}</td></tr>`;
}

// Cerrar modal al hacer clic fuera
document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target.id === 'userModal') {
        cerrarModal();
    }
});
