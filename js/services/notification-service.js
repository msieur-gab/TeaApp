// notification-service.js
// Handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
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

  // Show a notification for completed tea timer
  async notifyTeaReady(teaName) {
    // Make sure permissions are initialized
    const hasPermission = await this.init();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      // Try to use service worker for more reliable notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('Tea Timer', {
          body: `Your ${teaName || 'tea'} is ready!`,
          icon: './assets/icons/icon-192x192.png',
          badge: './assets/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          tag: 'tea-timer-notification',
          renotify: true,
          requireInteraction: true
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
  playSound() {
    try {
      // Create audio element if it doesn't exist yet
      if (!this.sound) {
        this.sound = new Audio('./assets/sounds/notification.mp3');
        
        // Fallback to another format if MP3 isn't supported
        this.sound.onerror = () => {
          this.sound = new Audio('./assets/sounds/notification.ogg');
        };
      }
      
      // Reset to start if it was already playing
      this.sound.currentTime = 0;
      
      // Play the sound (returns a promise)
      const playPromise = this.sound.play();
      
      // Handle potential play() rejection (happens if user hasn't interacted with page yet)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Could not play timer sound:', error);
        });
      }
      
      return true;
    } catch (e) {
      console.warn('Error playing sound:', e);
      return false;
    }
  }

  // Vibrate the device if supported
  vibrate() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
        return true;
      } catch (e) {
        console.warn('Error vibrating device:', e);
      }
    }
    return false;
  }

  // Notify across all available channels
  notifyAll(teaName) {
    // Use all notification methods for maximum reliability
    const soundPlayed = this.playSound();
    const vibrateSuccess = this.vibrate();
    
    // Visual notification always last (in case permissions need to be requested)
    this.notifyTeaReady(teaName).then(success => {
      if (!success && !soundPlayed && !vibrateSuccess) {
        console.warn('All notification methods failed');
      }
    });
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
