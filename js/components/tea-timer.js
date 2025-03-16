// scripts/components/tea-timer.js

class TeaTimer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this.isActive = false;
    this.timeRemaining = 0;
    this.originalTime = 0;
    this.timerInterval = null;
    this.teaData = null;
    this.brewStyle = 'gongfu'; // 'western' or 'gongfu'
    this.currentInfusion = 1;
    
    // Touch handling
    this.touchStartY = 0;
    this.touchMoveY = 0;
    this.drawerHeight = 0;
    this.isDragging = false;
    this.currentTranslateY = 0;
    
    // Animation properties
    this.animationInProgress = false;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Calculate drawer height after rendering
    setTimeout(() => {
      const drawer = this.shadowRoot.querySelector('.timer-drawer-content');
      if (drawer) {
        this.drawerHeight = drawer.offsetHeight;
      }
    }, 100);
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
    this.stopTimer();
  }
  
  static get observedAttributes() {
    return ['active'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'active' && oldValue !== newValue) {
      this.isActive = newValue === 'true';
      this.render();
    }
  }
  
  addEventListeners() {
    const drawer = this.shadowRoot.querySelector('.timer-drawer');
    if (!drawer) return;
    
    // Drawer handle for click actions
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.addEventListener('click', this.toggleDrawer.bind(this));
      
      // Touch events for swipe actions
      handle.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      handle.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      handle.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }
    
    // Button controls
    this.shadowRoot.querySelector('.start-button')?.addEventListener('click', this.startTimer.bind(this));
    this.shadowRoot.querySelector('.stop-button')?.addEventListener('click', this.stopTimer.bind(this));
    this.shadowRoot.querySelector('.reset-button')?.addEventListener('click', this.resetTimer.bind(this));
    
    // Brew style toggle
    this.shadowRoot.querySelector('.brew-style-toggle')?.addEventListener('change', this.handleBrewStyleChange.bind(this));
    
    // Infusion controls
    this.shadowRoot.querySelector('.prev-infusion-btn')?.addEventListener('click', this.previousInfusion.bind(this));
    this.shadowRoot.querySelector('.next-infusion-btn')?.addEventListener('click', this.nextInfusion.bind(this));
  }
  
  removeEventListeners() {
    const drawer = this.shadowRoot.querySelector('.timer-drawer');
    if (!drawer) return;
    
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.removeEventListener('click', this.toggleDrawer.bind(this));
      handle.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      handle.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      handle.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    this.shadowRoot.querySelector('.start-button')?.removeEventListener('click', this.startTimer.bind(this));
    this.shadowRoot.querySelector('.stop-button')?.removeEventListener('click', this.stopTimer.bind(this));
    this.shadowRoot.querySelector('.reset-button')?.removeEventListener('click', this.resetTimer.bind(this));
    this.shadowRoot.querySelector('.brew-style-toggle')?.removeEventListener('change', this.handleBrewStyleChange.bind(this));
    this.shadowRoot.querySelector('.prev-infusion-btn')?.removeEventListener('click', this.previousInfusion.bind(this));
    this.shadowRoot.querySelector('.next-infusion-btn')?.removeEventListener('click', this.nextInfusion.bind(this));
  }
  
  // Touch event handlers
  handleTouchStart(event) {
    if (this.animationInProgress) return;
    
    this.isDragging = true;
    this.touchStartY = event.touches[0].clientY;
    
    // Get the current position from any existing transform
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    const currentTransform = window.getComputedStyle(drawerElement).transform;
    
    if (currentTransform && currentTransform !== 'none') {
      // Extract the translateY value if it exists
      const matrix = new DOMMatrix(currentTransform);
      this.currentTranslateY = matrix.m42; // translateY value from the matrix
    } else {
      this.currentTranslateY = this.isActive ? 0 : this.drawerHeight;
    }
    
    // Remove any transition while dragging
    drawerElement.style.transition = 'none';
  }
  
  handleTouchMove(event) {
    if (!this.isDragging) return;
    
    // Prevent default to stop scrolling
    event.preventDefault();
    
    this.touchMoveY = event.touches[0].clientY;
    const deltaY = this.touchMoveY - this.touchStartY;
    
    // Calculate new position (constrained)
    let newTranslateY = this.currentTranslateY + deltaY;
    
    // Constrain movement (can't drag above top position or below bottom)
    if (newTranslateY < 0) newTranslateY = 0;
    if (newTranslateY > this.drawerHeight) newTranslateY = this.drawerHeight;
    
    // Apply the transform
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    drawerElement.style.transform = `translateY(${newTranslateY}px)`;
  }
  
  handleTouchEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const deltaY = this.touchMoveY - this.touchStartY;
    
    // Determine if this was a swipe (based on distance and direction)
    if (Math.abs(deltaY) > 50) {
      // If swiped up, open drawer
      if (deltaY < 0) {
        this.openDrawer();
      } 
      // If swiped down, close drawer
      else {
        this.closeDrawer();
      }
    } else {
      // Small movement, snap back to current state
      if (this.isActive) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
    
    // Restore transition for snap animation
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
  }
  
  setTeaData(tea) {
    this.teaData = tea;
    
    // Reset brewing state
    this.brewStyle = 'western';
    this.currentInfusion = 1;
    
    // Parse brew time to seconds based on brewing style
    this.setTimerForCurrentBrewStyle();
    
    this.openDrawer();
    this.render();
  }
  
  setTimerForCurrentBrewStyle() {
    if (!this.teaData) return;
    
    let brewTime;
    
    if (this.brewStyle === 'western') {
      brewTime = this.teaData.westernBrewTime || this.teaData.brewTime;
    } else {
      // For gongfu, we increase time with each infusion
      const baseGongfuTime = this.teaData.gongfuBrewTime || 
                            (this.teaData.brewTime ? Math.floor(parseInt(this.teaData.brewTime, 10) / 2) : 30);
      
      // Adjust time based on infusion number - typically increasing with each infusion
      if (this.currentInfusion === 1) {
        // First infusion is often a rinse or shorter
        brewTime = `${baseGongfuTime}`;
      } else {
        // Add 5 seconds for each subsequent infusion
        brewTime = `${baseGongfuTime + ((this.currentInfusion - 1) * 5)}`;
      }
    }
    
    // Parse the time to seconds
    if (brewTime) {
      // Check if time is in MM:SS format
      if (typeof brewTime === 'string' && brewTime.includes(':')) {
        const [minutes, seconds] = brewTime.split(':').map(part => parseInt(part, 10));
        this.timeRemaining = (minutes * 60) + seconds;
      } else {
        // Assume it's just seconds
        this.timeRemaining = parseInt(brewTime, 10);
      }
      this.originalTime = this.timeRemaining;
    } else {
      // Default times if none specified
      if (this.brewStyle === 'western') {
        this.timeRemaining = 180; // 3 minutes default for western
      } else {
        this.timeRemaining = 30; // 30 seconds default for gongfu
      }
      this.originalTime = this.timeRemaining;
    }
    
    this.updateTimerDisplay();
  }
  
  handleBrewStyleChange(event) {
    this.brewStyle = event.target.checked ? 'gongfu' : 'western';
    this.currentInfusion = 1; // Reset to first infusion
    this.setTimerForCurrentBrewStyle();
    this.render();
  }
  
  previousInfusion() {
    if (this.currentInfusion > 1) {
      this.currentInfusion--;
      this.setTimerForCurrentBrewStyle();
      this.render();
    }
  }
  
  nextInfusion() {
    // Cap at a reasonable number, e.g., 10 infusions
    if (this.currentInfusion < 10) {
      this.currentInfusion++;
      this.setTimerForCurrentBrewStyle();
      this.render();
    }
  }
  
  toggleDrawer() {
    if (this.animationInProgress) return;
    
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.openDrawer();
    } else {
      this.closeDrawer();
    }
  }
  
  openDrawer() {
    this.animationInProgress = true;
    this.isActive = true;
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    if (drawerElement) {
      drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
      drawerElement.style.transform = 'translateY(0)';
      
      // After animation completes
      setTimeout(() => {
        this.animationInProgress = false;
        this.render();
      }, 300);
    }
  }
  
  closeDrawer() {
    this.animationInProgress = true;
    this.isActive = false;
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    if (drawerElement) {
      const height = this.drawerHeight - 50; // Keep the handle visible
      drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
      drawerElement.style.transform = `translateY(${height}px)`;
      
      // After animation completes
      setTimeout(() => {
        this.animationInProgress = false;
        this.render();
      }, 300);
    }
  }
  
  startTimer() {
    if (this.timerInterval) return; // Timer already running
    
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateTimerDisplay();
      } else {
        this.stopTimer();
        this.timerCompleted();
      }
    }, 1000);
    
    this.updateButtonStates('running');
  }
  
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.updateButtonStates('stopped');
    }
  }
  
  resetTimer() {
    this.stopTimer();
    this.timeRemaining = this.originalTime;
    this.updateTimerDisplay();
    this.updateButtonStates('reset');
  }
  
timerCompleted() {
    // Vibration feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    this.playCompletionSound();

    // Enhanced notification handling
    const showNotification = () => {
      // Check if Notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      // Request permission if not already granted
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          try {
            // Create notification with more robust options
            const notification = new Notification('Tea Timer', {
              body: `Your ${this.teaData?.name || 'tea'} is ready!`,
              icon: './assets/icons/apple-touch-icon.png', // Use a larger, more recognizable icon
              tag: 'tea-timer-notification',
              renotify: true,
              requireInteraction: true // Keeps notification visible until dismissed
            });

            // Optional: Add click handler to bring app to foreground
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (error) {
            console.error('Failed to create notification:', error);
          }
        } else {
          console.warn('Notification permission denied');
        }
      }).catch(error => {
        console.error('Error requesting notification permission:', error);
      });
    };

    // Attempt to show notification
    showNotification();
    
    // Update button states
    this.updateButtonStates('completed');
    
    // For gongfu brewing, offer to start next infusion
    if (this.brewStyle === 'gongfu') {
      const infusionControls = this.shadowRoot.querySelector('.infusion-controls');
      if (infusionControls) {
        infusionControls.classList.add('highlight');
        
        // Remove highlight after a few seconds
        setTimeout(() => {
          infusionControls.classList.remove('highlight');
        }, 3000);
      }
    }
  }

  playCompletionSound() {
    // Create audio element if it doesn't exist yet
    if (!this.completionSound) {
      this.completionSound = new Audio('./assets/sounds/notification.mp3');
      
      // Fallback to another format if MP3 isn't supported
      this.completionSound.onerror = () => {
        this.completionSound = new Audio('./assets/sounds/notification.ogg');
      };
    }
    
    // Try to play the sound
    // The volume will be controlled by the device as requested
    try {
      // Reset to start if it was already playing
      this.completionSound.currentTime = 0;
      
      // Play the sound (returns a promise)
      const playPromise = this.completionSound.play();
      
      // Handle potential play() rejection (happens if user hasn't interacted with page yet)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Could not play timer sound:', error);
          // We don't need to handle this further as the notification and vibration
          // will still alert the user
        });
      }
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  updateTimerDisplay() {
    const timerDisplay = this.shadowRoot.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    timerDisplay.textContent = this.formatTime(this.timeRemaining);
    
    // Update progress bar
    const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
    if (progressBar && this.originalTime > 0) {
      const progressPercent = (this.timeRemaining / this.originalTime) * 100;
      progressBar.style.width = `${progressPercent}%`;
      
      // Change color as time runs out
      if (progressPercent < 25) {
        progressBar.style.backgroundColor = '#f44336'; // Red
      } else if (progressPercent < 50) {
        progressBar.style.backgroundColor = '#ff9800'; // Orange
      } else {
        progressBar.style.backgroundColor = '#4a90e2'; // Blue
      }
    }
  }
  
  updateButtonStates(state) {
    const startButton = this.shadowRoot.querySelector('.start-button');
    const stopButton = this.shadowRoot.querySelector('.stop-button');
    const resetButton = this.shadowRoot.querySelector('.reset-button');
    
    if (!startButton || !stopButton || !resetButton) return;
    
    switch (state) {
      case 'running':
        startButton.disabled = true;
        stopButton.disabled = false;
        resetButton.disabled = true;
        break;
      case 'stopped':
        startButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
        break;
      case 'reset':
        startButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = true;
        break;
      case 'completed':
        startButton.disabled = true;
        stopButton.disabled = true;
        resetButton.disabled = false;
        break;
    }
  }
  
  render() {
    const styles = `
      :host {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        pointer-events: ${this.isActive ? 'auto' : 'none'};
      }

      .timer-drawer {
        background-color: white;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        transform: translateY(${this.isActive ? '0' : 'calc(100% - 50px)'});
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        overflow: hidden;
      }

      .drawer-handle {
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        position: relative;
        user-select: none;
        touch-action: none;
        pointer-events: auto; /* Make sure the handle is always clickable */
      }
      
      .drawer-handle::before {
        content: '';
        width: 40px;
        height: 4px;
        background-color: #ddd;
        border-radius: 2px;
        transition: transform 0.2s ease, background-color 0.2s ease;
      }
      
      .drawer-handle:hover::before {
        background-color: #ccc;
      }
      
      .drawer-handle:active::before {
        transform: scaleX(0.9);
      }
      
      .timer-drawer-content {
        padding: 0 1.5rem 1.5rem;
      }
      
      .timer-title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-bottom: 1rem;
      }
      
      .timer-title {
        font-size: 1.2rem;
        text-align: center;
        margin: 0;
        max-width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .brew-style-container {
        margin: 1rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .brew-style-toggle {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
        margin: 0 10px;
      }
      
      .brew-style-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 30px;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .toggle-slider {
        background-color: #2196F3;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(30px);
      }
      
      .brew-style-label {
        font-size: 0.9rem;
        color: #666;
      }
      
      .brew-style-label.active {
        font-weight: bold;
        color: #333;
      }
      
      .infusion-controls {
        display: ${this.brewStyle === 'gongfu' ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        padding: 0.5rem;
        border-radius: 8px;
        transition: background-color 0.3s ease;
      }
      
      .infusion-controls.highlight {
        background-color: #e8f4f8;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          background-color: #e8f4f8;
        }
        50% {
          background-color: #c7e6f7;
        }
        100% {
          background-color: #e8f4f8;
        }
      }
      
      .infusion-controls button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
      }
      
      .infusion-controls button:hover {
        color: #333;
      }
      
      .infusion-controls button:disabled {
        color: #ccc;
        cursor: not-allowed;
      }
      
      .infusion-number {
        font-size: 1rem;
        font-weight: bold;
        margin: 0 1rem;
      }
      
      .timer-display-container {
        position: relative;
        width: 100%;
        margin-bottom: 1.5rem;
      }
      
      .timer-progress-bar-container {
        width: 100%;
        height: 6px;
        background-color: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .timer-progress-bar {
        height: 100%;
        background-color: #4a90e2;
        width: 100%;
        transition: width 1s linear, background-color 1s ease;
      }
      
      .timer-display {
        font-size: 4rem;
        text-align: center;
        font-weight: bold;
        margin: 1rem 0;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum";
      }
      
      .timer-info {
        color: #666;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 0.9rem;
      }
      
      .timer-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        justify-content: center;
      }
      
      .timer-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 100px;
      }
      
      .start-button {
        background-color: #4CAF50;
        color: white;
      }
      
      .start-button:hover:not(:disabled) {
        background-color: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .stop-button {
        background-color: #f44336;
        color: white;
      }
      
      .stop-button:hover:not(:disabled) {
        background-color: #d32f2f;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .reset-button {
        background-color: #808080;
        color: white;
      }
      
      .reset-button:hover:not(:disabled) {
        background-color: #707070;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .timer-button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: none;
      }
      
      .timer-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      @media (max-width: 480px) {
        .timer-display {
          font-size: 3rem;
        }
        
        .timer-button {
          padding: 0.5rem 1rem;
          min-width: 80px;
          font-size: 0.9rem;
        }
      }
    `;
    
    const teaName = this.teaData?.name || 'Select a tea to steep';
    
    // Determine temperature info based on brew style
    let tempInfo = '';
    if (this.teaData) {
      if (this.brewStyle === 'western') {
        tempInfo = this.teaData.westernTemperature || this.teaData.temperature || 'Not specified';
      } else {
        tempInfo = this.teaData.gongfuTemperature || this.teaData.temperature || 'Not specified';
      }
    }
    
    const teaInfo = this.teaData 
      ? `Temperature: ${tempInfo}`
      : 'Click on a tea card and press "Steep This Tea" to start';
    
    // Infusion label for Gongfu
    const infusionLabel = this.brewStyle === 'gongfu' 
      ? `Infusion ${this.currentInfusion}`
      : '';
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="timer-drawer">
        <div class="drawer-handle" aria-label="Toggle timer drawer"></div>
        
        <div class="timer-drawer-content">
          <div class="timer-title-row">
            <h3 class="timer-title">${teaName}</h3>
          </div>
          
          <div class="brew-style-container">
            <span class="brew-style-label ${this.brewStyle === 'western' ? 'active' : ''}">Western</span>
            
            <label class="brew-style-toggle">
              <input type="checkbox" ${this.brewStyle === 'gongfu' ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            
            <span class="brew-style-label ${this.brewStyle === 'gongfu' ? 'active' : ''}">Gongfu</span>
          </div>
          
          <div class="infusion-controls">
            <button class="prev-infusion-btn" ${this.currentInfusion <= 1 ? 'disabled' : ''} aria-label="Previous infusion">
              <span>−</span>
            </button>
            <span class="infusion-number">${infusionLabel}</span>
            <button class="next-infusion-btn" aria-label="Next infusion">
              <span>+</span>
            </button>
          </div>
          
          <div class="timer-display-container">
            <div class="timer-progress-bar-container">
              <div class="timer-progress-bar"></div>
            </div>
            <div class="timer-display">${this.formatTime(this.timeRemaining)}</div>
          </div>
          
          <p class="timer-info">${teaInfo}</p>
          
          <div class="timer-controls">
            <button class="timer-button start-button" ${!this.teaData ? 'disabled' : ''}>Start</button>
            <button class="timer-button stop-button" disabled>Stop</button>
            <button class="timer-button reset-button" ${!this.teaData ? 'disabled' : ''}>Reset</button>
          </div>
        </div>
      </div>
    `;
    
    this.addEventListeners();
    this.updateTimerDisplay();
    this.updateButtonStates(this.timerInterval ? 'running' : 'reset');
  }
}

customElements.define('tea-timer', TeaTimer);

export default TeaTimer;
