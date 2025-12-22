// user-profile.js
// Módulo centralizado para gestionar el perfil del usuario en todas las páginas

/**
 * Inicializa el avatar del usuario con sus iniciales
 */
function initUserProfile() {
    const profileAvatar = document.getElementById('profile-avatar');
    const userName = localStorage.getItem('userName');
    
    if (profileAvatar && userName) {
        // Generar iniciales del nombre
        const initials = userName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2); // Máximo 2 iniciales
        
        profileAvatar.textContent = initials;
        profileAvatar.setAttribute('title', userName); // Tooltip con nombre completo
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
 * Inicializa todos los componentes del perfil
 */
function initProfile() {
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Inicializar avatar
    initUserProfile();
    
    // Actualizar nombre de usuario
    updateUserName();
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
    checkAuth: checkAuth
};
