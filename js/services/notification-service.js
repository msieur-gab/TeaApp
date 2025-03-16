// notification-service.js
// Handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
    this.sound = null;
    this.lastNotificationTime = 0;
    this.notificationDedupeInterval = 2000; // 2 seconds deduplication window
  }

  // Initialize the notification service
  async init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }
    
    // Request permission if not already granted
    if (Notification.permission !== 'granted' && !this.hasRequestedPermission) {
      this.hasRequestedPermission = true;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  }

  // Main method to notify users that tea is ready
  async notifyTeaReady(teaName) {
    // Check if we've already sent a notification recently
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationDedupeInterval) {
      console.log('Notification already sent recently, skipping duplicate');
      return true;
    }
    
    this.lastNotificationTime = now;
    
    // Choose notification method based on page visibility
    if (document.visibilityState === 'visible') {
      // If page is visible, just play sound and vibrate - no visual notification
      return this.notifyActiveApp(teaName);
    } else {
      // If page is hidden, use full notification
      return this.notifyInactiveApp(teaName);
    }
  }
  
  // Notification when app is in focus (sound only)
  async notifyActiveApp(teaName) {
    console.log(`Tea ${teaName} ready - app is active, playing sound only`);
    
    const results = await Promise.all([
      this.playSound(),
      this.vibrate()
    ]);
    
    return results.some(result => result);
  }
  
  // Notification when app is in background
  async notifyInactiveApp(teaName) {
    console.log(`Tea ${teaName} ready - app is inactive, using full notification`);
    
    const results = await Promise.all([
      this.showVisualNotification(teaName),
      this.playSound(),
      this.vibrate()
    ]);
    
    return results.some(result => result);
  }

  // Show a visual notification (through service worker or direct)
  async showVisualNotification(teaName) {
    // Make sure permissions are initialized
    const hasPermission = await this.init();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      // Try to use service worker for more reliable notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send message to service worker to show notification
        // Set silent: true to prevent default notification sound
        navigator.serviceWorker.controller.postMessage({
          type: 'TIMER_COMPLETE',
          teaName: teaName,
          silent: true // Tell service worker to disable default sound
        });
        return true;
      } else {
        // Fall back to regular notification
        return this.showRegularNotification(teaName);
      }
    } catch (error) {
      console.error('Failed to show service worker notification:', error);
      // Try regular notification as fallback
      return this.showRegularNotification(teaName);
    }
  }

  // Show a notification without service worker
  showRegularNotification(teaName) {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification('Tea Timer', {
          body: `Your ${teaName || 'tea'} is ready!`,
          icon: './assets/icons/apple-touch-icon.png',
          tag: 'tea-timer-notification',
          renotify: true,
          requireInteraction: true,
          silent: true // Disable default notification sound
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return true;
      }
    } catch (error) {
      console.error('Failed to create fallback notification:', error);
    }
    
    return false;
  }

  // Play a sound notification
  async playSound() {
    try {
      // Create audio element if it doesn't exist yet
      if (!this.sound) {
        this.sound = new Audio('./assets/sounds/notification.mp3');
        
        // Set up error handler
        this.sound.onerror = () => {
          console.warn('Error with primary sound, trying fallback');
          this.sound = new Audio('./assets/sounds/notification.ogg');
        };
        
        // Preload the sound if possible
        if (this.sound.preload) {
          this.sound.preload = 'auto';
        }
      }
      
      // Reset to start if it was already playing
      this.sound.currentTime = 0;
      
      // Play the sound (returns a promise)
      try {
        await this.sound.play();
        return true;
      } catch (playError) {
        console.warn('Could not play timer sound:', playError);
        return false;
      }
    } catch (e) {
      console.warn('Error setting up sound:', e);
      return false;
    }
  }

  // Vibrate the device if supported
  vibrate() {
    if ('vibrate' in navigator) {
      try {
        // Pulse pattern: 200ms vibration, 100ms pause, 200ms vibration
        navigator.vibrate([200, 100, 200]);
        return true;
      } catch (e) {
        console.warn('Error vibrating device:', e);
      }
    }
    return false;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;