// user-profile.js
// Módulo centralizado para gestionar el perfil del usuario en todas las páginas

/**
 * Verifica si el modo invitado está permitido en esta página
 */
function isGuestAllowed() {
    const currentPath = window.location.pathname;
    // Permitir modo invitado en páginas de ciudadano (incluyendo mis-denuncias)
    return currentPath.includes('/ciudadano/');
}

/**
 * Inicializa el avatar del usuario con sus iniciales
 */
function initUserProfile() {
    const profileAvatar = document.getElementById('profile-avatar');
    const userName = localStorage.getItem('userName');
    
    if (profileAvatar) {
        if (userName) {
            // Generar iniciales del nombre
            const initials = userName
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2); // Máximo 2 iniciales
            
            profileAvatar.textContent = initials;
            profileAvatar.setAttribute('title', userName); // Tooltip con nombre completo
        } else if (isGuestAllowed()) {
            // Modo invitado
            profileAvatar.textContent = '👤';
            profileAvatar.setAttribute('title', 'Invitado');
        }
    }
}

/**
 * Actualiza el nombre del usuario en el header si existe el elemento
 */
function updateUserName() {
    const userNameEl = document.getElementById('user-name');
    const userName = localStorage.getItem('userName');
    
    if (userNameEl && userName) {
        userNameEl.textContent = userName;
    }
}

/**
 * Verifica la autenticación del usuario
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Permitir modo invitado en páginas de ciudadano
        if (isGuestAllowed()) {
            return true; // Permitir acceso como invitado
        }
        
        // Determinar la ruta correcta según la ubicación actual
        const currentPath = window.location.pathname;
        if (currentPath.includes('/ciudadano/') || currentPath.includes('/autoridad/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
        return false;
    }
    return true;
}

/**
 * Maneja el logout del usuario
 */
function handleLogout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    // Determinar la ruta correcta según la ubicación actual
    const currentPath = window.location.pathname;
    if (currentPath.includes('/ciudadano/') || currentPath.includes('/autoridad/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

/**
 * Inicializa el dropdown del perfil
 */
function initProfileDropdown() {
    const profileMenu = document.querySelector('.profile-menu');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileMenu && profileDropdown) {
        // Toggle dropdown al hacer click en el avatar
        profileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });
        
        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }
    
    // Configurar botones de logout
    const logoutBtnDropdown = document.getElementById('logout-btn-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * Inicializa todos los componentes del perfil
 */
function initProfile() {
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Inicializar avatar
    initUserProfile();
    
    // Actualizar nombre de usuario
    updateUserName();
    
    // Inicializar dropdown del perfil
    initProfileDropdown();
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    // El DOM ya está listo
    initProfile();
}

// Exportar funciones para uso manual si es necesario
window.UserProfile = {
    init: initProfile,
    updateAvatar: initUserProfile,
    updateName: updateUserName,
    checkAuth: checkAuth,
    logout: handleLogout
};