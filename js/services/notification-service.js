// notification-service.js
// Consolidated notification system that handles all notification functionality for the Tea Timer app

class NotificationService {
  constructor() {
    this.hasRequestedPermission = false;
    this.hasRequestedAudioPermission = false;
    this.sound = null;
    this.audioContext = null;
    this.lastNotificationTime = 0;
    this.notificationDedupeInterval = 2000; // 2 seconds deduplication window
    this.isLogging = true; // Enable detailed logging
    
    // Initialize audio unlocking
    this.setupAudioUnlocking();
    
    // Listen for service worker messages
    this.setupServiceWorkerListener();
  }

  // Helper for logging
  log(message) {
    if (this.isLogging) {
      console.log(`[NotificationService] ${message}`);
    }
  }
  
  // Setup service worker message listener
  setupServiceWorkerListener() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
          this.log('Received sound play request from Service Worker');
          await this.playSound().catch(err => this.log(`Error playing sound: ${err.message}`));
        }
      });
      this.log('Service worker message listener set up');
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
      
      // This is a good time to request sound permission if we haven't yet
      if (!this.hasRequestedAudioPermission) {
        this.requestAudioPermission();
      }
    } catch (error) {
      this.log(`Error unlocking audio: ${error.message}`);
    }
  }

  // Request audio permission separately (like we do for notifications)
  async requestAudioPermission() {
    if (this.hasRequestedAudioPermission) return;
    
    this.hasRequestedAudioPermission = true;
    this.log('Requesting audio permission');
    
    try {
      // Try to play a silent sound to request permission
      const audio = new Audio();
      audio.volume = 0.01; // Very quiet
      
      // Use base64 encoded silent sound to avoid network requests
      audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1TSS0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////kSZQ7KAgGwAAAH///R5QbCUQEgAAIQoe5zO6//9bVs9yXqQCgAAAVcMW1trGjjRscDUFAgEZCMZVZDIpmSKvaa39zX+dDf95V+DfNjoDFGmk0OhtOYolF0t7GH////4Y0I2H3fxoLlAoAAAKnGLm1vGjn0ImdBUFQZEZRlSyCRTbKc/u9IqX/SRL5tKbXc7N804m6lvasvva7Gxv///+CwIQxhfSgLlAoAAADI2bFltWODzGzyVxS/7UsQVA8f0SZgqYfcIAAANIAAAAQ5DiukxWNGgmm/uZf9Q76Tq0udDHykYY6kTyyLGBQD8LsNB8Pv///8urkYY6iQQA2AAAAHGmrLaschzI2ShRDjbke5TcGxpECr/1Kif+n7VufnY2hkl7gdmnQwFAMwuBmKAZ2v///+CYQABh/QgALAAAAA0MzpMKpUDLIXXFClDOk0nAoGs////CoLsVEK2e8z5v///wJpAC4AAz//tSxAGDxiRKniplM5IAABpAAAAEAAADQAB//QAAAWmrrrDNjmRKpWmKlAZEOQ2I2JCZv///9Pv8NB5/3Ob///8bUAFwAAAAABOgAJn//oAAAOYpmrGWhymRdUK21EYESUM6JCVUPf///YQ/hoPP+fOX///43oALgAAAAABQgAM3+tAAAABNjNS5jis9t1ybQlkk6A0IURmZCRY9///pE/w2Hn/fP//7UsQBA8WESZYqZTOSAAAaQAAAAf///G9AA4AAAAAAUoAB//6UAAXHDIuYmHJrjgUh0HJE7IUBkRFEhIie///0qv4bDz/v/L///+CAABwAAA=';
      
      // Try to play
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        // If we get here, permission was granted
        this.log('Audio permission granted');
        
        // Show a small notification to the user
        this.showMessage('Sound notifications enabled');
        
        return true;
      }
    } catch (error) {
      this.log(`Audio permission request failed: ${error.message}`);
      
      // Show a helpful message
      this.showMessage('Please enable sound for timer alerts');
      
      return false;
    }
  }
  
  // Helper to show messages to the user
  showMessage(message) {
    // See if there's a message container
    const container = document.getElementById('message-container');
    if (container) {
      // Create a message element
      const messageEl = document.createElement('div');
      messageEl.className = 'message message-info';
      messageEl.textContent = message;
      
      // Add a close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'message-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => messageEl.remove());
      messageEl.appendChild(closeBtn);
      
      // Add to container
      container.appendChild(messageEl);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (messageEl.parentNode === container) {
          messageEl.remove();
        }
      }, 5000);
    } else {
      // Fallback to console if no container
      console.log(`Message: ${message}`);
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
    
    // Handle notification based on visibility state
    if (document.visibilityState === 'visible') {
      // App is visible, just play sound, no visible notification needed
      this.log('App is visible, playing sound only');
      await this.playSound();
      // Also vibrate if possible (this doesn't create a sound)
      this.vibrate();
      
      // Call any callbacks that might be waiting
      return true;
    } else {
      // App is in background or closed, use a full notification approach
      
      // Play sound first 
      await this.playSound().catch(error => {
        this.log(`Error playing sound: ${error.message}`);
      });
      
      // Always try to vibrate
      this.vibrate();
      
      // Then show notification
      const notificationResult = await Promise.allSettled([
        this.showServiceWorkerNotification(teaName),
        this.showRegularNotification(teaName)
      ]);
      
      // Log results for debugging
      notificationResult.forEach((result, index) => {
        const methods = ['ServiceWorker Notification', 'Regular Notification'];
        if (result.status === 'fulfilled') {
          this.log(`${methods[index]}: ${result.value ? 'Success' : 'Failed'}`);
        } else {
          this.log(`${methods[index]}: Error - ${result.reason}`);
        }
      });
      
      // Return true if any method succeeded
      return notificationResult.some(r => r.status === 'fulfilled' && r.value === true);
    }
  }

  // Try to show notification via service worker
  async showServiceWorkerNotification(teaName) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      this.log('No active service worker controller');
      return false;
    }
    
    try {
      this.log(`Using service worker for notification for tea: ${teaName}`);
      
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
      
      this.log(`Creating regular notification for tea: ${teaName}`);
      const notification = new Notification('Tea Timer', {
        body: `Your ${teaName || 'tea'} is ready!`,
        icon: './assets/icons/apple-touch-icon.png',
        tag: 'tea-timer-notification',
        renotify: true,
        requireInteraction: true
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