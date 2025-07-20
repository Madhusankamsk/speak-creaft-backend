// Tips Management JavaScript
class TipsManager {
    constructor() {
        this.tips = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTips();
    }

    setupEventListeners() {
        const addTipBtn = document.getElementById('addTipBtn');
        if (addTipBtn) {
            addTipBtn.addEventListener('click', () => this.showAddTipModal());
        }
    }

    async loadTips() {
        try {
            const response = await apiService.getTips();
            if (response.success) {
                this.tips = response.data.tips || [];
                this.renderTips();
            }
        } catch (error) {
            console.error('Error loading tips:', error);
            this.showNotification('Error loading tips', 'error');
        }
    }

    renderTips() {
        const tipsGrid = document.getElementById('tipsGrid');
        if (!tipsGrid) return;

        if (this.tips.length === 0) {
            tipsGrid.innerHTML = '<div class="text-center">No tips found</div>';
            return;
        }

        const tipsHTML = this.tips.map(tip => `
            <div class="tip-card">
                <h3>${tip.title}</h3>
                <p>${tip.content}</p>
                <div class="tip-meta">
                    <span class="level">Level ${tip.level || 1}</span>
                    <span class="category">${tip.category?.name || 'General'}</span>
                </div>
                <div class="tip-actions">
                    <button class="btn btn-sm btn-primary" onclick="tipsManager.editTip('${tip._id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="tipsManager.deleteTip('${tip._id}')">Delete</button>
                </div>
            </div>
        `).join('');

        tipsGrid.innerHTML = tipsHTML;
    }

    async editTip(tipId) {
        try {
            const response = await apiService.getTip(tipId);
            if (response.success) {
                this.showEditTipModal(response.data.tip);
            }
        } catch (error) {
            console.error('Error loading tip:', error);
            this.showNotification('Error loading tip details', 'error');
        }
    }

    async deleteTip(tipId) {
        if (!confirm('Are you sure you want to delete this tip?')) return;

        try {
            const response = await apiService.deleteTip(tipId);
            if (response.success) {
                this.showNotification('Tip deleted successfully', 'success');
                this.loadTips();
            }
        } catch (error) {
            console.error('Error deleting tip:', error);
            this.showNotification('Error deleting tip', 'error');
        }
    }

    showAddTipModal() {
        console.log('Show add tip modal');
    }

    showEditTipModal(tip) {
        console.log('Show edit tip modal for:', tip);
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tipsManager = new TipsManager();
}); 