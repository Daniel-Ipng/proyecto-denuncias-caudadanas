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
    const isGuest = !localStorage.getItem('token');

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
                    <h2>¡Regístrate para reportar!</h2>
                    <p>Para enviar una denuncia y hacer seguimiento, necesitas crear una cuenta gratuita.</p>
                    <div class="guest-modal-benefits">
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Recibe notificaciones del estado</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Comunícate con las autoridades</span>
                        </div>
                        <div class="benefit-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Historial de todos tus reportes</span>
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
                .guest-modal-icon { margin-bottom: 20px; }
                .guest-modal h2 { color: #1a1a1a; font-size: 24px; font-weight: 800; margin-bottom: 12px; }
                .guest-modal p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
                .guest-modal-benefits { text-align: left; margin-bottom: 28px; }
                .benefit-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; color: #374151; font-size: 14px; }
                .guest-modal-buttons { display: flex; flex-direction: column; gap: 12px; }
                .btn-register { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.3s; }
                .btn-register:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4); }
                .btn-login-alt { color: #2563eb; padding: 12px 24px; font-weight: 600; font-size: 14px; text-decoration: none; transition: all 0.3s; }
                .btn-login-alt:hover { background: #eff6ff; border-radius: 8px; }
                .guest-modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; color: #9ca3af; cursor: pointer; }
                .guest-modal-close:hover { color: #1a1a1a; }
                .form-disabled { opacity: 0.6; pointer-events: none; }
                .guest-form-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    cursor: pointer;
                    z-index: 10;
                }
                .guest-form-message {
                    background: white;
                    padding: 24px 32px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    text-align: center;
                }
                .guest-form-message h3 { color: #1a1a1a; margin-bottom: 8px; }
                .guest-form-message p { color: #6b7280; font-size: 14px; }
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

    // --- Configuración de API ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    const apiCall = async (endpoint, method = 'GET', body = null, isFormData = false) => {
        const token = getToken();
        if (!token) { 
            showGuestModal();
            return null;
        }

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

        const response = await fetch(`${window.location.origin}/api/denuncias${endpoint}`, options);

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
        window.location.href = '../ciudadano/mis-denuncias.html';
    });

    // --- Cerrar Sesión ---
    document.querySelectorAll('.logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // --- Overlay para invitados en el formulario ---
    const addGuestOverlay = () => {
        if (!isGuest) return;
        
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.style.position = 'relative';
            const overlay = document.createElement('div');
            overlay.className = 'guest-form-overlay';
            overlay.onclick = showGuestModal;
            overlay.innerHTML = `
                <div class="guest-form-message">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="margin-bottom: 12px;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <h3>Regístrate para reportar</h3>
                    <p>Haz clic aquí para crear tu cuenta gratuita</p>
                </div>
            `;
            formCard.appendChild(overlay);
        }
    };

    // --- Inicialización ---
    const init = async () => {
        createGuestModal();
        initMap();
        await loadCategorias();
        addGuestOverlay();
        
        // Si es invitado, mostrar modal automáticamente después de un breve delay
        if (isGuest) {
            setTimeout(() => {
                showGuestModal();
            }, 1500);
        }
    };

    init();
});