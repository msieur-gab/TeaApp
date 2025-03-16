// scripts/components/tea-timer.js

import timerService from '../services/timer-service.js';

class TeaTimer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // State
    this.isActive = false;
    this.teaData = null;
    this.brewStyle = 'western'; // 'western' or 'gongfu'
    this.currentInfusion = 1;
    
    // Touch handling
    this.touchStartY = 0;
    this.touchMoveY = 0;
    this.drawerHeight = 0;
    this.isDragging = false;
    this.currentTranslateY = 0;
    
    // Animation properties
    this.animationInProgress = false;
    
    // Bind timer service callback methods
    this.handleTimerUpdate = this.handleTimerUpdate.bind(this);
    this.handleTimerComplete = this.handleTimerComplete.bind(this);
    this.handleTimerStateChange = this.handleTimerStateChange.bind(this);
    
    // Bind event handlers once
    this.handleStartClick = this.startTimer.bind(this);
    this.handleStopClick = this.stopTimer.bind(this);
    this.handleResetClick = this.resetTimer.bind(this);
    this.handleBrewStyleChange = this.handleBrewStyleChange.bind(this);
    this.handlePrevInfusionClick = this.previousInfusion.bind(this);
    this.handleNextInfusionClick = this.nextInfusion.bind(this);
    this.handleDrawerClick = this.toggleDrawer.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Register timer service callbacks
    timerService.onUpdate(this.handleTimerUpdate);
    timerService.onComplete(this.handleTimerComplete);
    timerService.onStateChange(this.handleTimerStateChange);
    
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
    
    // Unregister timer service callbacks
    timerService.offUpdate(this.handleTimerUpdate);
    timerService.offComplete(this.handleTimerComplete);
    timerService.offStateChange(this.handleTimerStateChange);
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
  
  // Timer service event handlers
  handleTimerUpdate(timeRemaining) {
    this.updateTimerDisplay(timeRemaining, timerService.getOriginalDuration());
  }
  
  handleTimerComplete() {
    // For gongfu brewing, highlight infusion controls to start next
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
  
  handleTimerStateChange(state) {
    this.updateButtonStates(state);
  }
  
  addEventListeners() {
    // Drawer handle for click actions
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.addEventListener('click', this.handleDrawerClick);
      
      // Touch events for swipe actions
      handle.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      handle.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      handle.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
    
    // Button controls
    this.shadowRoot.querySelector('.start-button')?.addEventListener('click', this.handleStartClick);
    this.shadowRoot.querySelector('.stop-button')?.addEventListener('click', this.handleStopClick);
    this.shadowRoot.querySelector('.reset-button')?.addEventListener('click', this.handleResetClick);
    
    // Brew style toggle
    this.shadowRoot.querySelector('.brew-style-toggle')?.addEventListener('change', this.handleBrewStyleChange);
    
    // Infusion controls
    this.shadowRoot.querySelector('.prev-infusion-btn')?.addEventListener('click', this.handlePrevInfusionClick);
    this.shadowRoot.querySelector('.next-infusion-btn')?.addEventListener('click', this.handleNextInfusionClick);
  }
  
  removeEventListeners() {
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.removeEventListener('click', this.handleDrawerClick);
      handle.removeEventListener('touchstart', this.handleTouchStart);
      handle.removeEventListener('touchmove', this.handleTouchMove);
      handle.removeEventListener('touchend', this.handleTouchEnd);
    }
    
    this.shadowRoot.querySelector('.start-button')?.removeEventListener('click', this.handleStartClick);
    this.shadowRoot.querySelector('.stop-button')?.removeEventListener('click', this.handleStopClick);
    this.shadowRoot.querySelector('.reset-button')?.removeEventListener('click', this.handleResetClick);
    this.shadowRoot.querySelector('.brew-style-toggle')?.removeEventListener('change', this.handleBrewStyleChange);
    this.shadowRoot.querySelector('.prev-infusion-btn')?.removeEventListener('click', this.handlePrevInfusionClick);
    this.shadowRoot.querySelector('.next-infusion-btn')?.removeEventListener('click', this.handleNextInfusionClick);
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
    
    // Calculate brew time based on brewing style
    const duration = this.calculateBrewDuration();
    
    // Update the timer service with initial duration 
    // (but don't start it yet)
    timerService.startTimer(duration, tea.name);
    timerService.pauseTimer();
    
    this.openDrawer();
    this.render();
  }
  
  calculateBrewDuration() {
    if (!this.teaData) return 180; // Default 3 minutes
    
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
        brewTime = `${parseInt(baseGongfuTime, 10) + ((this.currentInfusion - 1) * 5)}`;
      }
    }
    
    // Parse the time to seconds
    if (brewTime) {
      // Check if time is in MM:SS format
      if (typeof brewTime === 'string' && brewTime.includes(':')) {
        const [minutes, seconds] = brewTime.split(':').map(part => parseInt(part, 10));
        return (minutes * 60) + seconds;
      } else {
        // Assume it's just seconds
        return parseInt(brewTime, 10);
      }
    } else {
      // Default times if none specified
      if (this.brewStyle === 'western') {
        return 180; // 3 minutes default for western
      } else {
        return 30; // 30 seconds default for gongfu
      }
    }
  }
  
  handleBrewStyleChange(event) {
    this.brewStyle = event.target.checked ? 'gongfu' : 'western';
    this.currentInfusion = 1; // Reset to first infusion
    
    // Update timer duration when brew style changes
    const duration = this.calculateBrewDuration();
    
    // Update the timer with the new duration
    timerService.startTimer(duration, this.teaData?.name);
    timerService.pauseTimer();
    
    this.render();
  }
  
  previousInfusion() {
    if (this.currentInfusion > 1) {
      this.currentInfusion--;
      
      // Update timer for new infusion
      const duration = this.calculateBrewDuration();
      timerService.startTimer(duration, this.teaData?.name);
      timerService.pauseTimer();
      
      this.render();
    }
  }
  
  nextInfusion() {
    // Cap at a reasonable number, e.g., 10 infusions
    if (this.currentInfusion < 10) {
      this.currentInfusion++;
      
      // Update timer for new infusion
      const duration = this.calculateBrewDuration();
      timerService.startTimer(duration, this.teaData?.name);
      timerService.pauseTimer();
      
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
  
  // Timer control methods - using timer service
  startTimer() {
    if (!this.teaData) return;
    
    // Use the current calculated duration
    timerService.resumeTimer();
  }
  
  stopTimer() {
    timerService.pauseTimer();
  }
  
  resetTimer() {
    timerService.resetTimer();
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  updateTimerDisplay(timeRemaining, originalDuration) {
    const timerDisplay = this.shadowRoot.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    timerDisplay.textContent = this.formatTime(timeRemaining);
    
    // Update progress bar
    const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
    if (progressBar && originalDuration > 0) {
      const progressPercent = (timeRemaining / originalDuration) * 100;
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
            <div class="timer-display">${this.formatTime(timerService.getTimeRemaining())}</div>
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
    
    // Update button states based on current timer state
    this.updateButtonStates(timerService.isTimerRunning() ? 'running' : 'reset');
    
    // Update timer display initially
    this.updateTimerDisplay(timerService.getTimeRemaining(), timerService.getOriginalDuration());
  }
}