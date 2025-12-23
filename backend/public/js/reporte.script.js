document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const districtChart = document.getElementById('districtChart');
    const problemTypeChart = document.getElementById('problemTypeChart');
    const responseTimeChart = document.getElementById('responseTimeChart');
    const statusChart = document.getElementById('statusChart');
    const reportList = document.getElementById('reportList');
    const statusFilter = document.getElementById('statusFilter');
    const dateRangeSelect = document.getElementById('dateRange');
    const districtSelect = document.getElementById('district');
    const categorySelect = document.getElementById('category');
    const pdfExportBtn = document.querySelector('.btn-export.pdf');
    const excelExportBtn = document.querySelector('.btn-export.excel');
    const detailModal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');
    const closeDetailBtn = document.getElementById('closeDetail');
    const seguimientoMap = document.getElementById('seguimientoMap');

    // --- Estado de la aplicación ---
    let allDenuncias = [];
    let charts = {};
    let mapInstance = null;

    // --- Configuración de API ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    const apiCall = async (endpoint) => {
        const token = getToken();
        if (!token) { logout(); return; }
        const response = await fetch(`${window.location.origin}/api/denuncias${endpoint}`, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }
        return response.json();
    };

    // --- Funciones Auxiliares ---
    const getEstadoInfo = (estado) => {
        const estados = {
            'recibido': { text: 'Pendiente', class: 'pending', color: '#FFA500' },
            'en_progreso': { text: 'En Proceso', class: 'in-progress', color: '#3B82F6' },
            'resuelto': { text: 'Resuelta', class: 'resolved', color: '#10B981' },
            'rechazado': { text: 'Rechazada', class: 'rejected', color: '#EF4444' }
        };
        return estados[estado] || { text: 'Desconocido', class: 'pending', color: '#6B7280' };
    };

    const getDaysAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 'Hoy' : `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    };

    const filterDenuncias = () => {
        let filtered = [...allDenuncias];

        // Filtrar por estado
        if (statusFilter.value !== 'all') {
            const estadoMap = {
                'pending': 'recibido',
                'in-progress': 'en_progreso',
                'resolved': 'resuelto'
            };
            filtered = filtered.filter(d => d.estado === estadoMap[statusFilter.value]);
        }

        // Filtrar por rango de fechas
        if (dateRangeSelect.value !== 'all') {
            const days = parseInt(dateRangeSelect.value);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            filtered = filtered.filter(d => new Date(d.fecha_creacion) >= cutoffDate);
        }

        // Filtrar por distrito
        if (districtSelect.value !== 'all') {
            filtered = filtered.filter(d => d.distrito === districtSelect.value);
        }

        // Filtrar por categoría
        if (categorySelect.value !== 'all') {
            filtered = filtered.filter(d => d.id_categoria === parseInt(categorySelect.value));
        }

        return filtered;
    };

    // --- Funciones de Gráficos ---
    const initCharts = () => {
        // Gráfico de Denuncias por Distrito
        const districtData = {};
        allDenuncias.forEach(d => {
            const distrito = d.distrito || 'Sin especificar';
            districtData[distrito] = (districtData[distrito] || 0) + 1;
        });

        charts.district = new Chart(districtChart, {
            type: 'bar',
            data: {
                labels: Object.keys(districtData),
                datasets: [{
                    label: 'Denuncias',
                    data: Object.values(districtData),
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Gráfico de Tipos de Problemas (Categorías)
        const categoryData = {};
        allDenuncias.forEach(d => {
            const categoria = d.categoria || 'Sin especificar';
            categoryData[categoria] = (categoryData[categoria] || 0) + 1;
        });

        charts.problemType = new Chart(problemTypeChart, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'right' } }
            }
        });

        // Gráfico de Tiempo de Respuesta Promedio
        const distritos = [...new Set(allDenuncias.map(d => d.distrito || 'Sin especificar'))];
        const timeData = distritos.map(distrito => {
            const denunciasDistrito = allDenuncias.filter(d => (d.distrito || 'Sin especificar') === distrito);
            const tiempoPromedio = denunciasDistrito.length > 0 
                ? Math.ceil(denunciasDistrito.reduce((sum, d) => {
                    const fecha = new Date(d.fecha_creacion);
                    const hoy = new Date();
                    return sum + ((hoy - fecha) / (1000 * 60 * 60 * 24));
                }, 0) / denunciasDistrito.length)
                : 0;
            return tiempoPromedio;
        });

        charts.responseTime = new Chart(responseTimeChart, {
            type: 'line',
            data: {
                labels: distritos,
                datasets: [{
                    label: 'Días promedio',
                    data: timeData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // Gráfico de Estado de Denuncias
        const statusData = {
            recibido: 0,
            en_progreso: 0,
            resuelto: 0,
            rechazado: 0
        };
        allDenuncias.forEach(d => {
            if (statusData.hasOwnProperty(d.estado)) {
                statusData[d.estado]++;
            }
        });

        charts.status = new Chart(statusChart, {
            type: 'bar',
            data: {
                labels: ['Pendiente', 'En Proceso', 'Resuelta', 'Rechazada'],
                datasets: [{
                    label: 'Cantidad',
                    data: [statusData.recibido, statusData.en_progreso, statusData.resuelto, statusData.rechazado],
                    backgroundColor: ['#FFA500', '#3B82F6', '#10B981', '#EF4444'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    };

    const updateCharts = () => {
        const filtered = filterDenuncias();

        // Actualizar Denuncias por Distrito
        const districtData = {};
        filtered.forEach(d => {
            const distrito = d.distrito || 'Sin especificar';
            districtData[distrito] = (districtData[distrito] || 0) + 1;
        });
        charts.district.data.labels = Object.keys(districtData);
        charts.district.data.datasets[0].data = Object.values(districtData);
        charts.district.update();

        // Actualizar Tipos de Problemas
        const categoryData = {};
        filtered.forEach(d => {
            const categoria = d.categoria || 'Sin especificar';
            categoryData[categoria] = (categoryData[categoria] || 0) + 1;
        });
        charts.problemType.data.labels = Object.keys(categoryData);
        charts.problemType.data.datasets[0].data = Object.values(categoryData);
        charts.problemType.update();

        // Actualizar Estado de Denuncias
        const statusData = {
            recibido: 0,
            en_progreso: 0,
            resuelto: 0,
            rechazado: 0
        };
        filtered.forEach(d => {
            if (statusData.hasOwnProperty(d.estado)) {
                statusData[d.estado]++;
            }
        });
        charts.status.data.datasets[0].data = [statusData.recibido, statusData.en_progreso, statusData.resuelto, statusData.rechazado];
        charts.status.update();

        renderReportList(filtered);
    };

    // --- Funciones de Renderizado ---
    const renderReportList = (denuncias = allDenuncias) => {
        if (denuncias.length === 0) {
            reportList.innerHTML = '<p style="color: #9CA3AF; text-align: center; padding: 20px;">No hay denuncias para mostrar</p>';
            return;
        }

        reportList.innerHTML = denuncias.map(report => {
            const estadoInfo = getEstadoInfo(report.estado);
            return `
                <div class="report-item" style="padding: 16px; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 12px; background: white; cursor: pointer; transition: box-shadow 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                                <span style="background: ${estadoInfo.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${estadoInfo.text}</span>
                                <span style="color: #6B7280; font-size: 12px; font-weight: 600;">#${report.folio}</span>
                            </div>
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1F2937;">${report.titulo}</h4>
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;">${report.descripcion.substring(0, 80)}...</p>
                            <div style="display: flex; gap: 16px; font-size: 12px; color: #9CA3AF;">
                                <span>${report.categoria}</span>
                                <span>${getDaysAgo(report.fecha_creacion)}</span>
                            </div>
                        </div>
                        <button onclick="showDetail(${report.id})" style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Ver</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    window.showDetail = async (denunciaId) => {
        try {
            const denuncia = allDenuncias.find(d => d.id === denunciaId);
            if (!denuncia) {
                alert('Denuncia no encontrada');
                return;
            }

            const estadoInfo = getEstadoInfo(denuncia.estado);
            detailContent.innerHTML = `
                <div style="padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                        <div>
                            <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #1F2937;">${denuncia.titulo}</h2>
                            <span style="background: ${estadoInfo.color}; color: white; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">${estadoInfo.text}</span>
                        </div>
                        <span style="color: #6B7280; font-size: 18px; font-weight: 700;">#${denuncia.folio}</span>
                    </div>

                    <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1F2937;">Detalles</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">Categoría</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937;">${denuncia.categoria}</p>
                            </div>
                            <div>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">Fecha de Creación</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937;">${new Date(denuncia.fecha_creacion).toLocaleDateString('es-ES')}</p>
                            </div>
                            <div>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">Ubicación</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937;">${denuncia.latitud.toFixed(4)}, ${denuncia.longitud.toFixed(4)}</p>
                            </div>
                            <div>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">Última Actualización</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937;">${new Date(denuncia.fecha_actualizacion).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                    </div>

                    <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1F2937;">Descripción</h3>
                        <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6;">${denuncia.descripcion}</p>
                    </div>
                </div>
            `;

            detailModal.style.display = 'flex';
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            alert('Error al cargar detalles de la denuncia');
        }
    };

    // --- Funciones de Exportación ---
    const exportPDF = () => {
        alert('Funcionalidad de exportación a PDF próximamente. Se integrará con una librería como jsPDF.');
    };

    const exportExcel = () => {
        alert('Funcionalidad de exportación a Excel próximamente. Se integrará con una librería como SheetJS.');
    };

    // --- Cargar Datos ---
    const loadData = async () => {
        try {
            allDenuncias = await apiCall('/todas');
            initCharts();
            renderReportList();
        } catch (error) {
            console.error('Error al cargar denuncias:', error);
            reportList.innerHTML = '<p style="color: #EF4444;">Error al cargar los reportes. Por favor intenta de nuevo.</p>';
        }
    };

    // --- Event Listeners ---
    statusFilter.addEventListener('change', updateCharts);
    dateRangeSelect.addEventListener('change', updateCharts);
    districtSelect.addEventListener('change', updateCharts);
    categorySelect.addEventListener('change', updateCharts);
    pdfExportBtn.addEventListener('click', exportPDF);
    excelExportBtn.addEventListener('click', exportExcel);
    closeDetailBtn.addEventListener('click', () => {
        detailModal.style.display = 'none';
    });

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.style.display = 'none';
        }
    });

    // --- Inicialización ---
    loadData();
});
