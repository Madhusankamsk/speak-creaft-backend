const cron = require('node-cron');
const dailyUnlockService = require('../services/dailyUnlockService');
const notificationService = require('../services/notificationService');
const { logInfo, logError } = require('../utils/helpers');

class CronJobManager {
  constructor() {
    this.jobs = new Map();
  }

  // Initialize all cron jobs
  init() {
    this.setupTipUnlockJobs();
    this.setupNotificationJobs();
    this.setupCleanupJobs();
    
    logInfo('Cron jobs initialized');
  }

  // Setup tip unlock jobs
  setupTipUnlockJobs() {
    // Check for tip unlocks every 5 minutes
    this.jobs.set('tipUnlock', cron.schedule('*/5 * * * *', async () => {
      try {
        logInfo('Running tip unlock check');
        const results = await dailyUnlockService.processAllDailyUnlocks();
        
        if (results.length > 0) {
          logInfo('Tip unlocks processed', {
            totalUsers: results.length,
            totalUnlocks: results.reduce((sum, result) => sum + result.newlyUnlocked.length, 0)
          });
        }
      } catch (error) {
        logError(error, 'Tip unlock cron job');
      }
    }, {
      scheduled: false
    }));

    // Morning reminder at 8:45 AM
    this.jobs.set('morningReminder', cron.schedule('45 8 * * *', async () => {
      try {
        logInfo('Sending morning reminders');
        await dailyUnlockService.sendDailyReminders();
      } catch (error) {
        logError(error, 'Morning reminder cron job');
      }
    }, {
      scheduled: false
    }));

    // Quiz reminder at 10:00 AM
    this.jobs.set('quizReminder', cron.schedule('0 10 * * *', async () => {
      try {
        logInfo('Sending quiz reminders');
        await dailyUnlockService.sendQuizReminders();
      } catch (error) {
        logError(error, 'Quiz reminder cron job');
      }
    }, {
      scheduled: false
    }));
  }

  // Setup notification jobs
  setupNotificationJobs() {
    // Clean up expired notifications daily at 2:00 AM
    this.jobs.set('cleanupNotifications', cron.schedule('0 2 * * *', async () => {
      try {
        logInfo('Cleaning up expired notifications');
        const result = await notificationService.deleteExpiredNotifications();
        logInfo('Expired notifications cleaned up', { deletedCount: result.deletedCount });
      } catch (error) {
        logError(error, 'Notification cleanup cron job');
      }
    }, {
      scheduled: false
    }));

    // Send daily summary at 8:00 PM
    this.jobs.set('dailySummary', cron.schedule('0 20 * * *', async () => {
      try {
        logInfo('Sending daily summaries');
        // This could send a summary of the day's activities
        // For now, just log the action
      } catch (error) {
        logError(error, 'Daily summary cron job');
      }
    }, {
      scheduled: false
    }));
  }

  // Setup cleanup jobs
  setupCleanupJobs() {
    // Clean up old activity logs weekly on Sunday at 3:00 AM
    this.jobs.set('cleanupActivityLogs', cron.schedule('0 3 * * 0', async () => {
      try {
        logInfo('Cleaning up old activity logs');
        // This would clean up old activity logs
        // Implementation depends on your ActivityLog model
      } catch (error) {
        logError(error, 'Activity log cleanup cron job');
      }
    }, {
      scheduled: false
    }));

    // Database maintenance weekly on Saturday at 4:00 AM
    this.jobs.set('databaseMaintenance', cron.schedule('0 4 * * 6', async () => {
      try {
        logInfo('Running database maintenance');
        // This could include:
        // - Optimizing indexes
        // - Cleaning up temporary data
        // - Archiving old records
      } catch (error) {
        logError(error, 'Database maintenance cron job');
      }
    }, {
      scheduled: false
    }));
  }

  // Start all jobs
  start() {
    this.jobs.forEach((job, name) => {
      job.start();
      logInfo(`Started cron job: ${name}`);
    });
  }

  // Stop all jobs
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logInfo(`Stopped cron job: ${name}`);
    });
  }

  // Start specific job
  startJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.start();
      logInfo(`Started cron job: ${jobName}`);
    } else {
      logError(new Error(`Job ${jobName} not found`), 'startJob');
    }
  }

  // Stop specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      logInfo(`Stopped cron job: ${jobName}`);
    } else {
      logError(new Error(`Job ${jobName} not found`), 'stopJob');
    }
  }

  // Get job status
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    });
    return status;
  }

  // Manually trigger tip unlock check
  async triggerTipUnlockCheck() {
    try {
      logInfo('Manually triggering tip unlock check');
      const results = await dailyUnlockService.processAllDailyUnlocks();
      return results;
    } catch (error) {
      logError(error, 'Manual tip unlock check');
      throw error;
    }
  }

  // Manually trigger quiz reminders
  async triggerQuizReminders() {
    try {
      logInfo('Manually triggering quiz reminders');
      const results = await dailyUnlockService.sendQuizReminders();
      return results;
    } catch (error) {
      logError(error, 'Manual quiz reminders');
      throw error;
    }
  }

  // Manually trigger daily reminders
  async triggerDailyReminders() {
    try {
      logInfo('Manually triggering daily reminders');
      const results = await dailyUnlockService.sendDailyReminders();
      return results;
    } catch (error) {
      logError(error, 'Manual daily reminders');
      throw error;
    }
  }
}

// Create singleton instance
const cronJobManager = new CronJobManager();

module.exports = cronJobManager; 