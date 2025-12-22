document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const denunciaForm = document.getElementById('denunciaForm');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('category');
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const detectLocationBtn = document.getElementById('detectLocation');
    const coordsText = document.getElementById('coordsText');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const confirmModal = document.getElementById('confirmModal');
    const trackingCodeText = document.getElementById('trackingCodeText');
    const copyCodeBtn = document.getElementById('copyCode');
    const goToListBtn = document.getElementById('goToList');

    // --- Estado de la aplicación ---
    let mapInstance = null;
    let currentMarker = null;
    let selectedLat = null;
    let selectedLng = null;
    let selectedPhoto = null;
    let categorias = [];

    // --- Configuración de API ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    const apiCall = async (endpoint, method = 'GET', body = null, isFormData = false) => {
        const token = getToken();
        if (!token) { logout(); return; }

        const options = {
            method,
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
        };

        if (token && !isFormData) {
            options.headers['Authorization'] = `Bearer ${token}`;
        } else if (token && isFormData) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            if (isFormData) {
                options.body = body;
            } else {
                options.body = JSON.stringify(body);
            }
        }

        const response = await fetch(`http://localhost:3001/api/denuncias${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }

        return response.json();
    };

    // --- Inicializar Mapa ---
    const initMap = () => {
        mapInstance = L.map('map').setView([13.688, -89.192], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        mapInstance.on('click', (e) => {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;

            // Actualizar inputs
            latInput.value = selectedLat.toFixed(8);
            lngInput.value = selectedLng.toFixed(8);
            coordsText.textContent = `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;

            // Actualizar marcador
            if (currentMarker) {
                mapInstance.removeLayer(currentMarker);
            }
            currentMarker = L.marker([selectedLat, selectedLng]).addTo(mapInstance);
        });
    };

    // --- Detectar Ubicación ---
    detectLocationBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (navigator.geolocation) {
            detectLocationBtn.disabled = true;
            detectLocationBtn.textContent = 'Detectando...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    selectedLat = position.coords.latitude;
                    selectedLng = position.coords.longitude;

                    // Actualizar inputs
                    latInput.value = selectedLat.toFixed(8);
                    lngInput.value = selectedLng.toFixed(8);
                    coordsText.textContent = `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;

                    // Centrar mapa
                    mapInstance.setView([selectedLat, selectedLng], 16);

                    // Actualizar marcador
                    if (currentMarker) {
                        mapInstance.removeLayer(currentMarker);
                    }
                    currentMarker = L.marker([selectedLat, selectedLng]).addTo(mapInstance);

                    detectLocationBtn.disabled = false;
                    detectLocationBtn.textContent = 'Detectar mi ubicación';

                    console.log('Ubicación detectada:', selectedLat, selectedLng);
                },
                (error) => {
                    console.error('Error al detectar ubicación:', error);
                    alert('No se pudo detectar tu ubicación. Por favor, haz clic en el mapa.');
                    detectLocationBtn.disabled = false;
                    detectLocationBtn.textContent = 'Detectar mi ubicación';
                }
            );
        } else {
            alert('Tu navegador no soporta geolocalización');
        }
    });

    // --- Preview de Foto ---
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedPhoto = file;
            const reader = new FileReader();

            reader.onload = (event) => {
                photoPreview.innerHTML = `
                    <img src="${event.target.result}" alt="Preview">
                    <p style="color: #6B7280; font-size: 12px; margin-top: 4px;">
                        Foto cargada: ${file.name}
                    </p>
                `;
            };

            reader.readAsDataURL(file);
        }
    });

    // --- Cargar Categorías ---
    const loadCategorias = async () => {
        try {
            const response = await apiCall('/categorias');
            categorias = response;

            // Actualizar select de categorías
            categorySelect.innerHTML = '<option value="">-- Selecciona una categoría --</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                categorySelect.appendChild(option);
            });

            console.log('Categorías cargadas:', categorias);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            // Si falla, usar categorías por defecto
            console.log('Usando categorías por defecto');
        }
    };

    // --- Generar Folio Único ---
    const generateFolio = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `DEN-${year}-${random}`;
    };

    // --- Enviar Formulario ---
    denunciaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validación básica
        if (!titleInput.value.trim()) {
            alert('Por favor ingresa un título');
            return;
        }

        if (!descriptionInput.value.trim()) {
            alert('Por favor ingresa una descripción');
            return;
        }

        if (!categorySelect.value) {
            alert('Por favor selecciona una categoría');
            return;
        }

        if (!selectedLat || !selectedLng) {
            alert('Por favor selecciona una ubicación en el mapa');
            return;
        }

        try {
            // Mostrar indicador de carga
            const submitBtn = denunciaForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            // Preparar datos
            const folio = generateFolio();
            const formData = new FormData();
            formData.append('folio', folio);
            formData.append('titulo', titleInput.value.trim());
            formData.append('descripcion', descriptionInput.value.trim());
            formData.append('id_categoria', categorySelect.value);
            formData.append('latitud', selectedLat);
            formData.append('longitud', selectedLng);

            // Adjuntar foto si existe
            if (selectedPhoto) {
                formData.append('imagen', selectedPhoto);
            }

            // Enviar a la API
            const response = await apiCall('/crear', 'POST', formData, true);

            console.log('Denuncia creada:', response);

            // Mostrar modal de confirmación
            trackingCodeText.textContent = folio;
            confirmModal.style.display = 'flex';

            // Limpiar formulario
            denunciaForm.reset();
            photoPreview.innerHTML = '';
            selectedPhoto = null;
            selectedLat = null;
            selectedLng = null;

            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

        } catch (error) {
            console.error('Error al crear denuncia:', error);
            alert(`Error: ${error.message}`);

            // Restaurar botón
            const submitBtn = denunciaForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // --- Eventos del Modal ---
    copyCodeBtn.addEventListener('click', () => {
        const code = trackingCodeText.textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Código copiado al portapapeles');
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    });

    goToListBtn.addEventListener('click', () => {
        window.location.href = 'mis-denuncias.html';
    });

    // --- Cerrar Sesión ---
    document.querySelectorAll('.logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // --- Inicialización ---
    const init = async () => {
        initMap();
        await loadCategorias();
    };

    init();
});
