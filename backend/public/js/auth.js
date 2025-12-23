import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const registerForm = document.getElementById('register-form');
    const loginView = document.getElementById('login-view'); // Asumimos que tienes un div con este id para el login
    const registerView = document.getElementById('register-form').parentElement.parentElement; // Contenedor del formulario de registro
    const linkToLogin = document.getElementById('link-to-login');
    const linkToRegister = document.getElementById('link-to-register'); // Asumimos que tienes este enlace

    // --- Lógica para cambiar entre formularios (si tienes ambos en la misma página) ---
    linkToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });

    linkToRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    // Función para mostrar/ocultar la contraseña
    window.togglePassword = (inputId) => {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    };

    // --- Lógica del formulario de registro ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            dni: document.getElementById('dni').value,
            email: document.getElementById('email').value,
            rol: document.getElementById('rol').value,
            password: document.getElementById('password').value,
        };

        try {
            await api.register(userData);
            alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
            registerForm.reset();
            // Opcional: redirigir al login
            // window.location.href = 'login.html'; 
        } catch (error) {
            alert('Error al registrar: ' + error.message);
        }
    });

    // --- Lógica del formulario de login (si lo tienes en la misma página) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const credentials = {
                email: document.getElementById('log-email').value,
                password: document.getElementById('log-password').value,
            };
            try {
                const response = await api.login(credentials);
                alert(`¡Bienvenido ${response.usuario.nombre}!`);
                localStorage.setItem('token', response.token);
            } catch (error) {
                alert('Error al iniciar sesión: ' + error.message);
            }
        });
    }
});