// notification-service.js
// A simplified notification service focused on reliability

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.sound = null;
    this.soundLoaded = false;
    
    // Initialize audio element early
    this.preloadSound();
    
    // Set up service worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    }
  }
  
  // Initialize the service
  async init() {
    // Check permission immediately
    this.hasPermission = await this.checkPermission();
    
    // Try to preload sound
    this.preloadSound();
    
    // Set up visibility change listener to keep audio ready
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.preloadSound();
      }
    });
    
    return this.hasPermission;
  }
  
  // Check for notification permission
  async checkPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    // Only ask if not already denied
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    return false;
  }
  
  // Preload notification sound
  preloadSound() {
    if (!this.sound) {
      this.sound = new Audio();
      
      // Set up multiple sources for better compatibility
      const sources = [
        { src: './assets/sounds/notification.mp3', type: 'audio/mpeg' },
        { src: './assets/sounds/notification.ogg', type: 'audio/ogg' }
      ];
      
      // Try each source
      for (const source of sources) {
        const sourceElement = document.createElement('source');
        sourceElement.src = source.src;
        sourceElement.type = source.type;
        this.sound.appendChild(sourceElement);
      }
      
      // Set properties
      this.sound.preload = 'auto';
      this.sound.load();
      
      // Listen for canplaythrough event
      this.sound.addEventListener('canplaythrough', () => {
        this.soundLoaded = true;
        console.log('Notification sound preloaded successfully');
      });
      
      // Handle errors
      this.sound.addEventListener('error', (e) => {
        console.error('Error loading notification sound:', e);
      });
    }
  }
  
  // Play notification sound
  async playSound() {
    try {
      if (!this.sound || !this.soundLoaded) {
        // Create a new sound instance if not loaded
        const tempSound = new Audio('./assets/sounds/notification.mp3');
        await tempSound.play();
        return true;
      }
      
      // Reset current time to ensure it plays from the beginning
      this.sound.currentTime = 0;
      await this.sound.play();
      return true;
    } catch (error) {
      console.error('Error playing notification sound:', error);
      
      // Fallback to a basic beep using OscillatorNode
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = 880; // A5 note
          gain.gain.value = 0.1;
          
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.5);
          
          return true;
        }
      } catch (fallbackError) {
        console.error('Fallback sound also failed:', fallbackError);
      }
      
      return false;
    }
  }
  
  // Handle messages from service worker
  handleServiceWorkerMessage(event) {
    if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
      this.playSound();
    }
  }
  
  // Vibrate the device if supported
  vibrate() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
        return true;
      } catch (error) {
        console.error('Error vibrating device:', error);
      }
    }
    return false;
  }
  
  // Notify that tea is ready
  async notifyTeaReady(teaName) {
    // First try to play sound
    this.playSound();
    
    // Then try to vibrate
    this.vibrate();
    
    // If page is visible, no need for system notification
    if (document.visibilityState === 'visible') {
      return true;
    }
    
    // Otherwise, show notification via service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TIMER_COMPLETE',
        teaName: teaName
      });
      return true;
    } else {
      // Fallback to regular notification
      if (this.hasPermission) {
        try {
          new Notification('Tea Timer', {
            body: `Your ${teaName || 'tea'} is ready!`,
            icon: './assets/icons/icon-192x192.png'
          });
          return true;
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }
    }
    
    return false;
  }
}

// Create a singleton instance
const notificationService = new NotificationService();
export default notificationService;
