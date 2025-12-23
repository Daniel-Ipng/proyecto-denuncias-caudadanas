// API_URL se ajusta automáticamente según el entorno
const API_URL = `${window.location.origin}/api`;

async function apiCall(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        
        const textResponse = await response.text();
        
        let jsonData;
        try {
            jsonData = JSON.parse(textResponse);
        } catch (e) {
            throw new Error(`Error del servidor: ${textResponse.substring(0, 100)}`);
        }
        
        if (!response.ok) {
            throw new Error(jsonData.message || `Error ${response.status}`);
        }
        
        return jsonData;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

export const api = {
    register: (data) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};