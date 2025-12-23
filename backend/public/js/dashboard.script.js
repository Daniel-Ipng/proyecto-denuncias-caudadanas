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

    // --- Funciones de Autenticación y Utilidades ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = 'login.html';
    };

    // --- Función de la API ---
    const apiCall = async (endpoint) => {
        const token = getToken();
        if (!token) { logout(); return; }
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
            if (userName) {
                welcomeMessageEl.innerHTML = `Bienvenido de nuevo, <span>${userName}</span>`;
            } else {
                welcomeMessageEl.textContent = 'Bienvenido.';
            }
        } else {
            console.error('Error: No se encontró el elemento .header-left p en el DOM.');
        }
    };

    const loadStats = async () => {
        try {
            const stats = await apiCall('/estadisticas');
            totalDenunciasEl.textContent = stats.total || 0;
            pendientesEl.textContent = stats.pendientes || 0;
            enProcesoEl.textContent = stats.en_progreso || 0;
            resueltasEl.textContent = stats.resueltas || 0;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            alert('No se pudieron cargar las estadísticas.');
        }
    };

    // --- Funciones de Renderizado ---
    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'recibido': return { text: 'Pendiente', class: 'pending' };
            case 'en_progreso': return { text: 'En Proceso', class: 'in-progress' };
            case 'resuelto': return { text: 'Resuelta', class: 'resolved' };
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
        if (denuncia.foto_url) {
            detailImage.src = `${window.location.origin}${denuncia.foto_url}`;
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
        loadUserData();
        await loadStats();
        try {
            allDenuncias = await apiCall('/mis-denuncias');
            console.log('Denuncias cargadas en dashboard:', allDenuncias);
            renderReports();
        } catch (error) {
            console.error('Error al cargar denuncias para el preview del dashboard:', error);
        }
        setupEventListeners();
    };

    init();
});