// scripts/components/tea-card.js

class TeaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._expanded = false; // Use private property to track state
    
    // Bind methods to this instance
    this._handleCardClick = this._handleCardClick.bind(this);
    this._handleSteepButtonClick = this._handleSteepButtonClick.bind(this);
    this._handleTabClick = this._handleTabClick.bind(this);
    this._handleOtherCardExpanded = this._handleOtherCardExpanded.bind(this);
    
    // Create custom events
    this.startSteepingEvent = new CustomEvent('start-steeping', {
      bubbles: true,
      composed: true,
      detail: { tea: null }
    });
  }

  // Getters and setters for expanded state
  get expanded() {
    return this._expanded;
  }
  
  set expanded(value) {
    this._expanded = value;
    this.setAttribute('expanded', value);
    this._updateExpandedState();
  }
  
  // Lifecycle callbacks
  connectedCallback() {
    // When the element is added to the DOM
    this._render();
    this._addEventListeners();
    
    // Listen for other cards being expanded
    document.addEventListener('card-expanded', this._handleOtherCardExpanded);
  }
  
  disconnectedCallback() {
    // Clean up event listeners when element is removed
    this._removeEventListeners();
    document.removeEventListener('card-expanded', this._handleOtherCardExpanded);
  }
  
  static get observedAttributes() {
    return ['expanded'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'expanded' && oldValue !== newValue) {
      this._expanded = newValue === 'true';
      this._updateExpandedState();
    }
  }
  
  // Set data and render
  set teaData(data) {
    this._teaData = data;
    this._render();
  }
  
  get teaData() {
    return this._teaData;
  }
  
  // Event handling
  _addEventListeners() {
    // Make the whole card clickable
    const card = this.shadowRoot.querySelector('.card');
    if (card) {
      card.addEventListener('click', this._handleCardClick);
    }
    
    // Add listeners to buttons and tabs
    const steepButton = this.shadowRoot.querySelector('.steep-button');
    if (steepButton) {
      steepButton.addEventListener('click', this._handleSteepButtonClick);
    }
    
    const brewingTabs = this.shadowRoot.querySelectorAll('.brewing-tab');
    brewingTabs.forEach(tab => {
      tab.addEventListener('click', this._handleTabClick);
    });
  }
  
  _removeEventListeners() {
    const card = this.shadowRoot.querySelector('.card');
    if (card) {
      card.removeEventListener('click', this._handleCardClick);
    }
    
    const steepButton = this.shadowRoot.querySelector('.steep-button');
    if (steepButton) {
      steepButton.removeEventListener('click', this._handleSteepButtonClick);
    }
    
    const brewingTabs = this.shadowRoot.querySelectorAll('.brewing-tab');
    brewingTabs.forEach(tab => {
      tab.removeEventListener('click', this._handleTabClick);
    });
  }
  
  _handleCardClick(event) {
    // Don't toggle if we're clicking on interactive elements
    if (event.target.closest('.steep-button') || 
        event.target.closest('.brewing-tab') || 
        event.target.closest('.brewing-content') ||
        event.target.closest('.card-tag')) {
      return;
    }
    
    // Toggle expanded state
    this.expanded = !this.expanded;
    
    // If expanding, notify other cards
    if (this.expanded && this._teaData) {
      const expandEvent = new CustomEvent('card-expanded', {
        bubbles: true,
        composed: true,
        detail: { id: this._teaData.id }
      });
      this.dispatchEvent(expandEvent);
    }
  }
  
  _handleSteepButtonClick(event) {
    event.stopPropagation();
    
    if (this._teaData) {
      // Update event detail with tea data
      this.startSteepingEvent.detail.tea = this._teaData;
      // Dispatch the event
      this.dispatchEvent(this.startSteepingEvent);
    }
  }
  
  _handleTabClick(event) {
    event.stopPropagation();
    
    const tab = event.currentTarget;
    const tabs = this.shadowRoot.querySelectorAll('.brewing-tab');
    const contents = this.shadowRoot.querySelectorAll('.brewing-content');
    
    // Remove active class from all tabs and contents
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const tabName = tab.dataset.tab;
    const content = this.shadowRoot.querySelector(`.${tabName}-content`);
    if (content) {
      content.classList.add('active');
    }
  }
  
  _handleOtherCardExpanded(event) {
    // If another card was expanded and it's not this one, collapse this one
    if (this._teaData && event.detail.id !== this._teaData.id && this.expanded) {
      this.expanded = false;
    }
  }
  
  // UI updates
  _updateExpandedState() {
    // Get elements we need to update
    const cardDetails = this.shadowRoot.querySelector('.card-details');
    const cardDescription = this.shadowRoot.querySelector('.card-description');
    const card = this.shadowRoot.querySelector('.card');
    
    if (!cardDetails || !cardDescription || !card) return;
    
    // Update classes and styles for animation
    if (this.expanded) {
      // Expand the card
      card.classList.add('expanded');
      cardDescription.style.webkitLineClamp = '10';
      
      // Show contents with animation
      cardDetails.style.display = 'block';
      // Force a reflow to ensure the display change takes effect
      cardDetails.offsetHeight;
      // Then set the max height for animation
      cardDetails.style.maxHeight = `${cardDetails.scrollHeight}px`;
    } else {
      // Collapse the card
      card.classList.remove('expanded');
      cardDescription.style.webkitLineClamp = '2';
      cardDetails.style.maxHeight = '0';
      
      // Hide after animation completes
      setTimeout(() => {
        if (!this.expanded) {
          cardDetails.style.display = 'none';
        }
      }, 300);
    }
  }
  
  // Render the component
  _render() {
    if (!this._teaData) return;
    
    const { name, category, origin, description, brewTime, temperature, notes, tags, 
            westernBrewTime, westernTemperature, westernLeafRatio,
            gongfuBrewTime, gongfuTemperature, gongfuLeafRatio } = this._teaData;
    
    const styles = this._getCardStyles();
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="card ${this.expanded ? 'expanded' : ''}">
        <div class="card-header">
          <h3 class="card-title">${name}</h3>
          <span class="card-category">${category}</span>
        </div>
        
        <p class="card-origin">Origin: ${origin || 'Unknown'}</p>
        <p class="card-description">${description}</p>
        
        <div class="card-details" style="display: ${this.expanded ? 'block' : 'none'}; max-height: ${this.expanded ? '1000px' : '0px'};">
          <div class="brew-section">
            <h4 class="section-title">Brewing Guide</h4>
            
            <div class="brewing-tabs">
              <div class="brewing-tab western active" data-tab="western">Western</div>
              <div class="brewing-tab gongfu" data-tab="gongfu">Gongfu</div>
            </div>
            
            <div class="brewing-content western-content active">
              <div class="brew-grid">
                <div class="brew-param">
                  <span class="param-label">Time</span>
                  <span class="param-value">${westernBrewTime || brewTime || 'N/A'}</span>
                </div>
                <div class="brew-param">
                  <span class="param-label">Temperature</span>
                  <span class="param-value">${westernTemperature || temperature || 'N/A'}</span>
                </div>
                <div class="brew-param">
                  <span class="param-label">Leaf Ratio</span>
                  <span class="param-value">${westernLeafRatio || '2g per 8oz'}</span>
                </div>
              </div>
            </div>
            
            <div class="brewing-content gongfu-content">
              <div class="brew-grid">
                <div class="brew-param">
                  <span class="param-label">Initial Time</span>
                  <span class="param-value">${gongfuBrewTime ? `${gongfuBrewTime}s` : 'N/A'}</span>
                </div>
                <div class="brew-param">
                  <span class="param-label">Temperature</span>
                  <span class="param-value">${gongfuTemperature || temperature || 'N/A'}</span>
                </div>
                <div class="brew-param">
                  <span class="param-label">Leaf Ratio</span>
                  <span class="param-value">${gongfuLeafRatio || '5g per 100ml'}</span>
                </div>
              </div>
              <p class="gongfu-note">Add ~5s for each subsequent infusion</p>
            </div>
          </div>
          
          ${notes ? `
            <div class="notes-section">
              <h4 class="section-title">Notes</h4>
              <p class="card-notes">${notes}</p>
            </div>
          ` : ''}
          
          ${tags && tags.length ? `
            <div class="tags-section">
              <h4 class="section-title">Characteristics</h4>
              <div class="card-tags">
                ${tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="card-actions">
            <button class="steep-button">Steep This Tea</button>
          </div>
        </div>
      </div>
    `;
    
    this._addEventListeners();
  }
  
  // Card styles
  _getCardStyles() {
    return `
      :host {
        display: block;
        margin: 1rem 0;
      }
      
      .card {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
      }
      
      .card:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      .card.expanded {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      .card::after {
        content: '▾';
        position: absolute;
        right: 1rem;
        top: 1rem;
        color: #4a90e2;
        transition: transform 0.3s ease;
      }
      
      .card.expanded::after {
        transform: rotate(180deg);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-title {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
        transition: color 0.2s ease;
      }
      
      .card:hover .card-title {
        color: #4a90e2;
      }
      
      .card-category {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        background-color: #f0f0f0;
        font-size: 0.8rem;
        color: #666;
      }
      
      .card-origin {
        font-size: 0.9rem;
        color: #666;
        margin: 0.5rem 0;
      }
      
      .card-description {
        margin-top: 0.5rem;
        color: #333;
        display: -webkit-box;
        -webkit-line-clamp: ${this.expanded ? '10' : '2'};
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.5;
        transition: all 0.3s ease;
      }
      
      .card-details {
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.3s ease-in-out;
      }
      
      .section-title {
        font-size: 1rem;
        color: #4a90e2;
        margin: 1rem 0 0.5rem;
        padding-bottom: 0.3rem;
        border-bottom: 1px solid #eee;
      }
      
      .brewing-tabs {
        display: flex;
        background-color: #f5f5f5;
        border-radius: 4px;
        overflow: hidden;
        margin: 0.5rem 0 1rem;
      }
      
      .brewing-tab {
        padding: 0.5rem;
        text-align: center;
        cursor: pointer;
        flex: 1;
        transition: background-color 0.2s ease;
        font-size: 0.9rem;
        user-select: none;
      }
      
      .brewing-tab.active {
        background-color: #4a90e2;
        color: white;
        font-weight: bold;
      }
      
      .brewing-content {
        display: none;
      }
      
      .brewing-content.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      
      .brew-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }
      
      .brew-param {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
      
      .param-label {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      
      .param-value {
        font-weight: bold;
        color: #333;
      }
      
      .gongfu-note {
        font-size: 0.8rem;
        color: #666;
        font-style: italic;
        margin-top: 0.5rem;
        text-align: center;
      }
      
      .card-notes {
        font-style: italic;
        color: #666;
        padding-left: 0.5rem;
        border-left: 2px solid #eee;
        margin: 0.5rem 0;
      }
      
      .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      
      .card-tag {
        padding: 0.25rem 0.5rem;
        background-color: #e8f4f8;
        border-radius: 4px;
        font-size: 0.8rem;
        color: #4a90e2;
      }
      
      .steep-button {
        padding: 0.75rem 1rem;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        width: 100%;
        transition: all 0.3s ease;
      }
      
      .steep-button:hover {
        background-color: #3a80d2;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .steep-button:active {
        transform: translateY(0);
        box-shadow: none;
      }
      
      .card-actions {
        margin-top: 1rem;
      }
      
      /* Animation for expansion */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Responsive adjustments */
      @media (max-width: 480px) {
        .brew-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    `;
  }
}

customElements.define('tea-card', TeaCard);

export default TeaCard;