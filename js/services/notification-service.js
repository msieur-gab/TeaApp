// notification-service.js
// Handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
    this.sound = null;
    this.lastNotificationTime = 0;
    this.notificationDedupeInterval = 2000; // 2 seconds deduplication window
    this.isLogging = true; // Enable detailed logging
  }

  // Helper for logging
  log(message) {
    if (this.isLogging) {
      console.log(`[NotificationService] ${message}`);
    }
  }

  // Initialize the notification service
  async init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      this.log('Notifications are not supported in this browser');
      return false;
    }
    
    // Request permission if not already granted
    if (Notification.permission !== 'granted' && !this.hasRequestedPermission) {
      this.log('Requesting notification permission');
      this.hasRequestedPermission = true;
      try {
        const permission = await Notification.requestPermission();
        this.log(`Permission response: ${permission}`);
        return permission === 'granted';
      } catch (error) {
        this.log(`Error requesting permission: ${error.message}`);
        return false;
      }
    }
    
    this.log(`Current notification permission: ${Notification.permission}`);
    return Notification.permission === 'granted';
  }

  // Preload sound for better responsiveness
  async preloadSound() {
    try {
      if (!this.sound) {
        this.log('Preloading notification sound');
        this.sound = new Audio('./assets/sounds/notification.mp3');
        
        // Set up error handler
        this.sound.onerror = (e) => {
          this.log(`Error with primary sound: ${e.message}, trying fallback`);
          this.sound = new Audio('./assets/sounds/notification.ogg');
        };
        
        // Preload the sound
        this.sound.preload = 'auto';
        
        // Try to load it
        try {
          await this.sound.load();
          this.log('Sound preloaded successfully');
        } catch (loadError) {
          this.log(`Error preloading sound: ${loadError.message}`);
        }
      }
    } catch (e) {
      this.log(`Error setting up sound: ${e.message}`);
    }
  }

  // Main method to notify users that tea is ready
  async notifyTeaReady(teaName) {
    this.log(`Notification requested for tea: ${teaName}`);
    
    // Check if we've already sent a notification recently
    const now = Date.now();
    if (now - this.lastNotificationTime < this.notificationDedupeInterval) {
      this.log('Notification already sent recently, skipping duplicate');
      return true;
    }
    
    this.lastNotificationTime = now;
    
    // Try all notification methods for maximum reliability
    const results = await Promise.allSettled([
      this.showServiceWorkerNotification(teaName),
      this.showRegularNotification(teaName),
      this.playSound(),
      this.vibrate()
    ]);
    
    // Log results for debugging
    results.forEach((result, index) => {
      const methods = ['ServiceWorker Notification', 'Regular Notification', 'Sound', 'Vibration'];
      if (result.status === 'fulfilled') {
        this.log(`${methods[index]}: ${result.value ? 'Success' : 'Failed'}`);
      } else {
        this.log(`${methods[index]}: Error - ${result.reason}`);
      }
    });
    
    // Return true if any method succeeded
    return results.some(r => r.status === 'fulfilled' && r.value === true);
  }

  // Try to show notification via service worker
  async showServiceWorkerNotification(teaName) {
    if (!('serviceWorker' in navigator)) {
      this.log('Service Worker not supported');
      return false;
    }
    
    try {
      // Check if we have an active service worker
      if (navigator.serviceWorker.controller) {
        this.log('Using service worker for notification');
        
        // Create and show a notification channel
        navigator.serviceWorker.controller.postMessage({
          type: 'TIMER_COMPLETE',
          teaName: teaName
        });
        
        return true;
      } else {
        this.log('No active service worker controller');
        return false;
      }
    } catch (error) {
      this.log(`Service worker notification error: ${error.message}`);
      return false;
    }
  }

  // Show a direct notification (fallback)
  async showRegularNotification(teaName) {
    try {
      // Make sure permissions are initialized
      const hasPermission = await this.init();
      if (!hasPermission) {
        this.log('Regular notification failed - no permission');
        return false;
      }
      
      this.log('Creating regular notification');
      const notification = new Notification('Tea Timer', {
        body: `Your ${teaName || 'tea'} is ready!`,
        icon: './assets/icons/apple-touch-icon.png',
        tag: 'tea-timer-notification',
        renotify: true,
        requireInteraction: true,
        // Do not set silent: true here to ensure sound plays in some browsers
      });
      
      // Handle click on notification
      notification.onclick = () => {
        this.log('Notification clicked');
        window.focus();
        notification.close();
      };
      
      return true;
    } catch (error) {
      this.log(`Regular notification error: ${error.message}`);
      return false;
    }
  }

  // Play a sound notification
  async playSound() {
    try {
      // Create audio element if it doesn't exist yet
      if (!this.sound) {
        await this.preloadSound();
      }
      
      if (!this.sound) {
        this.log('Sound object not available');
        return false;
      }
      
      // Reset to start if it was already playing
      this.sound.currentTime = 0;
      
      // Set volume to maximum
      this.sound.volume = 1.0;
      
      // Play the sound (returns a promise)
      this.log('Playing notification sound');
      try {
        // Create a user interaction promise to handle browsers that require it
        const playPromise = this.sound.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          this.log('Sound played successfully');
          return true;
        } else {
          this.log('Sound play() did not return a promise');
          return true; // Assume it worked
        }
      } catch (playError) {
        this.log(`Could not play timer sound: ${playError.message}`);
        
        // If it failed due to no user interaction, try a fallback approach
        if (playError.name === 'NotAllowedError') {
          this.log('Attempting fallback audio approach');
          // Create a new audio context
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const audioContext = new AudioContext();
              const oscillator = audioContext.createOscillator();
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
              oscillator.connect(audioContext.destination);
              oscillator.start();
              oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.5 seconds
              this.log('Fallback audio played');
              return true;
            }
          } catch (fallbackError) {
            this.log(`Fallback audio failed: ${fallbackError.message}`);
          }
        }
        
        return false;
      }
    } catch (e) {
      this.log(`Error playing sound: ${e.message}`);
      return false;
    }
  }

  // Vibrate the device if supported
  vibrate() {
    if ('vibrate' in navigator) {
      try {
        // Pulse pattern: 200ms vibration, 100ms pause, 200ms vibration
        this.log('Triggering vibration');
        navigator.vibrate([200, 100, 200, 100, 200]);
        return true;
      } catch (e) {
        this.log(`Error vibrating device: ${e.message}`);
      }
    } else {
      this.log('Vibration not supported');
    }
    return false;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();

// Preload sound on page load
window.addEventListener('load', () => {
  notificationService.preloadSound();
});

export default notificationService;