// scripts/components/category-menu.js

class CategoryMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.categories = [];
    this.selectedCategory = null;
    
    // Create custom events
    this.categorySelectedEvent = new CustomEvent('category-selected', {
      bubbles: true,
      composed: true,
      detail: { category: null }
    });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
  }
  
  static get observedAttributes() {
    return ['open'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open' && oldValue !== newValue) {
      this.isOpen = newValue === 'true';
      this.render();
    }
  }
  
  set categoriesList(categories) {
    this.categories = categories;
    this.render();
  }
  
  addEventListeners() {
    this.shadowRoot.querySelector('.menu-toggle')?.addEventListener('click', this.toggleMenu.bind(this));
    this.shadowRoot.querySelector('.menu-overlay')?.addEventListener('click', this.closeMenu.bind(this));
    
    // Add event listeners to category items
    const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('click', this.selectCategory.bind(this));
    });
    
    // Add swipe gesture for menu (swipe right to open)
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }
  
  // Touch event handlers for swipe detection
  handleTouchStart(event) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  handleTouchMove(event) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    this.touchEndX = event.touches[0].clientX;
    this.touchEndY = event.touches[0].clientY;
  }
  
  handleTouchEnd(event) {
    if (!this.touchStartX || !this.touchStartY || !this.touchEndX || !this.touchEndY) {
      this.touchStartX = this.touchStartY = this.touchEndX = this.touchEndY = null;
      return;
    }
    
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 75) {
      // Swipe right to open menu
      if (deltaX > 0 && !this.isOpen && this.touchStartX < 50) {
        this.openMenu();
      }
      // Swipe left to close menu
      else if (deltaX < 0 && this.isOpen) {
        this.closeMenu();
      }
    }
    
    // Reset touch coordinates
    this.touchStartX = this.touchStartY = this.touchEndX = this.touchEndY = null;
  }
  
  removeEventListeners() {
    this.shadowRoot.querySelector('.menu-toggle')?.removeEventListener('click', this.toggleMenu.bind(this));
    this.shadowRoot.querySelector('.menu-overlay')?.removeEventListener('click', this.closeMenu.bind(this));
    
    const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.removeEventListener('click', this.selectCategory.bind(this));
    });
  }
  
  toggleMenu() {
    this.isOpen = !this.isOpen;
    this.render();
    
    // Dispatch a custom event so the app knows the menu state changed
    const menuToggleEvent = new CustomEvent('menu-toggle', {
      bubbles: true,
      composed: true,
      detail: { isOpen: this.isOpen }
    });
    this.dispatchEvent(menuToggleEvent);
  }
  
  openMenu() {
    this.isOpen = true;
    this.render();
  }
  
  closeMenu() {
    this.isOpen = false;
    this.render();
  }
  
  selectCategory(event) {
    const categoryName = event.currentTarget.dataset.category;
    this.selectedCategory = categoryName === 'all' ? null : categoryName;
    
    // Update the event detail
    this.categorySelectedEvent.detail.category = this.selectedCategory;
    
    // Dispatch the event
    this.dispatchEvent(this.categorySelectedEvent);
    
    // Close the menu after selection on mobile
    if (window.innerWidth < 768) {
      this.closeMenu();
    }
    
    this.render();
  }
  
  render() {
    const styles = `
      :host {
        display: block;
      }
      
      .menu-container {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100%;
        pointer-events: none;
        z-index: 1000;
      }
      
      .menu-toggle {
        position: fixed;
        top: 1rem;
        left: 1rem;
        width: 40px;
        height: 40px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 1001;
        pointer-events: auto;
      }
      
      .menu-toggle-icon {
        width: 20px;
        height: 20px;
        position: relative;
      }
      
      .menu-toggle-icon span {
        display: block;
        position: absolute;
        height: 2px;
        width: 100%;
        background-color: #333;
        border-radius: 2px;
        transition: all 0.3s ease;
      }
      
      .menu-toggle-icon span:nth-child(1) {
        top: ${this.isOpen ? '9px' : '4px'};
        transform: ${this.isOpen ? 'rotate(45deg)' : 'none'};
      }
      
      .menu-toggle-icon span:nth-child(2) {
        top: 9px;
        opacity: ${this.isOpen ? '0' : '1'};
      }
      
      .menu-toggle-icon span:nth-child(3) {
        top: ${this.isOpen ? '9px' : '14px'};
        transform: ${this.isOpen ? 'rotate(-45deg)' : 'none'};
      }
      
      .menu-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        opacity: ${this.isOpen ? '1' : '0'};
        pointer-events: ${this.isOpen ? 'auto' : 'none'};
        transition: opacity 0.3s ease;
      }
      
      .menu-sidebar {
        position: absolute;
        top: 0;
        left: 0;
        width: 250px;
        height: 100%;
        background-color: white;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        transform: translateX(${this.isOpen ? '0' : '-100%'});
        transition: transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1);
        overflow-y: auto;
        pointer-events: auto;
      }
      
      .menu-header {
        padding: 1.5rem 1rem;
        border-bottom: 1px solid #eee;
        text-align: center;
      }
      
      .menu-title {
        margin: 0;
        font-size: 1.2rem;
        color: #333;
      }
      
      .categories-list {
        padding: 1rem 0;
      }
      
      .category-item {
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        opacity: ${this.isOpen ? '1' : '0'};
        transform: ${this.isOpen ? 'translateX(0)' : 'translateX(-20px)'};
      }
      
      /* Staggered animation for menu items */
      ${this.categories.map((category, index) => `
        .category-item:nth-child(${index + 2}) {
          transition-delay: ${0.05 + (index * 0.05)}s;
        }
      `).join('\n')}
      
      /* "All" category gets first animation */
      .category-item:first-child {
        transition-delay: 0.05s;
      }
      
      .category-item:hover {
        background-color: #f5f5f5;
      }
      
      .category-item.selected {
        background-color: #e8f4f8;
        font-weight: bold;
        color: #4a90e2;
      }
      
      .category-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 0.75rem;
      }
      
      .category-item[data-category="all"] .category-dot {
        background-color: #808080;
      }
      
      .category-item[data-category="Black"] .category-dot {
        background-color: #654321;
      }
      
      .category-item[data-category="Green"] .category-dot {
        background-color: #5cb85c;
      }
      
      .category-item[data-category="Oolong"] .category-dot {
        background-color: #f0ad4e;
      }
      
      .category-item[data-category="White"] .category-dot {
        background-color: #f8f9fa;
        border: 1px solid #ddd;
      }
      
      .category-item[data-category="Herbal"] .category-dot {
        background-color: #9370db;
      }
      
      .category-item[data-category="Pu-erh"] .category-dot {
        background-color: #8b4513;
      }
      
      @media (min-width: 768px) {
        .menu-container {
          pointer-events: auto;
        }
        
        .menu-toggle {
          display: none;
        }
        
        .menu-overlay {
          display: none;
        }
        
        .menu-sidebar {
          transform: translateX(0);
          width: 200px;
          box-shadow: none;
          border-right: 1px solid #eee;
        }
        
        :host {
          margin-right: 200px;
        }
      }
    `;
    
    // Generate category items HTML
    let categoriesHTML = `
      <div class="category-item ${!this.selectedCategory ? 'selected' : ''}" data-category="all">
        <span class="category-dot"></span>
        All Teas
      </div>
    `;
    
    this.categories.forEach(category => {
      categoriesHTML += `
        <div class="category-item ${this.selectedCategory === category.name ? 'selected' : ''}" data-category="${category.name}">
          <span class="category-dot"></span>
          ${category.name}
        </div>
      `;
    });
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="menu-container">
        <div class="menu-toggle">
          <div class="menu-toggle-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div class="menu-overlay"></div>
        
        <div class="menu-sidebar">
          <div class="menu-header">
            <h2 class="menu-title">Tea Categories</h2>
          </div>
          
          <div class="categories-list">
            ${categoriesHTML}
          </div>
        </div>
      </div>
    `;
    
    this.addEventListeners();
  }
}

customElements.define('category-menu', CategoryMenu);

export default CategoryMenu;
