// Admin Authentication JavaScript
class AdminAuth {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        if (!this.token) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await apiService.verifyToken();
            if (!response.success) {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async logout() {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = '/admin/login.html';
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
}); 