// Color Utility for contrast and color manipulation
class ColorUtility {
  /**
   * Calculate optimal text color based on background
   * @param {string} backgroundColor - Background color in hex
   * @returns {string} Optimal text color (black or white)
   */
  static getOptimalTextColor(backgroundColor) {
    // Remove # if present
    backgroundColor = backgroundColor.replace(/^#/, '');
    
    // Convert hex to RGB
    const r = parseInt(backgroundColor.substr(0, 2), 16);
    const g = parseInt(backgroundColor.substr(2, 2), 16);
    const b = parseInt(backgroundColor.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.2 ? '#000000' : '#FFFFFF';
  }
}

// Authentic Tea Color Palette
const TeaColorPalette = {
  'green': '#7B9070',     // Wild Sage
  'yellow': '#D1CDA6',    // Coriander Seeds
  'white': '#D8DCD5',     // Crescent Moon
  'wulong': '#C09565',    // Translucent Amber
  'black': '#A56256',     // Rustic Terracotta
  'puer': '#6F5244'       // Powder Chocolate
};
// Theme generator based on tea colors
class TeaThemeGenerator {
  /**
   * Generate theme based on tea color
   * @param {string} teaType - Type of tea
   * @returns {object} Theme configuration
   */
  static generateTheme(teaType) {
    const baseColor = TeaColorPalette[teaType] || TeaColorPalette.green;
    
    return {
      primary: baseColor,
      background: baseColor,
      text: ColorUtility.getOptimalTextColor(baseColor)
    };
  }

  /**
   * Apply theme to document
   * @param {string} teaType - Type of tea
   */
  static applyTheme(teaType) {
    const theme = this.generateTheme(teaType);
    const root = document.documentElement;

    // Set CSS variables
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--background-color', theme.background);
    root.style.setProperty('--text-color', theme.text);
  }
}

export { TeaColorPalette, TeaThemeGenerator, ColorUtility };
