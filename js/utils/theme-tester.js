// js/utils/theme-tester.js

import themeColorManager from './theme-color-manager.js';

class ThemeTester {
  constructor() {
    this.testerId = 'theme-color-tester';
    this.categories = [
      'Black',
      'Green',
      'Oolong',
      'White',
      'Herbal',
      'Pu-erh'
    ];
    this.isVisible = false;
    this.isImmersiveMode = false;
  }

  /**
   * Create and show the theme tester UI
   */
  show() {
    // Create tester if it doesn't exist
    if (!document.getElementById(this.testerId)) {
      this.createTesterUI();
    }
    
    const tester = document.getElementById(this.testerId);
    if (tester) {
      tester.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide the theme tester UI
   */
  hide() {
    const tester = document.getElementById(this.testerId);
    if (tester) {
      tester.style.display = 'none';
      
      // Reset theme when hiding
      themeColorManager.resetThemeColor();
      document.body.classList.remove('immersive-mode');
      this.isVisible = false;
    }
  }

  /**
   * Toggle visibility of the theme tester
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Create the UI for testing theme colors
   */
  createTesterUI() {
    // Create tester container
    const tester = document.createElement('div');
    tester.id = this.testerId;
    tester.className = 'theme-tester';

    // Create header
    const header = document.createElement('div');
    header.className = 'tester-header';
    header.innerHTML = `
      <h2>Theme Color Tester</h2>
      <button id="close-tester" class="tester-close-btn">&times;</button>
    `;
    tester.appendChild(header);

    // Create color buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'tester-buttons';
    
    // Add default button
    const defaultButton = document.createElement('button');
    defaultButton.textContent = 'Default Theme';
    defaultButton.className = 'tester-button default-button';
    defaultButton.addEventListener('click', () => {
      themeColorManager.resetThemeColor();
      document.body.classList.remove('immersive-mode');
      this.updateButtonsState('default');
    });
    buttonsContainer.appendChild(defaultButton);
    
    // Add category buttons
    this.categories.forEach(category => {
      const button = document.createElement('button');
      button.textContent = category;
      button.className = 'tester-button';
      button.dataset.category = category;
      button.style.backgroundColor = themeColorManager.getColorForCategory(category);
      button.style.color = themeColorManager.isColorLight(themeColorManager.getColorForCategory(category)) ? '#333' : '#fff';
      
      button.addEventListener('click', () => {
        themeColorManager.applyThemeColorForCategory(category);
        
        // Apply immersive mode if toggled
        if (this.isImmersiveMode) {
          document.body.classList.add('immersive-mode');
        } else {
          document.body.classList.remove('immersive-mode');
        }
        
        this.updateButtonsState(category);
      });
      
      buttonsContainer.appendChild(button);
    });
    
    tester.appendChild(buttonsContainer);

    // Add immersive mode toggle
    const immersiveContainer = document.createElement('div');
    immersiveContainer.className = 'tester-option';
    
    const immersiveToggle = document.createElement('label');
    immersiveToggle.className = 'toggle-switch';
    immersiveToggle.innerHTML = `
      <input type="checkbox" id="immersive-toggle">
      <span class="toggle-slider"></span>
    `;
    
    const immersiveLabel = document.createElement('span');
    immersiveLabel.textContent = 'Immersive Mode';
    
    immersiveContainer.appendChild(immersiveToggle);
    immersiveContainer.appendChild(immersiveLabel);
    tester.appendChild(immersiveContainer);

    // Add scroll test section
    const scrollTestContainer = document.createElement('div');
    scrollTestContainer.className = 'tester-option';
    
    const scrollTestBtn = document.createElement('button');
    scrollTestBtn.textContent = 'Test Scroll Transition';
    scrollTestBtn.className = 'scroll-test-btn';
    
    scrollTestContainer.appendChild(scrollTestBtn);
    tester.appendChild(scrollTestContainer);

    // Add styles for the tester
    const style = document.createElement('style');
    style.textContent = `
      .theme-tester {
        position: fixed;
        bottom: 80px;
        right: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        width: 300px;
        max-width: 90vw;
        z-index: 1000;
        overflow: hidden;
        display: none;
      }
      
      .tester-header {
        padding: 10px 15px;
        background-color: #f5f5f5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ddd;
      }
      
      .tester-header h2 {
        margin: 0;
        font-size: 18px;
      }
      
      .tester-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .tester-buttons {
        padding: 15px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      
      .tester-button {
        padding: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s ease;
      }
      
      .tester-button.active {
        transform: scale(0.95);
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
      }
      
      .default-button {
        background-color: #f5f5f5;
        color: #333;
        grid-column: span 2;
      }
      
      .tester-option {
        padding: 10px 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-top: 1px solid #eee;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .toggle-switch input {
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
        border-radius: 24px;
        transition: .4s;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        border-radius: 50%;
        transition: .4s;
      }
      
      input:checked + .toggle-slider {
        background-color: #4a90e2;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }
      
      .scroll-test-btn {
        width: 100%;
        padding: 10px;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      
      /* For scroll test */
      .scroll-test-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1001;
        overflow: auto;
        display: none;
      }
      
      .scroll-test-header {
        height: 300px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }
      
      .scroll-test-content {
        background-color: white;
        min-height: 1000px;
        padding: 20px;
      }
      
      .scroll-test-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(tester);

    // Add event listeners
    document.getElementById('close-tester').addEventListener('click', () => {
      this.hide();
    });
    
    document.getElementById('immersive-toggle').addEventListener('change', (e) => {
      this.isImmersiveMode = e.target.checked;
      
      if (this.isImmersiveMode) {
        document.body.classList.add('immersive-mode');
      } else {
        document.body.classList.remove('immersive-mode');
      }
    });
    
    document.querySelector('.scroll-test-btn').addEventListener('click', () => {
      this.showScrollTest();
    });
  }

  /**
   * Update the active state of theme buttons
   * @param {string} activeCategory - The currently active category
   */
  updateButtonsState(activeCategory) {
    const buttons = document.querySelectorAll('.tester-button');
    buttons.forEach(button => {
      if ((button.dataset.category === activeCategory) || 
          (activeCategory === 'default' && !button.dataset.category)) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  /**
   * Show the scroll test interface
   */
  showScrollTest() {
    // Create scroll test container if it doesn't exist
    let scrollTest = document.querySelector('.scroll-test-container');
    
    if (!scrollTest) {
      scrollTest = document.createElement('div');
      scrollTest.className = 'scroll-test-container';
      
      const currentCategory = document.querySelector('.tester-button.active')?.dataset.category;
      const categoryColor = currentCategory ? 
        themeColorManager.getColorForCategory(currentCategory) : 
        '#4a90e2';
      
      scrollTest.innerHTML = `
        <div class="scroll-test-header" style="background-color: ${categoryColor}">
          <h1 style="color: ${themeColorManager.isColorLight(categoryColor) ? '#333' : '#fff'}">
            Scroll Down To Test
          </h1>
          <button class="scroll-test-close">Close</button>
        </div>
        <div class="scroll-test-content">
          <h2>Scroll Test Content</h2>
          <p>Scroll up and down to see how the header color transitions.</p>
          ${Array(10).fill('<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nisl nisl aliquam nisl, eget aliquam nisl nisl eget.</p>').join('')}
        </div>
      `;
      
      document.body.appendChild(scrollTest);
      
      // Add event listener for close button
      scrollTest.querySelector('.scroll-test-close').addEventListener('click', () => {
        scrollTest.style.display = 'none';
        themeColorManager.removeScrollColorTransition();
      });
    }
    
    // Show scroll test
    scrollTest.style.display = 'block';
    
    // Set up scroll color transition
    const currentCategory = document.querySelector('.tester-button.active')?.dataset.category;
    const headerColor = currentCategory ? 
      themeColorManager.getColorForCategory(currentCategory) : 
      '#4a90e2';
    
    themeColorManager.setupScrollColorTransition(() => {
      const scrollY = window.scrollY;
      if (scrollY > 100) {
        // Full color
        return headerColor;
      } else if (scrollY > 10) {
        // Semi-transparent
        const alpha = Math.min(scrollY / 100, 0.9);
        const hex = headerColor.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        // Transparent
        return 'transparent';
      }
    });
  }
}

// Create and export the ThemeTester instance
const themeTester = new ThemeTester();
export default themeTester;
