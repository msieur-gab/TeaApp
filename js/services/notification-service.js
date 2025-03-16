// notification-service.js
// Handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
    this.sound = null;
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
    // Try all notification methods concurrently
    const results = await Promise.all([
      this.showVisualNotification(teaName),
      this.playSound(),
      this.vibrate()
    ]);
    
    // Log if all notification methods failed
    if (!results.some(result => result)) {
      console.warn('All notification methods failed');
    }
    
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
        navigator.serviceWorker.controller.postMessage({
          type: 'TIMER_COMPLETE',
          teaName: teaName
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
          requireInteraction: true
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
