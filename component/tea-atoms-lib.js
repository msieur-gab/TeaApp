import ColorUtility from './color-utility.js';

// Tea-Inspired Atoms Library
class TeaAtoms {
  /**
   * Create a select menu component
   * @param {Object} palette - Color palette object
   * @returns {HTMLSelectElement} Styled select element
   */
  static createSelectMenu(palette) {
    const select = document.createElement('select');
    select.classList.add('tea-select');

    // Create options from palette
    Object.entries(palette).forEach(([teaName, color]) => {
      const option = document.createElement('option');
      option.value = teaName;
      option.textContent = teaName;
      
      // Set custom color for option
      // option.style.backgroundColor = color;
      // option.style.color = ColorUtility.getOptimalTextColor(color);
      
      select.appendChild(option);
    });

    // Apply dynamic styling
    select.style.cssText = `
       padding: 8px 12px;
      border: 2px solid var(--primary-color);
      border-radius: 4px;
      color: var(--text-color);
      transition: all 0.3s ease;
      width: 100%;
      background-color: transparent;
    `;

    return select;
  }

  

  /**
   * Create a text input component
   * @param {object} options - Input configuration
   * @returns {HTMLInputElement} Styled input element
   */
  static createTextInput(options = {}) {
    const input = document.createElement('input');
    input.type = options.type || 'text';
    input.placeholder = options.placeholder || '';
    input.classList.add('tea-input');
    
    // Apply dynamic styling
    input.style.cssText = `
      padding: 8px 12px;
      border: 2px solid var(--primary-color);
      border-radius: 4px;
      // background-color: var(--button-background);
      color: var(--text-color);
      transition: all 0.3s ease;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--primary-color)';
      input.style.boxShadow = '0 0 5px rgba(0,0,0,0.1)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = 'var(--primary-color)';
      input.style.boxShadow = 'none';
    });

    return input;
  }

  /**
   * Create a toggle switch
   * @param {object} options - Toggle configuration
   * @returns {HTMLDivElement} Styled toggle element
   */
/**
   * Create a toggle switch
   * @param {object} options - Toggle configuration
   * @returns {HTMLDivElement} Styled toggle element
   */
/**
 * Create an improved toggle switch with better visual state indication
 * @param {object} options - Toggle configuration
 * @returns {HTMLLabelElement} Styled toggle element
 */
static createToggle(options = {}) {
  const container = document.createElement('label');
  container.classList.add('tea-toggle');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = options.checked || false;
  input.classList.add('tea-toggle-input');

  const slider = document.createElement('span');
  slider.classList.add('tea-toggle-slider');

  // Apply dynamic styling
  container.style.cssText = `
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
    cursor: pointer;
  `;

  input.style.cssText = `
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  `;

  // Default inactive state background is light gray
  const inactiveBackground = 'rgba(200, 200, 200, 0.5)';
  
  slider.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${inactiveBackground};
    border-radius: 34px;
    transition: .4s;
  `;

  // Add the knob using ::before in the slider with enhanced styling
  slider.innerHTML = `<style>
    .tea-toggle-slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      border-radius: 50%;
      transition: .4s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .tea-toggle-input:checked + .tea-toggle-slider {
      background-color: var(--primary-color);
    }
    
    .tea-toggle-input:checked + .tea-toggle-slider:before {
      transform: translateX(26px);
      background-color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    .tea-toggle-input:focus + .tea-toggle-slider {
      box-shadow: 0 0 1px var(--primary-color);
    }
    
    /* Hover effects */
    .tea-toggle:hover .tea-toggle-slider:before {
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .tea-toggle:hover .tea-toggle-input:checked + .tea-toggle-slider {
      background-color: var(--primary-color);
      opacity: 0.9;
    }
    
    .tea-toggle:hover .tea-toggle-input:not(:checked) + .tea-toggle-slider {
      background-color: rgba(180, 180, 180, 0.6);
    }
  </style>`;

  container.appendChild(input);
  container.appendChild(slider);

  // Update toggle appearance based on initial state
  if (input.checked) {
    slider.style.backgroundColor = 'var(--primary-color)';
  } else {
    slider.style.backgroundColor = inactiveBackground;
  }

  // Add event listener for state changes
  input.addEventListener('change', () => {
    if (input.checked) {
      slider.style.backgroundColor = 'var(--primary-color)';
    } else {
      slider.style.backgroundColor = inactiveBackground;
    }
    
    // Call the onChange callback if provided
    if (options.onChange) {
      options.onChange(input.checked);
    }
  });

  // Expose methods for changing programmatically
  container.setValue = (value) => {
    input.checked = value;
    // Also update styling
    if (value) {
      slider.style.backgroundColor = 'var(--primary-color)';
    } else {
      slider.style.backgroundColor = inactiveBackground;
    }
  };
  
  container.getValue = () => input.checked;

  return container;
}

  /**
   * Create a chip component
   * @param {string} text - Chip text
   * @returns {HTMLDivElement} Styled chip element
   */
  static createChip(text) {
    const chip = document.createElement('div');
    chip.textContent = text;
    chip.classList.add('tea-chip');

    chip.style.cssText = `
      display: inline-block;
      padding: 6px 12px;
      margin: 4px;
      border-radius: 16px;
      background-color: var(--chip-background);
      color: var(--text-color);
      font-size: 0.9em;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid var(--primary-color);
    `;

    chip.addEventListener('mouseenter', () => {
      chip.style.opacity = '0.8';
    });

    chip.addEventListener('mouseleave', () => {
      chip.style.opacity = '1';
    });

    return chip;
  }

  /**
   * Create a progress bar
   * @param {number} progress - Progress percentage (0-100)
   * @returns {HTMLDivElement} Styled progress bar
   */
  static createProgressBar(progress = 0) {
    const container = document.createElement('div');
    container.classList.add('tea-progress');

    const bar = document.createElement('div');

    container.style.cssText = `
      width: 100%;
      height: 20px;
      background-color: var(--button-background);
      border-radius: 10px;
      overflow: hidden;
    `;

    bar.style.cssText = `
      width: ${progress}%;
      height: 100%;
      background-color: var(--primary-color);
      transition: width 0.5s ease;
    `;

    container.appendChild(bar);
    return container;
  }

  // Badge component for displaying tea categories or tags
static createBadge(text, color) {
  const badge = document.createElement('span');
  badge.textContent = text;
  badge.classList.add('tea-badge');
  
  badge.style.cssText = `
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    background-color: ${color || 'var(--primary-color)'};
    color: var(--text-color);
    font-size: 0.8em;
    font-weight: bold;
  `;
  
  return badge;
}

// IconButton for minimal UI controls
static createIconButton(iconName, label = '') {
  const button = document.createElement('button');
  button.classList.add('tea-icon-button');
  button.setAttribute('aria-label', label);
  
  // Using a simple text character as icon for demonstration
  // You could replace this with SVG or font icons
  button.textContent = iconName;
  
  button.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--button-background);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  return button;
}

/**
 * Create a search input component
 * @param {object} options - Search input configuration
 * @returns {HTMLDivElement} Styled search input container
 */
static createSearchInput(options = {}) {
  const container = document.createElement('div');
  container.classList.add('tea-search-container');
  
  const searchIcon = document.createElement('div');
  searchIcon.classList.add('tea-search-icon');
  searchIcon.innerHTML = '🔍'; // Simple search icon, could be replaced with SVG
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = options.placeholder || 'Search...';
  input.classList.add('tea-search-input');
  
  const clearButton = document.createElement('button');
  clearButton.classList.add('tea-search-clear');
  clearButton.innerHTML = '×';
  clearButton.style.display = 'none';
  
  // Apply styles
  container.style.cssText = `
    display: flex;
    align-items: center;
    position: relative;
    width: ${options.width || '100%'};
    max-width: ${options.maxWidth || '500px'};
    background-color: var(--button-background, rgba(255, 255, 255, 0.2));
    border-radius: 24px;
    padding: 8px 16px;
    transition: all 0.3s ease;
    border: 1px solid var(--primary-color, #7B9070);
  `;
  
  searchIcon.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    margin-right: 8px;
    color: var(--text-color, #333);
    opacity: 0.7;
  `;
  
  input.style.cssText = `
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 0;
    color: var(--text-color, #333);
    font-size: 1rem;
    outline: none;
  `;
  
  clearButton.style.cssText = `
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--text-color, #333);
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transition: all 0.2s ease;
  `;
  
  // Add event listeners
  input.addEventListener('input', () => {
    // Show/hide clear button based on input
    clearButton.style.display = input.value ? 'flex' : 'none';
    
    // Call the onInput callback if provided
    if (options.onInput) {
      options.onInput(input.value);
    }
  });
  
  input.addEventListener('focus', () => {
    container.style.boxShadow = '0 0 0 2px var(--primary-color, #7B9070)';
    
    if (options.onFocus) {
      options.onFocus();
    }
  });
  
  input.addEventListener('blur', () => {
    container.style.boxShadow = 'none';
    
    if (options.onBlur) {
      options.onBlur();
    }
  });
  
  clearButton.addEventListener('click', () => {
    input.value = '';
    clearButton.style.display = 'none';
    input.focus();
    
    if (options.onClear) {
      options.onClear();
    }
    
    // Also trigger the onInput callback with empty value
    if (options.onInput) {
      options.onInput('');
    }
  });
  
  // Add elements to container
  container.appendChild(searchIcon);
  container.appendChild(input);
  container.appendChild(clearButton);
  
  // Expose methods for programmatic control
  container.getValue = () => input.value;
  container.setValue = (value) => {
    input.value = value;
    clearButton.style.display = value ? 'flex' : 'none';
  };
  container.focus = () => input.focus();
  container.clear = () => {
    input.value = '';
    clearButton.style.display = 'none';
    
    if (options.onClear) {
      options.onClear();
    }
    
    if (options.onInput) {
      options.onInput('');
    }
  };
  
  return container;
}
  /**
   * Create a radio group
   * @param {string[]} options - Radio button options
   * @returns {HTMLDivElement} Styled radio group
   */
  static createRadioGroup(options) {
    const container = document.createElement('div');
    container.classList.add('tea-radio-group');

    options.forEach(optionText => {
      const radioWrapper = document.createElement('div');
      const radio = document.createElement('input');
      const label = document.createElement('label');

      radio.type = 'radio';
      radio.name = 'tea-radio-group';
      radio.value = optionText.toLowerCase();
      radio.id = `radio-${optionText.toLowerCase()}`;

      label.htmlFor = radio.id;
      label.textContent = optionText;

      radioWrapper.style.cssText = `
        display: flex;
        align-items: center;
        margin: 8px 0;
      `;

      radio.style.cssText = `
        margin-right: 8px;
        accent-color: var(--primary-color);
      `;

      label.style.cssText = `
        color: var(--text-color);
      `;

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      container.appendChild(radioWrapper);
    });

    return container;
  }

  /**
   * Create a checkbox
   * @param {string} label - Checkbox label
   * @returns {HTMLDivElement} Styled checkbox
   */
  static createCheckbox(label) {
    const container = document.createElement('div');
    const checkbox = document.createElement('input');
    const labelElement = document.createElement('label');

    checkbox.type = 'checkbox';
    checkbox.id = `tea-checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;

    labelElement.htmlFor = checkbox.id;
    labelElement.textContent = label;

    container.style.cssText = `
      display: flex;
      align-items: center;
      margin: 8px 0;
    `;

    checkbox.style.cssText = `
      margin-right: 8px;
      accent-color: var(--primary-color);
    `;

    labelElement.style.cssText = `
      color: var(--text-color);
    `;

    container.appendChild(checkbox);
    container.appendChild(labelElement);

    return container;
  }
}

export default TeaAtoms;
