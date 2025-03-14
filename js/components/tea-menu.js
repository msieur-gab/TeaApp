// scripts/components/menu.js

class CategoryMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.categories = [];
    this.selectedCategory = null;
    this.isMobile = window.innerWidth < 768;
    
    // Create custom events
    this.categorySelectedEvent = new CustomEvent('category-selected', {
      bubbles: true,
      composed: true,
      detail: { category: null }
    });
  }

  connectedCallback() {
    // Set initial state for desktop
    if (!this.isMobile) {
      this.isOpen = true;
    }
    
    this.render();
    this.addEventListeners();
    
    // Listen for window resize to handle responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  disconnectedCallback() {
    this.removeEventListeners();
    window.removeEventListener('resize', this.handleResize.bind(this));
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
  
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    
    // If transitioning from mobile to desktop, ensure menu is open
    if (wasMobile && !this.isMobile) {
      this.isOpen = true;
      this.render();
    }
    // If transitioning from desktop to mobile, close menu by default
    else if (!wasMobile && this.isMobile) {
      this.isOpen = false;
      this.render();
    }
  }
  
  addEventListeners() {
    // Toggle button
    const toggleButton = this.shadowRoot.querySelector('.menu-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', this.toggleMenu.bind(this));
    }
    
    // Overlay
    const overlay = this.shadowRoot.querySelector('.menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', this.closeMenu.bind(this));
    }
    
    // Category items
    const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.addEventListener('click', this.selectCategory.bind(this));
    });
    
    // Touch gestures for mobile
    if (this.isMobile) {
      document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
      document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }
  }
  
  removeEventListeners() {
    const toggleButton = this.shadowRoot.querySelector('.menu-toggle');
    if (toggleButton) {
      toggleButton.removeEventListener('click', this.toggleMenu.bind(this));
    }
    
    const overlay = this.shadowRoot.querySelector('.menu-overlay');
    if (overlay) {
      overlay.removeEventListener('click', this.closeMenu.bind(this));
    }
    
    const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.removeEventListener('click', this.selectCategory.bind(this));
    });
    
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  // Touch event handlers for swipe detection
  handleTouchStart(event) {
    if (!this.isMobile) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  handleTouchMove(event) {
    if (!this.isMobile || !this.touchStartX || !this.touchStartY) return;
    
    this.touchEndX = event.touches[0].clientX;
    this.touchEndY = event.touches[0].clientY;
  }
  
  handleTouchEnd(event) {
    if (!this.isMobile || !this.touchStartX || !this.touchStartY || !this.touchEndX || !this.touchEndY) {
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
  
  toggleMenu() {
    if (this.isMobile) {
      this.isOpen = !this.isOpen;
      
      // Important: We need to update the menu transform without a full re-render
      // to maintain the animation transition
      const sidebar = this.shadowRoot.querySelector('.menu-sidebar');
      const overlay = this.shadowRoot.querySelector('.menu-overlay');
      
      if (sidebar) {
        sidebar.style.transform = this.isOpen ? 'translateX(0)' : 'translateX(-100%)';
      }
      
      if (overlay) {
        overlay.style.opacity = this.isOpen ? '1' : '0';
        overlay.style.visibility = this.isOpen ? 'visible' : 'hidden';
        overlay.style.pointerEvents = this.isOpen ? 'auto' : 'none';
      }
      
      // Update the toggle icon without a full re-render
      const toggleIcon = this.shadowRoot.querySelector('.menu-toggle-icon');
      if (toggleIcon) {
        const spans = toggleIcon.querySelectorAll('span');
        if (spans.length === 3) {
          // First span (top)
          spans[0].style.top = this.isOpen ? '9px' : '4px';
          spans[0].style.transform = this.isOpen ? 'rotate(45deg)' : 'none';
          
          // Second span (middle)
          spans[1].style.opacity = this.isOpen ? '0' : '1';
          
          // Third span (bottom)
          spans[2].style.top = this.isOpen ? '9px' : '14px';
          spans[2].style.transform = this.isOpen ? 'rotate(-45deg)' : 'none';
        }
      }
      
      // Dispatch event so app knows menu state changed
      this.dispatchEvent(new CustomEvent('menu-toggle', {
        bubbles: true,
        composed: true,
        detail: { isOpen: this.isOpen }
      }));
    }
  }
  
  openMenu() {
    if (!this.isOpen) {
      this.isOpen = true;
      
      // Apply changes directly for animation
      const sidebar = this.shadowRoot.querySelector('.menu-sidebar');
      const overlay = this.shadowRoot.querySelector('.menu-overlay');
      
      if (sidebar) {
        sidebar.style.transform = 'translateX(0)';
      }
      
      if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        overlay.style.pointerEvents = 'auto';
      }
      
      // Update toggle icon
      const toggleIcon = this.shadowRoot.querySelector('.menu-toggle-icon');
      if (toggleIcon) {
        const spans = toggleIcon.querySelectorAll('span');
        if (spans.length === 3) {
          spans[0].style.top = '9px';
          spans[0].style.transform = 'rotate(45deg)';
          spans[1].style.opacity = '0';
          spans[2].style.top = '9px';
          spans[2].style.transform = 'rotate(-45deg)';
        }
      }
    }
  }
  
  closeMenu() {
    if (this.isMobile && this.isOpen) {
      this.isOpen = false;
      
      // Apply changes directly for animation
      const sidebar = this.shadowRoot.querySelector('.menu-sidebar');
      const overlay = this.shadowRoot.querySelector('.menu-overlay');
      
      if (sidebar) {
        sidebar.style.transform = 'translateX(-100%)';
      }
      
      if (overlay) {
        overlay.style.opacity = '0';
        // Don't change visibility immediately to maintain the animation
        setTimeout(() => {
          if (!this.isOpen) { // Check if still closed after timeout
            overlay.style.visibility = 'hidden';
            overlay.style.pointerEvents = 'none';
          }
        }, 350); // Match transition duration
      }
      
      // Update toggle icon
      const toggleIcon = this.shadowRoot.querySelector('.menu-toggle-icon');
      if (toggleIcon) {
        const spans = toggleIcon.querySelectorAll('span');
        if (spans.length === 3) {
          spans[0].style.top = '4px';
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.top = '14px';
          spans[2].style.transform = 'none';
        }
      }
    }
  }
  
  selectCategory(event) {
    const categoryName = event.currentTarget.dataset.category;
    this.selectedCategory = categoryName === 'all' ? null : categoryName;
    
    // Update selected category visually without full re-render
    const categoryItems = this.shadowRoot.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      if (item.dataset.category === categoryName ||
          (categoryName === 'all' && item.dataset.category === 'all')) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Update event detail
    this.categorySelectedEvent.detail.category = this.selectedCategory;
    
    // Dispatch event
    this.dispatchEvent(this.categorySelectedEvent);
    
    // Close menu after selection on mobile
    if (this.isMobile) {
      this.closeMenu();
    }
  }
  
  render() {
    const styles = `
      :host {
        display: block;
        --menu-width: 250px;
        --menu-width-desktop: 200px;
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
        transition: transform 0.3s ease;
      }
      
      .menu-toggle:hover {
        transform: scale(1.05);
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
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        opacity: ${this.isOpen && this.isMobile ? '1' : '0'};
        visibility: ${this.isOpen && this.isMobile ? 'visible' : 'hidden'};
        transition: opacity 0.3s ease, visibility 0.3s ease;
        z-index: 990;
        pointer-events: ${this.isOpen && this.isMobile ? 'auto' : 'none'};
      }
      
      .menu-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--menu-width);
        height: 100%;
        background-color: white;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
        transform: translateX(${this.isOpen ? '0' : '-100%'});
        transition: transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1);
        z-index: 1000;
        overflow-y: auto;
        will-change: transform;
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
      
      /* Category color coding */
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
        .menu-toggle {
          display: none;
        }
        
        .menu-overlay {
          display: none;
        }
        
        .menu-sidebar {
          transform: translateX(0);
          width: var(--menu-width-desktop);
          box-shadow: none;
          border-right: 1px solid #eee;
          z-index: 5; /* Lower z-index on desktop */
        }
        
        /* Main content push - this will be applied via app.js */
        :host::after {
          content: '';
          display: block;
          width: var(--menu-width-desktop);
          height: 0;
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
      
      ${this.isMobile ? `
        <div class="menu-toggle">
          <div class="menu-toggle-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      ` : ''}
      
      <div class="menu-overlay"></div>
      
      <div class="menu-sidebar">
        <div class="menu-header">
          <h2 class="menu-title">Tea Categories</h2>
        </div>
        
        <div class="categories-list">
          ${categoriesHTML}
        </div>
      </div>
    `;
    
    this.addEventListeners();
  }
}

customElements.define('category-menu', CategoryMenu);

export default CategoryMenu;
