const Auth = {
    isLoggedIn() {
        return !!localStorage.getItem('reflex_token');
    },

    getUser() {
        const userStr = localStorage.getItem('reflex_user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    redirectBasedOnRole() {
        const user = this.getUser();
        if (!user) return;

        let path = '';
        if (user.role === 'RETAILER') {
            path = '/retailer/dashboard.html';
        } else if (user.role === 'DISPATCHER') {
            path = '/dispatcher/dashboard.html';
        } else if (user.role === 'RIDER') {
            path = '/rider/dashboard.html';
        }

        // Only redirect if not already on the correct page
        if (path && window.location.pathname !== path) {
            window.location.href = path;
        }
    },
    
    enforceRole(roleRequired) {
        if (!this.isLoggedIn()) {
            window.location.href = '/index.html';
            return;
        }
        
        const user = this.getUser();
        if (!user || user.role !== roleRequired) {
            this.redirectBasedOnRole();
        }
        
        // Update header user info if exists
        const userInfoEl = document.getElementById('user-info');
        if (userInfoEl && user) {
            userInfoEl.textContent = `${user.name} (${user.role})`;
        }
    }
};

// Global logout handler
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            API.logout();
        });
    }
});
