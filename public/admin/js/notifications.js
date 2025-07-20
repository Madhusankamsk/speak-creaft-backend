// Notifications Management JavaScript
class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNotifications();
    }

    setupEventListeners() {
        const sendNotificationBtn = document.getElementById('sendNotificationBtn');
        if (sendNotificationBtn) {
            sendNotificationBtn.addEventListener('click', () => this.showSendNotificationModal());
        }
    }

    async loadNotifications() {
        try {
            const response = await apiService.getNotifications();
            if (response.success) {
                this.notifications = response.data.notifications || [];
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showNotification('Error loading notifications', 'error');
        }
    }

    renderNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        if (!notificationsList) return;

        if (this.notifications.length === 0) {
            notificationsList.innerHTML = '<div class="text-center">No notifications found</div>';
            return;
        }

        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${this.formatDate(notification.createdAt)}</span>
                <div class="notification-actions">
                    <button class="btn btn-sm btn-danger" onclick="notificationsManager.deleteNotification('${notification._id}')">Delete</button>
                </div>
            </div>
        `).join('');

        notificationsList.innerHTML = notificationsHTML;
    }

    async deleteNotification(notificationId) {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            const response = await apiService.deleteNotification(notificationId);
            if (response.success) {
                this.showNotification('Notification deleted successfully', 'success');
                this.loadNotifications();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showNotification('Error deleting notification', 'error');
        }
    }

    showSendNotificationModal() {
        console.log('Show send notification modal');
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
    window.notificationsManager = new NotificationsManager();
}); 