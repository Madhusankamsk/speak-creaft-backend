// Users Management JavaScript
class UsersManager {
    constructor() {
        this.users = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUsers();
    }

    setupEventListeners() {
        const addUserBtn = document.getElementById('addUserBtn');
        const userSearch = document.getElementById('userSearch');
        const userFilter = document.getElementById('userFilter');

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        if (userSearch) {
            userSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        if (userFilter) {
            userFilter.addEventListener('change', (e) => this.handleFilter(e.target.value));
        }
    }

    async loadUsers() {
        try {
            const response = await apiService.getUsers();
            if (response.success) {
                this.users = response.data.users || [];
                this.renderUsers();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }

        const usersHTML = this.users.map(user => `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.level || 1}</td>
                <td>${user.quizScore || 0}%</td>
                <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="usersManager.editUser('${user._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="usersManager.deleteUser('${user._id}')">Delete</button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = usersHTML;
    }

    async editUser(userId) {
        try {
            const response = await apiService.getUser(userId);
            if (response.success) {
                this.showEditUserModal(response.data.user);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            this.showNotification('Error loading user details', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await apiService.deleteUser(userId);
            if (response.success) {
                this.showNotification('User deleted successfully', 'success');
                this.loadUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        }
    }

    showAddUserModal() {
        // Implementation for add user modal
        console.log('Show add user modal');
    }

    showEditUserModal(user) {
        // Implementation for edit user modal
        console.log('Show edit user modal for:', user);
    }

    handleSearch(query) {
        // Filter users based on search query
        console.log('Search query:', query);
    }

    handleFilter(filter) {
        // Filter users based on selected filter
        console.log('Filter:', filter);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    showNotification(message, type = 'info') {
        // Use the notification system from main.js
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

// Initialize users manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.usersManager = new UsersManager();
}); 