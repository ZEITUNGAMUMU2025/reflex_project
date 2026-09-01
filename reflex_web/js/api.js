const API_BASE_URL = "http://127.0.0.1:8000/api";

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    _getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('reflex_token');
        if (token) {
            headers['Authorization'] = `Token ${token}`;
        }
        return headers;
    }

    async _handleResponse(response) {
        if (response.status === 401) {
            localStorage.removeItem('reflex_token');
            localStorage.removeItem('reflex_user');
            window.location.href = '/index.html';
            throw new Error("Unauthorized. Please log in again.");
        }
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const errorMsg = data && data.detail ? data.detail : 
                             (data ? JSON.stringify(data) : `Server error: ${response.status}`);
            throw new Error(errorMsg);
        }

        return data;
    }

    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await this._handleResponse(response);
        
        localStorage.setItem('reflex_token', data.token);
        localStorage.setItem('reflex_user', JSON.stringify(data.user));
        
        Auth.redirectBasedOnRole();
        return data;
    }

    async register(userData) {
        const response = await fetch(`${this.baseUrl}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        return this._handleResponse(response);
    }


    async logout() {
        try {
            await fetch(`${this.baseUrl}/auth/logout/`, {
                method: 'POST',
                headers: this._getHeaders()
            });
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            localStorage.removeItem('reflex_token');
            localStorage.removeItem('reflex_user');
            window.location.href = '/index.html';
        }
    }

    async getDeliveries() {
        const response = await fetch(`${this.baseUrl}/deliveries/`, {
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async createDelivery(data) {
        const response = await fetch(`${this.baseUrl}/deliveries/`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });
        return this._handleResponse(response);
    }

    async getRiders() {
        const response = await fetch(`${this.baseUrl}/riders/`, {
            headers: this._getHeaders()
        });
        return this._handleResponse(response);
    }

    async assignRider(deliveryId, riderId) {
        const response = await fetch(`${this.baseUrl}/deliveries/${deliveryId}/assign/`, {
            method: 'POST',
            headers: this._getHeaders(),
            body: JSON.stringify({ rider_id: riderId })
        });
        return this._handleResponse(response);
    }

    async updateDeliveryStatus(deliveryId, status) {
        const response = await fetch(`${this.baseUrl}/deliveries/${deliveryId}/status/`, {
            method: 'PATCH',
            headers: this._getHeaders(),
            body: JSON.stringify({ status })
        });
        return this._handleResponse(response);
    }
}

const API = new ApiService();
