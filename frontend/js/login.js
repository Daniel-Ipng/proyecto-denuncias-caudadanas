import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    // Función para mostrar/ocultar la contraseña (reutilizamos la misma)
    window.togglePassword = (inputId) => {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    };

    // --- Lógica del formulario de login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        const credentials = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };

        try {
            const response = await api.login(credentials);
    
            alert(`¡Bienvenido, ${response.usuario.nombre}!`);

            // Guardamos el token y otros datos en el almacenamiento del navegador
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRol', response.rol);
            localStorage.setItem('userName', response.usuario.nombre);
            localStorage.setItem('userId', response.usuario.id);

            console.log('Sesión iniciada. Token guardado.');
            
            // ¡REDIRECCIÓN AUTOMÁTICA AL DASHBOARD SEGÚN ROL!
            if (response.rol === 'autoridad') {
                window.location.href = 'autoridad/dashboard.html';
            } else {
                window.location.href = 'ciudadano/dashboard.html';
            } 

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            alert('Error al iniciar sesión: ' + error.message);
        }
    });
});