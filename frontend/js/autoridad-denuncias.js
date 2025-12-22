document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const denunciasList = document.getElementById('denuncias-list');
    const emptyState = document.getElementById('empty-state');
    const logoutBtns = document.querySelectorAll('#logout-btn, #logout-btn-dropdown');
    const profileAvatar = document.getElementById('profile-avatar');

    // --- Estado de la aplicación ---
    let allDenuncias = [];
    let filteredDenuncias = [];
    let currentFilter = 'all';

    // --- Funciones de Autenticación ---
    const getToken = () => localStorage.getItem('token');
    const getUserRole = () => localStorage.getItem('userRol');
    
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    const verifyAutority = () => {
        const role = getUserRole();
        if (role !== 'autoridad') {
            alert('Acceso denegado: Solo autoridades pueden acceder');
            window.location.href = '../login.html';
        }
    };

    // --- Función de la API ---
    const apiCall = async (endpoint) => {
        const token = getToken();
        if (!token) { logout(); return; }
        const response = await fetch(`http://localhost:3001/api/denuncias${endpoint}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }
        return response.json();
    };

    // --- Cargar datos ---
    const loadDenuncias = async () => {
        try {
            allDenuncias = await apiCall('/todas');
            updateCounts();
            filterAndRender();
        } catch (error) {
            console.error('Error al cargar denuncias:', error);
            alert('No se pudieron cargar las denuncias.');
        }
    };

    // --- Funciones de filtrado ---
    const filterDenuncias = (query = '', status = 'all') => {
        filteredDenuncias = allDenuncias.filter(d => {
            const matchesSearch = query === '' || 
                d.titulo.toLowerCase().includes(query.toLowerCase()) ||
                d.descripcion.toLowerCase().includes(query.toLowerCase()) ||
                d.folio.toLowerCase().includes(query.toLowerCase());
            
            const matchesStatus = status === 'all' || d.estado === status;
            
            return matchesSearch && matchesStatus;
        });
    };

    const updateCounts = () => {
        document.getElementById('count-all').textContent = allDenuncias.length;
        document.getElementById('count-pending').textContent = allDenuncias.filter(d => d.estado === 'recibido').length;
        document.getElementById('count-progress').textContent = allDenuncias.filter(d => d.estado === 'en_progreso').length;
        document.getElementById('count-resolved').textContent = allDenuncias.filter(d => d.estado === 'resuelto').length;
    };

    // --- Renderizado ---
    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'recibido': return { text: 'Por Revisar', class: 'pending' };
            case 'en_progreso': return { text: 'En Atención', class: 'in-progress' };
            case 'resuelto': return { text: 'Resuelta', class: 'resolved' };
            default: return { text: 'Desconocido', class: 'pending' };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderDenuncias = () => {
        if (filteredDenuncias.length === 0) {
            denunciasList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        denunciasList.style.display = 'block';
        emptyState.style.display = 'none';

        denunciasList.innerHTML = filteredDenuncias.map(denuncia => {
            const estadoInfo = getEstadoInfo(denuncia.estado);
            return `
                <div class="denuncia-card">
                    <div class="denuncia-header">
                        <div>
                            <h3 class="denuncia-title">${denuncia.titulo}</h3>
                            <p class="denuncia-folio">Folio: #${denuncia.folio}</p>
                        </div>
                        <span class="status-badge ${estadoInfo.class}">${estadoInfo.text}</span>
                    </div>
                    <p class="denuncia-description">${denuncia.descripcion}</p>
                    <div class="denuncia-meta">
                        <span class="meta-item">
                            <strong>Categoría:</strong> ${denuncia.categoria}
                        </span>
                        <span class="meta-item">
                            <strong>Reportado por:</strong> ${denuncia.nombre} ${denuncia.apellido}
                        </span>
                        <span class="meta-item">
                            <strong>Fecha:</strong> ${formatDate(denuncia.fecha_creacion)}
                        </span>
                    </div>
                    <div class="denuncia-actions">
                        <button class="btn-action btn-primary" onclick="alert('Atender denuncia #${denuncia.folio}')">Atender</button>
                        <button class="btn-action btn-secondary" onclick="alert('Ver detalles de #${denuncia.folio}')">Ver Detalles</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    const filterAndRender = () => {
        const query = searchInput.value;
        filterDenuncias(query, currentFilter);
        renderDenuncias();
    };

    // --- Event Listeners ---
    searchInput.addEventListener('input', filterAndRender);

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterAndRender();
        });
    });

    logoutBtns.forEach(btn => btn.addEventListener('click', logout));

    // --- Inicialización ---
    const init = async () => {
        verifyAutority();
        await loadDenuncias();
    };

    init();
});
