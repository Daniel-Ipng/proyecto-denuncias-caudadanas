// API Base URL
const API_URL = window.location.origin + '/api';

let todasLasNotificaciones = [];
let filtroActual = 'all';
let notificacionesLeidas = JSON.parse(localStorage.getItem('notificacionesLeidas') || '[]');

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    cargarNotificaciones();
    
    // Auto-actualizar cada 30 segundos
    setInterval(actualizarNotificaciones, 30000);
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

// Cargar notificaciones
async function cargarNotificaciones() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/denuncias/todas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const denuncias = await response.json();
            generarNotificaciones(denuncias);
        } else {
            mostrarEstadoVacio('Error al cargar notificaciones');
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarEstadoVacio('Error de conexión');
    }
}

// Generar notificaciones desde denuncias
function generarNotificaciones(denuncias) {
    todasLasNotificaciones = [];
    
    denuncias.forEach(denuncia => {
        const fechaDenuncia = new Date(denuncia.fecha_creacion);
        const ahora = new Date();
        const diasTranscurridos = Math.floor((ahora - fechaDenuncia) / (1000 * 60 * 60 * 24));
        
        // Nueva denuncia (últimas 24 horas)
        if (diasTranscurridos === 0) {
            todasLasNotificaciones.push({
                id: `new-${denuncia.id}`,
                denunciaId: denuncia.id,
                tipo: 'new',
                titulo: 'Nueva Denuncia Recibida',
                mensaje: `${denuncia.nombre} ${denuncia.apellido} reportó: ${denuncia.titulo}`,
                fecha: denuncia.fecha_creacion,
                leida: notificacionesLeidas.includes(`new-${denuncia.id}`)
            });
        }
        
        // Denuncias sin atender (más de 3 días en estado "recibido")
        if (denuncia.estado === 'recibido' && diasTranscurridos > 3) {
            todasLasNotificaciones.push({
                id: `alert-${denuncia.id}`,
                denunciaId: denuncia.id,
                tipo: 'alert',
                titulo: '⚠️ Denuncia sin Atender',
                mensaje: `La denuncia "${denuncia.titulo}" lleva ${diasTranscurridos} días sin atención`,
                fecha: denuncia.fecha_creacion,
                leida: notificacionesLeidas.includes(`alert-${denuncia.id}`)
            });
        }
        
        // Denuncias actualizadas recientemente
        if (denuncia.fecha_actualizacion && denuncia.fecha_actualizacion !== denuncia.fecha_creacion) {
            const fechaActualizacion = new Date(denuncia.fecha_actualizacion);
            const horasDesdeActualizacion = Math.floor((ahora - fechaActualizacion) / (1000 * 60 * 60));
            
            if (horasDesdeActualizacion < 24) {
                todasLasNotificaciones.push({
                    id: `update-${denuncia.id}`,
                    denunciaId: denuncia.id,
                    tipo: 'update',
                    titulo: 'Denuncia Actualizada',
                    mensaje: `Estado de "${denuncia.titulo}" cambió a: ${denuncia.estado}`,
                    fecha: denuncia.fecha_actualizacion,
                    leida: notificacionesLeidas.includes(`update-${denuncia.id}`)
                });
            }
        }
    });
    
    // Ordenar por fecha (más recientes primero)
    todasLasNotificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    actualizarContadores();
    mostrarNotificaciones(todasLasNotificaciones);
}

// Mostrar notificaciones
function mostrarNotificaciones(notificaciones) {
    const container = document.getElementById('notificationsContainer');
    
    if (notificaciones.length === 0) {
        mostrarEstadoVacio('No hay notificaciones');
        return;
    }
    
    container.innerHTML = notificaciones.map(notif => `
        <div class="notification-card ${notif.leida ? '' : 'unread'}">
            <div class="notification-icon ${notif.tipo}">
                ${getIconoNotificacion(notif.tipo)}
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-title">${notif.titulo}</div>
                    <div class="notification-time">${formatearTiempo(notif.fecha)}</div>
                </div>
                <div class="notification-message">${notif.mensaje}</div>
                <div class="notification-actions">
                    <button class="btn-notification btn-view-denuncia" onclick="verDenuncia(${notif.denunciaId})">
                        Ver Denuncia
                    </button>
                    ${!notif.leida ? `
                        <button class="btn-notification btn-mark-read" onclick="marcarLeida('${notif.id}')">
                            Marcar como leída
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar notificaciones
function filtrarNotificaciones(filtro) {
    filtroActual = filtro;
    
    // Actualizar tabs activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filtro}"]`).classList.add('active');
    
    let notificacionesFiltradas = todasLasNotificaciones;
    
    if (filtro === 'unread') {
        notificacionesFiltradas = todasLasNotificaciones.filter(n => !n.leida);
    } else if (filtro !== 'all') {
        notificacionesFiltradas = todasLasNotificaciones.filter(n => n.tipo === filtro);
    }
    
    mostrarNotificaciones(notificacionesFiltradas);
}

// Marcar como leída
function marcarLeida(notifId) {
    if (!notificacionesLeidas.includes(notifId)) {
        notificacionesLeidas.push(notifId);
        localStorage.setItem('notificacionesLeidas', JSON.stringify(notificacionesLeidas));
    }
    
    // Actualizar el estado de la notificación
    const notif = todasLasNotificaciones.find(n => n.id === notifId);
    if (notif) {
        notif.leida = true;
    }
    
    actualizarContadores();
    filtrarNotificaciones(filtroActual);
}

// Marcar todas como leídas
function marcarTodasLeidas() {
    todasLasNotificaciones.forEach(notif => {
        if (!notificacionesLeidas.includes(notif.id)) {
            notificacionesLeidas.push(notif.id);
        }
        notif.leida = true;
    });
    
    localStorage.setItem('notificacionesLeidas', JSON.stringify(notificacionesLeidas));
    actualizarContadores();
    filtrarNotificaciones(filtroActual);
}

// Actualizar notificaciones
function actualizarNotificaciones() {
    cargarNotificaciones();
}

// Actualizar contadores
function actualizarContadores() {
    const noLeidas = todasLasNotificaciones.filter(n => !n.leida).length;
    
    document.getElementById('countAll').textContent = todasLasNotificaciones.length;
    document.getElementById('countUnread').textContent = noLeidas;
    
    const badge = document.getElementById('badgeCount');
    if (noLeidas > 0) {
        badge.textContent = noLeidas;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Ver denuncia
function verDenuncia(denunciaId) {
    window.location.href = `denuncias.html?id=${denunciaId}`;
}

// Obtener icono de notificación
function getIconoNotificacion(tipo) {
    const iconos = {
        new: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="12" y1="12" x2="12" y2="12"></line></svg>',
        comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        alert: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        update: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>'
    };
    return iconos[tipo] || iconos.new;
}

// Formatear tiempo relativo
function formatearTiempo(fecha) {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora - fechaNotif;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return fechaNotif.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Mostrar estado vacío
function mostrarEstadoVacio(mensaje) {
    const container = document.getElementById('notificationsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <div class="empty-state-title">Sin notificaciones</div>
            <div class="empty-state-message">${mensaje}</div>
        </div>
    `;
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '../login.html';
}
