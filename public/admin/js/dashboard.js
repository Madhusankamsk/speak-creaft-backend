// Dashboard functionality
class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        // Initialize charts when dashboard is loaded
        if (document.getElementById('dashboard').classList.contains('active')) {
            this.loadDashboard();
        }
    }

    async loadDashboard() {
        try {
            // Show loading states
            this.showLoadingStates();

            // Load dashboard data
            const [statsResponse, activityResponse] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getRecentActivity()
            ]);

            // Update stats
            this.updateStats(statsResponse.data);

            // Update recent activity
            this.updateRecentActivity(activityResponse.data);

            // Initialize charts
            this.initializeCharts(statsResponse.data);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            adminPanel.showNotification('Error loading dashboard data', 'error');
        }
    }

    showLoadingStates() {
        // Show loading for stats
        const statElements = ['totalUsers', 'totalQuestions', 'totalTips', 'completedQuizzes'];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '...';
            }
        });

        // Show loading for activity
        const activityList = document.getElementById('recentActivity');
        if (activityList) {
            adminPanel.showLoading(activityList);
        }
    }

    updateStats(stats) {
        // Update stat cards
        if (stats.totalUsers !== undefined) {
            const element = document.getElementById('totalUsers');
            if (element) {
                element.textContent = adminPanel.formatNumber(stats.totalUsers);
            }
        }

        if (stats.totalQuestions !== undefined) {
            const element = document.getElementById('totalQuestions');
            if (element) {
                element.textContent = adminPanel.formatNumber(stats.totalQuestions);
            }
        }

        if (stats.totalTips !== undefined) {
            const element = document.getElementById('totalTips');
            if (element) {
                element.textContent = adminPanel.formatNumber(stats.totalTips);
            }
        }

        if (stats.completedQuizzes !== undefined) {
            const element = document.getElementById('completedQuizzes');
            if (element) {
                element.textContent = adminPanel.formatNumber(stats.completedQuizzes);
            }
        }
    }

    updateRecentActivity(activities) {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        adminPanel.hideLoading(activityList);

        if (!activities || activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${this.getActivityColor(activity.type)}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${adminPanel.formatDate(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');

        activityList.innerHTML = activityHTML;
    }

    getActivityIcon(type) {
        const icons = {
            'user_registered': 'user-plus',
            'user_login': 'sign-in-alt',
            'quiz_completed': 'check-circle',
            'tip_viewed': 'eye',
            'question_created': 'plus-circle',
            'tip_created': 'lightbulb',
            'category_created': 'folder-plus'
        };
        return icons[type] || 'info-circle';
    }

    getActivityColor(type) {
        const colors = {
            'user_registered': '#10b981',
            'user_login': '#3b82f6',
            'quiz_completed': '#8b5cf6',
            'tip_viewed': '#f59e0b',
            'question_created': '#ef4444',
            'tip_created': '#06b6d4',
            'category_created': '#84cc16'
        };
        return colors[type] || '#64748b';
    }

    initializeCharts(data) {
        // User Growth Chart
        this.createUserGrowthChart(data.userGrowth);

        // Quiz Performance Chart
        this.createQuizPerformanceChart(data.quizPerformance);
    }

    createUserGrowthChart(userGrowthData) {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.userGrowth) {
            this.charts.userGrowth.destroy();
        }

        const labels = userGrowthData?.labels || [];
        const datasets = userGrowthData?.datasets || [];

        this.charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Users',
                    data: datasets,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createQuizPerformanceChart(quizData) {
        const ctx = document.getElementById('quizPerformanceChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.quizPerformance) {
            this.charts.quizPerformance.destroy();
        }

        const labels = quizData?.labels || [];
        const datasets = quizData?.datasets || [];

        this.charts.quizPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Score',
                    data: datasets,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Refresh dashboard data
    async refreshDashboard() {
        await this.loadDashboard();
        adminPanel.showNotification('Dashboard refreshed', 'success');
    }

    // Export dashboard data
    exportDashboardData() {
        // Implementation for exporting dashboard data
        console.log('Exporting dashboard data...');
        adminPanel.showNotification('Export feature coming soon', 'info');
    }
}

// Initialize dashboard manager
let dashboardManager;

// Override the loadDashboard function in main.js
if (window.adminPanel) {
    adminPanel.loadDashboard = async function() {
        if (!dashboardManager) {
            dashboardManager = new DashboardManager();
        }
        await dashboardManager.loadDashboard();
    };
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button to dashboard header
    const dashboardHeader = document.querySelector('#dashboard .section-header');
    if (dashboardHeader) {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.onclick = () => {
            if (dashboardManager) {
                dashboardManager.refreshDashboard();
            }
        };
        dashboardHeader.appendChild(refreshBtn);
    }
}); 