// js/components/tea-timer-atoms.js
// Atomic UI components for the tea timer

// TimerButton - Reusable button with different styles
export class TimerButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._type = 'start'; // start, pause, reset, add-time
    this._disabled = false;
  }

  static get observedAttributes() {
    return ['type', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'type' && oldValue !== newValue) {
      this._type = newValue;
      this.render();
    }
    if (name === 'disabled' && oldValue !== newValue) {
      this._disabled = newValue === 'true' || newValue === '';
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.shadowRoot.querySelector('button')?.addEventListener('click', this.handleClick.bind(this));
  }

  removeEventListeners() {
    this.shadowRoot.querySelector('button')?.removeEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    if (this._disabled) return;
    
    // Add a small delay to prevent double-click issues
    if (this._clickTimeout) return;
    
    this._clickTimeout = setTimeout(() => {
      this._clickTimeout = null;
    }, 300);

    this.dispatchEvent(new CustomEvent('timer-button-click', {
      bubbles: true,
      composed: true,
      detail: { type: this._type }
    }));
    
    // For immediate visual feedback, add an active class
    const button = this.shadowRoot.querySelector('button');
    if (button) {
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 200);
    }
  }

  get buttonStyles() {
    switch (this._type) {
      case 'start':
        return {
          bg: '#4CAF50',
          hoverBg: '#45a049',
          label: 'Start'
        };
      case 'pause':
        return {
          bg: '#ff9800',
          hoverBg: '#f57c00',
          label: 'Pause'
        };
      case 'reset':
        return {
          bg: '#808080',
          hoverBg: '#707070',
          label: 'Reset'
        };
      case 'add-time':
        return {
          bg: '#2196F3',
          hoverBg: '#0b7dda',
          label: '+10s'
        };
      default:
        return {
          bg: '#4a90e2',
          hoverBg: '#3a80d2',
          label: this._type
        };
    }
  }

  render() {
    const styles = this._type;
    const buttonStyle = this.buttonStyles;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        button {
          padding: 0.75rem 1rem;
          background-color: ${buttonStyle.bg};
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-width: 100px;
        }
        
        button:hover:not(:disabled) {
          background-color: ${buttonStyle.hoverBg};
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        button.active {
          transform: scale(0.95);
          opacity: 0.9;
        }
      </style>
      
      <button ?disabled="${this._disabled}">${buttonStyle.label}</button>
    `;

    this.addEventListeners();
  }
}

// BrewStyleToggle - Toggle switch between brewing styles
export class BrewStyleToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._checked = false; // false = western, true = gongfu
  }

  static get observedAttributes() {
    return ['checked'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked' && oldValue !== newValue) {
      // Update internal state without re-rendering the whole component
      this._checked = newValue === 'true' || newValue === '';
      
      // Just update the checkbox state directly
      const checkbox = this.shadowRoot.querySelector('input');
      if (checkbox && checkbox.checked !== this._checked) {
        checkbox.checked = this._checked;
        
        // Update the active class on labels
        const westernLabel = this.shadowRoot.querySelector('.brew-style-label:first-of-type');
        const gongfuLabel = this.shadowRoot.querySelector('.brew-style-label:last-of-type');
        
        if (westernLabel && gongfuLabel) {
          if (this._checked) {
            westernLabel.classList.remove('active');
            gongfuLabel.classList.add('active');
          } else {
            westernLabel.classList.add('active');
            gongfuLabel.classList.remove('active');
          }
        }
      }
    }
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.shadowRoot.querySelector('input')?.addEventListener('change', this.handleChange.bind(this));
  }

  removeEventListeners() {
    this.shadowRoot.querySelector('input')?.removeEventListener('change', this.handleChange.bind(this));
  }

  handleChange(event) {
    this._checked = event.target.checked;
    
    this.dispatchEvent(new CustomEvent('brew-style-change', {
      bubbles: true,
      composed: true,
      detail: { checked: this._checked }
    }));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
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
      </style>
      
      <div class="brew-style-container">
        <span class="brew-style-label ${!this._checked ? 'active' : ''}">Western</span>
        
        <label class="brew-style-toggle">
          <input type="checkbox" ?checked="${this._checked}">
          <span class="toggle-slider"></span>
        </label>
        
        <span class="brew-style-label ${this._checked ? 'active' : ''}">Gongfu</span>
      </div>
    `;

    this.addEventListeners();
  }
}

// TimerProgressBar - Visual indicator of remaining time
export class TimerProgressBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._progress = 100; // 0-100
  }

  static get observedAttributes() {
    return ['progress'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'progress' && oldValue !== newValue) {
      this._progress = parseFloat(newValue);
      if (isNaN(this._progress)) this._progress = 0;
      if (this._progress < 0) this._progress = 0;
      if (this._progress > 100) this._progress = 100;
      this.updateProgress();
    }
  }

  connectedCallback() {
    this.render();
  }

  updateProgress() {
    const progressBar = this.shadowRoot.querySelector('.timer-progress-bar');
    if (!progressBar) return;
    
    progressBar.style.width = `${this._progress}%`;
    
    // Change color as time runs out
    if (this._progress < 10) {
      progressBar.style.backgroundColor = '#558B2F'; // Deep Green
    } else if (this._progress < 25) {
      progressBar.style.backgroundColor = '#7CB342'; // Medium Green
    } else if (this._progress < 50) {
      progressBar.style.backgroundColor = '#AED581'; // Light Green
    } else if (this._progress < 75) {
      progressBar.style.backgroundColor = '#DCEDC8'; // Pale Green
    } else {
      progressBar.style.backgroundColor = '#F1F8E9'; // Very Pale Green
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .timer-progress-bar-container {
          width: 100%;
          height: 6px;
          background-color: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .timer-progress-bar {
          height: 100%;
          background-color: #F1F8E9;
          width: ${this._progress}%;
          transition: width 1s linear, background-color 1s ease;
        }
      </style>
      
      <div class="timer-progress-bar-container">
        <div class="timer-progress-bar"></div>
      </div>
    `;
  }
}

// TimeDisplay - Display and input for minutes and seconds
export class TimeDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._minutes = 0;
    this._seconds = 0;
    this._editable = true;
    this._isEditing = false;
  }

  static get observedAttributes() {
    return ['minutes', 'seconds', 'editable'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'minutes') {
      this._minutes = parseInt(newValue) || 0;
      this.updateDisplay();
    }
    if (name === 'seconds') {
      this._seconds = parseInt(newValue) || 0;
      this.updateDisplay();
    }
    if (name === 'editable') {
      this._editable = newValue !== 'false';
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  addEventListeners() {
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (minutesInput) {
      minutesInput.addEventListener('focus', () => this.handleTimeInputFocus(minutesInput, true));
      minutesInput.addEventListener('blur', () => this.handleTimeInputBlur(minutesInput, false));
      minutesInput.addEventListener('input', this.handleInputFilter.bind(this));
    }
    
    if (secondsInput) {
      secondsInput.addEventListener('focus', () => this.handleTimeInputFocus(secondsInput, true));
      secondsInput.addEventListener('blur', () => this.handleTimeInputBlur(secondsInput, false));
      secondsInput.addEventListener('input', this.handleInputFilter.bind(this));
    }
  }

  removeEventListeners() {
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    minutesInput?.removeEventListener('focus', this.handleTimeInputFocus);
    minutesInput?.removeEventListener('blur', this.handleTimeInputBlur);
    minutesInput?.removeEventListener('input', this.handleInputFilter);
    
    secondsInput?.removeEventListener('focus', this.handleTimeInputFocus);
    secondsInput?.removeEventListener('blur', this.handleTimeInputBlur);
    secondsInput?.removeEventListener('input', this.handleInputFilter);
  }

  handleTimeInputFocus(input) {
    this._isEditing = true;
    input.select();
  }

  handleTimeInputBlur(input) {
    this._isEditing = false;
    this.validateTimeInput(input);
    this.notifyTimeChange();
  }

  handleInputFilter(event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
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

    if (input.classList.contains('minutes-input')) {
      this._minutes = value;
    } else if (input.classList.contains('seconds-input')) {
      this._seconds = value;
    }
  }

  notifyTimeChange() {
    this.dispatchEvent(new CustomEvent('time-change', {
      bubbles: true,
      composed: true,
      detail: { 
        minutes: this._minutes,
        seconds: this._seconds,
        totalSeconds: this._minutes * 60 + this._seconds
      }
    }));
  }

  updateDisplay() {
    if (this._isEditing) return;
    
    const minutesInput = this.shadowRoot.querySelector('.minutes-input');
    const secondsInput = this.shadowRoot.querySelector('.seconds-input');
    
    if (minutesInput) {
      minutesInput.value = this._minutes.toString().padStart(2, '0');
    }
    
    if (secondsInput) {
      secondsInput.value = this._seconds.toString().padStart(2, '0');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
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
        
        @media (max-width: 480px) {
          .timer-display {
            font-size: 3rem;
          }
          
          .timer-display input {
            width: 60px;
          }
        }
      </style>
      
      <div class="timer-display">
        <input type="number" class="minutes-input" min="0" max="59" 
               value="${this._minutes.toString().padStart(2, '0')}" 
               ?disabled="${!this._editable}">
        <span class="timer-display-separator">:</span>
        <input type="number" class="seconds-input" min="0" max="59" 
               value="${this._seconds.toString().padStart(2, '0')}" 
               ?disabled="${!this._editable}">
      </div>
    `;

    this.addEventListeners();
  }
}

// DrawerHandle - Handle for the timer drawer
export class DrawerHandle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._handleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  addEventListeners() {
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.addEventListener('click', this._handleClick);
    }
  }

  removeEventListeners() {
    const handle = this.shadowRoot.querySelector('.drawer-handle');
    if (handle) {
      handle.removeEventListener('click', this._handleClick);
    }
  }

  handleClick() {
    this.dispatchEvent(new CustomEvent('drawer-toggle', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
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
      </style>
      
      <div class="drawer-handle" aria-label="Toggle timer drawer"></div>
    `;

    this.addEventListeners();
  }
}

// InfusionControls - Controls for navigating infusions in gongfu mode
export class InfusionControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._current = 1;
    this._min = 1;
    this._max = 10;
    this._visible = true;
  }

  static get observedAttributes() {
    return ['current', 'min', 'max', 'visible'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'current') {
      this._current = parseInt(newValue) || 1;
    }
    if (name === 'min') {
      this._min = parseInt(newValue) || 1;
    }
    if (name === 'max') {
      this._max = parseInt(newValue) || 10;
    }
    if (name === 'visible') {
      this._visible = newValue !== 'false';
    }
    
    this.render();
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  addEventListeners() {
    const prevButton = this.shadowRoot.querySelector('.prev-infusion-btn');
    const nextButton = this.shadowRoot.querySelector('.next-infusion-btn');
    
    if (prevButton) {
      prevButton.addEventListener('click', this.handlePrev.bind(this));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', this.handleNext.bind(this));
    }
  }

  removeEventListeners() {
    const prevButton = this.shadowRoot.querySelector('.prev-infusion-btn');
    const nextButton = this.shadowRoot.querySelector('.next-infusion-btn');
    
    prevButton?.removeEventListener('click', this.handlePrev);
    nextButton?.removeEventListener('click', this.handleNext);
  }

  handlePrev() {
    if (this._current > this._min) {
      this._current--;
      this.dispatchEvent(new CustomEvent('infusion-change', {
        bubbles: true,
        composed: true,
        detail: { infusion: this._current }
      }));
      this.render();
    }
  }

  handleNext() {
    if (this._current < this._max) {
      this._current++;
      this.dispatchEvent(new CustomEvent('infusion-change', {
        bubbles: true,
        composed: true,
        detail: { infusion: this._current }
      }));
      this.render();
    }
  }

  render() {
    if (!this._visible) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .infusion-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          // margin-bottom: 1rem;
          // padding: 0.5rem;
          // border-radius: 8px;
          // transition: background-color 0.3s ease;
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
      </style>
      
      <div class="infusion-controls">
        <button class="prev-infusion-btn" ${this._current <= this._min ? 'disabled' : ''} aria-label="Previous infusion">
          <span>−</span>
        </button>
        <span class="infusion-number">Infusion ${this._current}</span>
        <button class="next-infusion-btn" ${this._current >= this._max ? 'disabled' : ''} aria-label="Next infusion">
          <span>+</span>
        </button>
      </div>
    `;

    this.addEventListeners();
  }
}

// Register custom elements
customElements.define('timer-button', TimerButton);
customElements.define('brew-style-toggle', BrewStyleToggle);
customElements.define('timer-progress-bar', TimerProgressBar);
customElements.define('time-display', TimeDisplay);
customElements.define('drawer-handle', DrawerHandle);
customElements.define('infusion-controls', InfusionControls);
