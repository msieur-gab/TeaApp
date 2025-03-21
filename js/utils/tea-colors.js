// js/utils/tea-colors.js - Fixed Version

/**
 * Tea Colors Utility
 * Manages consistent color palette for tea categories throughout the application
 */

class TeaColors {
  constructor() {
    // Primary tea category colors
    this.categoryColors = {
      'Green': '#7B9070',   // Wild Sage
      'Yellow': '#D1CDA6',  // Coriander Seeds
      'White': '#D8DCD5',   // Crescent Moon
      'Oolong': '#C09565',  // Translucent Amber
      'Black': '#A56256',   // Rustic Terracotta
      'Pu-erh': '#6F5244',  // Powder Chocolate
      'Herbal': '#9370db',  // Existing herbal color (purple)
      'Default': '#4a90e2'  // Default blue for uncategorized teas
    };
    
    // Set up the style element ID for CSS variables
    this._styleId = 'tea-colors-css-variables';
    
    // Create the CSS variables in :root when instantiated
    this._injectCSSVariables();
  }
  
  /**
   * Get the color for a specific tea category
   * @param {string} category - The tea category
   * @param {number} opacity - Optional opacity (0-1)
   * @return {string} - CSS color value
   */
  getColor(category, opacity = 1) {
    const normalizedCategory = this._normalizeCategory(category);
    const baseColor = this.categoryColors[normalizedCategory] || this.categoryColors.Default;
    
    if (opacity < 1) {
      return this.hexToRgba(baseColor, opacity);
    }
    
    return baseColor;
  }
  
  /**
   * Get color variations for a category (lighter and darker shades)
   * @param {string} category - The tea category
   * @return {Object} - Object with light, main, and dark variations
   */
  getColorVariations(category) {
    const normalizedCategory = this._normalizeCategory(category);
    const baseColor = this.categoryColors[normalizedCategory] || this.categoryColors.Default;
    
    return {
      lighter: this._lightenColor(baseColor, 20),
      light: this._lightenColor(baseColor, 10),
      main: baseColor,
      dark: this._darkenColor(baseColor, 10),
      darker: this._darkenColor(baseColor, 20)
    };
  }
  
  /**
   * Get a suitable text color (black or white) based on the background color
   * @param {string} category - The tea category
   * @return {string} - Either '#000000' or '#ffffff'
   */
  getTextColor(category) {
    const normalizedCategory = this._normalizeCategory(category);
    const bgColor = this.categoryColors[normalizedCategory] || this.categoryColors.Default;
    
    // Convert to RGB to calculate luminance
    return this._isLightColor(bgColor) ? '#000000' : '#ffffff';
  }
  
  /**
   * Get the CSS gradient string for a category
   * @param {string} category - The tea category
   * @param {string} direction - Gradient direction (default: 'to bottom')
   * @return {string} - CSS gradient value
   */
  getGradient(category, direction = 'to bottom') {
    const normalizedCategory = this._normalizeCategory(category);
    const colors = this.getColorVariations(normalizedCategory);
    
    return `linear-gradient(${direction}, ${colors.light} 0%, ${colors.main} 50%, ${colors.dark} 100%)`;
  }
  
  /**
   * Generate CSS for a category dot used in UI elements
   * @param {string} category - The tea category
   * @return {Object} - Object with backgroundColor and borderColor
   */
  getCategoryDotStyle(category) {
    const normalizedCategory = this._normalizeCategory(category);
    const color = this.categoryColors[normalizedCategory] || this.categoryColors.Default;
    
    // For very light colors, add a border
    const needsBorder = this._isLightColor(color);
    
    return {
      backgroundColor: color,
      border: needsBorder ? '1px solid #ddd' : 'none'
    };
  }
  
  /**
   * Normalize category name to match keys in our color map
   * @private
   */
  _normalizeCategory(category) {
    if (!category) return 'Default';
    
    // Handle special cases
    if (category.toLowerCase() === 'pu-erh' || category.toLowerCase() === 'puerh') {
      return 'Pu-erh';
    }
    
    // Check exact match first
    if (this.categoryColors[category]) {
      return category;
    }
    
    // Try capitalizing first letter
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
    if (this.categoryColors[capitalized]) {
      return capitalized;
    }
    
    return 'Default';
  }
  
  /**
   * Check if a color is considered "light" based on luminance
   * @private
   */
  _isLightColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
  }
  
  /**
   * Convert hex color to rgba format
   * @param {string} hex - Hex color code
   * @param {number} opacity - Opacity value (0-1)
   * @returns {string} - RGBA color value
   */
  hexToRgba(hex, opacity) {
    if (!hex || typeof hex !== 'string') {
      return `rgba(0, 0, 0, ${opacity})`;
    }
    
    hex = hex.replace('#', '');
    
    // Handle shorthand hex (e.g., #fff)
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    // Validate hex value
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn('Invalid hex color:', hex);
      return `rgba(0, 0, 0, ${opacity})`;
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  /**
   * Lighten a hex color by a percentage
   * @private
   */
  _lightenColor(hex, percent) {
    try {
      // Convert to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Lighten each component
      const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
      const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
      const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
      
      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.warn('Error lightening color:', error);
      return hex;
    }
  }
  
  /**
   * Darken a hex color by a percentage
   * @private
   */
  _darkenColor(hex, percent) {
    try {
      // Convert to RGB
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      // Darken each component
      const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
      const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
      const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));
      
      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.warn('Error darkening color:', error);
      return hex;
    }
  }
  
  /**
   * Inject CSS variables into the document for global access
   * @private
   */
  _injectCSSVariables() {
    if (typeof document === 'undefined') return;
    
    // Check if styles already exist
    let styleEl = document.getElementById(this._styleId);
    
    // Create the style element if it doesn't exist
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = this._styleId;
      document.head.appendChild(styleEl);
    }
    
    let cssVars = ':root {\n';
    
    // Add base category colors
    Object.entries(this.categoryColors).forEach(([category, color]) => {
      const catKey = category.toLowerCase();
      cssVars += `  --tea-${catKey}: ${color};\n`;
    });
    
    // Add variations for each category
    Object.entries(this.categoryColors).forEach(([category, color]) => {
      const variations = this.getColorVariations(category);
      const catKey = category.toLowerCase();
      
      cssVars += `  --tea-${catKey}-lighter: ${variations.lighter};\n`;
      cssVars += `  --tea-${catKey}-light: ${variations.light};\n`;
      cssVars += `  --tea-${catKey}-dark: ${variations.dark};\n`;
      cssVars += `  --tea-${catKey}-darker: ${variations.darker};\n`;
      
      // Also add text color
      const textColor = this.getTextColor(category);
      cssVars += `  --tea-${catKey}-text: ${textColor};\n`;
    });
    
    cssVars += '}';
    
    // Update the style element content
    styleEl.textContent = cssVars;
  }
  
  /**
   * Get a color scheme for a specific tea category
   * This returns an object with all color variations and text colors
   * @param {string} category - The tea category
   * @return {Object} - Complete color scheme object
   */
  getColorScheme(category) {
    const normalizedCategory = this._normalizeCategory(category);
    const baseColor = this.categoryColors[normalizedCategory] || this.categoryColors.Default;
    const variations = this.getColorVariations(normalizedCategory);
    const textColor = this.getTextColor(normalizedCategory);
    
    return {
      category: normalizedCategory,
      base: baseColor,
      lighter: variations.lighter,
      light: variations.light,
      dark: variations.dark,
      darker: variations.darker,
      text: textColor,
      gradient: this.getGradient(normalizedCategory),
      rgba: (opacity = 1) => this.hexToRgba(baseColor, opacity)
    };
  }
  
  /**
   * Get all category colors as an array of objects
   * Useful for dropdown menus or color pickers
   * @return {Array} - Array of category color objects
   */
  getAllCategoryColors() {
    return Object.entries(this.categoryColors)
      .filter(([category]) => category !== 'Default')
      .map(([category, color]) => ({
        name: category,
        color: color,
        textColor: this.getTextColor(category)
      }));
  }
  
  /**
   * Apply a category color scheme to an element
   * This adds custom properties to the element that can be used in CSS
   * @param {HTMLElement} element - The element to apply colors to
   * @param {string} category - The tea category
   */
  applyColorScheme(element, category) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('Invalid element provided to applyColorScheme');
      return;
    }
    
    const scheme = this.getColorScheme(category);
    
    element.style.setProperty('--category-color', scheme.base);
    element.style.setProperty('--category-lighter', scheme.lighter);
    element.style.setProperty('--category-light', scheme.light);
    element.style.setProperty('--category-dark', scheme.dark);
    element.style.setProperty('--category-darker', scheme.darker);
    element.style.setProperty('--category-text', scheme.text);
    element.dataset.teaCategory = scheme.category;
  }
}

// Export a singleton instance
const teaColors = new TeaColors();
export default teaColors;