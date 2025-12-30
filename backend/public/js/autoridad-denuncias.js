// Estado global
let denuncias = [];
let currentDenuncia = null;
let currentRating = 0;
let allComments = [];
let currentSort = 'date-desc';
let currentCategory = '';

// Elementos del DOM
const denunciasList = document.getElementById('denuncias-list');
const modal = document.getElementById('denunciaModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveChangesBtn = document.getElementById('saveChangesBtn');
const sendCommentBtn = document.getElementById('sendCommentBtn');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnDropdown = document.getElementById('logout-btn-dropdown');
const profileAvatar = document.getElementById('profile-avatar');
const categoryFilter = document.getElementById('categoryFilter');
const sortDateBtn = document.getElementById('sortDateBtn');
const sortOldBtn = document.getElementById('sortOldBtn');

let currentFilter = 'all';

// Verificar autenticación
function verifyAuthority() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRol');

    if (!token || userRole !== 'autoridad') {
        window.location.href = '../login.html';
    }
}

// Cargar todas las denuncias
async function loadDenuncias() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.location.origin}/api/denuncias/todas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar denuncias');

        denuncias = await response.json();
        renderDenuncias();
        updateCounts();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar denuncias', 'error');
    }
}

// Renderizar lista de denuncias mejorada
function renderDenuncias() {
    let filtered = filterDenuncias(denuncias, currentFilter);
    
    // Filtro por categoría
    if (currentCategory) {
        filtered = filtered.filter(d => d.categoria === currentCategory);
    }
    
    // Búsqueda
    const searched = filtered.filter(d =>
        d.titulo.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        d.folio.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchInput.value.toLowerCase())
    );
    
    // Ordenamiento
    const sorted = sortDenuncias(searched);

    denunciasList.innerHTML = '';

    if (sorted.length === 0) {
        document.getElementById('empty-state').style.display = 'flex';
        return;
    }

    document.getElementById('empty-state').style.display = 'none';

    sorted.forEach(denuncia => {
        const card = createDenunciaCard(denuncia);
        denunciasList.appendChild(card);
    });
}

// Ordenar denuncias
function sortDenuncias(list) {
    return [...list].sort((a, b) => {
        const dateA = new Date(a.fecha_creacion);
        const dateB = new Date(b.fecha_creacion);
        
        if (currentSort === 'date-desc') {
            return dateB - dateA;
        } else if (currentSort === 'date-asc') {
            return dateA - dateB;
        }
        return 0;
    });
}

// Calcular días transcurridos
function getDaysAgo(fecha) {
    const now = new Date();
    const created = new Date(fecha);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Crear tarjeta de denuncia mejorada
function createDenunciaCard(denuncia) {
    const card = document.createElement('div');
    card.className = 'denuncia-card';
    
    // Calcular días y urgencia
    const daysAgo = getDaysAgo(denuncia.fecha_creacion);
    const isUrgent = daysAgo > 7 && denuncia.estado === 'recibido';
    const isHighPriority = daysAgo > 3 && daysAgo <= 7 && denuncia.estado === 'recibido';
    
    if (isUrgent) card.classList.add('urgente');
    else if (isHighPriority) card.classList.add('alta');

    const statusMap = {
        'recibido': 'Por Revisar',
        'en_progreso': 'En Atención',
        'resuelto': 'Resuelto',
        'rechazado': 'Rechazado'
    };

    const fecha = new Date(denuncia.fecha_creacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Badge de días
    let daysBadgeClass = 'new';
    let daysBadgeText = 'Hoy';
    if (daysAgo === 0) {
        daysBadgeText = 'Hoy';
        daysBadgeClass = 'new';
    } else if (daysAgo === 1) {
        daysBadgeText = 'Ayer';
        daysBadgeClass = 'new';
    } else if (daysAgo <= 3) {
        daysBadgeText = `${daysAgo} días`;
        daysBadgeClass = 'new';
    } else if (daysAgo <= 7) {
        daysBadgeText = `${daysAgo} días`;
        daysBadgeClass = 'medium';
    } else {
        daysBadgeText = `${daysAgo} días`;
        daysBadgeClass = 'old';
    }

    const imageSrc = denuncia.foto_url ? `${window.location.origin}${denuncia.foto_url}` : null;
    
    // Acciones según estado
    let actionsHTML = '';
    if (denuncia.estado === 'recibido') {
        actionsHTML = `
            <button class="action-btn atender" onclick="quickChangeStatus(${denuncia.id}, 'en_progreso', event)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"></path></svg>
                Atender
            </button>
            <button class="action-btn rechazar" onclick="quickChangeStatus(${denuncia.id}, 'rechazado', event)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Rechazar
            </button>
        `;
    } else if (denuncia.estado === 'en_progreso') {
        actionsHTML = `
            <button class="action-btn resolver" onclick="quickChangeStatus(${denuncia.id}, 'resuelto', event)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Resolver
            </button>
        `;
    }
    
    card.innerHTML = `
        <div class="denuncia-card-content">
            <div class="denuncia-info">
                <div class="denuncia-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="denuncia-folio">${denuncia.folio}</span>
                        ${isUrgent ? '<span class="priority-badge urgente">⚠ Urgente</span>' : ''}
                        ${isHighPriority ? '<span class="priority-badge alta">Prioridad Alta</span>' : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="days-badge ${daysBadgeClass}">${daysBadgeText}</span>
                        <span class="denuncia-status-badge ${denuncia.estado}">${statusMap[denuncia.estado]}</span>
                    </div>
                </div>
                <h3 class="denuncia-title">${denuncia.titulo}</h3>
                <p class="denuncia-description">${denuncia.descripcion}</p>
                <div class="denuncia-footer">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="denuncia-category">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                            ${denuncia.categoria}
                        </span>
                        <span class="denuncia-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            ${fecha}
                        </span>
                    </div>
                    <div class="denuncia-actions">
                        ${actionsHTML}
                        <button class="btn-view-detail" onclick="openDenunciaDetail(${denuncia.id})">Ver Detalle</button>
                    </div>
                </div>
                <div class="denuncia-meta">
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${denuncia.ciudadano_nombre ? `${denuncia.ciudadano_nombre} ${denuncia.ciudadano_apellido || ''}` : 'Anónimo'}
                    </span>
                    ${denuncia.latitud ? `
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Con ubicación
                    </span>
                    ` : ''}
                    ${denuncia.foto_url ? `
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        Con imagen
                    </span>
                    ` : ''}
                </div>
            </div>
            ${imageSrc ? `<div class="denuncia-image"><img src="${imageSrc}" alt="Imagen denuncia"></div>` : ''}
        </div>
    `;

    return card;
}

// Cambio rápido de estado
async function quickChangeStatus(denunciaId, newStatus, event) {
    event.stopPropagation();
    
    const statusNames = {
        'en_progreso': 'En Atención',
        'resuelto': 'Resuelto',
        'rechazado': 'Rechazado'
    };
    
    if (!confirm(`¿Cambiar estado a "${statusNames[newStatus]}"?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showNotification('Sesión expirada. Por favor, inicia sesión de nuevo.', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        
        const response = await fetch(`${window.location.origin}/api/denuncias/${denunciaId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: newStatus })
        });

        const data = await response.json();
        
        if (response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('userRol');
            localStorage.removeItem('userId');
            showNotification('Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al cambiar estado');
        }

        showNotification(`Estado cambiado a "${statusNames[newStatus]}"`, 'success');
        loadDenuncias();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al cambiar estado', 'error');
    }
}

// Abrir modal con detalles de denuncia
async function openDenunciaDetail(denunciaId) {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showNotification('Sesión expirada. Por favor, inicia sesión de nuevo.', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }

        // Obtener datos detallados de la denuncia
        const response = await fetch(`${window.location.origin}/api/denuncias/${denunciaId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('userRol');
            localStorage.removeItem('userId');
            showNotification('Sesión expirada. Redirigiendo al login...', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al cargar detalle de denuncia');
        }

        currentDenuncia = data;
        currentRating = 0;

        // Obtener comentarios
        try {
            console.log('Cargando comentarios para denuncia:', denunciaId);
            const commentsResponse = await fetch(`${window.location.origin}/api/denuncias/${denunciaId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Respuesta comentarios:', commentsResponse.status);
            if (commentsResponse.ok) {
                allComments = await commentsResponse.json();
                console.log('Comentarios cargados:', allComments);
            } else {
                console.warn('Error en respuesta:', await commentsResponse.text());
                allComments = [];
            }
        } catch (e) {
            console.warn('No se pudieron cargar comentarios:', e);
            allComments = [];
        }

        populateModal();
        if (modal) {
            modal.classList.add('active');
            console.log('Modal abierto');
        } else {
            console.error('Modal no encontrado en el DOM');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'Error al cargar detalles', 'error');
    }
}

// Llenar modal con información de denuncia
function populateModal() {
    const d = currentDenuncia;
    console.log('Datos de denuncia:', d);

    // Información básica
    document.getElementById('detailFolio').textContent = d.folio;
    document.getElementById('detailTitulo').textContent = d.titulo;
    document.getElementById('detailDescripcion').textContent = d.descripcion;
    document.getElementById('detailCategoria').textContent = d.categoria || '-';
    document.getElementById('detailCiudadano').textContent = d.ciudadano_nombre ?
        `${d.ciudadano_nombre} ${d.ciudadano_apellido || ''}` : '-';

    // Ubicación
    const ubicacion = d.latitud && d.longitud ?
        `${parseFloat(d.latitud).toFixed(4)}, ${parseFloat(d.longitud).toFixed(4)}` :
        'Sin ubicación';
    document.getElementById('detailUbicacion').textContent = ubicacion;

    // Fecha
    const fecha = new Date(d.fecha_creacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('detailFecha').textContent = fecha;

    // Imagen
    const imgElement = document.getElementById('denunciaImage');
    const noImagePlaceholder = document.getElementById('noImagePlaceholder');

    if (d.imagen_url) {
        imgElement.src = d.imagen_url.startsWith('http') 
            ? d.imagen_url 
            : `${window.location.origin}${d.imagen_url}`;
        imgElement.style.display = 'block';
        noImagePlaceholder.style.display = 'none';
    } else {
        imgElement.style.display = 'none';
        noImagePlaceholder.style.display = 'flex';
    }

    // Estado actual
    console.log('Estado de la denuncia:', d.estado);
    const statusSelect = document.getElementById('statusSelect');
    console.log('Opciones disponibles:', Array.from(statusSelect.options).map(o => o.value));
    statusSelect.value = d.estado;
    console.log('Valor seleccionado:', statusSelect.value);

    // Cargar comentarios
    renderComments();
}

// Renderizar comentarios
function renderComments() {
    console.log('renderComments llamado, allComments:', allComments);
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';

    if (allComments.length === 0) {
        commentsList.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 20px;">No hay comentarios aún</p>';
        return;
    }

    allComments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';

        const fecha = new Date(comment.fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const autor = comment.es_autoridad ? 'Autoridad' : 'Ciudadano';

        commentDiv.innerHTML = `
            <div class="comment-author">${autor}</div>
            <div class="comment-date">${fecha}</div>
            <div class="comment-text">${comment.texto}</div>
        `;

        commentsList.appendChild(commentDiv);
    });

    // Scroll al final
    commentsList.scrollTop = commentsList.scrollHeight;
}

// Manejar calificación con estrellas
document.addEventListener('DOMContentLoaded', function () {
    const stars = document.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', function () {
            currentRating = this.getAttribute('data-rating');
            updateStars();
        });

        star.addEventListener('mouseover', function () {
            const rating = this.getAttribute('data-rating');
            stars.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.style.filter = 'drop-shadow(0 0 6px #fbbf24) grayscale(0%)';
                } else {
                    s.style.filter = 'grayscale(100%)';
                }
            });
        });
    });

    document.getElementById('starRating').addEventListener('mouseleave', updateStars);
});

function updateStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const rating = star.getAttribute('data-rating');
        if (rating <= currentRating) {
            star.classList.add('active');
            star.style.filter = 'drop-shadow(0 0 6px #fbbf24) grayscale(0%)';
        } else {
            star.classList.remove('active');
            star.style.filter = 'grayscale(100%)';
        }
    });
}

// Enviar comentario
sendCommentBtn.addEventListener('click', async function () {
    const commentText = document.getElementById('commentInput').value.trim();

    if (!commentText) {
        showNotification('Por favor escribe un comentario', 'warning');
        return;
    }

    if (!currentDenuncia) return;

    try {
        this.disabled = true;
        this.textContent = 'Enviando...';

        const token = localStorage.getItem('token');
        const response = await fetch(`${window.location.origin}/api/denuncias/${currentDenuncia.id}/comentarios`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texto: commentText
            })
        });

        if (!response.ok) throw new Error('Error al enviar comentario');

        const newComment = await response.json();
        allComments.push(newComment);

        document.getElementById('commentInput').value = '';
        renderComments();

        showNotification('Comentario enviado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al enviar comentario', 'error');
    } finally {
        this.disabled = false;
        this.textContent = 'Enviar Comentario';
    }
});

// Guardar cambios (estado y calificación)
saveChangesBtn.addEventListener('click', async function () {
    if (!currentDenuncia) return;

    try {
        this.disabled = true;
        this.textContent = 'Guardando...';

        const token = localStorage.getItem('token');
        const newStatus = document.getElementById('statusSelect').value;

        const updateData = {
            estado: newStatus
        };

        if (currentRating > 0) {
            updateData.calificacion = currentRating;
        }

        const response = await fetch(`${window.location.origin}/api/denuncias/${currentDenuncia.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) throw new Error('Error al guardar cambios');

        currentDenuncia.estado = newStatus;
        if (currentRating > 0) {
            currentDenuncia.calificacion = currentRating;
        }

        showNotification('Cambios guardados correctamente', 'success');

        // Actualizar la lista
        setTimeout(() => {
            closeModalFn();
            loadDenuncias();
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar cambios', 'error');
    } finally {
        this.disabled = false;
        this.textContent = 'Guardar Cambios';
    }
});

// Cerrar modal
function closeModalFn() {
    modal.classList.remove('active');
    currentDenuncia = null;
    currentRating = 0;
    allComments = [];
    document.getElementById('commentInput').value = '';
        // (map cleanup reverted)
}

closeModal.addEventListener('click', closeModalFn);
cancelBtn.addEventListener('click', closeModalFn);

// Cerrar modal al hacer clic fuera
modal.addEventListener('click', function (e) {
    if (e.target === modal) {
        closeModalFn();
    }
});

// Filtrar denuncias
function filterDenuncias(list, filter) {
    if (filter === 'all') return list;
    return list.filter(d => d.estado === filter);
}

function updateCounts() {
    const all = denuncias.length;
    const pending = denuncias.filter(d => d.estado === 'recibido').length;
    const progress = denuncias.filter(d => d.estado === 'en_progreso').length;
    const resolved = denuncias.filter(d => d.estado === 'resuelto').length;
    
    // Contar urgentes (más de 7 días sin atender)
    const urgent = denuncias.filter(d => {
        if (d.estado !== 'recibido') return false;
        const daysAgo = getDaysAgo(d.fecha_creacion);
        return daysAgo > 7;
    }).length;

    document.getElementById('count-all').textContent = all;
    document.getElementById('count-pending').textContent = pending;
    document.getElementById('count-progress').textContent = progress;
    document.getElementById('count-resolved').textContent = resolved;
    
    // Stats cards
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;
    document.getElementById('stat-urgent').textContent = urgent;
}

// Event listeners para filtros
filterButtons.forEach(btn => {
    btn.addEventListener('click', function () {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        renderDenuncias();
    });
});

// Search en tiempo real
searchInput.addEventListener('input', renderDenuncias);

// Filtro por categoría
categoryFilter.addEventListener('change', function() {
    currentCategory = this.value;
    renderDenuncias();
});

// Botones de ordenamiento
sortDateBtn.addEventListener('click', function() {
    currentSort = 'date-desc';
    sortDateBtn.classList.add('active');
    sortOldBtn.classList.remove('active');
    renderDenuncias();
});

sortOldBtn.addEventListener('click', function() {
    currentSort = 'date-asc';
    sortOldBtn.classList.add('active');
    sortDateBtn.classList.remove('active');
    renderDenuncias();
});

// Logout
logoutBtn.addEventListener('click', function (e) {
    e.preventDefault();
    logout();
});

logoutBtnDropdown.addEventListener('click', function (e) {
    e.preventDefault();
    logout();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRol');
    localStorage.removeItem('userId');
    window.location.href = '../login.html';
}

// Notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 700;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    const colors = {
        'success': '#dcfce7',
        'error': '#fee2e2',
        'warning': '#fef3c7',
        'info': '#dbeafe'
    };

    const textColors = {
        'success': '#166534',
        'error': '#991b1b',
        'warning': '#92400e',
        'info': '#164e63'
    };

    notification.style.background = colors[type] || colors['info'];
    notification.style.color = textColors[type] || textColors['info'];
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inicializar
verifyAuthority();
loadDenuncias();

// Marcar ordenamiento por defecto
sortDateBtn.classList.add('active');

// Recargar denuncias cada 30 segundos
setInterval(loadDenuncias, 30000);

// Exponer funciones globalmente para los onclick en HTML
window.quickChangeStatus = quickChangeStatus;
window.openDenunciaDetail = openDenunciaDetail;
