document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a elementos del DOM ---
    const configForm = document.getElementById('configForm');
    const passwordForm = document.getElementById('passwordForm');

    // --- Elementos del formulario de perfil ---
    const fullNameInput = document.getElementById('fullName');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    // --- Elementos del formulario de contraseña ---
    const currentPassInput = document.getElementById('currentPass');
    const newPassInput = document.getElementById('newPass');
    const confirmPassInput = document.getElementById('confirmPass');

    // --- Estado de la aplicación ---
    let userData = null;
    const isGuest = !localStorage.getItem('token');

    // --- Funciones de Autenticación ---
    const getToken = () => localStorage.getItem('token');
    const logout = () => {
        localStorage.clear();
        window.location.href = '../login.html';
    };

    // --- Mostrar mensaje para invitados ---
    if (isGuest) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh;">
                    <div style="text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 12px; border: 2px dashed #e5e7eb; max-width: 500px;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom: 16px;">
                            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <h3 style="color: #374151; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Configuración requiere cuenta</h3>
                        <p style="color: #6b7280; margin-bottom: 20px;">Para acceder a la configuración de tu perfil, necesitas iniciar sesión.</p>
                        <a href="../registro.html" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; margin-right: 12px;">Crear Cuenta</a>
                        <a href="../login.html" style="color: #2563eb; padding: 12px 24px; font-weight: 600; text-decoration: none;">Iniciar Sesión</a>
                    </div>
                </div>
            `;
        }
        return;
    }

    // --- Funciones de API ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const token = getToken();
        if (!token) { 
            logout(); 
            return; 
        }

        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${window.location.origin}/api${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la petición');
        }

        return response.json();
    };

    // --- Cargar datos del usuario ---
    const loadUserData = async () => {
        try {
            const data = await apiCall('/auth/me');
            userData = data;

            // Cargar valores en los campos del formulario
            fullNameInput.value = `${data.nombre} ${data.apellido}` || '';
            usernameInput.value = data.email || '';
            emailInput.value = data.email || '';

            console.log('Datos de usuario cargados:', userData);
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            alert('Error al cargar los datos del usuario. Por favor, intenta nuevamente.');
            // Si falla, redirigir al login
            setTimeout(() => logout(), 2000);
        }
    };

    // --- Manejador del formulario de perfil ---
    if (configForm) {
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();

            if (!fullName || !email) {
                alert('Por favor completa todos los campos requeridos');
                return;
            }

            try {
                const [nombre, ...apellidoArray] = fullName.split(' ');
                const apellido = apellidoArray.join(' ') || '';

                const response = await apiCall('/auth/update-profile', 'PUT', {
                    nombre,
                    apellido,
                    email
                });

                alert('Perfil actualizado correctamente');
                console.log('Perfil actualizado:', response);

                // Actualizar datos locales
                userData.nombre = nombre;
                userData.apellido = apellido;
                userData.email = email;

            } catch (error) {
                console.error('Error al actualizar perfil:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // --- Manejador del formulario de contraseña ---
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPass = currentPassInput.value;
            const newPass = newPassInput.value;
            const confirmPass = confirmPassInput.value;

            if (!currentPass || !newPass || !confirmPass) {
                alert('Por favor completa todos los campos');
                return;
            }

            if (newPass.length < 6) {
                alert('La nueva contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (newPass !== confirmPass) {
                alert('Las contraseñas no coinciden');
                return;
            }

            if (currentPass === newPass) {
                alert('La nueva contraseña debe ser diferente a la actual');
                return;
            }

            try {
                const response = await apiCall('/auth/change-password', 'POST', {
                    passwordActual: currentPass,
                    passwordNueva: newPass
                });

                alert('Contraseña cambiada correctamente');
                
                // Limpiar campos
                currentPassInput.value = '';
                newPassInput.value = '';
                confirmPassInput.value = '';

                console.log('Contraseña actualizada:', response);

            } catch (error) {
                console.error('Error al cambiar contraseña:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // --- Event listener para logout ---
    document.querySelectorAll('.logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // --- Inicialización ---
    const init = async () => {
        await loadUserData();
    };

    init();
});
