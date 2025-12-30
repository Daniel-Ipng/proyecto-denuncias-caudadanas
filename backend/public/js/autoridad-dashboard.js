document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const totalDenunciasEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
    const pendientesEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
    const enProcesoEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
    const resueltasEl = document.querySelector('.stat-card:nth-child(4) .stat-number');
    const reportsGrid = document.querySelector('.reports-grid');
    const userNameEl = document.getElementById('user-name');
    const notificationBadge = document.getElementById('notification-badge');

    // --- Estado de la aplicación ---
    let allDenuncias = [];

    // --- Funciones de Autenticación y Utilidades ---
    const getToken = () => localStorage.getItem('token');
    const getUserRole = () => localStorage.getItem('userRol');
    
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    // Verificar que el usuario es autoridad
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
        if (userName && userNameEl) {
            userNameEl.textContent = userName;
        }
    };

    const loadStats = async () => {
        try {
            // Para autoridad, obtener todas las denuncias
            const allDenuncias = await apiCall('/todas');
            
            const stats = {
                total: allDenuncias.length,
                pendientes: allDenuncias.filter(d => d.estado === 'recibido').length,
                en_progreso: allDenuncias.filter(d => d.estado === 'en_progreso').length,
                resueltas: allDenuncias.filter(d => d.estado === 'resuelto').length
            };

            totalDenunciasEl.textContent = stats.total || 0;
            pendientesEl.textContent = stats.pendientes || 0;
            enProcesoEl.textContent = stats.en_progreso || 0;
            resueltasEl.textContent = stats.resueltas || 0;

            // Actualizar badge de notificaciones con pendientes
            if (notificationBadge) {
                notificationBadge.textContent = stats.pendientes;
            }

            return allDenuncias;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            alert('No se pudieron cargar las estadísticas.');
            return [];
        }
    };

    // --- Funciones de Renderizado ---
    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'recibido': return { text: 'Por Revisar', class: 'pending' };
            case 'en_progreso': return { text: 'En Atención', class: 'in-progress' };
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
        // Priorizar denuncias pendientes y recientes
        const prioritarias = allDenuncias
            .sort((a, b) => {
                // Primero las pendientes, luego por fecha
                if (a.estado === 'recibido' && b.estado !== 'recibido') return -1;
                if (a.estado !== 'recibido' && b.estado === 'recibido') return 1;
                return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
            })
            .slice(0, 4);

        if (prioritarias.length === 0) {
            reportsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No hay denuncias para mostrar</p>';
            return;
        }

        reportsGrid.innerHTML = prioritarias.map(report => {
            const estadoInfo = getEstadoInfo(report.estado);
            const ciudadano = `${report.nombre} ${report.apellido}`;
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
                        <span>Reportado por: ${ciudadano}</span>
                    </div>
                    <div class="card-footer">
                        <div class="card-category">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            <span>${report.categoria}</span>
                        </div>
                        <button class="btn-view-details" onclick="window.location.href='denuncias.html'">Ver detalles →</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    // --- Event Listeners ---
    const setupEventListeners = () => {
        const logoutBtns = document.querySelectorAll('#logout-btn, #logout-btn-dropdown');
        logoutBtns.forEach(btn => btn.addEventListener('click', logout));
    };

    // --- Inicialización ---
    const init = async () => {
        verifyAutority();
        loadUserData();
        allDenuncias = await loadStats();
        renderReports();
        setupEventListeners();
    };

    init();
});
