// Analytics Management JavaScript
class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.loadAnalytics();
    }

    async loadAnalytics() {
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
        console.log('Initializing charts with real data...');
        
        // Initialize user growth chart
        this.initUserGrowthChart(userGrowth);
        
        // Initialize quiz performance chart
        this.initQuizPerformanceChart(quizPerformance);
        
        // Initialize level distribution chart
        this.initLevelDistributionChart(levelDistribution);
        
        // Initialize daily active users chart
        this.initDailyUsersChart(dailyUsers);
    }

    initUserGrowthChart(data) {
        const canvas = document.getElementById('userGrowthChart');
        if (!canvas) return;

        console.log('Initializing user growth chart with data:', data);
        // Chart.js implementation would go here
    }

    initQuizPerformanceChart(data) {
        const canvas = document.getElementById('quizPerformanceChart');
        if (!canvas) return;

        console.log('Initializing quiz performance chart with data:', data);
        // Chart.js implementation would go here
    }

    initLevelDistributionChart(data) {
        const canvas = document.getElementById('levelChart');
        if (!canvas) return;

        console.log('Initializing level distribution chart with data:', data);
        // Chart.js implementation would go here
    }

    initDailyUsersChart(data) {
        const canvas = document.getElementById('dailyUsersChart');
        if (!canvas) return;

        console.log('Initializing daily users chart with data:', data);
        // Chart.js implementation would go here
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
}); 