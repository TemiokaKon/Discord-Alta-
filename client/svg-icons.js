/**
 * SVG Icon Helper Module
 * Provides functions to load and use SVG icons throughout the app
 */

const SVGIcons = {
    // Icon cache
    cache: new Map(),
    basePath: '/client/assets/icons/',

    /**
     * Get inline SVG icon
     * @param {string} name - Icon name (without .svg extension)
     * @param {Object} options - Options for the icon
     * @param {string} options.className - Additional CSS classes
     * @param {string} options.color - Icon color (uses currentColor by default)
     * @param {string} options.size - Icon size (e.g., '24px')
     * @returns {Promise<string>} - HTML string with SVG
     */
    async get(name, options = {}) {
        const { className = '', color = 'currentColor', size = '24px' } = options;

        // Check cache first
        if (!this.cache.has(name)) {
            try {
                const response = await fetch(`${this.basePath}${name}.svg`);
                const svgText = await response.text();
                this.cache.set(name, svgText);
            } catch (error) {
                console.error(`Failed to load icon: ${name}`, error);
                return '';
            }
        }

        let svg = this.cache.get(name);
        
        // Add custom attributes
        svg = svg.replace(
            '<svg',
            `<svg class="svg-icon ${className}" style="width: ${size}; height: ${size}; color: ${color};"`
        );

        return svg;
    },

    /**
     * Create icon element
     * @param {string} name - Icon name
     * @param {Object} options - Icon options
     * @returns {Promise<HTMLElement>}
     */
    async create(name, options = {}) {
        const svgString = await this.get(name, options);
        const temp = document.createElement('div');
        temp.innerHTML = svgString;
        return temp.firstElementChild;
    },

    /**
     * Inject icon into element
     * @param {HTMLElement} element - Target element
     * @param {string} name - Icon name
     * @param {Object} options - Icon options
     */
    async inject(element, name, options = {}) {
        const icon = await this.create(name, options);
        if (icon) {
            element.innerHTML = '';
            element.appendChild(icon);
        }
    },

    /**
     * Preload icons
     * @param {Array<string>} iconNames - Array of icon names to preload
     */
    async preload(iconNames) {
        const promises = iconNames.map(name => this.get(name));
        await Promise.all(promises);
    },

    /**
     * Get logo
     * @param {string} variant - Logo variant (e.g., 'alta-logo')
     * @param {Object} options - Logo options
     */
    async getLogo(variant = 'alta-logo', options = {}) {
        const { className = '', size = '48px' } = options;
        
        try {
            const response = await fetch(`/client/assets/logos/${variant}.svg`);
            let svg = await response.text();
            
            svg = svg.replace(
                '<svg',
                `<svg class="app-logo ${className}" style="width: ${size}; height: ${size};"`
            );
            
            return svg;
        } catch (error) {
            console.error(`Failed to load logo: ${variant}`, error);
            return '';
        }
    }
};

// Preload common icons on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SVGIcons.preload([
            'settings', 'microphone', 'microphone-muted', 'headphones',
            'logout', 'video', 'screen-share', 'phone', 'phone-hangup',
            'user-friends', 'plus', 'hash', 'send'
        ]);
    });
} else {
    SVGIcons.preload([
        'settings', 'microphone', 'microphone-muted', 'headphones',
        'logout', 'video', 'screen-share', 'phone', 'phone-hangup',
        'user-friends', 'plus', 'hash', 'send'
    ]);
}

// Make available globally
window.SVGIcons = SVGIcons;
