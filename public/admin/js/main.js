// Main Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        console.log('AdminPanel: Initializing...');
        
        // Add a small delay to prevent immediate redirects
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await this.checkAuth();
        this.setupEventListeners();
        this.loadCurrentSection();
        console.log('AdminPanel: Initialization complete');
    }

    async checkAuth() {
        try {
            console.log('AdminPanel: Checking authentication...');
            const token = localStorage.getItem('adminToken');
            console.log('AdminPanel: Token found:', token ? 'Yes' : 'No');
            
            if (!token) {
                console.log('AdminPanel: No token found');
                
                // Check if we're already on the login page to prevent redirect loops
                if (window.location.pathname.includes('login.html')) {
                    console.log('AdminPanel: Already on login page, staying here');
                    return;
                }
                
                console.log('AdminPanel: Redirecting to login');
                window.location.href = '/admin/login.html';
                return;
            }

            // TEMPORARY: Skip token verification to test if admin panel loads
            console.log('AdminPanel: TEMPORARILY SKIPPING TOKEN VERIFICATION FOR TESTING');
            this.isAuthenticated = true;
            this.updateAdminInfo({ name: 'Admin User' });
            
            // Uncomment this when you want to enable real authentication
            /*
            console.log('AdminPanel: Verifying token...');
            const response = await apiService.verifyToken();
            console.log('AdminPanel: Token verification response:', response);
            
            if (response.success) {
                console.log('AdminPanel: Authentication successful');
                this.isAuthenticated = true;
                this.updateAdminInfo(response.admin);
            } else {
                console.log('AdminPanel: Authentication failed - response not successful');
                this.logout();
            }
            */
        } catch (error) {
            console.error('AdminPanel: Auth check failed with error:', error);
            console.error('AdminPanel: Error details:', {
                message: error.message,
                stack: error.stack
            });
            // Don't logout on error for testing
            // this.logout();
        }
    }

    updateAdminInfo(admin) {
        const adminName = document.querySelector('.admin-name');
        const adminAvatar = document.querySelector('.admin-avatar');
        
        if (adminName) adminName.textContent = admin.name || 'Admin User';
        if (adminAvatar && admin.avatar) adminAvatar.src = admin.avatar;
    }

    setupEventListeners() {
        console.log('AdminPanel: Setting up event listeners...');
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        console.log('AdminPanel: Found', navItems.length, 'navigation items');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                console.log('AdminPanel: Navigation clicked:', section);
                this.navigateToSection(section);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        searchInput?.focus();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.toggleSidebar();
                        break;
                }
            }
        });
        
        console.log('AdminPanel: Event listeners setup complete');
    }

    navigateToSection(section) {
        console.log('AdminPanel: Navigating to section:', section);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${section}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
            console.log('AdminPanel: Set active nav item:', section);
        } else {
            console.error('AdminPanel: Nav item not found for section:', section);
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(section);
        }

        // Hide all sections
        const allSections = document.querySelectorAll('.content-section');
        console.log('AdminPanel: Hiding', allSections.length, 'sections');
        allSections.forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('AdminPanel: Showed section:', section);
        } else {
            console.error('AdminPanel: Target section not found:', section);
        }

        this.currentSection = section;
        this.loadSectionData(section);
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            questions: 'Question Management',
            tips: 'Tip Management',
            categories: 'Category Management',
            quizzes: 'Quiz Results',
            notifications: 'Notifications',
            analytics: 'Analytics',
            settings: 'Settings'
        };
        return titles[section] || 'Dashboard';
    }

    async loadSectionData(section) {
        try {
            console.log('AdminPanel: Loading data for section:', section);
            switch (section) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
                case 'questions':
                    await this.loadQuestions();
                    break;
                case 'tips':
                    await this.loadTips();
                    break;
                case 'categories':
                    await this.loadCategories();
                    break;
                case 'quizzes':
                    await this.loadQuizResults();
                    break;
                case 'notifications':
                    await this.loadNotifications();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
            }
        } catch (error) {
            console.error(`AdminPanel: Error loading ${section} data:`, error);
            this.showNotification('Error loading data', 'error');
        }
    }

    loadCurrentSection() {
        const hash = window.location.hash.slice(1);
        console.log('AdminPanel: Current hash:', hash);
        
        if (hash && document.getElementById(hash)) {
            console.log('AdminPanel: Loading section from hash:', hash);
            this.navigateToSection(hash);
        } else {
            console.log('AdminPanel: Loading default dashboard section');
            this.navigateToSection('dashboard');
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    }

    handleSearch(query) {
        // Implement search functionality based on current section
        console.log('Searching for:', query);
        // This will be implemented in individual section files
    }

    async logout() {
        console.log('AdminPanel: Logout called');
        try {
            await apiService.logout();
            console.log('AdminPanel: API logout successful');
        } catch (error) {
            console.error('AdminPanel: API logout error:', error);
        } finally {
            console.log('AdminPanel: Clearing token and redirecting to login');
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
        }
    }

    // Modal functions
    showModal(title, content) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalOverlay = document.getElementById('modalOverlay');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (modalOverlay) modalOverlay.classList.add('active');
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) modalOverlay.classList.remove('active');
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    // Loading states
    showLoading(element) {
        if (element) {
            element.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading...</span>
                </div>
            `;
        }
    }

    hideLoading(element) {
        if (element) {
            const spinner = element.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    // Utility functions
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Section loading functions (to be implemented in separate files)
    async loadDashboard() {
        console.log('Loading dashboard data...');
        try {
            const response = await apiService.getDashboardStats();
            if (response.success) {
                const data = response.data;
                
                // Update stats
                const statsElements = {
                    totalUsers: document.getElementById('totalUsers'),
                    totalQuestions: document.getElementById('totalQuestions'),
                    totalTips: document.getElementById('totalTips'),
                    completedQuizzes: document.getElementById('completedQuizzes')
                };
                
                if (statsElements.totalUsers) statsElements.totalUsers.textContent = data.totalUsers || 0;
                if (statsElements.totalQuestions) statsElements.totalQuestions.textContent = data.totalQuestions || 0;
                if (statsElements.totalTips) statsElements.totalTips.textContent = data.totalTips || 0;
                if (statsElements.completedQuizzes) statsElements.completedQuizzes.textContent = data.completedQuizzes || 0;
                
                // Load recent activity
                await this.loadRecentActivity();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadRecentActivity() {
        try {
            const response = await apiService.getRecentActivity();
            if (response.success) {
                const activities = response.data;
                const recentActivity = document.getElementById('recentActivity');
                
                if (recentActivity && activities.length > 0) {
                    const activityHTML = activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                            </div>
                            <div class="activity-content">
                                <p>${activity.description}</p>
                                <span>${this.formatDate(activity.createdAt)}</span>
                            </div>
                        </div>
                    `).join('');
                    
                    recentActivity.innerHTML = activityHTML;
                }
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    getActivityIcon(type) {
        const icons = {
            'user_register': 'user-plus',
            'quiz_complete': 'clipboard-check',
            'tip_view': 'lightbulb',
            'question_answer': 'question-circle'
        };
        return icons[type] || 'info-circle';
    }

    async loadUsers() {
        console.log('Loading users data...');
        try {
            const response = await apiService.getUsers();
            if (response.success) {
                const users = response.data.users || [];
                const usersTableBody = document.getElementById('usersTableBody');
                
                if (usersTableBody) {
                    if (users.length === 0) {
                        usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
                    } else {
                        const usersHTML = users.map(user => `
                            <tr>
                                <td>${user.name || 'N/A'}</td>
                                <td>${user.email}</td>
                                <td>${user.level || 1}</td>
                                <td>${user.quizScore || 0}%</td>
                                <td><span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>${this.formatDate(user.createdAt)}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                                </td>
                            </tr>
                        `).join('');
                        
                        usersTableBody.innerHTML = usersHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        }
    }

    async loadQuestions() {
        console.log('Loading questions data...');
        try {
            const response = await apiService.getQuestions();
            if (response.success) {
                const questions = response.data.questions || [];
                const questionsTableBody = document.getElementById('questionsTableBody');
                
                if (questionsTableBody) {
                    if (questions.length === 0) {
                        questionsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No questions found</td></tr>';
                    } else {
                        const questionsHTML = questions.map(question => `
                            <tr>
                                <td>${question.question}</td>
                                <td>${question.category?.name || 'N/A'}</td>
                                <td>${question.difficulty || 'Medium'}</td>
                                <td>${question.type || 'Multiple Choice'}</td>
                                <td><span class="status ${question.isActive ? 'active' : 'inactive'}">${question.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editQuestion('${question._id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${question._id}')">Delete</button>
                                </td>
                            </tr>
                        `).join('');
                        
                        questionsTableBody.innerHTML = questionsHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showNotification('Error loading questions', 'error');
        }
    }

    async loadTips() {
        console.log('Loading tips data...');
        try {
            const response = await apiService.getTips();
            if (response.success) {
                const tips = response.data.tips || [];
                const tipsGrid = document.getElementById('tipsGrid');
                
                if (tipsGrid) {
                    if (tips.length === 0) {
                        tipsGrid.innerHTML = '<div class="text-center">No tips found</div>';
                    } else {
                        const tipsHTML = tips.map(tip => `
                            <div class="tip-card">
                                <h3>${tip.title}</h3>
                                <p>${tip.content}</p>
                                <div class="tip-meta">
                                    <span class="level">Level ${tip.level || 1}</span>
                                    <span class="category">${tip.category?.name || 'General'}</span>
                                </div>
                                <div class="tip-actions">
                                    <button class="btn btn-sm btn-primary" onclick="editTip('${tip._id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTip('${tip._id}')">Delete</button>
                                </div>
                            </div>
                        `).join('');
                        
                        tipsGrid.innerHTML = tipsHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading tips:', error);
            this.showNotification('Error loading tips', 'error');
        }
    }

    async loadCategories() {
        console.log('Loading categories data...');
        try {
            const response = await apiService.getCategories();
            if (response.success) {
                const categories = response.data.categories || [];
                const categoriesGrid = document.getElementById('categoriesGrid');
                
                if (categoriesGrid) {
                    if (categories.length === 0) {
                        categoriesGrid.innerHTML = '<div class="text-center">No categories found</div>';
                    } else {
                        const categoriesHTML = categories.map(category => `
                            <div class="category-card">
                                <h3>${category.name}</h3>
                                <p>${category.description || 'No description'}</p>
                                <div class="category-stats">
                                    <span>${category.questionCount || 0} Questions</span>
                                    <span>${category.tipCount || 0} Tips</span>
                                </div>
                                <div class="category-actions">
                                    <button class="btn btn-sm btn-primary" onclick="editCategory('${category._id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category._id}')">Delete</button>
                                </div>
                            </div>
                        `).join('');
                        
                        categoriesGrid.innerHTML = categoriesHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Error loading categories', 'error');
        }
    }

    async loadQuizResults() {
        console.log('Loading quiz results data...');
        try {
            const response = await apiService.getQuizResults();
            if (response.success) {
                const results = response.data.results || [];
                const quizResultsTableBody = document.getElementById('quizResultsTableBody');
                
                if (quizResultsTableBody) {
                    if (results.length === 0) {
                        quizResultsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No quiz results found</td></tr>';
                    } else {
                        const resultsHTML = results.map(result => `
                            <tr>
                                <td>${result.user?.name || 'Unknown User'}</td>
                                <td>${result.score || 0}%</td>
                                <td>${result.level || 1}</td>
                                <td>${result.timeSpent || 'N/A'}</td>
                                <td>${this.formatDate(result.createdAt)}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="viewQuizResult('${result._id}')">View</button>
                                </td>
                            </tr>
                        `).join('');
                        
                        quizResultsTableBody.innerHTML = resultsHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading quiz results:', error);
            this.showNotification('Error loading quiz results', 'error');
        }
    }

    async loadNotifications() {
        console.log('Loading notifications data...');
        try {
            const response = await apiService.getNotifications();
            if (response.success) {
                const notifications = response.data.notifications || [];
                const notificationsList = document.getElementById('notificationsList');
                
                if (notificationsList) {
                    if (notifications.length === 0) {
                        notificationsList.innerHTML = '<div class="text-center">No notifications found</div>';
                    } else {
                        const notificationsHTML = notifications.map(notification => `
                            <div class="notification-item">
                                <h4>${notification.title}</h4>
                                <p>${notification.message}</p>
                                <span class="notification-time">${this.formatDate(notification.createdAt)}</span>
                                <div class="notification-actions">
                                    <button class="btn btn-sm btn-danger" onclick="deleteNotification('${notification._id}')">Delete</button>
                                </div>
                            </div>
                        `).join('');
                        
                        notificationsList.innerHTML = notificationsHTML;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showNotification('Error loading notifications', 'error');
        }
    }

    async loadAnalytics() {
        console.log('Loading analytics data...');
        try {
            // Load various analytics data
            const [userGrowth, quizPerformance, levelDistribution, dailyUsers] = await Promise.all([
                apiService.getUserGrowth(),
                apiService.getQuizPerformance(),
                apiService.getLevelDistribution(),
                apiService.getDailyActiveUsers()
            ]);

            // Initialize charts with real data
            this.initializeCharts(userGrowth, quizPerformance, levelDistribution, dailyUsers);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showNotification('Error loading analytics', 'error');
        }
    }

    initializeCharts(userGrowth, quizPerformance, levelDistribution, dailyUsers) {
        // Initialize Chart.js charts with real data
        // This would be implemented with Chart.js library
        console.log('Initializing charts with real data...');
    }

    async loadSettings() {
        console.log('Loading settings data...');
        try {
            const response = await apiService.getSettings();
            if (response.success) {
                const settings = response.data.settings || {};
                
                // Populate settings forms
                const appName = document.getElementById('appName');
                const adminEmail = document.getElementById('adminEmail');
                const questionsPerQuiz = document.getElementById('questionsPerQuiz');
                const timeLimit = document.getElementById('timeLimit');
                
                if (appName) appName.value = settings.appName || 'SpeakCraft';
                if (adminEmail) adminEmail.value = settings.adminEmail || 'admin@speakcraft.com';
                if (questionsPerQuiz) questionsPerQuiz.value = settings.questionsPerQuiz || 5;
                if (timeLimit) timeLimit.value = settings.timeLimit || 10;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Error loading settings', 'error');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .loading-spinner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2rem;
        color: #64748b;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }

    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: background-color 0.3s ease;
    }

    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style); 