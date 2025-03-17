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
    this.isEditing = false;
    
    // Touch handling
    this.touchStartY = 0;
    this.touchMoveY = 0;
    this.drawerHeight = 0;
    this.isDragging = false;
    this.currentTranslateY = 0;
    this.animationInProgress = false;
    
    // Bind methods
    this.handleTimerUpdate = this.handleTimerUpdate.bind(this);
    this.handleTimerComplete = this.handleTimerComplete.bind(this);
    this.handleTimerStateChange = this.handleTimerStateChange.bind(this);
    this.handleDrawerClick = this.toggleDrawer.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Register timer service callbacks
    timerService.onUpdate(this.handleTimerUpdate);
    timerService.onComplete(this.handleTimerComplete);
    timerService.onStateChange(this.handleTimerStateChange);
    
    // Calculate drawer height
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
  handleTimerUpdate(timeRemaining, originalDuration) {
    // Track if originalDuration has changed (indicating time was added)
    const durationChanged = this.lastOriginalDuration && this.lastOriginalDuration !== originalDuration;
    
    // Store current value for next comparison
    this.lastOriginalDuration = originalDuration;
    
    // If duration changed, handle the progress bar transition
    if (durationChanged) {
      const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
      if (progressBar) {
        // Temporarily disable transition for instant adjustment
        progressBar.style.transition = 'none';
        
        // Force a reflow to apply the disabled transition
        progressBar.offsetHeight;
        
        // Re-enable transition after a brief moment
        setTimeout(() => {
          progressBar.style.transition = 'width 1s linear, background-color 1s ease';
        }, 10);
      }
    }
    
    // Update the timer display
    this.updateTimerDisplay(timeRemaining, originalDuration);
  }
  
  handleTimerComplete() {
    // For gongfu brewing, highlight infusion controls
    if (this.brewStyle === 'gongfu') {
      const infusionControls = this.shadowRoot.querySelector('.infusion-controls');
      if (infusionControls) {
        infusionControls.classList.add('highlight');
        setTimeout(() => infusionControls.classList.remove('highlight'), 3000);
      }
    }
  }
  
  handleTimerStateChange(state) {
    this.updateButtonStates(state);
  }
  
  setupEventListeners() {
    // Drawer handle
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.addEventListener('click', this.handleDrawerClick);
      handle.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      handle.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      handle.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
    
    // Button controls
    this.shadowRoot.querySelector('.start-pause-button')?.addEventListener('click', () => this.toggleStartPause());
    this.shadowRoot.querySelector('.add-time-button')?.addEventListener('click', () => this.addTenSeconds());
    this.shadowRoot.querySelector('.reset-button')?.addEventListener('click', () => this.resetTimer());
    
    // Time inputs
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (minutesInput) {
      minutesInput.addEventListener('focus', () => this.handleTimeInput(minutesInput, true));
      minutesInput.addEventListener('blur', () => this.handleTimeInput(minutesInput, false));
      minutesInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/[^0-9]/g, ''));
    }
    
    if (secondsInput) {
      secondsInput.addEventListener('focus', () => this.handleTimeInput(secondsInput, true));
      secondsInput.addEventListener('blur', () => this.handleTimeInput(secondsInput, false));
      secondsInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/[^0-9]/g, ''));
    }
    
    // Brew style toggle
    this.shadowRoot.querySelector('.brew-style-toggle')?.addEventListener('change', (e) => this.handleBrewStyleChange(e));
    
    // Infusion controls
    this.shadowRoot.querySelector('.prev-infusion-btn')?.addEventListener('click', () => this.previousInfusion());
    this.shadowRoot.querySelector('.next-infusion-btn')?.addEventListener('click', () => this.nextInfusion());
  }
  
  removeEventListeners() {
    // We'll use the newer approach of removing listeners by not explicitly removing each one
    // This simplifies the code and avoids potential memory leaks
    // The shadowRoot will be garbage collected along with its event listeners
  }
  
  // Simplified time input handling
  handleTimeInput(input, isFocusing) {
    this.isEditing = isFocusing;
    
    if (isFocusing) {
      input.select();
    } else {
      this.validateTimeInput(input);
      
      if (!timerService.isTimerRunning()) {
        this.applyManualTimeChange();
      }
    }
  }
  
  validateTimeInput(input) {
    let value = parseInt(input.value);
    const max = 59;
    
    if (isNaN(value) || value < 0) {
      value = 0;
    } else if (value > max) {
      value = max;
    }
    
    input.value = value.toString().padStart(2, '0');
  }
  
  applyManualTimeChange() {
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (minutesInput && secondsInput) {
      const minutes = parseInt(minutesInput.value) || 0;
      const seconds = parseInt(secondsInput.value) || 0;
      const newDuration = minutes * 60 + seconds;
      
      if (newDuration > 0) {
        timerService.startTimer(newDuration, this.teaData?.name);
        timerService.pauseTimer();
      }
    }
  }
  
  // Touch handlers
  handleTouchStart(event) {
    if (this.animationInProgress) return;
    
    this.isDragging = true;
    this.touchStartY = event.touches[0].clientY;
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    const currentTransform = window.getComputedStyle(drawerElement).transform;
    
    if (currentTransform && currentTransform !== 'none') {
      const matrix = new DOMMatrix(currentTransform);
      this.currentTranslateY = matrix.m42;
    } else {
      this.currentTranslateY = this.isActive ? 0 : this.drawerHeight;
    }
    
    drawerElement.style.transition = 'none';
  }
  
  handleTouchMove(event) {
    if (!this.isDragging) return;
    event.preventDefault();
    
    this.touchMoveY = event.touches[0].clientY;
    const deltaY = this.touchMoveY - this.touchStartY;
    
    let newTranslateY = this.currentTranslateY + deltaY;
    newTranslateY = Math.max(0, Math.min(this.drawerHeight, newTranslateY));
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    drawerElement.style.transform = `translateY(${newTranslateY}px)`;
  }
  
  handleTouchEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    const deltaY = this.touchMoveY - this.touchStartY;
    
    if (Math.abs(deltaY) > 50) {
      deltaY < 0 ? this.openDrawer() : this.closeDrawer();
    } else {
      this.isActive ? this.openDrawer() : this.closeDrawer();
    }
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
  }
  
  // Public API methods (for app.js)
  setTeaData(tea) {
    this.teaData = tea;
    this.brewStyle = 'western';
    this.currentInfusion = 1;
    
    const duration = this.calculateBrewDuration();
    timerService.startTimer(duration, tea.name);
    timerService.pauseTimer();
    
    this.render();
  }
  
  openDrawer() {
    this.animationInProgress = true;
    this.isActive = true;
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    if (drawerElement) {
      drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
      drawerElement.style.transform = 'translateY(0)';
      
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
      const height = this.drawerHeight - 50;
      drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
      drawerElement.style.transform = `translateY(${height}px)`;
      
      setTimeout(() => {
        this.animationInProgress = false;
        this.render();
      }, 300);
    }
  }
  
  toggleDrawer() {
    if (this.animationInProgress) return;
    this.isActive ? this.closeDrawer() : this.openDrawer();
  }
  
  // Brewing methods
  calculateBrewDuration() {
    if (!this.teaData) return 180; // Default 3 minutes
    
    let brewTime;
    
    if (this.brewStyle === 'western') {
      brewTime = this.teaData.westernBrewTime || this.teaData.brewTime;
    } else {
      // For gongfu brewing
      const baseGongfuTime = this.teaData.gongfuBrewTime || 
                            (this.teaData.brewTime ? Math.floor(parseInt(this.teaData.brewTime, 10) / 2) : 30);
      
      if (this.currentInfusion === 1) {
        brewTime = `${baseGongfuTime}`;
      } else {
        brewTime = `${parseInt(baseGongfuTime, 10) + ((this.currentInfusion - 1) * 5)}`;
      }
    }
    
    // Parse time to seconds
    if (brewTime) {
      if (typeof brewTime === 'string' && brewTime.includes(':')) {
        const [minutes, seconds] = brewTime.split(':').map(part => parseInt(part, 10));
        return (minutes * 60) + seconds;
      } else {
        return parseInt(brewTime, 10);
      }
    } else {
      return this.brewStyle === 'western' ? 180 : 30;
    }
  }
  
  handleBrewStyleChange(event) {
    this.brewStyle = event.target.checked ? 'gongfu' : 'western';
    this.currentInfusion = 1;
    
    const duration = this.calculateBrewDuration();
    timerService.startTimer(duration, this.teaData?.name);
    timerService.pauseTimer();
    
    this.render();
  }
  
  previousInfusion() {
    if (this.currentInfusion > 1) {
      this.currentInfusion--;
      
      const duration = this.calculateBrewDuration();
      timerService.startTimer(duration, this.teaData?.name);
      timerService.pauseTimer();
      
      this.render();
    }
  }
  
  nextInfusion() {
    if (this.currentInfusion < 10) {
      this.currentInfusion++;
      
      const duration = this.calculateBrewDuration();
      timerService.startTimer(duration, this.teaData?.name);
      timerService.pauseTimer();
      
      this.render();
    }
  }
  
  // Timer control methods
  toggleStartPause() {
    if (!this.teaData) return;
    
    if (timerService.isTimerRunning()) {
      timerService.pauseTimer();
    } else {
      timerService.resumeTimer();
    }
  }
  
  addTenSeconds() {
    if (!this.teaData) return;
    timerService.addTime(10);
  }
  
  resetTimer() {
    timerService.resetTimer();
  }
  
  // UI update methods
  updateTimerDisplay(timeRemaining, originalDuration) {
    if (this.isEditing) return;
    
    // Ensure timeRemaining is a valid number
    const validTimeRemaining = Number.isFinite(timeRemaining) ? timeRemaining : 0;
    
    // Update the time inputs
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (minutesInput && secondsInput) {
      const minutes = Math.floor(validTimeRemaining / 60);
      const seconds = validTimeRemaining % 60;
      
      // Ensure we're setting valid values
      minutesInput.value = Number.isFinite(minutes) ? minutes.toString().padStart(2, '0') : '00';
      secondsInput.value = Number.isFinite(seconds) ? seconds.toString().padStart(2, '0') : '00';
    }
    
    // Update progress bar
    const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
    if (progressBar && originalDuration > 0) {
      // Ensure we calculate a valid percentage
      const progressPercent = Number.isFinite(validTimeRemaining) && Number.isFinite(originalDuration) 
        ? (validTimeRemaining / originalDuration) * 100
        : 100;
      
      progressBar.style.width = `${progressPercent}%`;
      
      // Change color as time runs out
      // if (progressPercent < 25) {
      //   progressBar.style.backgroundColor = '#f44336'; // Red
      // } else if (progressPercent < 50) {
      //   progressBar.style.backgroundColor = '#ff9800'; // Orange
      // } else {
      //   progressBar.style.backgroundColor = '#4a90e2'; // Blue
      // }

      if (progressPercent < 25) {
        progressBar.style.backgroundColor = '#795548'; // Dark, fully steeped tea
      } else if (progressPercent < 50) {
        progressBar.style.backgroundColor = '#B38867'; // Medium steep
      } else {
        progressBar.style.backgroundColor = '#D7CCC8'; // Light tea
      }
    }
  }
  
  updateButtonStates(state) {
    const startPauseButton = this.shadowRoot.querySelector('.start-pause-button');
    const resetButton = this.shadowRoot.querySelector('.reset-button');
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (!startPauseButton || !resetButton) return;
    
    switch (state) {
      case 'running':
        startPauseButton.textContent = 'Pause';
        startPauseButton.classList.remove('start-button');
        startPauseButton.classList.add('pause-button');
        resetButton.disabled = true;
        
        // Disable time inputs when running
        if (minutesInput) minutesInput.disabled = true;
        if (secondsInput) secondsInput.disabled = true;
        break;
        
      case 'stopped':
      case 'paused':
        startPauseButton.textContent = 'Start';
        startPauseButton.classList.remove('pause-button');
        startPauseButton.classList.add('start-button');
        resetButton.disabled = false;
        
        // Enable time inputs when paused
        if (minutesInput) minutesInput.disabled = false;
        if (secondsInput) secondsInput.disabled = false;
        break;
        
      case 'reset':
        startPauseButton.textContent = 'Start';
        startPauseButton.classList.remove('pause-button');
        startPauseButton.classList.add('start-button');
        resetButton.disabled = true;
        
        // Enable time inputs when reset
        if (minutesInput) minutesInput.disabled = false;
        if (secondsInput) secondsInput.disabled = false;
        break;
        
      case 'completed':
        startPauseButton.textContent = 'Start';
        startPauseButton.classList.remove('pause-button');
        startPauseButton.classList.add('start-button');
        resetButton.disabled = false;
        
        // Enable time inputs when completed
        if (minutesInput) minutesInput.disabled = false;
        if (secondsInput) secondsInput.disabled = false;
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
        pointer-events: auto;
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
        0% { background-color: #e8f4f8; }
        50% { background-color: #c7e6f7; }
        100% { background-color: #e8f4f8; }
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
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        text-align: center;
        font-weight: bold;
        margin: 1rem 0;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum";
      }
      
      .timer-display input {
        width: 80px;
        background: transparent;
        border: none;
        font-size: inherit;
        text-align: center;
        font-weight: inherit;
        color: inherit;
        font-family: inherit;
        padding: 0;
        margin: 0;
        transition: background-color 0.2s ease;
      }
      
      .timer-display input:focus {
        outline: none;
        background-color: rgba(74, 144, 226, 0.1);
        border-radius: 8px;
      }
      
      .timer-display input:disabled {
        opacity: 1;
        color: inherit;
      }
      
      .timer-display-separator {
        margin: 0 5px;
      }
      
      /* Remove spinner arrows from number inputs */
      .timer-display input::-webkit-outer-spin-button,
      .timer-display input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      
      .timer-display input[type="number"] {
        -moz-appearance: textfield;
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
        padding: 0.75rem 1rem;
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
      
      .pause-button {
        background-color: #ff9800;
        color: white;
      }
      
      .pause-button:hover:not(:disabled) {
        background-color: #f57c00;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .add-time-button {
        background-color: #2196F3;
        color: white;
      }
      
      .add-time-button:hover:not(:disabled) {
        background-color: #0b7dda;
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
        
        .timer-display input {
          width: 60px;
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
      
    // Get safe time values
    const timeRemaining = timerService.getTimeRemaining();
    const minutes = Number.isFinite(timeRemaining) ? Math.floor(timeRemaining / 60) : 0;
    const seconds = Number.isFinite(timeRemaining) ? timeRemaining % 60 : 0;
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
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
            
            <div class="timer-display">
              <input type="number" class="minutes-input" min="0" max="59" value="${minutesStr}" ${timerService.isTimerRunning() ? 'disabled' : ''}>
              <span class="timer-display-separator">:</span>
              <input type="number" class="seconds-input" min="0" max="59" value="${secondsStr}" ${timerService.isTimerRunning() ? 'disabled' : ''}>
            </div>
          </div>
          
          <p class="timer-info">${teaInfo}</p>
          
          <div class="timer-controls">
            <button class="timer-button start-pause-button ${timerService.isTimerRunning() ? 'pause-button' : 'start-button'}" ${!this.teaData ? 'disabled' : ''}>
              ${timerService.isTimerRunning() ? 'Pause' : 'Start'}
            </button>
            <button class="timer-button add-time-button" ${!this.teaData ? 'disabled' : ''}>+10s</button>
            <button class="timer-button reset-button" ${!this.teaData || timerService.isTimerRunning() ? 'disabled' : ''}>Reset</button>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    
    // Update button states based on current timer state
    this.updateButtonStates(timerService.isTimerRunning() ? 'running' : 'reset');
    
    // Update timer display initially
    this.updateTimerDisplay(timerService.getTimeRemaining(), timerService.getOriginalDuration());
  }
}

customElements.define('tea-timer', TeaTimer);

export default TeaTimer;