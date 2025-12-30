document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const welcomeMessageEl = document.querySelector('.header-left p');
    const totalDenunciasEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
    const pendientesEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    const enProcesoEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    const resueltasEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    const reportsGrid = document.querySelector('.reports-grid');

    // --- Estado de la aplicación ---
    let allDenuncias = [];
    const isGuest = !localStorage.getItem('token');

    // --- Funciones de Autenticación y Utilidades ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    // --- Modal de registro para invitados ---
    const createGuestModal = () => {
        const modalHTML = `
            <div class="guest-modal-overlay" id="guestModal" style="display: none;">
                <div class="guest-modal">
                    <div class="guest-modal-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <h2>¡Regístrate para continuar!</h2>
                    <p>Para reportar un problema y hacer seguimiento de tus denuncias, necesitas crear una cuenta gratuita.</p>
                    <div class="guest-modal-benefits">
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Reporta problemas en tu comunidad</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Recibe actualizaciones en tiempo real</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Historial completo de tus reportes</span>
                        </div>
                    </div>
                    <div class="guest-modal-buttons">
                        <a href="../registro.html" class="btn-register">Crear Cuenta Gratis</a>
                        <a href="../login.html" class="btn-login-alt">Ya tengo cuenta</a>
                    </div>
                    <button class="guest-modal-close" onclick="closeGuestModal()">×</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Agregar estilos del modal
        const styles = `
            <style>
                .guest-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .guest-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease;
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .guest-modal-icon {
                    margin-bottom: 20px;
                }
                .guest-modal h2 {
                    color: #1a1a1a;
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 12px;
                }
                .guest-modal p {
                    color: #6b7280;
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }
                .guest-modal-benefits {
                    text-align: left;
                    margin-bottom: 28px;
                }
                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                    color: #374151;
                    font-size: 14px;
                }
                .guest-modal-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .btn-register {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: white;
                    padding: 14px 24px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 15px;
                    text-decoration: none;
                    transition: all 0.3s;
                }
                .btn-register:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
                }
                .btn-login-alt {
                    color: #2563eb;
                    padding: 12px 24px;
                    font-weight: 600;
                    font-size: 14px;
                    text-decoration: none;
                    transition: all 0.3s;
                }
                .btn-login-alt:hover {
                    background: #eff6ff;
                    border-radius: 8px;
                }
                .guest-modal-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #9ca3af;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .guest-modal-close:hover {
                    color: #1a1a1a;
                }
                .guest-banner {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 1px solid #f59e0b;
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                }
                .guest-banner-text {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #92400e;
                    font-weight: 600;
                }
                .guest-banner a {
                    background: #f59e0b;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 13px;
                    text-decoration: none;
                    white-space: nowrap;
                }
                .guest-banner a:hover {
                    background: #d97706;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    };

    window.showGuestModal = () => {
        document.getElementById('guestModal').style.display = 'flex';
    };

    window.closeGuestModal = () => {
        document.getElementById('guestModal').style.display = 'none';
    };

    // --- Función de la API ---
    const apiCall = async (endpoint) => {
        const token = getToken();
        if (!token) return null;
        const response = await fetch(`${window.location.origin}/api/denuncias${endpoint}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }
        return response.json();
    };

    // --- Funciones de Carga de Datos ---
    const loadUserData = () => {
        const userName = localStorage.getItem('userName');
        
        // Verificación para evitar el error "Cannot read properties of null"
        if (welcomeMessageEl) {
            if (isGuest) {
                welcomeMessageEl.innerHTML = `Bienvenido, <span>Invitado</span>`;
            } else if (userName) {
                welcomeMessageEl.innerHTML = `Bienvenido de nuevo, <span>${userName}</span>`;
            } else {
                welcomeMessageEl.textContent = 'Bienvenido.';
            }
        } else {
            console.error('Error: No se encontró el elemento .header-left p en el DOM.');
        }
    };

    // --- Agregar banner de invitado ---
    const addGuestBanner = () => {
        if (!isGuest) return;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const banner = document.createElement('div');
            banner.className = 'guest-banner';
            banner.innerHTML = `
                <div class="guest-banner-text">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Estás navegando como invitado. Regístrate para reportar problemas.</span>
                </div>
                <a href="../registro.html">Crear Cuenta</a>
            `;
            mainContent.insertBefore(banner, mainContent.firstChild.nextSibling);
        }
    };

    const loadStats = async () => {
        if (isGuest) {
            // Mostrar estadísticas de demostración para invitados
            totalDenunciasEl.textContent = '0';
            pendientesEl.textContent = '0';
            enProcesoEl.textContent = '0';
            resueltasEl.textContent = '0';
            return;
        }
        
        try {
            const stats = await apiCall('/estadisticas');
            if (stats) {
                totalDenunciasEl.textContent = stats.total || 0;
                pendientesEl.textContent = stats.pendientes || 0;
                enProcesoEl.textContent = stats.en_progreso || 0;
                resueltasEl.textContent = stats.resueltas || 0;
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    // --- Funciones de Renderizado ---
    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'recibido': return { text: 'Pendiente', class: 'pending' };
            case 'en_progreso': return { text: 'En Proceso', class: 'in-progress' };
            case 'resuelto': return { text: 'Resuelta', class: 'resolved' };
            case 'rechazado': return { text: 'Rechazada', class: 'rejected' };
            default: return { text: 'Desconocido', class: 'pending' };
        }
    };

    const getDaysAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    };

    const renderReports = () => {
        if (isGuest) {
            // Mostrar mensaje para invitados
            reportsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 12px; border: 2px dashed #e5e7eb;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom: 16px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <h3 style="color: #374151; font-size: 18px; font-weight: 700; margin-bottom: 8px;">¡Crea tu primera denuncia!</h3>
                    <p style="color: #6b7280; margin-bottom: 20px;">Regístrate para reportar problemas en tu comunidad y hacer seguimiento de tus reportes.</p>
                    <a href="../registro.html" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block;">Crear Cuenta Gratis</a>
                </div>
            `;
            return;
        }
        
        if (allDenuncias.length === 0) {
            reportsGrid.innerHTML = '<p>No tienes denuncias registradas aún.</p>';
            return;
        }

        reportsGrid.innerHTML = allDenuncias.slice(0, 4).map(report => {
            const estadoInfo = getEstadoInfo(report.estado);
            return `
                <div class="denuncia-card" data-id="${report.id}" data-status="${report.estado}">
                    <div class="card-header">
                        <div class="card-status">
                            <span class="status-badge ${estadoInfo.class}">${estadoInfo.text}</span>
                            <span class="card-id">#${report.folio}</span>
                        </div>
                        <span class="card-date">${getDaysAgo(report.fecha_creacion)}</span>
                    </div>
                    <h3 class="card-title">${report.titulo}</h3>
                    <p class="card-description">${report.descripcion}</p>
                    <div class="card-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>${report.categoria}</span>
                    </div>
                    <div class="card-footer">
                        <div class="card-category">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            <span>${report.categoria}</span>
                        </div>
                        <button class="btn-view-details" data-id="${report.id}">Ver detalles →</button>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar event listeners a los botones "Ver detalles"
        const viewButtons = document.querySelectorAll('.btn-view-details');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const denunciaId = parseInt(e.target.getAttribute('data-id'));
                const denuncia = allDenuncias.find(d => d.id === denunciaId);
                if (denuncia) {
                    showModal(denuncia);
                }
            });
        });
    };

    // Función para mostrar el modal con los detalles
    const showModal = async (denuncia) => {
        const modal = document.getElementById('detailModal');
        const estadoInfo = getEstadoInfo(denuncia.estado);
        
        // Popular campos básicos
        document.getElementById('detailFolio').textContent = denuncia.folio || '-';
        document.getElementById('detailTitulo').textContent = denuncia.titulo || '-';
        document.getElementById('detailDescripcion').textContent = denuncia.descripcion || '-';
        document.getElementById('detailCategoria').textContent = denuncia.categoria || '-';
        document.getElementById('detailEstado').textContent = estadoInfo.text;

        // Ubicación
        if (denuncia.latitud && denuncia.longitud) {
            document.getElementById('detailUbicacion').textContent = `${parseFloat(denuncia.latitud).toFixed(4)}, ${parseFloat(denuncia.longitud).toFixed(4)}`;
        } else {
            document.getElementById('detailUbicacion').textContent = 'Sin ubicación';
        }

        // Imagen
        const detailImage = document.getElementById('detailImage');
        const noImage = document.getElementById('noImage');
        if (denuncia.imagen_url) {
            detailImage.src = denuncia.imagen_url.startsWith('http') 
                ? denuncia.imagen_url 
                : `${window.location.origin}${denuncia.imagen_url}`;
            detailImage.style.display = 'block';
            noImage.style.display = 'none';
        } else {
            detailImage.style.display = 'none';
            noImage.style.display = 'flex';
        }

        // Obtener comentarios
        const commentsList = document.getElementById('commentsList');
        try {
            const response = await fetch(`${window.location.origin}/api/denuncias/${denuncia.id}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const comentarios = await response.json();
                commentsList.innerHTML = '';
                if (!comentarios || comentarios.length === 0) {
                    commentsList.innerHTML = '<p style="color:#9ca3af;padding:12px;text-align:center">No hay comentarios aún</p>';
                } else {
                    comentarios.forEach(c => {
                        const html = `
                            <div class="comment">
                                <div class="comment-author">${c.autor || (c.es_autoridad ? 'Autoridad' : 'Ciudadano')}</div>
                                <div class="comment-date">${new Date(c.fecha).toLocaleString('es-ES')}</div>
                                <div class="comment-text">${c.texto}</div>
                            </div>`;
                        commentsList.insertAdjacentHTML('beforeend', html);
                    });
                }
            } else {
                commentsList.innerHTML = '<p style="color:#9ca3af;padding:12px;text-align:center">No hay comentarios aún</p>';
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
            commentsList.innerHTML = '<p style="color:#9ca3af;padding:12px;text-align:center">No hay comentarios aún</p>';
        }

        modal.style.display = 'flex';
    };

    // Función para cerrar el modal
    const closeModal = () => {
        document.getElementById('detailModal').style.display = 'none';
    };

    // --- Event Listeners ---
    const setupEventListeners = () => {
        const logoutBtns = document.querySelectorAll('#logout-btn, #logout-btn-dropdown');
        logoutBtns.forEach(btn => btn.addEventListener('click', logout));

        // Event listeners para el modal
        const closeModalBtn = document.getElementById('closeModal');
        const cancelCommentBtn = document.getElementById('cancelCommentBtn');
        const sendCommentBtn = document.getElementById('sendCommentBtn');
        const modal = document.getElementById('detailModal');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        if (cancelCommentBtn) {
            cancelCommentBtn.addEventListener('click', closeModal);
        }
        if (sendCommentBtn) {
            sendCommentBtn.addEventListener('click', async () => {
                const commentInput = document.getElementById('commentInput');
                const commentText = commentInput.value.trim();
                if (commentText) {
                    // Aquí podrías implementar la lógica para enviar comentarios
                    alert('Funcionalidad de comentarios en desarrollo');
                    commentInput.value = '';
                }
            });
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
    };

    // --- Inicialización ---
    const init = async () => {
        // Crear modal de invitado
        createGuestModal();
        
        loadUserData();
        addGuestBanner();
        await loadStats();
        
        if (!isGuest) {
            try {
                allDenuncias = await apiCall('/mis-denuncias');
                console.log('Denuncias cargadas en dashboard:', allDenuncias);
            } catch (error) {
                console.error('Error al cargar denuncias para el preview del dashboard:', error);
            }
        }
        
        renderReports();
        setupEventListeners();
    };

    init();
});