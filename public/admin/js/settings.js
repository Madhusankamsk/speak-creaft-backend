// Settings Management JavaScript
class SettingsManager {
    constructor() {
        this.settings = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        const generalSettingsForm = document.getElementById('generalSettingsForm');
        const quizSettingsForm = document.getElementById('quizSettingsForm');

        if (generalSettingsForm) {
            generalSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGeneralSettings();
            });
        }

        if (quizSettingsForm) {
            quizSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveQuizSettings();
            });
        }
    }

    async loadSettings() {
        try {
            const response = await apiService.getSettings();
            if (response.success) {
                this.settings = response.data.settings || {};
                this.populateSettingsForms();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Error loading settings', 'error');
        }
    }

    populateSettingsForms() {
        // Populate general settings
        const appName = document.getElementById('appName');
        const adminEmail = document.getElementById('adminEmail');
        
        if (appName) appName.value = this.settings.appName || 'SpeakCraft';
        if (adminEmail) adminEmail.value = this.settings.adminEmail || 'admin@speakcraft.com';

        // Populate quiz settings
        const questionsPerQuiz = document.getElementById('questionsPerQuiz');
        const timeLimit = document.getElementById('timeLimit');
        
        if (questionsPerQuiz) questionsPerQuiz.value = this.settings.questionsPerQuiz || 5;
        if (timeLimit) timeLimit.value = this.settings.timeLimit || 10;
    }

    async saveGeneralSettings() {
        const appName = document.getElementById('appName')?.value;
        const adminEmail = document.getElementById('adminEmail')?.value;

        try {
            const response = await apiService.updateSettings({
                appName,
                adminEmail
            });

            if (response.success) {
                this.showNotification('General settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving general settings:', error);
            this.showNotification('Error saving general settings', 'error');
        }
    }

    async saveQuizSettings() {
        const questionsPerQuiz = document.getElementById('questionsPerQuiz')?.value;
        const timeLimit = document.getElementById('timeLimit')?.value;

        try {
            const response = await apiService.updateSettings({
                questionsPerQuiz: parseInt(questionsPerQuiz),
                timeLimit: parseInt(timeLimit)
            });

            if (response.success) {
                this.showNotification('Quiz settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving quiz settings:', error);
            this.showNotification('Error saving quiz settings', 'error');
        }
    }

    showNotification(message, type = 'info') {
        if (window.adminPanel && window.adminPanel.showNotification) {
            window.adminPanel.showNotification(message, type);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 