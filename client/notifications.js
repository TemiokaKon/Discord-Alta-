// Alta52 - Enhanced Toast Notification System
// Discord-style notifications with animations and sounds

class ToastNotification {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.sounds = {
            success: '/public/sounds/notification.mp3',
            error: '/public/sounds/error.mp3',
            info: '/public/sounds/message.mp3',
            warning: '/public/sounds/warning.mp3'
        };
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        // Create notification container if it doesn't exist
        let container = document.getElementById('toast-notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-notification-container';
            container.className = 'toast-notification-container';
            document.body.appendChild(container);
        }
        
        this.container = container;
    }

    /**
     * Show a toast notification
     * @param {Object} options - Notification options
     * @param {string} options.type - Type: 'success', 'error', 'info', 'warning'
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {number} options.duration - Duration in ms (default: 5000, 0 = never auto-close)
     * @param {boolean} options.playSound - Play sound (default: true)
     * @param {Function} options.onClick - Callback when notification is clicked
     * @returns {string} Notification ID
     */
    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            playSound = true,
            onClick = null
        } = options;

        const notifId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // Create notification element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.id = notifId;
        
        // Icon based on type
        const iconMap = {
            success: `<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"/>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"/>
            </svg>`
        };

        toast.innerHTML = `
            <div class="toast-icon">
                ${iconMap[type] || iconMap.info}
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
                ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Close notification">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                </svg>
            </button>
        `;

        // Add progress bar
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            toast.appendChild(progress);
            
            // Animate progress bar
            setTimeout(() => {
                progress.style.width = '0%';
            }, 10);
        }

        // Event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(notifId);
        });

        if (onClick) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', () => {
                onClick();
                this.close(notifId);
            });
        }

        // Add to container
        this.container.appendChild(toast);
        this.notifications.set(notifId, toast);

        // Play sound
        if (playSound && this.sounds[type]) {
            this.playSound(type);
        }

        // Auto-close
        if (duration > 0) {
            setTimeout(() => {
                this.close(notifId);
            }, duration);
        }

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);

        return notifId;
    }

    /**
     * Close a toast notification
     * @param {string} notifId - Notification ID
     */
    close(notifId) {
        const toast = this.notifications.get(notifId);
        if (!toast) return;

        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        setTimeout(() => {
            toast.remove();
            this.notifications.delete(notifId);
        }, 300);
    }

    /**
     * Close all notifications
     */
    closeAll() {
        this.notifications.forEach((_, notifId) => {
            this.close(notifId);
        });
    }

    /**
     * Show success notification
     */
    success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    /**
     * Show error notification
     */
    error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            ...options
        });
    }

    /**
     * Show info notification
     */
    info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    /**
     * Show warning notification
     */
    warning(title, message, options = {}) {
        return this.show({
            type: 'warning',
            title,
            message,
            ...options
        });
    }

    /**
     * Play notification sound
     * @param {string} type - Sound type
     */
    playSound(type) {
        try {
            const audio = new Audio(this.sounds[type]);
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Silently fail if sound can't be played
            });
        } catch (e) {
            // Sound is optional
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.toast = new ToastNotification();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastNotification;
}
