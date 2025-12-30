/**
 * UI Utilities
 * Helper functions for UI state management and interactions
 */

const UIUtils = {
    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = window.i18n?.t('loading') || 'Загрузка...';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            delete button.dataset.originalText;
            button.disabled = false;
            button.classList.remove('loading');
        }
    },

    /**
     * Set button disabled state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isDisabled - Disabled state
     */
    setButtonDisabled(button, isDisabled) {
        button.disabled = isDisabled;
        if (isDisabled) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    },

    /**
     * Toggle button active state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isActive - Active state
     */
    setButtonActive(button, isActive) {
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    },

    /**
     * Show element with animation
     * @param {HTMLElement} element - Element to show
     * @param {string} animationClass - Animation class (optional)
     */
    show(element, animationClass = 'fade-in') {
        element.classList.remove('hidden');
        if (animationClass) {
            element.classList.add(animationClass);
        }
    },

    /**
     * Hide element with animation
     * @param {HTMLElement} element - Element to hide
     * @param {string} animationClass - Animation class (optional)
     */
    hide(element, animationClass = 'fade-out') {
        if (animationClass) {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.add('hidden');
                element.classList.remove(animationClass);
            }, 300);
        } else {
            element.classList.add('hidden');
        }
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     */
    toggle(element) {
        if (element.classList.contains('hidden')) {
            this.show(element);
        } else {
            this.hide(element);
        }
    },

    /**
     * Create ripple effect on click
     * @param {Event} event - Click event
     */
    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    },

    /**
     * Scroll element into view smoothly
     * @param {HTMLElement} element - Element to scroll to
     * @param {Object} options - Scroll options
     */
    scrollTo(element, options = {}) {
        const defaults = {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        };
        element.scrollIntoView({ ...defaults, ...options });
    },

    /**
     * Focus element with trap (for modals)
     * @param {HTMLElement} container - Container element
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstElement.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            if (window.toast) {
                window.toast.success(
                    window.i18n?.t('success') || 'Успешно',
                    'Скопировано в буфер обмена'
                );
            }
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            if (window.toast) {
                window.toast.error(
                    window.i18n?.t('error') || 'Ошибка',
                    'Не удалось скопировать'
                );
            }
            return false;
        }
    },

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';

        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Generate random ID
     * @param {string} prefix - ID prefix
     * @returns {string}
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

// Add ripple effect CSS if not present
if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .fade-in {
            animation: fade-in 0.3s ease-out;
        }
        
        .fade-out {
            animation: fade-out 0.3s ease-out;
        }
        
        @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fade-out {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(10px);
            }
        }
        
        button.loading {
            position: relative;
            pointer-events: none;
            opacity: 0.7;
        }
        
        button.loading::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            top: 50%;
            left: 50%;
            margin-left: -8px;
            margin-top: -8px;
            border: 2px solid #fff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Make available globally
window.UIUtils = UIUtils;
