/**
 * Color Utility Module
 * Provides advanced color analysis and adaptive styling utilities
 */
class ColorUtility {
  /**
   * Calculate relative luminance of a color
   * @param {number} r - Red channel (0-255)
   * @param {number} g - Green channel (0-255)
   * @param {number} b - Blue channel (0-255)
   * @returns {number} Luminance value
   */
  static calculateLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color code
   * @returns {number[]} RGB values
   */
  static hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Handle 3-digit hex codes
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    const bigint = parseInt(hex, 16);
    return [
      (bigint >> 16) & 255,
      (bigint >> 8) & 255,
      bigint & 255
    ];
  }

  /**
   * Convert hex color to HSL
   * @param {string} hex - Hex color code
   * @returns {Object} HSL color object
   */
  static hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  /**
   * Convert HSL to Hex
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color code
   */
  static hslToHex(h, s, l) {
    // Convert to decimal values
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  /**
   * Convert RGB to Hex
   * @param {number} r - Red channel (0-255)
   * @param {number} g - Green channel (0-255)
   * @param {number} b - Blue channel (0-255)
   * @returns {string} Hex color code
   */
  static rgbToHex(r, g, b) {
    return `#${[r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color in hex
   * @param {string} color2 - Second color in hex
   * @returns {number} Contrast ratio
   */
  static getContrastRatio(color1, color2) {
    const [r1, g1, b1] = this.hexToRgb(color1);
    const [r2, g2, b2] = this.hexToRgb(color2);

    const l1 = this.calculateLuminance(r1, g1, b1);
    const l2 = this.calculateLuminance(r2, g2, b2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Determine optimal text color based on background
   * @param {string} backgroundColor - Background color in hex
   * @param {string} [lightColor='#FFFFFF'] - Light text color
   * @param {string} [darkColor='#000000'] - Dark text color
   * @returns {string} Optimal text color
   */
  static getOptimalTextColor(
    backgroundColor, 
    lightColor = '#FFFFFF', 
    darkColor = '#000000'
  ) {
    // WCAG 2.0 recommends a contrast ratio of at least 4.5:1 for normal text
    const whiteContrast = this.getContrastRatio(backgroundColor, lightColor);
    const blackContrast = this.getContrastRatio(backgroundColor, darkColor);

    return whiteContrast >= 4.5 ? lightColor : darkColor;
  }

  /**
   * Lighten a color by a percentage
   * @param {string} hex - Hex color code
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} Lightened hex color
   */
  static lightenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Convert hex to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    // Calculate lighter values
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Darken a color by a percentage
   * @param {string} hex - Hex color code
   * @param {number} percent - Percentage to darken (0-100)
   * @returns {string} Darkened hex color
   */
  static darkenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Convert hex to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    // Calculate darker values
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

 /**
   * Calculate the complementary color
   * @param {string} hex - Hex color code
   * @returns {string} Complementary color in hex
   */
 static getComplementaryColor(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Invert RGB values
  const complementaryR = 255 - r;
  const complementaryG = 255 - g;
  const complementaryB = 255 - b;

  // Convert back to hex
  return `#${complementaryR.toString(16).padStart(2, '0')}${complementaryG.toString(16).padStart(2, '0')}${complementaryB.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate the analogous colors
 * @param {string} hex - Hex color code
 * @param {number} [angle=30] - Angle of deviation (default 30 degrees)
 * @returns {Object} Analogous colors
 */
static getAnalogousColors(hex, angle = 30) {
  // Convert hex to HSL
  const { h, s, l } = this.hexToHSL(hex);

  // Calculate analogous colors
  const color1 = this.hslToHex((h + angle + 360) % 360, s, l);
  const color2 = this.hslToHex((h - angle + 360) % 360, s, l);

  return {
    primary: hex,
    analogous1: color1,
    analogous2: color2
  };
}
  /**
   * Generate color variants for styling
   * @param {string} baseColor - Base color in hex
   * @returns {object} Color variant object
   */
  static generateColorVariants(baseColor) {
    const contrastColor = this.getOptimalTextColor(baseColor);
    
    return {
      base: baseColor,
      contrastColor,
      background: contrastColor === '#FFFFFF' 
        ? 'rgba(255,255,255,0.1)' 
        : 'rgba(0,0,0,0.05)',
      hover: contrastColor === '#FFFFFF' 
        ? 'rgba(255,255,255,0.2)' 
        : 'rgba(0,0,0,0.1)',
      border: contrastColor === '#FFFFFF' 
        ? 'rgba(255,255,255,0.3)' 
        : 'rgba(0,0,0,0.2)'
    };
  }

  /**
   * Dynamically apply styles to elements based on background color
   * @param {HTMLElement} element - Target element
   * @param {string} backgroundColor - Background color in hex
   */
  static applyAdaptiveStyles(element, backgroundColor) {
    const variants = this.generateColorVariants(backgroundColor);
    
    // Apply text color
    element.style.color = variants.contrastColor;
    
    // Recursively style child elements
    this.styleChildElements(element, variants);
  }

  /**
   * Recursively style child elements
   * @param {HTMLElement} parentElement - Parent element
   * @param {object} variants - Color variants
   */
  static styleChildElements(parentElement, variants) {
    const styleableSelectors = [
      'button', 
      '.btn', 
      '.tag', 
      '.badge', 
      'input', 
      'select', 
      'textarea'
    ];

    styleableSelectors.forEach(selector => {
      const children = parentElement.querySelectorAll(selector);
      children.forEach(child => {
        // Button-like elements
        if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(child.tagName)) {
          child.style.backgroundColor = variants.background;
          child.style.borderColor = variants.border;
          child.style.color = variants.contrastColor;
        }

        // Tag-like elements
        if (child.classList.contains('tag') || child.classList.contains('badge')) {
          child.style.backgroundColor = variants.background;
          child.style.borderColor = variants.border;
          child.style.color = variants.contrastColor;
        }
      });
    });
  }

  /**
   * Create CSS variables for adaptive theming
   * @param {string} baseColor - Base color in hex
   * @returns {object} CSS variable definitions
   */
  static createCSSVariables(baseColor) {
    const variants = this.generateColorVariants(baseColor);
    
    return {
      '--color-base': baseColor,
      '--color-text': variants.contrastColor,
      '--color-background': variants.background,
      '--color-hover': variants.hover,
      '--color-border': variants.border
    };
  }

  /**
   * Apply CSS variables to the root element
   * @param {string} baseColor - Base color in hex
   */
  static applyCSSVariables(baseColor) {
    const variables = this.createCSSVariables(baseColor);
    
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }
}

// Expose as a module
export default ColorUtility;
