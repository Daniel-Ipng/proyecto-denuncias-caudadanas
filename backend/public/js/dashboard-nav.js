// Gestionar el dropdown del perfil
document.addEventListener('DOMContentLoaded', () => {
    const profileMenu = document.querySelector('.profile-menu');
    const profileAvatar = document.querySelector('.profile-avatar');

    // Toggle dropdown al hacer click en el avatar
    if (profileAvatar) {
        profileAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });
    }

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        if (profileMenu && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
        }
    });

    // Cerrar dropdown al hacer click en un link (excepto logout)
    const profileLinks = document.querySelectorAll('.profile-dropdown a:not(#logout-btn-dropdown)');
    profileLinks.forEach(link => {
        link.addEventListener('click', () => {
            profileMenu.classList.remove('active');
        });
    });

    // Manejar logout desde todos los botones
    const logoutButtons = document.querySelectorAll('#logout-btn, #logout-btn-dropdown');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            // Determinar la ruta correcta según la ubicación actual
            const currentPath = window.location.pathname;
            if (currentPath.includes('/ciudadano/') || currentPath.includes('/autoridad/')) {
                window.location.href = '../login.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    });
});
