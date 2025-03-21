/**
 * Tea UI Components
 * A simple atomic component library for Tea App UI elements
 */

class TeaUI {
  constructor() {
    // Set up internal properties
    this._styleId = 'tea-ui-styles';
    this._toggleStyleId = 'tea-ui-toggle-styles';
    this._progressAnimationId = 'tea-progress-keyframes';
    
    // Initialize styles
    this._initGlobalStyles();
  }
  
  /**
   * Initialize global styles for the component library
   * @private
   */
  _initGlobalStyles() {
    // Only create the global styles if they don't already exist
    if (!document.getElementById(this._styleId)) {
      const styleSheet = `
        :root {
          --tea-primary: #4a90e2;
          --tea-success: #4CAF50;
          --tea-warning: #ff9800;
          --tea-error: #f44336;
          --tea-text-dark: #333333;
          --tea-text-medium: #666666;
          --tea-text-light: #999999;
          --tea-background-light: #f5f7fa;
          --tea-border-color: #e0e0e0;
          --tea-border-radius: 8px;
          --tea-shadow-small: 0 2px 4px rgba(0, 0, 0, 0.1);
          --tea-shadow-medium: 0 4px 8px rgba(0, 0, 0, 0.1);
          --tea-shadow-large: 0 8px 16px rgba(0, 0, 0, 0.1);
          --tea-spacing-xs: 0.25rem;
          --tea-spacing-sm: 0.5rem;
          --tea-spacing-md: 1rem;
          --tea-spacing-lg: 1.5rem;
          --tea-spacing-xl: 2rem;
          
          /* Transitions */
          --tea-transition-fast: 0.2s ease;
          --tea-transition-medium: 0.3s ease;
          --tea-transition-slow: 0.5s ease;
        }

        /* Animations */
        @keyframes tea-progress-animate {
          0% { background-position: 40px 0; }
          100% { background-position: 0 0; }
        }
      `;
      
      const style = document.createElement('style');
      style.id = this._styleId;
      style.textContent = styleSheet;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Create a styled button element
   * @param {Object} options - Button configuration options
   * @returns {HTMLButtonElement} - The button element
   */
  createButton(options = {}) {
    const {
      text = 'Button',
      variant = 'primary', // primary, secondary, outline, text
      size = 'medium', // small, medium, large
      icon = null,
      iconPosition = 'left',
      fullWidth = false,
      disabled = false,
      onClick = null,
      className = '',
      type = 'button'
    } = options;
    
    const button = document.createElement('button');
    button.textContent = text;
    button.type = type;
    button.disabled = disabled;
    button.className = `tea-button tea-button-${variant} tea-button-${size} ${className}`;
    
    if (fullWidth) {
      button.classList.add('tea-button-full-width');
    }
    
    if (onClick && !disabled) {
      button.addEventListener('click', onClick);
    }
    
    // Apply styles
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.borderRadius = 'var(--tea-border-radius)';
    button.style.fontWeight = 'bold';
    button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    button.style.transition = 'var(--tea-transition-fast)';
    button.style.opacity = disabled ? '0.65' : '1';
    button.style.width = fullWidth ? '100%' : 'auto';
    
    // Size styles
    switch (size) {
      case 'small':
        button.style.padding = '0.35rem 0.75rem';
        button.style.fontSize = '0.875rem';
        break;
      case 'large':
        button.style.padding = '0.75rem 1.5rem';
        button.style.fontSize = '1.125rem';
        break;
      default: // medium
        button.style.padding = '0.5rem 1rem';
        button.style.fontSize = '1rem';
    }
    
    // Variant styles
    switch (variant) {
      case 'primary':
        button.style.backgroundColor = 'var(--tea-primary)';
        button.style.color = 'white';
        button.style.border = 'none';
        break;
      case 'secondary':
        button.style.backgroundColor = '#f5f7fa';
        button.style.color = 'var(--tea-text-dark)';
        button.style.border = '1px solid var(--tea-border-color)';
        break;
      case 'outline':
        button.style.backgroundColor = 'transparent';
        button.style.color = 'var(--tea-primary)';
        button.style.border = '1px solid var(--tea-primary)';
        break;
      case 'text':
        button.style.backgroundColor = 'transparent';
        button.style.color = 'var(--tea-primary)';
        button.style.border = 'none';
        button.style.padding = '0.25rem 0.5rem';
        break;
    }
    
    // Add hover effect
    if (!disabled) {
      button.addEventListener('mouseenter', () => {
        if (variant === 'primary') {
          button.style.backgroundColor = '#3a80d2';
        } else if (variant === 'secondary') {
          button.style.backgroundColor = '#e9ecf1';
        } else if (variant === 'outline') {
          button.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
        } else if (variant === 'text') {
          button.style.backgroundColor = 'rgba(74, 144, 226, 0.05)';
        }
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = 'var(--tea-shadow-small)';
      });
      
      button.addEventListener('mouseleave', () => {
        if (variant === 'primary') {
          button.style.backgroundColor = 'var(--tea-primary)';
        } else if (variant === 'secondary') {
          button.style.backgroundColor = '#f5f7fa';
        } else if (variant === 'outline' || variant === 'text') {
          button.style.backgroundColor = 'transparent';
        }
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
      
      button.addEventListener('mousedown', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    }
    
    // Add icon if provided
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'tea-button-icon';
      iconEl.innerHTML = icon;
      iconEl.style.display = 'inline-flex';
      iconEl.style.alignItems = 'center';
      iconEl.style.justifyContent = 'center';
      
      if (iconPosition === 'left') {
        iconEl.style.marginRight = '0.5rem';
        button.insertBefore(iconEl, button.firstChild);
      } else {
        iconEl.style.marginLeft = '0.5rem';
        button.appendChild(iconEl);
      }
    }
    
    return button;
  }
  
  /**
   * Create a toggle switch
   * @param {Object} options - Toggle configuration
   * @returns {HTMLDivElement} - The toggle container element
   */
  createToggle(options = {}) {
    const {
      checked = false,
      disabled = false,
      onChange = null,
      id = `tea-toggle-${Math.random().toString(36).substring(2, 9)}`,
      labelLeft = '',
      labelRight = '',
      color = 'var(--tea-primary)'
    } = options;
    
    // Ensure we have unique styles for each toggle
    this._ensureToggleStyles(id, checked, color);
    
    const container = document.createElement('div');
    container.className = 'tea-toggle-container';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '0.5rem';
    
    // Left label if provided
    if (labelLeft) {
      const leftLabel = document.createElement('span');
      leftLabel.className = 'tea-toggle-label-left';
      leftLabel.textContent = labelLeft;
      leftLabel.style.color = checked ? 'var(--tea-text-light)' : 'var(--tea-text-dark)';
      leftLabel.style.fontWeight = checked ? 'normal' : 'bold';
      leftLabel.style.fontSize = '0.9rem';
      container.appendChild(leftLabel);
    }
    
    // Toggle switch
    const label = document.createElement('label');
    label.className = 'tea-toggle';
    label.style.position = 'relative';
    label.style.display = 'inline-block';
    label.style.width = '60px';
    label.style.height = '30px';
    label.style.cursor = disabled ? 'not-allowed' : 'pointer';
    label.style.opacity = disabled ? '0.65' : '1';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = disabled;
    input.id = id;
    input.className = 'tea-toggle-input';
    input.style.opacity = '0';
    input.style.width = '0';
    input.style.height = '0';
    
    const slider = document.createElement('span');
    slider.className = 'tea-toggle-slider';
    slider.style.position = 'absolute';
    slider.style.cursor = disabled ? 'not-allowed' : 'pointer';
    slider.style.top = '0';
    slider.style.left = '0';
    slider.style.right = '0';
    slider.style.bottom = '0';
    slider.style.backgroundColor = checked ? color : '#ccc';
    slider.style.borderRadius = '30px';
    slider.style.transition = 'var(--tea-transition-medium)';
    slider.style.boxShadow = 'inset 0 0 2px rgba(0, 0, 0, 0.2)';
    
    if (onChange) {
      input.addEventListener('change', (e) => {
        // Update the toggle visually
        slider.style.backgroundColor = e.target.checked ? color : '#ccc';
        
        // Update toggle pseudo-element styles
        this._updateToggleStyles(id, e.target.checked, color);
        
        // Update labels if they exist
        const leftLabel = container.querySelector('.tea-toggle-label-left');
        const rightLabel = container.querySelector('.tea-toggle-label-right');
        
        if (leftLabel) {
          leftLabel.style.color = e.target.checked ? 'var(--tea-text-light)' : 'var(--tea-text-dark)';
          leftLabel.style.fontWeight = e.target.checked ? 'normal' : 'bold';
        }
        
        if (rightLabel) {
          rightLabel.style.color = e.target.checked ? 'var(--tea-text-dark)' : 'var(--tea-text-light)';
          rightLabel.style.fontWeight = e.target.checked ? 'bold' : 'normal';
        }
        
        onChange(e);
      });
    }
    
    label.appendChild(input);
    label.appendChild(slider);
    container.appendChild(label);
    
    // Right label if provided
    if (labelRight) {
      const rightLabel = document.createElement('span');
      rightLabel.className = 'tea-toggle-label-right';
      rightLabel.textContent = labelRight;
      rightLabel.style.color = checked ? 'var(--tea-text-dark)' : 'var(--tea-text-light)';
      rightLabel.style.fontWeight = checked ? 'bold' : 'normal';
      rightLabel.style.fontSize = '0.9rem';
      container.appendChild(rightLabel);
    }
    
    return container;
  }
  
  /**
   * Ensure toggle styles are added to the document
   * @private
   */
  _ensureToggleStyles(id, checked, color) {
    // Create or update the style element for toggle pseudo-elements
    let styleEl = document.getElementById(`${this._toggleStyleId}-${id}`);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = `${this._toggleStyleId}-${id}`;
      document.head.appendChild(styleEl);
    }
    
    // Update the styles
    this._updateToggleStyles(id, checked, color);
  }
  
  /**
   * Update toggle styles
   * @private
   */
  _updateToggleStyles(id, checked, color) {
    const styleEl = document.getElementById(`${this._toggleStyleId}-${id}`);
    if (!styleEl) return;
    
    // Update the toggle knob position
    styleEl.textContent = `
      #${id} + .tea-toggle-slider:before {
        content: "";
        position: absolute;
        height: 22px;
        width: 22px;
        left: ${checked ? '34px' : '4px'};
        bottom: 4px;
        background-color: white;
        border-radius: 50%;
        transition: var(--tea-transition-medium);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    `;
  }
  
  /**
   * Create a tabs component
   * @param {Object} options - Tabs configuration
   * @returns {HTMLDivElement} - The tabs component
   */
  createTabs(options = {}) {
    const {
      tabs = [],
      activeTab = 0,
      onChange = null,
      variant = 'default' // default, pills, underline
    } = options;
    
    if (!tabs.length) {
      return document.createElement('div');
    }
    
    const container = document.createElement('div');
    container.className = 'tea-tabs-container';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '100%';
    
    // Create tabs header
    const tabsHeader = document.createElement('div');
    tabsHeader.className = 'tea-tabs-header';
    tabsHeader.style.display = 'flex';
    
    if (variant === 'default' || variant === 'underline') {
      tabsHeader.style.borderBottom = '1px solid var(--tea-border-color)';
    } else if (variant === 'pills') {
      tabsHeader.style.backgroundColor = '#f5f7fa';
      tabsHeader.style.borderRadius = 'var(--tea-border-radius)';
      tabsHeader.style.padding = '4px';
    }
    
    // Create tab buttons
    tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tea-tab-button';
      tabButton.textContent = tab.label;
      tabButton.dataset.tabIndex = index;
      tabButton.type = 'button';
      
      // Style based on variant
      if (variant === 'default' || variant === 'underline') {
        tabButton.style.padding = '0.75rem 1rem';
        tabButton.style.backgroundColor = 'transparent';
        tabButton.style.border = 'none';
        tabButton.style.borderBottom = index === activeTab ? 
          '2px solid var(--tea-primary)' : '2px solid transparent';
        tabButton.style.color = index === activeTab ? 
          'var(--tea-primary)' : 'var(--tea-text-medium)';
        tabButton.style.fontWeight = index === activeTab ? 'bold' : 'normal';
      } else if (variant === 'pills') {
        tabButton.style.flex = '1';
        tabButton.style.padding = '0.5rem 1rem';
        tabButton.style.backgroundColor = index === activeTab ? 
          'white' : 'transparent';
        tabButton.style.border = 'none';
        tabButton.style.borderRadius = 'var(--tea-border-radius)';
        tabButton.style.color = index === activeTab ? 
          'var(--tea-primary)' : 'var(--tea-text-medium)';
        tabButton.style.fontWeight = index === activeTab ? 'bold' : 'normal';
        tabButton.style.boxShadow = index === activeTab ? 'var(--tea-shadow-small)' : 'none';
      }
      
      tabButton.style.cursor = 'pointer';
      tabButton.style.transition = 'var(--tea-transition-fast)';
      
      if (index === activeTab) {
        tabButton.setAttribute('data-active', 'true');
      }
      
      tabButton.addEventListener('click', () => {
        if (index !== Array.from(tabsHeader.children).findIndex(el => el.hasAttribute('data-active'))) {
          // Update active tab
          const currentActive = tabsHeader.querySelector('.tea-tab-button[data-active="true"]');
          if (currentActive) {
            currentActive.removeAttribute('data-active');
            
            if (variant === 'default' || variant === 'underline') {
              currentActive.style.borderBottom = '2px solid transparent';
              currentActive.style.color = 'var(--tea-text-medium)';
              currentActive.style.fontWeight = 'normal';
            } else if (variant === 'pills') {
              currentActive.style.backgroundColor = 'transparent';
              currentActive.style.color = 'var(--tea-text-medium)';
              currentActive.style.fontWeight = 'normal';
              currentActive.style.boxShadow = 'none';
            }
          }
          
          tabButton.setAttribute('data-active', 'true');
          
          if (variant === 'default' || variant === 'underline') {
            tabButton.style.borderBottom = '2px solid var(--tea-primary)';
            tabButton.style.color = 'var(--tea-primary)';
            tabButton.style.fontWeight = 'bold';
          } else if (variant === 'pills') {
            tabButton.style.backgroundColor = 'white';
            tabButton.style.color = 'var(--tea-primary)';
            tabButton.style.fontWeight = 'bold';
            tabButton.style.boxShadow = 'var(--tea-shadow-small)';
          }
          
          // Update content
          const allPanels = container.querySelectorAll('.tea-tab-panel');
          allPanels.forEach(panel => {
            panel.style.display = 'none';
          });
          
          const targetPanel = container.querySelector(`.tea-tab-panel[data-tab-index="${index}"]`);
          if (targetPanel) {
            targetPanel.style.display = 'block';
          }
          
          // Call onChange callback if provided
          if (onChange) {
            onChange(index);
          }
        }
      });
      
      tabsHeader.appendChild(tabButton);
    });
    
    container.appendChild(tabsHeader);
    
    // Create tab panels
    const tabsContent = document.createElement('div');
    tabsContent.className = 'tea-tabs-content';
    tabsContent.style.padding = '1rem 0';
    
    tabs.forEach((tab, index) => {
      const tabPanel = document.createElement('div');
      tabPanel.className = 'tea-tab-panel';
      tabPanel.dataset.tabIndex = index;
      tabPanel.style.display = index === activeTab ? 'block' : 'none';
      
      // If content is a node, append it, otherwise set as innerHTML
      if (tab.content instanceof Node) {
        tabPanel.appendChild(tab.content);
      } else {
        tabPanel.innerHTML = tab.content || '';
      }
      
      tabsContent.appendChild(tabPanel);
    });
    
    container.appendChild(tabsContent);
    return container;
  }
  
  /**
   * Create a card element
   * @param {Object} options - Card configuration
   * @returns {HTMLDivElement} - The card element
   */
  createCard(options = {}) {
    const {
      title = '',
      content = '',
      footer = '',
      elevation = 'medium', // low, medium, high
      padding = 'medium', // none, small, medium, large
      border = false,
      borderRadius = 'medium', // none, small, medium, large
      className = '',
      onClick = null
    } = options;
    
    const card = document.createElement('div');
    card.className = `tea-card ${className}`;
    
    // Apply styles
    card.style.backgroundColor = 'white';
    card.style.overflow = 'hidden';
    card.style.transition = 'var(--tea-transition-medium)';
    
    // Border radius
    switch (borderRadius) {
      case 'none':
        card.style.borderRadius = '0';
        break;
      case 'small':
        card.style.borderRadius = '4px';
        break;
      case 'large':
        card.style.borderRadius = '12px';
        break;
      default: // medium
        card.style.borderRadius = 'var(--tea-border-radius)';
    }
    
    // Elevation (shadow)
    switch (elevation) {
      case 'low':
        card.style.boxShadow = 'var(--tea-shadow-small)';
        break;
      case 'high':
        card.style.boxShadow = 'var(--tea-shadow-large)';
        break;
      default: // medium
        card.style.boxShadow = 'var(--tea-shadow-medium)';
    }
    
    // Border
    if (border) {
      card.style.border = '1px solid var(--tea-border-color)';
    }
    
    // Click handler
    if (onClick) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', onClick);
      
      // Hover effect
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        
        switch (elevation) {
          case 'low':
            card.style.boxShadow = 'var(--tea-shadow-medium)';
            break;
          case 'medium':
            card.style.boxShadow = 'var(--tea-shadow-large)';
            break;
          case 'high':
            card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
            break;
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        
        switch (elevation) {
          case 'low':
            card.style.boxShadow = 'var(--tea-shadow-small)';
            break;
          case 'medium':
            card.style.boxShadow = 'var(--tea-shadow-medium)';
            break;
          case 'high':
            card.style.boxShadow = 'var(--tea-shadow-large)';
            break;
        }
      });
    }
    
    // Title
    if (title) {
      const cardHeader = document.createElement('div');
      cardHeader.className = 'tea-card-header';
      
      switch (padding) {
        case 'none':
          cardHeader.style.padding = '0';
          break;
        case 'small':
          cardHeader.style.padding = '0.75rem';
          break;
        case 'large':
          cardHeader.style.padding = '1.5rem';
          break;
        default: // medium
          cardHeader.style.padding = '1rem';
      }
      
      cardHeader.style.borderBottom = '1px solid var(--tea-border-color)';
      
      if (typeof title === 'string') {
        const titleEl = document.createElement('h3');
        titleEl.className = 'tea-card-title';
        titleEl.textContent = title;
        titleEl.style.margin = '0';
        titleEl.style.fontSize = '1.25rem';
        titleEl.style.fontWeight = 'bold';
        titleEl.style.color = 'var(--tea-text-dark)';
        cardHeader.appendChild(titleEl);
      } else {
        cardHeader.appendChild(title);
      }
      
      card.appendChild(cardHeader);
    }
    
    // Content
    const cardContent = document.createElement('div');
    cardContent.className = 'tea-card-content';
    
    switch (padding) {
      case 'none':
        cardContent.style.padding = '0';
        break;
      case 'small':
        cardContent.style.padding = '0.75rem';
        break;
      case 'large':
        cardContent.style.padding = '1.5rem';
        break;
      default: // medium
        cardContent.style.padding = '1rem';
    }
    
    if (typeof content === 'string') {
      cardContent.innerHTML = content;
    } else if (content instanceof Node) {
      cardContent.appendChild(content);
    }
    
    card.appendChild(cardContent);
    
    // Footer
    if (footer) {
      const cardFooter = document.createElement('div');
      cardFooter.className = 'tea-card-footer';
      
      switch (padding) {
        case 'none':
          cardFooter.style.padding = '0';
          break;
        case 'small':
          cardFooter.style.padding = '0.75rem';
          break;
        case 'large':
          cardFooter.style.padding = '1.5rem';
          break;
        default: // medium
          cardFooter.style.padding = '1rem';
      }
      
      cardFooter.style.borderTop = '1px solid var(--tea-border-color)';
      cardFooter.style.backgroundColor = 'var(--tea-background-light)';
      
      if (typeof footer === 'string') {
        cardFooter.innerHTML = footer;
      } else if (footer instanceof Node) {
        cardFooter.appendChild(footer);
      }
      
      card.appendChild(cardFooter);
    }
    
    return card;
  }
  
  /**
   * Create a badge element
   * @param {Object} options - Badge configuration
   * @returns {HTMLSpanElement} - The badge element
   */
  createBadge(options = {}) {
    const {
      text = '',
      variant = 'default', // default, primary, success, warning, error
      size = 'medium', // small, medium, large
      pill = false,
      outline = false,
      className = ''
    } = options;
    
    const badge = document.createElement('span');
    badge.className = `tea-badge tea-badge-${variant} tea-badge-${size} ${className}`;
    badge.textContent = text;
    
    // Apply styles
    badge.style.display = 'inline-block';
    badge.style.fontWeight = 'bold';
    badge.style.textAlign = 'center';
    badge.style.whiteSpace = 'nowrap';
    badge.style.verticalAlign = 'middle';
    
    // Size styles
    switch (size) {
      case 'small':
        badge.style.padding = '0.2rem 0.5rem';
        badge.style.fontSize = '0.75rem';
        break;
      case 'large':
        badge.style.padding = '0.4rem 0.9rem';
        badge.style.fontSize = '1rem';
        break;
      default: // medium
        badge.style.padding = '0.25rem 0.75rem';
        badge.style.fontSize = '0.875rem';
    }
    
    // Border radius
    badge.style.borderRadius = pill ? '999px' : '4px';
    
    // Color based on variant
    let bgColor, textColor, borderColor;
    
    switch (variant) {
      case 'primary':
        bgColor = outline ? 'transparent' : 'var(--tea-primary)';
        textColor = outline ? 'var(--tea-primary)' : 'white';
        borderColor = 'var(--tea-primary)';
        break;
      case 'success':
        bgColor = outline ? 'transparent' : 'var(--tea-success)';
        textColor = outline ? 'var(--tea-success)' : 'white';
        borderColor = 'var(--tea-success)';
        break;
      case 'warning':
        bgColor = outline ? 'transparent' : 'var(--tea-warning)';
        textColor = outline ? 'var(--tea-warning)' : 'white';
        borderColor = 'var(--tea-warning)';
        break;
      case 'error':
        bgColor = outline ? 'transparent' : 'var(--tea-error)';
        textColor = outline ? 'var(--tea-error)' : 'white';
        borderColor = 'var(--tea-error)';
        break;
      default: // default
        bgColor = outline ? 'transparent' : '#e0e0e0';
        textColor = outline ? 'var(--tea-text-medium)' : 'var(--tea-text-dark)';
        borderColor = '#e0e0e0';
    }
    
    badge.style.backgroundColor = bgColor;
    badge.style.color = textColor;
    badge.style.border = outline ? `1px solid ${borderColor}` : 'none';
    
    return badge;
  }
  
  /**
   * Create a chip/tag element
   * @param {Object} options - Chip configuration
   * @returns {HTMLDivElement} - The chip element
   */
  createChip(options = {}) {
    const {
      text = '',
      color = null,
      backgroundColor = null,
      icon = null,
      closable = false,
      onClick = null,
      onClose = null,
      className = ''
    } = options;
    
    const chip = document.createElement('div');
    chip.className = `tea-chip ${className}`;
    
    // Apply base styles
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.padding = '0.5rem 0.75rem';
    chip.style.borderRadius = '999px';
    chip.style.fontSize = '0.875rem';
    chip.style.fontWeight = 'normal';
    chip.style.border = '1px solid var(--tea-border-color)';
    chip.style.backgroundColor = backgroundColor || '#f5f7fa';
    chip.style.color = color || 'var(--tea-text-dark)';
    chip.style.userSelect = 'none';
    chip.style.transition = 'var(--tea-transition-fast)';
    
    // Add icon if provided
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'tea-chip-icon';
      iconEl.innerHTML = icon;
      iconEl.style.marginRight = '0.5rem';
      iconEl.style.display = 'flex';
      iconEl.style.alignItems = 'center';
      chip.appendChild(iconEl);
    }
    
    // Add text
    const textEl = document.createElement('span');
    textEl.className = 'tea-chip-text';
    textEl.textContent = text;
    chip.appendChild(textEl);
    
    // Add close button if closable
    if (closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tea-chip-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.style.marginLeft = '0.5rem';
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.padding = '0';
      closeBtn.style.fontSize = '1.2rem';
      closeBtn.style.lineHeight = '1';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.color = 'currentColor';
      closeBtn.style.opacity = '0.7';
      
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.7';
      });
      
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onClose) {
          onClose(e);
        } else {
          // Remove the chip from the DOM if no onClose handler is provided
          chip.remove();
        }
      });
      
      chip.appendChild(closeBtn);
    }
    
    // Add click handler
    if (onClick) {
      chip.style.cursor = 'pointer';
      
      chip.addEventListener('mouseenter', () => {
        chip.style.boxShadow = 'var(--tea-shadow-small)';
        chip.style.transform = 'translateY(-1px)';
      });
      
      chip.addEventListener('mouseleave', () => {
        chip.style.boxShadow = 'none';
        chip.style.transform = 'translateY(0)';
      });
      
      chip.addEventListener('click', onClick);
    }
    
    return chip;
  }
  
  /**
   * Create a progress bar
   * @param {Object} options - Progress bar configuration
   * @returns {HTMLDivElement} - The progress bar element
   */
  createProgressBar(options = {}) {
    const {
      value = 0,
      max = 100,
      height = '8px',
      color = null,
      backgroundColor = null,
      showPercentage = false,
      animated = false,
      striped = false,
      className = ''
    } = options;
    
    // Ensure progress animation keyframes exist
    this._ensureProgressAnimationStyles();
    
    const container = document.createElement('div');
    container.className = `tea-progress-container ${className}`;
    
    // Apply container styles
    container.style.width = '100%';
    container.style.marginBottom = showPercentage ? '1.5rem' : '0';
    container.style.position = 'relative';
    
    // Progress track
    const track = document.createElement('div');
    track.className = 'tea-progress-track';
    track.style.width = '100%';
    track.style.height = height;
    track.style.backgroundColor = backgroundColor || '#e0e0e0';
    track.style.borderRadius = '999px';
    track.style.overflow = 'hidden';
    
    // Progress bar
    const bar = document.createElement('div');
    bar.className = 'tea-progress-bar';
    
    // Calculate percentage
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    // Apply bar styles
    bar.style.width = `${percentage}%`;
    bar.style.height = '100%';
    bar.style.backgroundColor = color || 'var(--tea-primary)';
    bar.style.borderRadius = '999px';
    bar.style.transition = 'width 0.3s ease';
    
    // Striped pattern
    if (striped) {
      bar.style.backgroundImage = `linear-gradient(45deg, 
        rgba(255, 255, 255, 0.15) 25%, 
        transparent 25%, 
        transparent 50%, 
        rgba(255, 255, 255, 0.15) 50%, 
        rgba(255, 255, 255, 0.15) 75%, 
        transparent 75%, 
        transparent)`;
      bar.style.backgroundSize = '40px 40px';
    }
    
    // Animation
    if (animated && striped) {
      bar.style.animation = 'tea-progress-animate 1s linear infinite';
    }
    
    track.appendChild(bar);
    container.appendChild(track);
    
    // Percentage label
    if (showPercentage) {
      const label = document.createElement('div');
      label.className = 'tea-progress-label';
      label.textContent = `${Math.round(percentage)}%`;
      label.style.position = 'absolute';
      label.style.bottom = '-1.5rem';
      label.style.right = '0';
      label.style.fontSize = '0.875rem';
      label.style.color = 'var(--tea-text-medium)';
      container.appendChild(label);
    }
    
    return container;
  }
  
  /**
   * Ensure progress animation keyframes exist
   * @private
   */
  _ensureProgressAnimationStyles() {
    if (!document.getElementById(this._progressAnimationId)) {
      const keyframes = document.createElement('style');
      keyframes.id = this._progressAnimationId;
      keyframes.textContent = `
        @keyframes tea-progress-animate {
          0% { background-position: 40px 0; }
          100% { background-position: 0 0; }
        }
      `;
      document.head.appendChild(keyframes);
    }
  }
}

// Export a singleton instance
const teaUI = new TeaUI();
export default teaUI;// js/components/ui/tea-ui.js - Fixed Version
