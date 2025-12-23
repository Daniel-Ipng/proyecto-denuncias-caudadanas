document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const denunciasListEl = document.getElementById('denuncias-list');
    const emptyStateEl = document.getElementById('empty-state');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const logoutBtns = document.querySelectorAll('#logout-btn, #logout-btn-dropdown');

    // --- Estado de la aplicación ---
    let allDenuncias = [];
    let currentFilter = 'all';

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

    const loadDenuncias = async () => {
        try {
            allDenuncias = await apiCall('/mis-denuncias');
            console.log('Denuncias cargadas:', allDenuncias);
            updateFilterCounts();
            renderDenuncias();
        } catch (error) {
            console.error('Error al cargar denuncias:', error);
            denunciasListEl.innerHTML = '<p style="color: #EF4444;">Error al cargar denuncias</p>';
        }
    };
    
    // --- Funciones de Renderizado y Filtrado ---
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

    const renderDenuncias = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredDenuncias = allDenuncias.filter(denuncia => {
            const matchesFilter = currentFilter === 'all' || denuncia.estado === currentFilter;
            const matchesSearch = denuncia.titulo.toLowerCase().includes(searchTerm) || denuncia.descripcion.toLowerCase().includes(searchTerm);
            return matchesFilter && matchesSearch;
        });

        if (filteredDenuncias.length === 0) {
            denunciasListEl.style.display = 'none';
            emptyStateEl.style.display = 'flex';
            return;
        }

        denunciasListEl.style.display = 'grid';
        emptyStateEl.style.display = 'none';

        denunciasListEl.innerHTML = filteredDenuncias.map(denuncia => {
            const estadoInfo = getEstadoInfo(denuncia.estado);
            return `
            <div class="denuncia-card" data-id="${denuncia.id}" data-status="${denuncia.estado}">
                    <div class="card-header">
                        <div class="card-status">
                            <span class="status-badge ${estadoInfo.class}">${estadoInfo.text}</span>
                            <span class="card-id">#${denuncia.folio}</span>
                        </div>
                        <span class="card-date">${getDaysAgo(denuncia.fecha_creacion)}</span>
                    </div>
                    <h3 class="card-title">${denuncia.titulo}</h3>
                    <p class="card-description">${denuncia.descripcion}</p>
                    <div class="card-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>${denuncia.categoria}</span>
                    </div>
                    <div class="card-footer">
                        <div class="card-category">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            <span>${denuncia.categoria}</span>
                        </div>
                        <button class="btn-view-details" data-id="${denuncia.id}">Ver detalles →</button>
                    </div>
                </div>
            `;
        }).join('');
    };
    
    const updateFilterCounts = () => {
        const counts = {
            all: allDenuncias.length,
            recibido: allDenuncias.filter(d => d.estado === 'recibido').length,
            en_progreso: allDenuncias.filter(d => d.estado === 'en_progreso').length,
            resuelto: allDenuncias.filter(d => d.estado === 'resuelto').length,
        };
        document.getElementById('count-all').textContent = counts.all;
        document.getElementById('count-pending').textContent = counts.recibido;
        document.getElementById('count-progress').textContent = counts.en_progreso;
        document.getElementById('count-resolved').textContent = counts.resuelto;
    };

    // --- Event Listeners ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderDenuncias();
        });
    });

    searchInput.addEventListener('input', renderDenuncias);
    logoutBtns.forEach(btn => btn.addEventListener('click', logout));

    // --- Inicialización ---
    const init = async () => {
        await loadDenuncias();
    };

    init();
    
    /* ------------------ Modal y detalle de denuncia ------------------- */
    const modal = document.getElementById('denunciaModal');
    const closeModalBtn = document.getElementById('closeModal');
    const detailImage = document.getElementById('detailImage');
    const noImage = document.getElementById('noImage');
    const detailFolio = document.getElementById('detailFolio');
    const detailTitulo = document.getElementById('detailTitulo');
    const detailDescripcion = document.getElementById('detailDescripcion');
    const detailCategoria = document.getElementById('detailCategoria');
    const detailUbicacion = document.getElementById('detailUbicacion');
    const detailEstado = document.getElementById('detailEstado');
    const commentsList = document.getElementById('commentsList');
    const commentInput = document.getElementById('commentInput');
    const sendCommentBtn = document.getElementById('sendCommentBtn');
    const cancelCommentBtn = document.getElementById('cancelCommentBtn');

    // (mini-map removed - revert)

    // Delegación de eventos: abrir modal al hacer click en "Ver detalles"
    denunciasListEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-view-details');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        await openDenunciaDetail(id);
    });

    // Cerrar modal
    closeModalBtn.addEventListener('click', closeModal);
    cancelCommentBtn.addEventListener('click', closeModal);

    async function openDenunciaDetail(id) {
        try {
            // detalles
            const detalle = await apiCall(`/${id}`);
            // comentarios
            let comentarios = [];
            try { comentarios = await apiCall(`/${id}/comentarios`); } catch(e){ comentarios = []; }

            // Popular campos
            detailFolio.textContent = detalle.folio || '-';
            detailTitulo.textContent = detalle.titulo || '-';
            detailDescripcion.textContent = detalle.descripcion || '-';
            detailCategoria.textContent = detalle.categoria || '-';
            detailEstado.textContent = (detalle.estado || '-').replace('_', ' ');

            if (detalle.latitud && detalle.longitud) {
                detailUbicacion.textContent = `${parseFloat(detalle.latitud).toFixed(4)}, ${parseFloat(detalle.longitud).toFixed(4)}`;
            } else {
                detailUbicacion.textContent = 'Sin ubicación';
            }

            if (detalle.imagen_url) {
                detailImage.src = detalle.imagen_url.startsWith('http') 
                    ? detalle.imagen_url 
                    : `${window.location.origin}${detalle.imagen_url}`;
                detailImage.style.display = 'block';
                noImage.style.display = 'none';
            } else {
                detailImage.style.display = 'none';
                noImage.style.display = 'flex';
            }

            // (mini-map removed in revert)

            // Comentarios
            commentsList.innerHTML = '';
            if (!comentarios || comentarios.length === 0) {
                commentsList.innerHTML = '<p style="color:#9ca3af;padding:12px;text-align:center">No hay comentarios aún</p>';
            } else {
                comentarios.forEach(c => {
                    const html = `\
                        <div class="comment">\
                            <div class="comment-author">${c.autor || (c.es_autoridad ? 'Autoridad' : 'Ciudadano')}</div>\
                            <div class="comment-date">${new Date(c.fecha).toLocaleString('es-ES')}</div>\
                            <div class="comment-text">${c.texto}</div>\
                        </div>`;
                    commentsList.insertAdjacentHTML('beforeend', html);
                });
            }

            // Mostrar modal
            modal.style.display = 'flex';

            // Asociar el botón de enviar comentario
            sendCommentBtn.onclick = async () => {
                const texto = commentInput.value.trim();
                if (!texto) return;
                sendCommentBtn.disabled = true;
                sendCommentBtn.textContent = 'Enviando...';
                try {
                    const token = getToken();
                    const res = await fetch(`${window.location.origin}/api/denuncias/${id}/comentarios`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ texto })
                    });
                    if (!res.ok) throw new Error('Error al enviar comentario');
                    const nuevo = await res.json();
                    // render nuevo
                    const newHtml = `\
                        <div class="comment">\
                            <div class="comment-author">${nuevo.es_autoridad ? 'Autoridad' : 'Ciudadano'}</div>\
                            <div class="comment-date">${new Date(nuevo.fecha).toLocaleString('es-ES')}</div>\
                            <div class="comment-text">${nuevo.texto}</div>\
                        </div>`;
                    commentsList.insertAdjacentHTML('beforeend', newHtml);
                    commentInput.value = '';
                    commentsList.scrollTop = commentsList.scrollHeight;
                } catch (err) {
                    console.error(err);
                    alert('No se pudo enviar el comentario');
                } finally {
                    sendCommentBtn.disabled = false;
                    sendCommentBtn.textContent = 'Enviar comentario';
                }
            };

        } catch (error) {
            console.error('Error al abrir detalle:', error);
            alert('No se pudo cargar el detalle de la denuncia');
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        detailImage.src = '';
        detailImage.style.display = 'none';
        noImage.style.display = 'flex';
        commentsList.innerHTML = '';
        commentInput.value = '';
        // (map cleanup reverted)
    }
});