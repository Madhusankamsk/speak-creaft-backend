// Questions Management JavaScript
class QuestionsManager {
    constructor() {
        this.questions = [];
        this.categories = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadQuestions();
    }

    setupEventListeners() {
        const addQuestionBtn = document.getElementById('addQuestionBtn');
        const categoryFilter = document.getElementById('categoryFilter');
        const difficultyFilter = document.getElementById('difficultyFilter');

        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => this.showAddQuestionModal());
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => this.handleDifficultyFilter(e.target.value));
        }
    }

    async loadCategories() {
        try {
            const response = await apiService.getCategories();
            if (response.success) {
                this.categories = response.data.categories || [];
                this.populateCategoryFilter();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const options = this.categories.map(category => 
            `<option value="${category._id}">${category.name}</option>`
        ).join('');

        categoryFilter.innerHTML = '<option value="">All Categories</option>' + options;
    }

    async loadQuestions() {
        try {
            const response = await apiService.getQuestions();
            if (response.success) {
                this.questions = response.data.questions || [];
                this.renderQuestions();
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showNotification('Error loading questions', 'error');
        }
    }

    renderQuestions() {
        const tbody = document.getElementById('questionsTableBody');
        if (!tbody) return;

        if (this.questions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No questions found</td></tr>';
            return;
        }

        const questionsHTML = this.questions.map(question => `
            <tr>
                <td>${question.question}</td>
                <td>${question.category?.name || 'N/A'}</td>
                <td>${question.difficulty || 'Medium'}</td>
                <td>${question.type || 'Multiple Choice'}</td>
                <td><span class="status ${question.isActive ? 'active' : 'inactive'}">${question.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="questionsManager.editQuestion('${question._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="questionsManager.deleteQuestion('${question._id}')">Delete</button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = questionsHTML;
    }

    async editQuestion(questionId) {
        try {
            const response = await apiService.getQuestion(questionId);
            if (response.success) {
                this.showEditQuestionModal(response.data.question);
            }
        } catch (error) {
            console.error('Error loading question:', error);
            this.showNotification('Error loading question details', 'error');
        }
    }

    async deleteQuestion(questionId) {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const response = await apiService.deleteQuestion(questionId);
            if (response.success) {
                this.showNotification('Question deleted successfully', 'success');
                this.loadQuestions();
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            this.showNotification('Error deleting question', 'error');
        }
    }

    showAddQuestionModal() {
        // Implementation for add question modal
        console.log('Show add question modal');
    }

    showEditQuestionModal(question) {
        // Implementation for edit question modal
        console.log('Show edit question modal for:', question);
    }

    handleCategoryFilter(categoryId) {
        // Filter questions by category
        console.log('Category filter:', categoryId);
    }

    handleDifficultyFilter(difficulty) {
        // Filter questions by difficulty
        console.log('Difficulty filter:', difficulty);
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

// Initialize questions manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.questionsManager = new QuestionsManager();
}); 