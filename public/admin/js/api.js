// API Service for Admin Panel
class ApiService {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('adminToken');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('adminToken', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('adminToken');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        console.log('ApiService: Making request to:', url);
        console.log('ApiService: Request config:', {
            method: config.method || 'GET',
            headers: config.headers,
            hasToken: !!this.token
        });

        try {
            const response = await fetch(url, config);
            console.log('ApiService: Response status:', response.status);
            
            // TEMPORARY: Don't auto-redirect on 401 for testing
            /*
            if (response.status === 401) {
                console.log('ApiService: 401 Unauthorized - clearing token and redirecting');
                this.clearToken();
                window.location.href = '/admin/login.html';
                throw new Error('Unauthorized');
            }
            */

            const data = await response.json();
            console.log('ApiService: Response data:', data);
            
            if (!response.ok) {
                console.log('ApiService: Response not ok - throwing error');
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('ApiService: Request error:', error);
            throw error;
        }
    }

    // Authentication
    async login(credentials) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async logout() {
        return this.request('/admin/logout', {
            method: 'POST'
        });
    }

    async verifyToken() {
        return this.request('/admin/verify');
    }

    // Dashboard
    async getDashboardStats() {
        return this.request('/admin/dashboard/stats');
    }

    async getRecentActivity() {
        return this.request('/admin/dashboard/activity');
    }

    // Users
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
        return this.request(endpoint);
    }

    async getUser(userId) {
        return this.request(`/admin/users/${userId}`);
    }

    async updateUser(userId, userData) {
        return this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async toggleUserStatus(userId) {
        return this.request(`/admin/users/${userId}/toggle-status`, {
            method: 'PATCH'
        });
    }

    // Questions
    async getQuestions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/questions?${queryString}` : '/admin/questions';
        return this.request(endpoint);
    }

    async getQuestion(questionId) {
        return this.request(`/admin/questions/${questionId}`);
    }

    async createQuestion(questionData) {
        return this.request('/admin/questions', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    async updateQuestion(questionId, questionData) {
        return this.request(`/admin/questions/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(questionData)
        });
    }

    async deleteQuestion(questionId) {
        return this.request(`/admin/questions/${questionId}`, {
            method: 'DELETE'
        });
    }

    async toggleQuestionStatus(questionId) {
        return this.request(`/admin/questions/${questionId}/toggle-status`, {
            method: 'PATCH'
        });
    }

    // Tips
    async getTips(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/tips?${queryString}` : '/admin/tips';
        return this.request(endpoint);
    }

    async getTip(tipId) {
        return this.request(`/admin/tips/${tipId}`);
    }

    async createTip(tipData) {
        return this.request('/admin/tips', {
            method: 'POST',
            body: JSON.stringify(tipData)
        });
    }

    async updateTip(tipId, tipData) {
        return this.request(`/admin/tips/${tipId}`, {
            method: 'PUT',
            body: JSON.stringify(tipData)
        });
    }

    async deleteTip(tipId) {
        return this.request(`/admin/tips/${tipId}`, {
            method: 'DELETE'
        });
    }

    async toggleTipStatus(tipId) {
        return this.request(`/admin/tips/${tipId}/toggle-status`, {
            method: 'PATCH'
        });
    }

    // Categories
    async getCategories() {
        return this.request('/admin/categories');
    }

    async getCategory(categoryId) {
        return this.request(`/admin/categories/${categoryId}`);
    }

    async createCategory(categoryData) {
        return this.request('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(categoryId, categoryData) {
        return this.request(`/admin/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(categoryId) {
        return this.request(`/admin/categories/${categoryId}`, {
            method: 'DELETE'
        });
    }

    // Quiz Results
    async getQuizResults(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/quiz-results?${queryString}` : '/admin/quiz-results';
        return this.request(endpoint);
    }

    async getQuizResult(resultId) {
        return this.request(`/admin/quiz-results/${resultId}`);
    }

    async deleteQuizResult(resultId) {
        return this.request(`/admin/quiz-results/${resultId}`, {
            method: 'DELETE'
        });
    }

    // Notifications
    async getNotifications() {
        return this.request('/admin/notifications');
    }

    async sendNotification(notificationData) {
        return this.request('/admin/notifications', {
            method: 'POST',
            body: JSON.stringify(notificationData)
        });
    }

    async deleteNotification(notificationId) {
        return this.request(`/admin/notifications/${notificationId}`, {
            method: 'DELETE'
        });
    }

    // Analytics
    async getAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/admin/analytics?${queryString}` : '/admin/analytics';
        return this.request(endpoint);
    }

    async getUserGrowth() {
        return this.request('/admin/analytics/user-growth');
    }

    async getQuizPerformance() {
        return this.request('/admin/analytics/quiz-performance');
    }

    async getLevelDistribution() {
        return this.request('/admin/analytics/level-distribution');
    }

    async getDailyActiveUsers() {
        return this.request('/admin/analytics/daily-active-users');
    }

    // Settings
    async getSettings() {
        return this.request('/admin/settings');
    }

    async updateSettings(settingsData) {
        return this.request('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });
    }

    // File Upload
    async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request('/admin/upload', {
            method: 'POST',
            headers: {
                // Don't set Content-Type for FormData
            },
            body: formData
        });
    }

    // Health Check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API instance
window.apiService = new ApiService(); 