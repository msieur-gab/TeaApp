// scripts/components/tea-timer.js
// Updated to use atomic components

import timerService from '../services/timer-service.js';
import './tea-timer-atoms.js';

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
    this.handleTimerStateChange = this.handleTimerStateChange.bind(this);
    this.handleDrawerToggle = this.handleDrawerToggle.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.handleBrewStyleChange = this.handleBrewStyleChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleInfusionChange = this.handleInfusionChange.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Register timer service callbacks
    timerService.onUpdate(this.handleTimerUpdate);
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
    
    // Update the timer display
    this.updateTimerDisplay(timeRemaining, originalDuration);
  }
  
  handleTimerStateChange(state) {
    this.updateButtonStates(state);
  }

  // Event handlers for atomic components
  handleButtonClick(event) {
    const buttonType = event.detail.type;
    
    switch (buttonType) {
      case 'start':
      case 'pause':
        this.toggleStartPause();
        break;
      case 'add-time':
        this.addTenSeconds();
        break;
      case 'reset':
        this.resetTimer();
        break;
    }
  }
  
  handleBrewStyleChange(event) {
    this.brewStyle = event.detail.checked ? 'gongfu' : 'western';
    this.currentInfusion = 1;
    
    const duration = this.calculateBrewDuration();
    timerService.startTimer(duration, this.teaData?.name);
    timerService.pauseTimer();
    
    // Update the UI elements without a full re-render
    this.updateBrewStyleUI();
  }
  
  // Add this new method to update UI elements related to brew style
  updateBrewStyleUI() {
    // Update infusion controls visibility
    const infusionControls = this.shadowRoot.querySelector('infusion-controls');
    if (infusionControls) {
      infusionControls.setAttribute('visible', this.brewStyle === 'gongfu' ? 'true' : 'false');
      infusionControls.setAttribute('current', this.currentInfusion);
    }
    
    // Update brew style toggle (without recreating it)
    const brewStyleToggle = this.shadowRoot.querySelector('brew-style-toggle');
    if (brewStyleToggle) {
      if (this.brewStyle === 'gongfu' && !brewStyleToggle.hasAttribute('checked')) {
        brewStyleToggle.setAttribute('checked', '');
      } else if (this.brewStyle === 'western' && brewStyleToggle.hasAttribute('checked')) {
        brewStyleToggle.removeAttribute('checked');
      }
    }
  }
  
  handleTimeChange(event) {
    if (timerService.isTimerRunning()) return;
    
    const { totalSeconds } = event.detail;
    if (totalSeconds > 0) {
      timerService.startTimer(totalSeconds, this.teaData?.name);
      timerService.pauseTimer();
    }
  }
  
  handleInfusionChange(event) {
    this.currentInfusion = event.detail.infusion;
    
    const duration = this.calculateBrewDuration();
    timerService.startTimer(duration, this.teaData?.name);
    timerService.pauseTimer();
    
    // Instead of full re-render, just update the necessary parts
    const infusionControls = this.shadowRoot.querySelector('infusion-controls');
    if (infusionControls) {
      infusionControls.setAttribute('current', this.currentInfusion);
    }
    
    // Update the timer display without full re-render
    const timeRemaining = timerService.getTimeRemaining();
    const originalDuration = timerService.getOriginalDuration();
    this.updateTimerDisplay(timeRemaining, originalDuration);
  }
  
  setupEventListeners() {
    // Listen for custom events from atomic components
    this.shadowRoot.addEventListener('timer-button-click', this.handleButtonClick);
    this.shadowRoot.addEventListener('brew-style-change', this.handleBrewStyleChange);
    this.shadowRoot.addEventListener('time-change', this.handleTimeChange);
    this.shadowRoot.addEventListener('infusion-change', this.handleInfusionChange);
    this.shadowRoot.addEventListener('drawer-toggle', this.handleDrawerToggle);
    
    // Set up touch events for drawer
    const handle = this.shadowRoot.querySelector('drawer-handle');
    if (handle) {
      handle.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      handle.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      handle.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }
  }
  
  removeEventListeners() {
    this.shadowRoot.removeEventListener('timer-button-click', this.handleButtonClick);
    this.shadowRoot.removeEventListener('brew-style-change', this.handleBrewStyleChange);
    this.shadowRoot.removeEventListener('time-change', this.handleTimeChange);
    this.shadowRoot.removeEventListener('infusion-change', this.handleInfusionChange);
    this.shadowRoot.removeEventListener('drawer-toggle', this.handleDrawerToggle);
    
    const handle = this.shadowRoot.querySelector('drawer-handle');
    if (handle) {
      handle.removeEventListener('touchstart', this.handleTouchStart);
      handle.removeEventListener('touchmove', this.handleTouchMove);
      handle.removeEventListener('touchend', this.handleTouchEnd);
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
        this.style.pointerEvents = 'auto';
      }, 300);
    }
  }
  
  closeDrawer() {
    this.animationInProgress = true;
    this.isActive = false;
    
    const drawerElement = this.shadowRoot.querySelector('.timer-drawer');
    if (drawerElement) {
      // Make sure we're using the full height minus just the handle height
      const height = this.drawerHeight;
      drawerElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
      drawerElement.style.transform = `translateY(${height}px)`; // coould have a height 50px, to keep displaying tea name.
      
      setTimeout(() => {
        this.animationInProgress = false;
        this.style.pointerEvents = 'none';
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
  
  // Timer control methods
  toggleStartPause() {
    if (!this.teaData) return;
    
    if (timerService.isTimerRunning()) {
      timerService.pauseTimer();
    } else {
      // Make sure we have a valid duration before starting
      if (timerService.getTimeRemaining() <= 0) {
        const duration = this.calculateBrewDuration();
        timerService.startTimer(duration, this.teaData?.name);
      } else {
        timerService.resumeTimer();
      }
    }
    
    // Update button state immediately without waiting for the next timer update
    this.updateButtonStates(timerService.isTimerRunning() ? 'running' : 'paused');
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
    // Ensure timeRemaining is a valid number
    const validTimeRemaining = Number.isFinite(timeRemaining) ? timeRemaining : 0;
    
    // Update the time display component
    const timeDisplay = this.shadowRoot.querySelector('time-display');
    if (timeDisplay) {
      const minutes = Math.floor(validTimeRemaining / 60);
      const seconds = validTimeRemaining % 60;
      
      timeDisplay.setAttribute('minutes', minutes);
      timeDisplay.setAttribute('seconds', seconds);
      timeDisplay.setAttribute('editable', !timerService.isTimerRunning());
    }
    
    // Update progress bar
    const progressBar = this.shadowRoot.querySelector('timer-progress-bar');
    if (progressBar && originalDuration > 0) {
      // Calculate progress percentage
      const progressPercent = Number.isFinite(validTimeRemaining) && Number.isFinite(originalDuration) 
        ? (validTimeRemaining / originalDuration) * 100
        : 100;
      
      progressBar.setAttribute('progress', progressPercent);
    }
  }
  
  updateButtonStates(state) {
    const startPauseButton = this.shadowRoot.querySelector('[type="start"], [type="pause"]');
    const resetButton = this.shadowRoot.querySelector('[type="reset"]');
    
    if (!startPauseButton) return;
    
    switch (state) {
      case 'running':
        if (startPauseButton.getAttribute('type') !== 'pause') {
          startPauseButton.setAttribute('type', 'pause');
        }
        resetButton?.setAttribute('disabled', 'true');
        break;
        
      case 'stopped':
      case 'paused':
      case 'reset':
      case 'completed':
        if (startPauseButton.getAttribute('type') !== 'start') {
          startPauseButton.setAttribute('type', 'start');
        }
        
        if (state === 'reset') {
          resetButton?.setAttribute('disabled', 'true');
        } else {
          resetButton?.removeAttribute('disabled');
        }
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
      
      .brew-controls-row {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        gap: 1rem;
      }
      
      .brew-controls-row > brew-style-toggle,
      .brew-controls-row > infusion-controls {
        flex: 0 0 auto;
      }
      
      .spacer {
        flex: 1;
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
      
      @media (max-width: 480px) {
        .timer-controls {
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }
    `;
    
    const teaName = this.teaData ? this.teaData.name : 'Select a tea to steep';
    
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
    
    // Get timer values
    const timeRemaining = timerService.getTimeRemaining();
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const isRunning = timerService.isTimerRunning();
    const originalDuration = timerService.getOriginalDuration();
    const progress = originalDuration > 0 ? (timeRemaining / originalDuration) * 100 : 100;
    
    // Calculate max infusions based on tea data
    const maxInfusions = this.teaData ? (this.teaData.numberOfInfusions || 10) : 10;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="timer-drawer">
        <drawer-handle></drawer-handle>
        
        <div class="timer-drawer-content">
          <div class="timer-title-row">
            <h3 class="timer-title">${teaName}</h3>
          </div>
          
          <div class="brew-controls-row">
            <brew-style-toggle class="control-item" ${this.brewStyle === 'gongfu' ? 'checked' : ''}></brew-style-toggle>
            <infusion-controls 
              class="control-item"
              current="${this.currentInfusion}" 
              max="${maxInfusions}" 
              ${this.brewStyle !== 'gongfu' ? 'visible="false"' : ''}>
            </infusion-controls>
          </div>
          
          <timer-progress-bar progress="${progress}"></timer-progress-bar>
          
          <time-display 
            minutes="${minutes}" 
            seconds="${seconds}" 
            ${isRunning ? 'editable="false"' : ''}>
          </time-display>
          
          <p class="timer-info">${teaInfo}</p>
          
          <div class="timer-controls">
            <timer-button 
              type="${isRunning ? 'pause' : 'start'}" 
              ${!this.teaData ? 'disabled' : ''}>
            </timer-button>
            
            <timer-button 
              type="add-time" 
              ${!this.teaData ? 'disabled' : ''}>
            </timer-button>
            
            <timer-button 
              type="reset" 
              ${!this.teaData || isRunning ? 'disabled' : ''}>
            </timer-button>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  handleDrawerToggle() {
    this.toggleDrawer();
  }
}

customElements.define('tea-timer', TeaTimer);

export default TeaTimer;