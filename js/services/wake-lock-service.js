// wake-lock-service.js
// Handles screen wake lock functionality to prevent device sleep during timing

class WakeLockService {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
    this.wakeLockRequest = false;
    this.isLogging = true; // Set to true for debugging wake lock issues
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Set up visibility change listener
    if (this.isSupported) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    } else {
      this.log('Wake Lock API not supported in this browser');
    }
  }
  
  // Helper for logging wake lock events
  log(message) {
    if (this.isLogging) {
      console.log(`[WakeLockService] ${message}`);
    }
  }
  
  // Check if wake lock is supported
  isWakeLockSupported() {
    return this.isSupported;
  }
  
  // Handle page visibility changes
  async handleVisibilityChange() {
    this.log(`Visibility changed. Page is ${document.visibilityState}`);
    
    if (document.visibilityState === 'visible' && this.wakeLockRequest) {
      // Page is visible again, reacquire the wake lock
      this.log('Page visible again, reacquiring wake lock');
      try {
        this.wakeLock = await this.requestWakeLock();
      } catch (error) {
        this.log(`Failed to reacquire wake lock: ${error.message}`);
      }
    } else if (document.visibilityState === 'hidden') {
      // The wake lock is automatically released when the page is hidden
      // but we need to update our internal state
      this.log('Page hidden, wake lock will be auto-released by browser');
      // Don't set wakeLock to null here, as we'll receive the 'release' event
    }
  }
  
  // Request a wake lock to keep the screen on
  async requestWakeLock() {
    if (!this.isSupported) {
      this.log('Wake Lock not supported, cannot request');
      return null;
    }
    
    // If we already have a wake lock, return it
    if (this.wakeLock && !this.wakeLock.released) {
      this.log('Wake Lock already active, reusing existing lock');
      return this.wakeLock;
    }
    
    try {
      this.wakeLockRequest = true;
      this.log('Requesting wake lock...');
      const wakeLock = await navigator.wakeLock.request('screen');
      
      this.log('Wake Lock acquired successfully');
      
      // Set up release listener
      wakeLock.addEventListener('release', () => {
        this.log('Wake Lock released by system');
        this.wakeLock = null;
      });
      
      this.wakeLock = wakeLock;
      return wakeLock;
    } catch (error) {
      this.log(`Failed to acquire Wake Lock: ${error.message}`);
      this.wakeLockRequest = false;
      return null;
    }
  }
  
  // Check if we currently have an active wake lock
  isWakeLockActive() {
    const isActive = this.wakeLock !== null && !this.wakeLock.released;
    this.log(`Wake lock active? ${isActive}`);
    return isActive;
  }
  
  // Force check and release wake lock if timer is inactive
  checkAndReleaseWakeLock(isTimerActive) {
    if (!isTimerActive && this.isWakeLockActive()) {
      this.log('Timer inactive but wake lock still active - forcing release');
      this.releaseWakeLock();
    }
  }
  
  // Release the wake lock
  async releaseWakeLock() {
    if (this.wakeLock && !this.wakeLock.released) {
      try {
        this.log('Explicitly releasing wake lock');
        await this.wakeLock.release();
        this.wakeLock = null;
        this.wakeLockRequest = false;
        this.log('Wake Lock explicitly released successfully');
        return true;
      } catch (error) {
        this.log(`Failed to release Wake Lock: ${error.message}`);
        
        // Even if release fails, update our internal state
        // This prevents getting stuck in a state where we think we have a wake lock
        // but actually don't
        if (error.message.includes('already released') || 
            error.message.includes('no lock')) {
          this.log('Wake lock was already released, updating internal state');
          this.wakeLock = null;
          this.wakeLockRequest = false;
        }
        
        return false;
      }
    } else {
      this.log('No active wake lock to release');
      this.wakeLock = null;
      this.wakeLockRequest = false;
      return false;
    }
  }
  
  // Clean up resources
  destroy() {
    if (this.isSupported) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    this.releaseWakeLock();
    this.log('WakeLockService destroyed');
  }
}

// Create and export a singleton instance
const wakeLockService = new WakeLockService();
export default wakeLockService;