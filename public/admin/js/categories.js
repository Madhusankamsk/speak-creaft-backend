// Categories Management JavaScript
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    setupEventListeners() {
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.showAddCategoryModal());
        }
    }

    async loadCategories() {
        try {
            const response = await apiService.getCategories();
            if (response.success) {
                this.categories = response.data.categories || [];
                this.renderCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Error loading categories', 'error');
        }
    }

    renderCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        if (this.categories.length === 0) {
            categoriesGrid.innerHTML = '<div class="text-center">No categories found</div>';
            return;
        }

        const categoriesHTML = this.categories.map(category => `
            <div class="category-card">
                <h3>${category.name}</h3>
                <p>${category.description || 'No description'}</p>
                <div class="category-stats">
                    <span>${category.questionCount || 0} Questions</span>
                    <span>${category.tipCount || 0} Tips</span>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-primary" onclick="categoriesManager.editCategory('${category._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="categoriesManager.deleteCategory('${category._id}')">Delete</button>
                </div>
            </div>
        `).join('');

        categoriesGrid.innerHTML = categoriesHTML;
    }

    async editCategory(categoryId) {
        try {
            const response = await apiService.getCategory(categoryId);
            if (response.success) {
                this.showEditCategoryModal(response.data.category);
            }
        } catch (error) {
            console.error('Error loading category:', error);
            this.showNotification('Error loading category details', 'error');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await apiService.deleteCategory(categoryId);
            if (response.success) {
                this.showNotification('Category deleted successfully', 'success');
                this.loadCategories();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showNotification('Error deleting category', 'error');
        }
    }

    showAddCategoryModal() {
        console.log('Show add category modal');
    }

    showEditCategoryModal(category) {
        console.log('Show edit category modal for:', category);
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
}); 