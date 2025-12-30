document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const mapContainer = document.getElementById('map');
    const myLocationBtn = document.getElementById('myLocationBtn');
    const filterBtn = document.getElementById('filterBtn');
    const closeFilterPanelBtn = document.getElementById('closeFilterPanel');
    const filterPanel = document.getElementById('filterPanel');
    const applyFiltersBtn = document.querySelector('.btn-apply-filters');

    // --- Estado de la Aplicación ---
    let map;
    let markers = [];
    let allDenuncias = [];
    let currentFilters = {
        status: ['recibido', 'en_progreso', 'resuelto'],
        category: []
    };
    const isGuest = !localStorage.getItem('token');

    // --- Funciones de Autenticación ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    // --- Función de la API ---
    const apiCall = async (endpoint, method = 'GET', requiresAuth = true) => {
        const token = getToken();
        
        // Si requiere auth y no hay token, salir
        if (requiresAuth && !token && !isGuest) { logout(); return; }
        
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };

        const response = await fetch(`${window.location.origin}/api/denuncias${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }

        return response.json();
    };

    // --- Inicializar Mapa ---
    const initMap = () => {
        map = L.map('map').setView([13.688, -89.192], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
    };

    // --- Cargar Denuncias ---
    const loadDenuncias = async () => {
        try {
            // La ruta /todas es pública, no requiere autenticación
            allDenuncias = await apiCall('/todas', 'GET', false);
            console.log('Denuncias cargadas para mapa:', allDenuncias);
            renderMarkers();
            updateStats();
        } catch (error) {
            console.error('Error al cargar denuncias:', error);
        }
    };

    // --- Obtener Icono de Estado ---
    const getMarkerIcon = (estado) => {
        const colors = {
            'recibido': '#FFA500',      // Naranja
            'en_progreso': '#3B82F6',   // Azul
            'resuelto': '#10B981'       // Verde
        };

        const color = colors[estado] || '#6B7280';

        return L.divIcon({
            html: `<div style="
                background-color: ${color}; 
                color: white; 
                border-radius: 50%; 
                width: 34px; 
                height: 34px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-weight: bold;
                font-size: 16px;
            ">📍</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
    };

    // --- Renderizar Marcadores ---
    const renderMarkers = () => {
        // Limpiar marcadores existentes
        markers.forEach(m => map.removeLayer(m.marker));
        markers = [];

        // Agregar nuevos marcadores
        allDenuncias.forEach(denuncia => {
            const isStatusVisible = currentFilters.status.includes(denuncia.estado);
            const isCategoryVisible = currentFilters.category.length === 0 || 
                                    currentFilters.category.includes(denuncia.id_categoria.toString());

            if (isStatusVisible && isCategoryVisible) {
                const marker = L.marker([denuncia.latitud, denuncia.longitud], {
                    icon: getMarkerIcon(denuncia.estado)
                });

                const estadoTexto = getEstadoTexto(denuncia.estado);
                marker.bindPopup(`
                    <div style="max-width: 200px;">
                        <h4 style="margin: 0 0 8px 0; color: #1F2937;">${denuncia.titulo}</h4>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">${denuncia.descripcion.substring(0, 80)}...</p>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF;">
                            <span><strong>Categoría:</strong> ${denuncia.categoria}</span>
                            <span><strong>Estado:</strong> ${estadoTexto}</span>
                        </div>
                    </div>
                `);

                marker.addTo(map);

                markers.push({
                    marker: marker,
                    denuncia: denuncia
                });
            }
        });

        // Ajustar vista si hay marcadores
        if (markers.length > 0) {
            const group = L.featureGroup(markers.map(m => m.marker));
            map.fitBounds(group.getBounds().pad(0.1));
        }
    };

    // --- Obtener Texto de Estado ---
    const getEstadoTexto = (estado) => {
        const textos = {
            'recibido': 'Pendiente',
            'en_progreso': 'En Progreso',
            'resuelto': 'Resuelta',
            'rechazado': 'Rechazada'
        };
        return textos[estado] || estado;
    };

    // --- Actualizar Estadísticas ---
    const updateStats = () => {
        const stats = {
            total: allDenuncias.length,
            recibido: allDenuncias.filter(d => d.estado === 'recibido').length,
            en_progreso: allDenuncias.filter(d => d.estado === 'en_progreso').length,
            resuelto: allDenuncias.filter(d => d.estado === 'resuelto').length,
        };

        const statTotal = document.getElementById('stat-total');
        const statPending = document.getElementById('stat-pending');
        const statProgress = document.getElementById('stat-progress');
        const statResolved = document.getElementById('stat-resolved');

        if (statTotal) statTotal.textContent = stats.total;
        if (statPending) statPending.textContent = stats.recibido;
        if (statProgress) statProgress.textContent = stats.en_progreso;
        if (statResolved) statResolved.textContent = stats.resuelto;
    };

    // --- Event Listeners ---
    
    // Botón de mi ubicación
    if (myLocationBtn) {
        myLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                myLocationBtn.disabled = true;
                myLocationBtn.textContent = 'Detectando...';

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        map.setView([latitude, longitude], 16);

                        // Mostrar marcador temporal
                        const userMarker = L.circleMarker([latitude, longitude], {
                            color: '#0066FF',
                            fillColor: '#0066FF',
                            fillOpacity: 0.3,
                            radius: 10
                        }).addTo(map).bindPopup('¡Tu ubicación!').openPopup();

                        setTimeout(() => {
                            map.removeLayer(userMarker);
                            myLocationBtn.disabled = false;
                            myLocationBtn.textContent = 'Mi Ubicación';
                        }, 3000);
                    },
                    (error) => {
                        console.error('Error de geolocalización:', error);
                        alert('No se pudo acceder a tu ubicación');
                        myLocationBtn.disabled = false;
                        myLocationBtn.textContent = 'Mi Ubicación';
                    }
                );
            }
        });
    }

    // Panel de filtros
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            filterPanel.style.display = filterPanel.style.display === 'none' ? 'flex' : 'none';
            filterBtn.classList.toggle('active');
        });
    }

    if (closeFilterPanelBtn) {
        closeFilterPanelBtn.addEventListener('click', () => {
            filterPanel.style.display = 'none';
            filterBtn.classList.remove('active');
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            // Obtener filtros seleccionados
            const statusCheckboxes = document.querySelectorAll('input[name="status"]:checked');
            const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');

            currentFilters.status = Array.from(statusCheckboxes).map(cb => cb.value);
            currentFilters.category = Array.from(categoryCheckboxes).map(cb => cb.value);

            renderMarkers();
            filterPanel.style.display = 'none';
            filterBtn.classList.remove('active');
        });
    }

    // Logout
    document.querySelectorAll('.logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // --- Inicialización ---
    const init = async () => {
        initMap();
        await loadDenuncias();
    };

    init();
});