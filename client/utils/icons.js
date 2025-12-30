/**
 * Alta Icon Loader - Standalone SVG Icon System
 * 
 * Loads and caches SVG icons from separate files.
 * Provides methods to inline SVGs or use as img src.
 */

class IconLoader {
  constructor(baseUrl = '/client/assets/icons/') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.loading = new Map();
  }

  /**
   * Load an icon SVG from file
   * @param {string} name - Icon name (without .svg extension)
   * @returns {Promise<string>} - SVG content
   */
  async load(name) {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    // Check if already loading
    if (this.loading.has(name)) {
      return this.loading.get(name);
    }

    // Start loading
    const promise = fetch(`${this.baseUrl}${name}.svg`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${name}`);
        }
        return response.text();
      })
      .then(svgContent => {
        this.cache.set(name, svgContent);
        this.loading.delete(name);
        return svgContent;
      })
      .catch(error => {
        console.error(`Icon load error for ${name}:`, error);
        this.loading.delete(name);
        // Return fallback icon
        return '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
      });

    this.loading.set(name, promise);
    return promise;
  }

  /**
   * Create an inline SVG element
   * @param {string} name - Icon name
   * @param {Object} options - Options (className, size, etc.)
   * @returns {Promise<HTMLElement>} - Span element containing SVG
   */
  async createInline(name, options = {}) {
    const svgContent = await this.load(name);
    const container = document.createElement('span');
    container.className = options.className || 'icon';
    container.innerHTML = svgContent;

    const svg = container.querySelector('svg');
    if (svg) {
      // Apply size if specified
      if (options.size) {
        svg.style.width = typeof options.size === 'number' ? `${options.size}px` : options.size;
        svg.style.height = typeof options.size === 'number' ? `${options.size}px` : options.size;
      }
      
      // Apply color if specified
      if (options.color) {
        svg.style.color = options.color;
      }

      // Apply additional attributes
      if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
          svg.setAttribute(key, value);
        });
      }
    }

    return container;
  }

  /**
   * Get icon as img element (for simple usage)
   * @param {string} name - Icon name
   * @param {Object} options - Options (className, size, alt, etc.)
   * @returns {HTMLImageElement} - Image element
   */
  createImage(name, options = {}) {
    const img = document.createElement('img');
    img.src = `${this.baseUrl}${name}.svg`;
    img.alt = options.alt || name;
    img.className = options.className || 'icon';
    
    if (options.size) {
      const size = typeof options.size === 'number' ? `${options.size}px` : options.size;
      img.style.width = size;
      img.style.height = size;
    }

    return img;
  }

  /**
   * Replace FontAwesome icon with SVG icon
   * @param {HTMLElement} element - Element containing fa icon
   * @param {string} iconName - Icon name to replace with
   */
  async replaceFontAwesome(element, iconName) {
    const container = await this.createInline(iconName, {
      className: element.className.replace(/fa[bs]?\s+fa-[\w-]+/g, 'icon').trim()
    });
    
    element.parentNode.replaceChild(container, element);
    return container;
  }

  /**
   * Preload multiple icons
   * @param {string[]} names - Array of icon names
   */
  async preload(names) {
    return Promise.all(names.map(name => this.load(name)));
  }

  /**
   * Get icon URL
   * @param {string} name - Icon name
   * @returns {string} - Icon URL
   */
  getUrl(name) {
    return `${this.baseUrl}${name}.svg`;
  }
}

// Create global instance
const iconLoader = new IconLoader();

// Helper function to get icon element quickly
async function getIcon(name, options = {}) {
  return await iconLoader.createInline(name, options);
}

// Helper function to replace all FA icons in a container
async function replaceAllFontAwesome(container = document.body) {
  const iconMap = {
    'fa-microphone': 'microphone',
    'fa-headphones': 'headphones',
    'fa-cog': 'settings',
    'fa-sign-out-alt': 'logout',
    'fa-video': 'video',
    'fa-desktop': 'screen-share',
    'fa-phone-slash': 'phone-hangup',
    'fa-phone': 'phone',
    'fa-paper-plane': 'send',
    'fa-plus': 'plus',
    'fa-plus-circle': 'plus-circle',
    'fa-times': 'close',
    'fa-chevron-down': 'chevron-down',
    'fa-gamepad': 'gamepad',
    'fa-at': 'at',
    'fa-user-friends': 'user-friends',
    'fa-search': 'search',
    'fa-envelope': 'envelope',
    'fa-lock': 'lock',
    'fa-user': 'user',
    'fa-eye': 'eye',
    'fa-eye-slash': 'eye-slash',
    'fa-bell': 'bell',
    'fa-save': 'save',
    'fa-check-circle': 'check-circle',
    'fa-exclamation-circle': 'exclamation-circle',
    'fa-user-plus': 'user-plus',
    'fa-camera': 'camera',
  };

  const faIcons = container.querySelectorAll('[class*="fa-"]');
  
  for (const element of faIcons) {
    // Skip if it's a social icon (fab)
    if (element.classList.contains('fab')) {
      continue;
    }

    // Find which FA icon class it has
    let iconName = null;
    for (const [faClass, svgName] of Object.entries(iconMap)) {
      if (element.classList.contains(faClass.replace('fa-', ''))) {
        iconName = svgName;
        break;
      }
    }

    // Try to find by full class name
    if (!iconName) {
      for (const className of element.classList) {
        if (iconMap[`fa-${className}`]) {
          iconName = iconMap[`fa-${className}`];
          break;
        }
      }
    }

    if (iconName) {
      try {
        await iconLoader.replaceFontAwesome(element, iconName);
      } catch (error) {
        console.warn(`Failed to replace icon for ${iconName}:`, error);
      }
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IconLoader, iconLoader, getIcon, replaceAllFontAwesome };
}

// Make available globally
window.IconLoader = IconLoader;
window.iconLoader = iconLoader;
window.getIcon = getIcon;
window.replaceAllFontAwesome = replaceAllFontAwesome;
