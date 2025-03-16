// notification-service.js
// Consolidated notification system that handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
    this.sound = null;
    this.audioContext = null;
    this.lastNotificationTime = 0;
    this.notificationDedupeInterval = 2000; // 2 seconds deduplication window
    this.isLogging = true; // Enable detailed logging
    
    // Initialize audio unlocking
    this.setupAudioUnlocking();
  }

  // Helper for logging
  log(message) {
    if (this.isLogging) {
      console.log(`[NotificationService] ${message}`);
    }
  }

  // Setup listeners to unlock audio on user interaction
  setupAudioUnlocking() {
    // These are common user interactions that browsers accept for enabling audio
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    const unlockAudio = this.unlockAudio.bind(this);
    
    // Add listeners for each event type
    unlockEvents.forEach(eventType => {
      document.addEventListener(eventType, unlockAudio, { once: false });
    });
    
    // Also try to unlock when visibility changes to visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        unlockAudio();
      }
    });
    
    this.log('Audio unlocking event listeners set up');
  }
  
  // Unlock audio on user interaction
  unlockAudio() {
    try {
      // Only create AudioContext when needed
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
          this.log(`AudioContext created with state: ${this.audioContext.state}`);
        } else {
          this.log('AudioContext not supported in this browser');
        }
      }
      
      // If context is suspended, try to resume it
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.log('AudioContext resumed successfully');
        }).catch(error => {
          this.log(`Failed to resume AudioContext: ${error.message}`);
        });
      }
      
      // Also try to preload sounds now that we have user interaction
      this.preloadSound();
    } catch (error) {
      this.log(`Error unlocking audio: ${error.message}`);
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
        this.log('Preloading notification sounds');
        
        // Create an array of promises for each sound format
        const preloadPromises = [
          this.preloadSoundFormat('./assets/sounds/notification.mp3', 'mp3'),
          this.preloadSoundFormat('./assets/sounds/notification.ogg', 'ogg')
        ];
        
        // Wait for the first successful preload
        await Promise.any(preloadPromises);
        this.log('At least one sound format preloaded successfully');
      }
    } catch (e) {
      this.log(`Error preloading sounds: ${e.message}`);
    }
  }
  
  // Helper method to preload a specific sound format
  async preloadSoundFormat(url, format) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.preload = 'auto';
      
      // Set up event handlers
      audio.oncanplaythrough = () => {
        this.log(`${format} format loaded and can play through`);
        if (!this.sound) {
          this.sound = audio;
        }
        resolve(audio);
      };
      
      audio.onerror = (error) => {
        this.log(`Error loading ${format} format: ${error.message || 'Unknown error'}`);
        reject(new Error(`Failed to load ${format} format`));
      };
      
      // Start loading
      audio.src = url;
      audio.load();
      
      // Set a timeout in case oncanplaythrough never fires
      setTimeout(() => {
        if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or higher
          this.log(`${format} format ready state: ${audio.readyState}`);
          if (!this.sound) {
            this.sound = audio;
          }
          resolve(audio);
        } else {
          reject(new Error(`Timeout loading ${format} format`));
        }
      }, 3000);
    });
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
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      this.log('No active service worker controller');
      return false;
    }
    
    try {
      this.log('Using service worker for notification');
      
      // Send message to service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'TIMER_COMPLETE',
        teaName: teaName
      });
      
      return true;
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
        silent: false // Ensure sound can play
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

  // Play a sound notification - consolidated all sound playing logic here
  async playSound() {
    // Try multiple approaches in sequence for maximum reliability
    try {
      this.log('Attempting to play notification sound');
      
      // 1. First try: Web Audio API with AudioContext if available
      if (this.audioContext && this.audioContext.state === 'running') {
        const success = await this.playWithAudioContext();
        if (success) return true;
      }
      
      // 2. Second try: Basic HTML5 Audio API with preloaded sound
      if (this.sound) {
        const success = await this.playWithAudioElement(this.sound);
        if (success) return true;
      }
      
      // 3. Third try: Create new Audio elements for both formats
      const mp3Success = await this.playWithAudioElement(new Audio('./assets/sounds/notification.mp3'));
      if (mp3Success) return true;
      
      const oggSuccess = await this.playWithAudioElement(new Audio('./assets/sounds/notification.ogg'));
      if (oggSuccess) return true;
      
      // 4. Last resort: Generate a beep programmatically
      return this.generateBeepSound();
    } catch (error) {
      this.log(`All sound playing methods failed: ${error.message}`);
      return false;
    }
  }
  
  // Helper to play with AudioContext (Web Audio API)
  async playWithAudioContext() {
    try {
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        this.audioContext = new AudioContext();
      }
      
      // Try to resume the audio context if it's suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // If still not running, fail
      if (this.audioContext.state !== 'running') {
        this.log(`AudioContext not running: ${this.audioContext.state}`);
        return false;
      }
      
      // Try to fetch and decode the audio file
      const response = await fetch('./assets/sounds/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create a source and play it
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
      
      this.log('Sound played via AudioContext');
      return true;
    } catch (error) {
      this.log(`AudioContext playback failed: ${error.message}`);
      return false;
    }
  }
  
  // Helper to play with HTML5 Audio API
  async playWithAudioElement(audio) {
    return new Promise((resolve) => {
      try {
        if (!audio) {
          resolve(false);
          return;
        }
        
        // Reset audio if it was previously played
        audio.currentTime = 0;
        audio.volume = 1.0;
        
        // Set up event handlers
        audio.onended = () => {
          this.log('Sound played completely');
          resolve(true);
        };
        
        audio.onerror = (error) => {
          this.log(`Audio playback error: ${error.message || 'Unknown error'}`);
          resolve(false);
        };
        
        // Try to play
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.log('Audio play promise resolved successfully');
            // Let onended handle success case
          }).catch((error) => {
            this.log(`Audio play promise rejected: ${error.message}`);
            resolve(false);
          });
        } else {
          // For browsers where play() doesn't return a promise
          this.log('Audio play() did not return a promise, assuming success');
          // Let onended handle success case
        }
        
        // Set a timeout in case neither onended nor onerror fires
        setTimeout(() => {
          resolve(true); // Assume it's playing
        }, 2000);
      } catch (error) {
        this.log(`Error in playWithAudioElement: ${error.message}`);
        resolve(false);
      }
    });
  }
  
  // Helper to generate a beep sound as last resort
  async generateBeepSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.log('AudioContext not supported for beep');
        return false;
      }
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(784, context.currentTime); // G5 note
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 1);
      
      this.log('Generated beep sound as fallback');
      return true;
    } catch (error) {
      this.log(`Beep generation failed: ${error.message}`);
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

// Try to unlock audio on page load
window.addEventListener('load', () => {
  notificationService.unlockAudio();
  notificationService.preloadSound();
});

export default notificationService;