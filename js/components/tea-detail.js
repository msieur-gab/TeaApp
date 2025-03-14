// scripts/components/tea-detail.js

class TeaDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.teaData = null;
    
    // Create custom events
    this.startSteepingEvent = new CustomEvent('start-steeping', {
      bubbles: true,
      composed: true,
      detail: { tea: null }
    });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  addEventListeners() {
    this.shadowRoot.querySelector('.close-button')?.addEventListener('click', this.close.bind(this));
    this.shadowRoot.querySelector('.steep-button')?.addEventListener('click', this.startSteeping.bind(this));
    
    // Add brewing style toggle listeners
    this.shadowRoot.querySelector('.brewing-toggle')?.addEventListener('change', this.toggleBrewingStyle.bind(this));
    
    // Add touch gestures for swiping right to close (mobile back gesture)
    this.shadowRoot.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.shadowRoot.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.shadowRoot.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }
  
  removeEventListeners() {
    this.shadowRoot.querySelector('.close-button')?.removeEventListener('click', this.close.bind(this));
    this.shadowRoot.querySelector('.steep-button')?.removeEventListener('click', this.startSteeping.bind(this));
    this.shadowRoot.querySelector('.brewing-toggle')?.removeEventListener('change', this.toggleBrewingStyle.bind(this));
    
    this.shadowRoot.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.shadowRoot.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.shadowRoot.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  // Touch handling for swipe gestures
  handleTouchStart(event) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  handleTouchMove(event) {
    if (!this.touchStartX) return;
    
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    
    // Calculate horizontal and vertical distance moved
    const xDiff = this.touchStartX - touchX;
    const yDiff = this.touchStartY - touchY;
    
    // If horizontal swipe is greater than vertical, it's likely a back gesture
    if (Math.abs(xDiff) > Math.abs(yDiff) && xDiff < -50) {
      const container = this.shadowRoot.querySelector('.detail-container');
      if (container) {
        const swipeAmount = Math.min(Math.abs(xDiff) / 3, 100);
        container.style.transform = `translateX(${swipeAmount}px)`;
        container.style.opacity = 1 - (swipeAmount / 200);
      }
      
      // Only prevent default if this is definitely a horizontal swipe gesture
      // This allows vertical scrolling to work normally
      if (event.cancelable && Math.abs(xDiff) > 30 && Math.abs(xDiff) > Math.abs(yDiff) * 2) {
        event.preventDefault();
      }
    }
  }
  
  handleTouchEnd(event) {
    if (!this.touchStartX) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const xDiff = this.touchStartX - touchEndX;
    
    // If swiped right more than 100px, close the detail view
    if (xDiff < -100) {
      this.close();
    } else {
      // Reset position if not closing
      const container = this.shadowRoot.querySelector('.detail-container');
      if (container) {
        container.style.transform = '';
        container.style.opacity = '1';
      }
    }
    
    // Reset touch tracking
    this.touchStartX = null;
    this.touchStartY = null;
  }
  
  open(teaData) {
    this.teaData = teaData;
    this.isOpen = true;
    this.render();
    
    // Don't prevent scrolling of background content anymore
    // document.body.classList.add('detail-view-open');
    
    // Animate in
    const container = this.shadowRoot.querySelector('.detail-container');
    if (container) {
      requestAnimationFrame(() => {
        container.classList.add('active');
      });
    }
  }
  
  close() {
    // Animate out
    const container = this.shadowRoot.querySelector('.detail-container');
    if (container) {
      container.classList.remove('active');
      
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        this.isOpen = false;
        this.render();
        // document.body.classList.remove('detail-view-open');
      }, 300);
    } else {
      this.isOpen = false;
      this.render();
      // document.body.classList.remove('detail-view-open');
    }
  }
  
  startSteeping() {
    if (!this.teaData) return;
    
    // Get the currently selected brewing style
    const brewingToggle = this.shadowRoot.querySelector('.brewing-toggle');
    const isGongfu = brewingToggle && brewingToggle.checked;
    
    // Create a copy of tea data with the appropriate brewing time
    const teaForSteeping = { ...this.teaData };
    
    // Use gongfu time if available and selected, otherwise use default/western time
    if (isGongfu && teaForSteeping.gongfuBrewTime) {
      teaForSteeping.brewTime = teaForSteeping.gongfuBrewTime;
      teaForSteeping.temperature = teaForSteeping.gongfuTemperature || teaForSteeping.temperature;
    } else if (!isGongfu && teaForSteeping.westernBrewTime) {
      teaForSteeping.brewTime = teaForSteeping.westernBrewTime;
      teaForSteeping.temperature = teaForSteeping.westernTemperature || teaForSteeping.temperature;
    }
    
    // Update event detail with tea data
    this.startSteepingEvent.detail.tea = teaForSteeping;
    
    // Dispatch the event
    this.dispatchEvent(this.startSteepingEvent);
    
    // Close the detail view
    this.close();
  }
  
  toggleBrewingStyle(event) {
    // Update UI elements that show brewing parameters
    const isGongfu = event.target.checked;
    
    // Update displayed brewing parameters
    this.updateBrewingInfo(isGongfu);
  }
  
  updateBrewingInfo(isGongfu) {
    if (!this.teaData) return;
    
    const brewTimeDisplay = this.shadowRoot.querySelector('.brew-time-value');
    const tempDisplay = this.shadowRoot.querySelector('.temperature-value');
    
    if (brewTimeDisplay) {
      if (isGongfu && this.teaData.gongfuBrewTime) {
        brewTimeDisplay.textContent = this.teaData.gongfuBrewTime;
      } else {
        brewTimeDisplay.textContent = this.teaData.brewTime || this.teaData.westernBrewTime || 'N/A';
      }
    }
    
    if (tempDisplay) {
      if (isGongfu && this.teaData.gongfuTemperature) {
        tempDisplay.textContent = this.teaData.gongfuTemperature;
      } else {
        tempDisplay.textContent = this.teaData.temperature || this.teaData.westernTemperature || 'N/A';
      }
    }
  }
  
  render() {
    if (!this.isOpen) {
      this.shadowRoot.innerHTML = '';
      return;
    }
    
    if (!this.teaData) {
      this.shadowRoot.innerHTML = '<div>No tea data available</div>';
      return;
    }
    
    const { 
      name, 
      category, 
      origin, 
      description, 
      brewTime, 
      temperature, 
      notes, 
      tags,
      harvestDate,
      elevation,
      vendor,
      price,
      rating,
      flavorProfile,
      storageInstructions,
      ingredients,
      caffeineLevel,
      gongfuBrewTime,
      westernBrewTime,
      gongfuTemperature,
      westernTemperature,
      leafGradeOrType,
      processingMethod,
      seasonality,
      shelfLife
    } = this.teaData;
    
    // Default to western brewing style
    const isGongfuDefault = false;
    
    const styles = `
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 95; /* Below the timer (100) but above other content */
        pointer-events: ${this.isOpen ? 'auto' : 'none'};
        padding-bottom: 120px; /* Space for the timer drawer */
      }
      
      .detail-container {
        position: absolute;
        top: 60px; /* Space for the header */
        left: 0;
        width: 100%;
        height: calc(100% - 60px); /* Adjust for header space */
        background-color: white;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
        overflow-y: auto;
        scroll-behavior: smooth;
      }
      
      .detail-container.active {
        transform: translateX(0);
        opacity: 1;
      }
      
      @media (min-width: 768px) {
        :host {
          left: 200px; /* Space for the menu sidebar on desktop */
          width: calc(100% - 200px);
        }
      }
      
      .detail-header {
        position: sticky;
        top: 0;
        background-color: white;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        color: #666;
      }
      
      .close-button:hover {
        background-color: #f0f0f0;
        color: #333;
      }
      
      .tea-title {
        font-size: 1.5rem;
        margin: 0;
        flex: 1;
        text-align: center;
        color: #333;
      }
      
      .detail-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .tea-hero {
        position: relative;
        height: 200px;
        background-color: #f5f7fa;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        margin-bottom: 1rem;
      }
      
      .tea-category {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.5rem 1rem;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: bold;
        color: #333;
      }
      
      .tea-origin {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        padding: 0.5rem 1rem;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 20px;
        font-size: 0.9rem;
        color: #333;
      }
      
      .tea-image-placeholder {
        color: #aaa;
        font-size: 4rem;
        text-align: center;
      }
      
      .tea-description {
        font-size: 1.1rem;
        line-height: 1.6;
        color: #333;
      }
      
      .section-title {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
        color: #333;
        position: relative;
        padding-left: 1rem;
      }
      
      .section-title::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.3rem;
        bottom: 0.3rem;
        width: 4px;
        background-color: #4a90e2;
        border-radius: 2px;
      }
      
      .brewing-section {
        background-color: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        position: relative;
      }
      
      .brewing-toggle-container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .toggle-label {
        font-size: 0.9rem;
        color: #666;
      }
      
      .brewing-toggle {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
      }
      
      .brewing-toggle input {
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
        border-radius: 30px;
        transition: 0.3s;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        border-radius: 50%;
        transition: 0.3s;
      }
      
      input:checked + .toggle-slider {
        background-color: #4a90e2;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(30px);
      }
      
      .brewing-params {
        display: flex;
        justify-content: space-around;
        text-align: center;
      }
      
      .brewing-param {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .param-label {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      
      .param-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
      }
      
      .tea-details-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      
      .detail-item {
        display: flex;
        flex-direction: column;
      }
      
      .detail-label {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
      
      .detail-value {
        font-size: 1rem;
        color: #333;
      }
      
      .tea-notes {
        font-style: italic;
        color: #666;
        line-height: 1.5;
      }
      
      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      
      .tag {
        padding: 0.5rem 1rem;
        background-color: #e8f4f8;
        border-radius: 20px;
        font-size: 0.9rem;
        color: #4a90e2;
      }
      
      .flavor-profile {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        margin-top: 0.5rem;
      }
      
      .flavor-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .flavor-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #4a90e2;
      }
      
      .steep-button-container {
        padding: 1rem;
        position: sticky;
        bottom: 0;
        background-color: white;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: center;
      }
      
      .steep-button {
        width: 100%;
        max-width: 300px;
        padding: 1rem;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .steep-button:hover {
        background-color: #3a80d2;
      }
      
      @media (min-width: 768px) {
        .tea-hero {
          height: 300px;
        }
        
        .detail-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .tea-details-list {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="detail-container">
        <div class="detail-header">
          <button class="close-button">&larr;</button>
          <h2 class="tea-title">${name}</h2>
          <div style="width: 40px;"></div> <!-- Spacer for alignment -->
        </div>
        
        <div class="detail-content">
          <div class="tea-hero">
            <div class="tea-image-placeholder">🍵</div>
            <div class="tea-category">${category}</div>
            ${origin ? `<div class="tea-origin">Origin: ${origin}</div>` : ''}
          </div>
          
          <p class="tea-description">${description}</p>
          
          <div class="brewing-section">
            <h3 class="section-title">Brewing Guide</h3>
            
            <div class="brewing-toggle-container">
              <span class="toggle-label">Western</span>
              <label class="brewing-toggle">
                <input type="checkbox" class="brewing-toggle" ${isGongfuDefault ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">Gongfu</span>
            </div>
            
            <div class="brewing-params">
              <div class="brewing-param">
                <span class="param-label">Brewing Time</span>
                <span class="param-value brew-time-value">${
                  isGongfuDefault && gongfuBrewTime ? gongfuBrewTime : (brewTime || westernBrewTime || 'N/A')
                }</span>
              </div>
              
              <div class="brewing-param">
                <span class="param-label">Water Temperature</span>
                <span class="param-value temperature-value">${
                  isGongfuDefault && gongfuTemperature ? gongfuTemperature : (temperature || westernTemperature || 'N/A')
                }</span>
              </div>
            </div>
          </div>
          
          <div class="tea-details">
            <h3 class="section-title">Tea Details</h3>
            
            <div class="tea-details-list">
              ${origin ? `
                <div class="detail-item">
                  <span class="detail-label">Origin</span>
                  <span class="detail-value">${origin}</span>
                </div>
              ` : ''}
              
              ${harvestDate ? `
                <div class="detail-item">
                  <span class="detail-label">Harvest Date</span>
                  <span class="detail-value">${harvestDate}</span>
                </div>
              ` : ''}
              
              ${elevation ? `
                <div class="detail-item">
                  <span class="detail-label">Elevation</span>
                  <span class="detail-value">${elevation}</span>
                </div>
              ` : ''}
              
              ${caffeineLevel ? `
                <div class="detail-item">
                  <span class="detail-label">Caffeine Level</span>
                  <span class="detail-value">${caffeineLevel}</span>
                </div>
              ` : ''}
              
              ${processingMethod ? `
                <div class="detail-item">
                  <span class="detail-label">Processing Method</span>
                  <span class="detail-value">${processingMethod}</span>
                </div>
              ` : ''}
              
              ${leafGradeOrType ? `
                <div class="detail-item">
                  <span class="detail-label">Leaf Grade/Type</span>
                  <span class="detail-value">${leafGradeOrType}</span>
                </div>
              ` : ''}
              
              ${vendor ? `
                <div class="detail-item">
                  <span class="detail-label">Vendor</span>
                  <span class="detail-value">${vendor}</span>
                </div>
              ` : ''}
              
              ${price ? `
                <div class="detail-item">
                  <span class="detail-label">Price</span>
                  <span class="detail-value">${price}</span>
                </div>
              ` : ''}
              
              ${seasonality ? `
                <div class="detail-item">
                  <span class="detail-label">Seasonality</span>
                  <span class="detail-value">${seasonality}</span>
                </div>
              ` : ''}
              
              ${shelfLife ? `
                <div class="detail-item">
                  <span class="detail-label">Shelf Life</span>
                  <span class="detail-value">${shelfLife}</span>
                </div>
              ` : ''}
              
              ${storageInstructions ? `
                <div class="detail-item">
                  <span class="detail-label">Storage</span>
                  <span class="detail-value">${storageInstructions}</span>
                </div>
              ` : ''}
              
              ${rating ? `
                <div class="detail-item">
                  <span class="detail-label">Rating</span>
                  <span class="detail-value">${rating}/5</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${flavorProfile && flavorProfile.length ? `
            <div class="flavor-section">
              <h3 class="section-title">Flavor Profile</h3>
              <div class="flavor-profile">
                ${flavorProfile.map(flavor => `
                  <div class="flavor-item">
                    <span class="flavor-dot"></span>
                    <span>${flavor}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${ingredients && ingredients.length ? `
            <div class="ingredients-section">
              <h3 class="section-title">Ingredients</h3>
              <p>${ingredients.join(', ')}</p>
            </div>
          ` : ''}
          
          ${notes ? `
            <div class="notes-section">
              <h3 class="section-title">Notes</h3>
              <p class="tea-notes">${notes}</p>
            </div>
          ` : ''}
          
          ${tags && tags.length ? `
            <div class="tags-section">
              <h3 class="section-title">Tags</h3>
              <div class="tags-container">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="steep-button-container">
          <button class="steep-button">Steep This Tea</button>
        </div>
      </div>
    `;
    
    this.addEventListeners();
    
    // Initialize brewing parameters based on default style
    this.updateBrewingInfo(isGongfuDefault);
  }
}

customElements.define('tea-detail', TeaDetail);

export default TeaDetail;
