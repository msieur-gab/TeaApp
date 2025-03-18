// js/utils/theme-color-manager.js

class ThemeColorManager {
  constructor() {
    this.defaultThemeColor = '#ffffff';
    this.defaultTextColor = '#333333';
    this.currentThemeColor = this.defaultThemeColor;
    this.colorMap = {
      'Black': '#654321',    // Dark brown
      'Green': '#5cb85c',    // Green
      'Oolong': '#f0ad4e',   // Amber
      'White': '#f8f9fa',    // Light gray
      'Herbal': '#9370db',   // Purple
      'Pu-erh': '#8b4513'    // Saddle brown
    };

    // Create CSS variables
    this.initCSSVariables();
  }

  /**
   * Initialize CSS variables in the document
   */
  initCSSVariables() {
    // Create a style element if not exists
    let styleElement = document.getElementById('theme-color-variables');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'theme-color-variables';
      document.head.appendChild(styleElement);
    }

    // Set default values
    this.updateCSSVariables(this.defaultThemeColor);
  }

  /**
   * Get the color associated with a tea category
   * @param {string} category - The tea category
   * @return {string} The hex color code
   */
  getColorForCategory(category) {
    return this.colorMap[category] || this.defaultThemeColor;
  }

  /**
   * Update meta tags and CSS variables with the new theme color
   * @param {string} color - Hex color code
   */
  updateThemeColor(color) {
    // Store current color
    this.currentThemeColor = color;

    // Update theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
    
    // Update Apple-specific meta tag
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      // For colors that are light, use black text, otherwise use default
      const isLightColor = this.isColorLight(color);
      appleStatusBar.content = isLightColor ? 'black' : 'black-translucent';
    }

    // Update CSS variables
    this.updateCSSVariables(color);
    
    // Apply color to document root for navigation bar in PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone) {
      document.documentElement.style.backgroundColor = color;
    }
  }

  /**
   * Reset theme color to default
   */
  resetThemeColor() {
    this.updateThemeColor(this.defaultThemeColor);
  }

  /**
   * Apply theme color based on a tea category
   * @param {string} category - The tea category
   */
  applyThemeColorForCategory(category) {
    const color = this.getColorForCategory(category);
    this.updateThemeColor(color);
  }

  /**
   * Update CSS variables used for styling
   * @param {string} color - Hex color code
   */
  updateCSSVariables(color) {
    const isLight = this.isColorLight(color);
    const textColor = isLight ? '#333333' : '#ffffff';
    
    const styleElement = document.getElementById('theme-color-variables');
    if (styleElement) {
      styleElement.textContent = `
        :root {
          --app-bar-color: ${color};
          --text-on-app-bar: ${textColor};
          --app-bar-shadow: 0 2px 4px ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)'};
        }
        
        @media (display-mode: standalone) {
          html, body {
            background-color: ${color};
          }
        }
      `;
    }
  }

  /**
   * Determine if a color is light or dark
   * @param {string} hexColor - Hex color code
   * @return {boolean} True if the color is light
   */
  isColorLight(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) || 0;
    const g = parseInt(hex.substr(2, 2), 16) || 0;
    const b = parseInt(hex.substr(4, 2), 16) || 0;
    
    // Calculate perceived brightness (YIQ equation)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  /**
   * Sets up the app to handle color transitions on scroll
   * Useful for detail views where the header should change color on scroll
   * @param {Function} getColorCallback - Function that returns the color based on scroll position
   */
  setupScrollColorTransition(getColorCallback) {
    // Remove any existing scroll listener
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }

    // Create new scroll listener
    this.scrollListener = () => {
      const color = getColorCallback();
      if (color !== this.currentThemeColor) {
        this.updateThemeColor(color);
      }
    };

    window.addEventListener('scroll', this.scrollListener);
  }

  /**
   * Removes scroll color transition listener
   */
  removeScrollColorTransition() {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  /**
   * Make the status bar transparent for immersive content
   * Content will flow underneath the status bar
   */
  setTransparentStatusBar() {
    // Set transparent status bar for iOS
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      appleStatusBar.content = 'black-translucent';
    }
    
    // Set transparent status bar for Android
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = 'transparent';
    }
    
    // Add CSS class to body for proper padding/layout
    document.body.classList.add('transparent-status-bar');
  }

  /**
   * Reset status bar to its default color
   * @param {string} color - Color to reset to
   */
  resetStatusBar(color = this.defaultThemeColor) {
    // Reset iOS status bar
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      appleStatusBar.content = this.isColorLight(color) ? 'black' : 'black-translucent';
    }
    
    // Reset Android status bar
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = color;
    }
    
    // Remove CSS class from body
    document.body.classList.remove('transparent-status-bar');
  }
}

// Create and export a singleton instance
const themeColorManager = new ThemeColorManager();
export default themeColorManager;
