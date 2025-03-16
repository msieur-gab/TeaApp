// wake-lock-service.js
// Handles screen wake lock functionality to prevent device sleep during timing

class WakeLockService {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Set up visibility change listener
    if (this.isSupported) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
  
  // Check if wake lock is supported
  isWakeLockSupported() {
    return this.isSupported;
  }
  
  // Handle page visibility changes
  async handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.wakeLockRequest) {
      // Page is visible again, reacquire the wake lock
      this.wakeLock = await this.requestWakeLock();
    }
  }
  
  // Request a wake lock to keep the screen on
  async requestWakeLock() {
    if (!this.isSupported) {
      return null;
    }
    
    try {
      this.wakeLockRequest = true;
      const wakeLock = await navigator.wakeLock.request('screen');
      
      console.log('Wake Lock acquired');
      
      // Set up release listener
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
        this.wakeLock = null;
      });
      
      this.wakeLock = wakeLock;
      return wakeLock;
    } catch (error) {
      console.error('Failed to acquire Wake Lock:', error);
      this.wakeLockRequest = false;
      return null;
    }
  }
  
  // Release the wake lock
  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        this.wakeLockRequest = false;
        console.log('Wake Lock explicitly released');
        return true;
      } catch (error) {
        console.error('Failed to release Wake Lock:', error);
        return false;
      }
    }
    
    return false;
  }
  
  // Clean up resources
  destroy() {
    if (this.isSupported) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    this.releaseWakeLock();
  }
}

// Create and export a singleton instance
const wakeLockService = new WakeLockService();
export default wakeLockService;
