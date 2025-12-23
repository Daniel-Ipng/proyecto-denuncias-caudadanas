// Estado global
let denuncias = [];
let currentDenuncia = null;
let currentRating = 0;
let allComments = [];
// (detailMap/detailMarker removed — revert)
/* map removed (reverted) */

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
    const filtered = filterDenuncias(denuncias, currentFilter);
    const searched = filtered.filter(d =>
        d.titulo.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        d.folio.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchInput.value.toLowerCase())
    );

    denunciasList.innerHTML = '';

    if (searched.length === 0) {
        document.getElementById('empty-state').style.display = 'flex';
        return;
    }

    document.getElementById('empty-state').style.display = 'none';

    searched.forEach(denuncia => {
        const card = createDenunciaCard(denuncia);
        denunciasList.appendChild(card);
    });
}

// Crear tarjeta de denuncia mejorada
function createDenunciaCard(denuncia) {
    const card = document.createElement('div');
    card.className = 'denuncia-card';

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

    card.innerHTML = `
        <div class="denuncia-header">
            <span class="denuncia-folio">${denuncia.folio}</span>
            <span class="denuncia-status-badge ${denuncia.estado}">${statusMap[denuncia.estado]}</span>
        </div>
        <h3 class="denuncia-title">${denuncia.titulo}</h3>
        <p class="denuncia-description">${denuncia.descripcion}</p>
        <div class="denuncia-footer">
            <div>
                <span class="denuncia-category">${denuncia.categoria}</span>
                <span class="denuncia-date">${fecha}</span>
            </div>
            <button class="btn-view-detail" onclick="openDenunciaDetail(${denuncia.id})">Ver Detalle</button>
        </div>
    `;

    return card;
}

// Abrir modal con detalles de denuncia
async function openDenunciaDetail(denunciaId) {
    try {
        const token = localStorage.getItem('token');

        // Obtener datos detallados de la denuncia
        const response = await fetch(`${window.location.origin}/api/denuncias/${denunciaId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar detalle de denuncia');

        currentDenuncia = await response.json();
        currentRating = 0;

        // Obtener comentarios
        const commentsResponse = await fetch(`${window.location.origin}/api/denuncias/${denunciaId}/comentarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (commentsResponse.ok) {
            allComments = await commentsResponse.json();
        }

        populateModal();
        modal.classList.add('active');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles', 'error');
    }
}

// Llenar modal con información de denuncia
function populateModal() {
    const d = currentDenuncia;

    // Información básica
    document.getElementById('detailFolio').textContent = d.folio;
    document.getElementById('detailTitulo').textContent = d.titulo;
    document.getElementById('detailDescripcion').textContent = d.descripcion;
    document.getElementById('detailCategoria').textContent = d.categoria || '-';
    document.getElementById('detailCiudadano').textContent = d.ciudadano_nombre ?
        `${d.ciudadano_nombre} ${d.ciudadano_apellido}` : '-';

    // Ubicación
    const ubicacion = d.latitud && d.longitud ?
        `${d.latitud.toFixed(4)}, ${d.longitud.toFixed(4)}` :
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

        // (mini-map removed in revert)

    // Estado actual
    document.getElementById('statusSelect').value = d.estado;

    // Cargar comentarios
    renderComments();
}

// Renderizar comentarios
function renderComments() {
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

    document.getElementById('count-all').textContent = all;
    document.getElementById('count-pending').textContent = pending;
    document.getElementById('count-progress').textContent = progress;
    document.getElementById('count-resolved').textContent = resolved;
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

// Recargar denuncias cada 30 segundos
setInterval(loadDenuncias, 30000);
