// scripts/components/tea-card.js

class TeaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.expanded = false;
    this.fullDetailView = false;
    
    // Create custom events
    this.startSteepingEvent = new CustomEvent('start-steeping', {
      bubbles: true,
      composed: true,
      detail: { tea: null }
    });
    
    this.showDetailViewEvent = new CustomEvent('show-detail-view', {
      bubbles: true,
      composed: true,
      detail: { tea: null, element: this }
    });
  }

  connectedCallback() {
    // When the element is added to the DOM
    this.render();
    this.addEventListeners();
    
    // Listen for other cards being expanded
    document.addEventListener('card-expanded', this.handleOtherCardExpanded.bind(this));
  }
  
  disconnectedCallback() {
    // Clean up event listeners when element is removed
    this.removeEventListeners();
    document.removeEventListener('card-expanded', this.handleOtherCardExpanded.bind(this));
  }
  
  static get observedAttributes() {
    return ['expanded', 'detail-view'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'expanded' && oldValue !== newValue) {
      this.expanded = newValue === 'true';
      this.render();
    }
    if (name === 'detail-view' && oldValue !== newValue) {
      this.fullDetailView = newValue === 'true';
      this.render();
    }
  }
  
  set teaData(data) {
    this._teaData = data;
    this.render();
  }
  
  get teaData() {
    return this._teaData;
  }
  
  addEventListeners() {
    if (this.fullDetailView) {
      // In detail view mode
      const backButton = this.shadowRoot.querySelector('.back-button');
      const steepButton = this.shadowRoot.querySelector('.steep-button');
      
      if (backButton) {
        backButton.addEventListener('click', this.closeDetailView.bind(this));
      }
      
      if (steepButton) {
        steepButton.addEventListener('click', this.startSteeping.bind(this));
      }
    } else {
      // In card view mode
      const card = this.shadowRoot.querySelector('.card');
      if (card) {
        card.addEventListener('click', this.handleCardClick.bind(this));
      }
      
      // Add direct listeners to buttons for improved touch response
      const steepButton = this.shadowRoot.querySelector('.steep-button');
      if (steepButton) {
        steepButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startSteeping(e);
        });
      }
      
      const detailsButton = this.shadowRoot.querySelector('.view-details-btn');
      if (detailsButton) {
        detailsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDetailView(e);
        });
      }
    }
  }
  
  removeEventListeners() {
    if (this.fullDetailView) {
      const backButton = this.shadowRoot.querySelector('.back-button');
      const steepButton = this.shadowRoot.querySelector('.steep-button');
      
      if (backButton) {
        backButton.removeEventListener('click', this.closeDetailView.bind(this));
      }
      
      if (steepButton) {
        steepButton.removeEventListener('click', this.startSteeping.bind(this));
      }
    } else {
      const card = this.shadowRoot.querySelector('.card');
      if (card) {
        card.removeEventListener('click', this.handleCardClick.bind(this));
      }
      
      const steepButton = this.shadowRoot.querySelector('.steep-button');
      if (steepButton) {
        const steepEvents = steepButton.getEventListeners?.('click') || [];
        steepEvents.forEach(listener => steepButton.removeEventListener('click', listener));
      }
      
      const detailsButton = this.shadowRoot.querySelector('.view-details-btn');
      if (detailsButton) {
        const detailEvents = detailsButton.getEventListeners?.('click') || [];
        detailEvents.forEach(listener => detailsButton.removeEventListener('click', listener));
      }
    }
  }
  
  handleCardClick(event) {
    // Don't toggle if buttons were clicked
    if (event.target.closest('.steep-button') || event.target.closest('.view-details-btn')) {
      return;
    }
    
    this.expanded = !this.expanded;
    this.setAttribute('expanded', this.expanded);
    this.render();
    
    // If this card is now expanded, dispatch an event so other cards can close
    if (this.expanded) {
      const expandEvent = new CustomEvent('card-expanded', {
        bubbles: true,
        composed: true,
        detail: { id: this._teaData?.id }
      });
      this.dispatchEvent(expandEvent);
    }
  }
  
  handleOtherCardExpanded(event) {
    // If another card was expanded and it's not this one, collapse this one
    if (this._teaData && event.detail.id !== this._teaData.id && this.expanded) {
      this.expanded = false;
      this.setAttribute('expanded', 'false');
      this.render();
    }
  }
  
  showDetailView(event) {
    event.stopPropagation(); // Prevent card toggle
    
    // Update event detail with tea data
    this.showDetailViewEvent.detail.tea = this._teaData;
    
    // Dispatch the event
    this.dispatchEvent(this.showDetailViewEvent);
    
    // Also set local state
    this.fullDetailView = true;
    this.render();
  }
  
  closeDetailView(event) {
    event.stopPropagation();
    
    this.fullDetailView = false;
    this.render();
  }
  
  startSteeping(event) {
    event.stopPropagation(); // Prevent card toggle
    
    // Update event detail with tea data
    this.startSteepingEvent.detail.tea = this._teaData;
    
    // Dispatch the event
    this.dispatchEvent(this.startSteepingEvent);
  }
  
  render() {
    if (!this._teaData) return;
    
    const { name, category, origin, description, brewTime, temperature, notes, tags, 
            westernBrewTime, westernTemperature, westernLeafRatio,
            gongfuBrewTime, gongfuTemperature, gongfuLeafRatio } = this._teaData;
    
    // CSS styles based on view mode
    const styles = this.fullDetailView ? this.getDetailViewStyles() : this.getCardStyles();
    
    // Render different views based on mode
    if (this.fullDetailView) {
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="detail-view">
          <div class="detail-header">
            <button class="back-button" aria-label="Back to tea list">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2 class="detail-title">${name}</h2>
            <span class="detail-category">${category}</span>
          </div>
          
          <div class="detail-content">
            <div class="detail-section">
              <h3>About This Tea</h3>
              <p class="detail-origin"><strong>Origin:</strong> ${origin || 'Unknown'}</p>
              <p class="detail-description">${description}</p>
              ${notes ? `<p class="detail-notes">${notes}</p>` : ''}
            </div>
            
            <div class="detail-section brewing-section">
              <h3>Brewing Guide</h3>
              <div class="brewing-tabs">
                <div class="brewing-tab western active" data-tab="western">Western Style</div>
                <div class="brewing-tab gongfu" data-tab="gongfu">Gongfu Style</div>
              </div>
              
              <div class="brewing-content western-content active">
                <div class="brewing-parameter">
                  <span class="parameter-label">Time</span>
                  <span class="parameter-value">${westernBrewTime || brewTime || 'N/A'}</span>
                </div>
                <div class="brewing-parameter">
                  <span class="parameter-label">Temperature</span>
                  <span class="parameter-value">${westernTemperature || temperature || 'N/A'}</span>
                </div>
                <div class="brewing-parameter">
                  <span class="parameter-label">Leaf Ratio</span>
                  <span class="parameter-value">${westernLeafRatio || '2g per 8oz'}</span>
                </div>
              </div>
              
              <div class="brewing-content gongfu-content">
                <div class="brewing-parameter">
                  <span class="parameter-label">Initial Time</span>
                  <span class="parameter-value">${gongfuBrewTime ? `${gongfuBrewTime}s` : 'N/A'}</span>
                </div>
                <div class="brewing-parameter">
                  <span class="parameter-label">Temperature</span>
                  <span class="parameter-value">${gongfuTemperature || temperature || 'N/A'}</span>
                </div>
                <div class="brewing-parameter">
                  <span class="parameter-label">Leaf Ratio</span>
                  <span class="parameter-value">${gongfuLeafRatio || '5g per 100ml'}</span>
                </div>
                <p class="gongfu-note">Add ~5s for each subsequent infusion</p>
              </div>
            </div>
            
            ${tags && tags.length ? `
              <div class="detail-section">
                <h3>Characteristics</h3>
                <div class="detail-tags">
                  ${tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="detail-actions">
              <button class="steep-button">Steep This Tea</button>
            </div>
          </div>
        </div>
      `;
      
      // Add tabs functionality
      const tabs = this.shadowRoot.querySelectorAll('.brewing-tab');
      const contents = this.shadowRoot.querySelectorAll('.brewing-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs and contents
          tabs.forEach(t => t.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          tab.classList.add('active');
          const tabName = tab.dataset.tab;
          this.shadowRoot.querySelector(`.${tabName}-content`).classList.add('active');
        });
      });
      
    } else {
      // Regular card view
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${name}</h3>
            <span class="card-category">${category}</span>
          </div>
          <p class="card-origin">Origin: ${origin || 'Unknown'}</p>
          <p class="card-description">${description}</p>
          
          <div class="card-details">
            <div class="card-brew-info">
              <span>
                <strong>Brew Time</strong>
                ${brewTime || 'N/A'}
              </span>
              <span>
                <strong>Temperature</strong>
                ${temperature || 'N/A'}
              </span>
            </div>
            
            ${notes ? `<p class="card-notes">${notes}</p>` : ''}
            
            ${tags && tags.length ? `
              <div class="card-tags">
                ${tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
            
            <div class="card-actions">
              <button class="steep-button">Steep This Tea</button>
              <button class="view-details-btn">View Details</button>
            </div>
          </div>
        </div>
      `;
    }
    
    this.addEventListeners();
  }
  
  getCardStyles() {
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
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .card:hover {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
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
      }
      
      .card-details {
        margin-top: 1rem;
        display: ${this.expanded ? 'block' : 'none'};
        animation: fadeIn 0.3s ease;
      }
      
      .card-brew-info {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
        padding: 0.5rem;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
      
      .card-brew-info span {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .card-brew-info strong {
        margin-bottom: 0.25rem;
        font-size: 0.8rem;
        color: #666;
      }
      
      .card-notes {
        margin-top: 1rem;
        font-style: italic;
        color: #666;
      }
      
      .card-tags {
        display: flex;
        flex-wrap: wrap;
        margin-top: 1rem;
        gap: 0.5rem;
      }
      
      .card-tag {
        padding: 0.25rem 0.5rem;
        background-color: #e8f4f8;
        border-radius: 4px;
        font-size: 0.8rem;
        color: #4a90e2;
      }
      
      .card-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      
      .steep-button {
        padding: 0.5rem 1rem;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        flex: 1;
        transition: background-color 0.3s ease;
      }
      
      .steep-button:hover {
        background-color: #3a80d2;
      }
      
      .view-details-btn {
        padding: 0.5rem 1rem;
        background-color: #f0f0f0;
        color: #333;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        flex: 1;
        transition: background-color 0.3s ease;
      }
      
      .view-details-btn:hover {
        background-color: #e0e0e0;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
  }
  
  getDetailViewStyles() {
    return `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        background-color: white;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
      }
      
      .detail-view {
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .detail-header {
        background-color: #4a90e2;
        color: white;
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
      }
      
      .back-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.5rem;
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      
      .back-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .detail-title {
        margin: 0;
        font-size: 1.5rem;
        flex-grow: 1;
      }
      
      .detail-category {
        padding: 0.25rem 0.5rem;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      .detail-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .detail-section {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
      }
      
      .detail-section h3 {
        margin-top: 0;
        font-size: 1.2rem;
        color: #4a90e2;
        margin-bottom: 1rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
      }
      
      .detail-origin {
        margin-bottom: 1rem;
      }
      
      .detail-description {
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      
      .detail-notes {
        font-style: italic;
        color: #666;
        padding-left: 1rem;
        border-left: 3px solid #eee;
      }
      
      .brewing-tabs {
        display: flex;
        gap: 1px;
        background-color: #eee;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
      }
      
      .brewing-tab {
        padding: 0.75rem;
        text-align: center;
        cursor: pointer;
        background-color: #f5f5f5;
        flex: 1;
        transition: all 0.2s ease;
      }
      
      .brewing-tab.active {
        background-color: #4a90e2;
        color: white;
        font-weight: bold;
      }
      
      .brewing-content {
        display: none;
        animation: fadeIn 0.3s ease;
      }
      
      .brewing-content.active {
        display: block;
      }
      
      .brewing-parameter {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px dashed #eee;
      }
      
      .parameter-label {
        font-weight: bold;
        color: #666;
      }
      
      .parameter-value {
        color: #333;
      }
      
      .gongfu-note {
        font-size: 0.9rem;
        color: #666;
        font-style: italic;
        margin-top: 1rem;
      }
      
      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .detail-tag {
        padding: 0.5rem 0.75rem;
        background-color: #e8f4f8;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #4a90e2;
      }
      
      .detail-actions {
        position: sticky;
        bottom: 0;
        background-color: white;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
      }
      
      .steep-button {
        padding: 0.75rem 2rem;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.3s ease;
        width: 100%;
        max-width: 300px;
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
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
  }
}

customElements.define('tea-card', TeaCard);

export default TeaCard;
