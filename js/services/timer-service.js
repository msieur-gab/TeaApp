// timer-service.js
// Manages the timer worker and provides a clean API for the tea timer component

import notificationService from './notification-service.js';
import wakeLockService from './wake-lock-service.js';

class TimerService {
  constructor() {
    this.worker = null;
    this.isRunning = false;
    this.timeRemaining = 0;
    this.originalDuration = 0;
    this.teaName = null;
    this.onUpdateCallbacks = [];
    this.onCompleteCallbacks = [];
    this.onStateChangeCallbacks = [];
    
    // Store wake lock service reference
    this.wakeLockService = wakeLockService;
    
    // Bind methods
    this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Set up visibility change listener for syncing
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Initialize the worker
    this.initWorker();
  }
  
  // Initialize the timer worker
  initWorker() {
    if (window.Worker) {
      try {
        // Terminate any existing worker
        if (this.worker) {
          this.worker.terminate();
        }
        
        // Create new worker
        this.worker = new Worker('./timer-worker.js');
        
        // Set up message handler
        this.worker.onmessage = this.handleWorkerMessage;
        
        console.log('Timer worker initialized');
        return true;
      } catch (error) {
        console.error('Failed to initialize timer worker:', error);
        return false;
      }
    } else {
      console.warn('Web Workers not supported in this browser');
      return false;
    }
  }
  
  // Handle messages from the worker
  handleWorkerMessage(event) {
    const data = event.data;
    
    // Update common state for all message types
    if ('timeRemaining' in data) {
      this.timeRemaining = data.timeRemaining;
    }
    
    // Update running state based on message type
    switch (data.type) {
      case 'update':
        // Just notify update callbacks
        this.notifyUpdateCallbacks(this.timeRemaining);
        break;
        
      case 'complete':
        this.isRunning = false;
        this.wakeLockService.releaseWakeLock();
        this.notifyUpdateCallbacks(0);
        this.notifyCompleteCallbacks();
        this.notifyStateChangeCallbacks('completed');
        break;
        
      case 'paused':
      case 'stopped':
        this.isRunning = false;
        this.wakeLockService.releaseWakeLock();
        this.notifyUpdateCallbacks(this.timeRemaining);
        this.notifyStateChangeCallbacks('stopped');
        break;
        
      case 'resumed':
        this.isRunning = true;
        this.wakeLockService.requestWakeLock();
        this.notifyStateChangeCallbacks('running');
        break;
        
      case 'reset':
        this.isRunning = false;
        this.wakeLockService.releaseWakeLock();
        this.notifyUpdateCallbacks(this.timeRemaining);
        this.notifyStateChangeCallbacks('reset');
        break;
    }
  }
  
  // Handle page visibility changes
  handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.isRunning) {
      // Page is visible again, sync the timer
      this.syncTimer();
    }
  }
  
  // Sync with the worker to get current time
  syncTimer() {
    if (this.worker) {
      this.worker.postMessage({ command: 'sync' });
    }
  }
  
  // Start the timer
  startTimer(duration, teaName) {
    this.originalDuration = duration;
    this.timeRemaining = duration;
    this.teaName = teaName;
    
    // Request wake lock to keep screen on
    this.wakeLockService.requestWakeLock();
    
    if (this.worker) {
      this.worker.postMessage({
        command: 'start',
        duration: duration
      });
      
      this.isRunning = true;
      this.notifyStateChangeCallbacks('running');
      return true;
    } else {
      console.error('Timer worker not available');
      return false;
    }
  }
  
  // Pause the timer
  pauseTimer() {
    if (this.worker) {
      this.worker.postMessage({ command: 'pause' });
      this.isRunning = false;
      // Wake lock will be released in the message handler
      return true;
    }
    
    return false;
  }
  
  // Resume the timer
  resumeTimer() {
    if (this.worker) {
      this.worker.postMessage({ command: 'resume' });
      this.isRunning = true;
      // Wake lock will be requested in the message handler
      return true;
    }
    
    return false;
  }
  
  // Reset the timer
  resetTimer() {
    if (this.worker) {
      this.worker.postMessage({
        command: 'reset',
        duration: this.originalDuration
      });
      
      this.isRunning = false;
      // Wake lock will be released in the message handler
      return true;
    }
    
    return false;
  }
  
  // Stop the timer
  stopTimer() {
    if (this.worker) {
      this.worker.postMessage({ command: 'stop' });
      this.isRunning = false;
      // Wake lock will be released in the message handler
      return true;
    }
    
    return false;
  }
  
  // Get current time remaining
  getTimeRemaining() {
    return this.timeRemaining;
  }
  
  // Get original duration
  getOriginalDuration() {
    return this.originalDuration;
  }
  
  // Check if timer is running
  isTimerRunning() {
    return this.isRunning;
  }
  
  // Register update callback
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallbacks.push(callback);
    }
  }
  
  // Register complete callback
  onComplete(callback) {
    if (typeof callback === 'function') {
      this.onCompleteCallbacks.push(callback);
    }
  }
  
  // Register state change callback
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.onStateChangeCallbacks.push(callback);
    }
  }
  
  // Remove update callback
  offUpdate(callback) {
    this.onUpdateCallbacks = this.onUpdateCallbacks.filter(cb => cb !== callback);
  }
  
  // Remove complete callback
  offComplete(callback) {
    this.onCompleteCallbacks = this.onCompleteCallbacks.filter(cb => cb !== callback);
  }
  
  // Remove state change callback
  offStateChange(callback) {
    this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
  }
  
  // Notify all update callbacks
  notifyUpdateCallbacks(timeRemaining) {
    this.onUpdateCallbacks.forEach(callback => {
      try {
        callback(timeRemaining);
      } catch (error) {
        console.error('Error in timer update callback:', error);
      }
    });
  }
  
  // Notify all complete callbacks
  notifyCompleteCallbacks() {
    // Delegate notification to the notification service
    notificationService.notifyTeaReady(this.teaName);
    
    this.onCompleteCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in timer complete callback:', error);
      }
    });
  }
  
  // Notify all state change callbacks
  notifyStateChangeCallbacks(state) {
    this.onStateChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in timer state change callback:', error);
      }
    });
  }
  
  // Clean up resources
  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.wakeLockService.releaseWakeLock();
    
    this.onUpdateCallbacks = [];
    this.onCompleteCallbacks = [];
    this.onStateChangeCallbacks = [];
  }
}

// Create and export a singleton instance
const timerService = new TimerService();
export default timerService;
