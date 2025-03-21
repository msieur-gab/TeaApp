import ColorUtility from './color-utility.js';

// Tea Color Palette
const TeaColorPalette = {
    'Green Tea': '#7B9070',     // Wild Sage
    'Yellow Tea': '#D1CDA6',    // Coriander Seeds
    'White Tea': '#D8DCD5',     // Crescent Moon
    'Wulong Tea': '#C09565',    // Translucent Amber
    'Black Tea': '#A56256',     // Rustic Terracotta
    'Pu\'er Tea': '#6F5244'     // Powder Chocolate
};

/**
 * Tea Theme Generator Service
 * Manages theme application and color transformations
 */
class TeaThemeGenerator {
    /**
     * Apply theme to document
     * @param {string} teaType - Type of tea
     */
    static applyTheme(teaType) {
        const baseColor = TeaColorPalette[teaType];
        const variants = ColorUtility.generateColorVariants(baseColor);
        const root = document.documentElement;

        // Lighten colors for radio and checkbox
        const radioBackground = ColorUtility.lightenColor(baseColor, 20);
        const checkboxBackground = ColorUtility.lightenColor(baseColor, 20);

        // Set CSS variables
        root.style.setProperty('--primary-color', baseColor);
        root.style.setProperty('--background-color', baseColor);
        root.style.setProperty('--text-color', variants.contrastColor);
        root.style.setProperty('--chip-background', variants.background);
        root.style.setProperty('--button-background', variants.background);
        root.style.setProperty('--radio-background', radioBackground);
        root.style.setProperty('--checkbox-background', checkboxBackground);

        // Apply adaptive styles to body
        ColorUtility.applyAdaptiveStyles(document.body, baseColor);
    }

      /**
     * Generate comprehensive color information
     * @param {string} teaType - Type of tea
     * @returns {Object} Comprehensive color details
     */
      static generateColorDetails(teaType) {
        const baseColor = TeaColorPalette[teaType];
        const swatches = this.generateColorSwatches(baseColor);
        
        return {
            baseColor: baseColor,
            swatches: swatches,
            complementary: ColorUtility.getComplementaryColor(baseColor),
            analogous: ColorUtility.getAnalogousColors(baseColor)
        };
    }

    /**
     * Create a detailed color information display
     * @param {string} teaType - Type of tea
     * @returns {HTMLDivElement} Color details display
     */
    static createColorDetailsDisplay(teaType) {
        const colorDetails = this.generateColorDetails(teaType);
        
        const container = document.createElement('div');
        container.classList.add('color-details-container');
        
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 15px;
            border-radius: 8px;
            background-color: rgba(255,255,255,0.7);
        `;

        const title = document.createElement('h3');
        title.textContent = `Color Details (${teaType} Example)`;
        container.appendChild(title);

        // Color variations section
        const createColorSection = (label, color) => {
            const section = document.createElement('div');
            section.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 50px;
                height: 30px;
                background-color: ${color};
                border: 1px solid rgba(0,0,0,0.1);
            `;

            const textElement = document.createElement('span');
            textElement.textContent = `${label} - ${color}`;

            section.appendChild(colorBox);
            section.appendChild(textElement);
            return section;
        };

        // Add base color swatch
        container.appendChild(createColorSection('Base Color', colorDetails.baseColor));

        // Add complementary color
        container.appendChild(createColorSection('Complementary', colorDetails.complementary));

        // Add analogous colors
        container.appendChild(createColorSection('Analogous 1', colorDetails.analogous.analogous1));
        container.appendChild(createColorSection('Analogous 2', colorDetails.analogous.analogous2));

        return container;
    }
    
    /**
     * Generate color swatch variations
     * @param {string} baseColor - Base hex color
     * @returns {Object} Color swatch variations
     */
    static generateColorSwatches(baseColor) {
        return {
            lighter20: ColorUtility.lightenColor(baseColor, 20),
            lighter10: ColorUtility.lightenColor(baseColor, 10),
            main: baseColor,
            dark10: ColorUtility.darkenColor(baseColor, 10),
            dark20: ColorUtility.darkenColor(baseColor, 20)
        };
    }

    /**
     * Create a color swatch display element
     * @param {string} teaType - Type of tea
     * @returns {HTMLDivElement} Color swatch display
     */
    static createColorSwatchDisplay(teaType) {
        const baseColor = TeaColorPalette[teaType];
        const swatches = this.generateColorSwatches(baseColor);
        
        const container = document.createElement('div');
        container.classList.add('color-swatch-container');
        
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 15px;
            border-radius: 8px;
            // background-color: rgba(255,255,255,0.7);
        `;

        const title = document.createElement('h3');
        title.textContent = `Color Variations (${teaType} Example)`;
        container.appendChild(title);

        const swatchLabels = [
            { label: 'Lighter (20%)', key: 'lighter20' },
            { label: 'Light (10%)', key: 'lighter10' },
            { label: 'Main', key: 'main' },
            { label: 'Dark (10%)', key: 'dark10' },
            { label: 'Darker (20%)', key: 'dark20' }
        ];

        swatchLabels.forEach(({label, key}) => {
            const swatchElement = document.createElement('div');
            swatchElement.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 50px;
                height: 30px;
                background-color: ${swatches[key]};
                border: 1px solid rgba(0,0,0,0.1);
            `;

            const textElement = document.createElement('span');
            textElement.textContent = `${label} - ${swatches[key]}`;

            swatchElement.appendChild(colorBox);
            swatchElement.appendChild(textElement);
            container.appendChild(swatchElement);
        });

        return container;
    }

    /**
     * Get the color palette
     * @returns {Object} Tea color palette
     */
    static getColorPalette() {
        return TeaColorPalette;
    }

    /**
     * Get a specific tea color
     * @param {string} teaType - Type of tea
     * @returns {string} Hex color code
     */
    static getTeaColor(teaType) {
        return TeaColorPalette[teaType];
    }
}

export { TeaThemeGenerator, TeaColorPalette };