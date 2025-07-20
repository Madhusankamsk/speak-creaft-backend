// Quiz Results Management JavaScript
class QuizzesManager {
    constructor() {
        this.results = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadQuizResults();
    }

    setupEventListeners() {
        const quizDateFrom = document.getElementById('quizDateFrom');
        const quizDateTo = document.getElementById('quizDateTo');
        const quizLevelFilter = document.getElementById('quizLevelFilter');

        if (quizDateFrom) {
            quizDateFrom.addEventListener('change', () => this.handleDateFilter());
        }

        if (quizDateTo) {
            quizDateTo.addEventListener('change', () => this.handleDateFilter());
        }

        if (quizLevelFilter) {
            quizLevelFilter.addEventListener('change', (e) => this.handleLevelFilter(e.target.value));
        }
    }

    async loadQuizResults() {
        try {
            const response = await apiService.getQuizResults();
            if (response.success) {
                this.results = response.data.results || [];
                this.renderQuizResults();
            }
        } catch (error) {
            console.error('Error loading quiz results:', error);
            this.showNotification('Error loading quiz results', 'error');
        }
    }

    renderQuizResults() {
        const tbody = document.getElementById('quizResultsTableBody');
        if (!tbody) return;

        if (this.results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No quiz results found</td></tr>';
            return;
        }

        const resultsHTML = this.results.map(result => `
            <tr>
                <td>${result.user?.name || 'Unknown User'}</td>
                <td>${result.score || 0}%</td>
                <td>${result.level || 1}</td>
                <td>${result.timeSpent || 'N/A'}</td>
                <td>${this.formatDate(result.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="quizzesManager.viewQuizResult('${result._id}')">View</button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = resultsHTML;
    }

    async viewQuizResult(resultId) {
        try {
            const response = await apiService.getQuizResult(resultId);
            if (response.success) {
                this.showQuizResultModal(response.data.result);
            }
        } catch (error) {
            console.error('Error loading quiz result:', error);
            this.showNotification('Error loading quiz result details', 'error');
        }
    }

    async deleteQuizResult(resultId) {
        if (!confirm('Are you sure you want to delete this quiz result?')) return;

        try {
            const response = await apiService.deleteQuizResult(resultId);
            if (response.success) {
                this.showNotification('Quiz result deleted successfully', 'success');
                this.loadQuizResults();
            }
        } catch (error) {
            console.error('Error deleting quiz result:', error);
            this.showNotification('Error deleting quiz result', 'error');
        }
    }

    showQuizResultModal(result) {
        console.log('Show quiz result modal for:', result);
    }

    handleDateFilter() {
        const dateFrom = document.getElementById('quizDateFrom')?.value;
        const dateTo = document.getElementById('quizDateTo')?.value;
        console.log('Date filter:', { dateFrom, dateTo });
    }

    handleLevelFilter(level) {
        console.log('Level filter:', level);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.quizzesManager = new QuizzesManager();
}); 