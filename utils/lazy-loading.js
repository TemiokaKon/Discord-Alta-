// Alta52 - Lazy Loading Image System
// Uses Intersection Observer API for performance optimization

class LazyLoadingManager {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.init();
    }

    /**
     * Инициализация Intersection Observer
     */
    init() {
        if (!('IntersectionObserver' in window)) {
            console.warn('Intersection Observer not supported, loading all images immediately');
            this.loadAllImages();
            return;
        }

        const options = {
            root: null, // viewport
            rootMargin: '100px', // Предзагрузка за 100px до viewport
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }

    /**
     * Добавить изображение для ленивой загрузки
     * @param {HTMLElement} element - Элемент изображения
     * @param {string} src - URL изображения
     * @param {string} placeholder - URL плейсхолдера (опционально)
     */
    observe(element, src, placeholder = null) {
        if (!element) return;

        // Сохранить оригинальный URL
        element.dataset.lazySrc = src;

        // Установить плейсхолдер
        if (placeholder) {
            element.dataset.lazyPlaceholder = placeholder;
        }

        // Добавить класс для стилизации
        element.classList.add('lazy-image');
        element.setAttribute('aria-busy', 'true');

        // Установить низкокачественный blur-плейсхолдер
        if (element.tagName === 'IMG') {
            element.src = placeholder || this.createBlurPlaceholder();
        } else {
            element.style.backgroundImage = `url(${placeholder || this.createBlurPlaceholder()})`;
        }

        // Наблюдать за элементом
        if (this.observer) {
            this.observer.observe(element);
        } else {
            // Fallback для старых браузеров
            this.loadImage(element);
        }
    }

    /**
     * Загрузить изображение
     * @param {HTMLElement} element - Элемент изображения
     */
    loadImage(element) {
        const src = element.dataset.lazySrc;
        if (!src || this.loadedImages.has(element)) return;

        this.loadedImages.add(element);

        // Создать новый объект изображения для прогрессивной загрузки
        const img = new Image();

        img.onload = () => {
            // Плавный переход к загруженному изображению
            if (element.tagName === 'IMG') {
                element.src = src;
            } else {
                element.style.backgroundImage = `url(${src})`;
            }

            // Удалить blur эффект
            element.classList.remove('lazy-image');
            element.classList.add('lazy-loaded');
            element.setAttribute('aria-busy', 'false');

            // Удалить data-атрибуты
            delete element.dataset.lazySrc;
            delete element.dataset.lazyPlaceholder;
        };

        img.onerror = () => {
            console.error('Failed to load image:', src);
            element.classList.add('lazy-error');
            element.setAttribute('aria-busy', 'false');
            
            // Установить fallback изображение
            if (element.tagName === 'IMG') {
                element.src = this.createErrorPlaceholder();
            } else {
                element.style.backgroundImage = `url(${this.createErrorPlaceholder()})`;
            }
        };

        // Начать загрузку
        img.src = src;
    }

    /**
     * Создать blur плейсхолдер (SVG)
     */
    createBlurPlaceholder() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#1A0B0F;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#14090C;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#grad)" />
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Создать плейсхолдер для ошибки
     */
    createErrorPlaceholder() {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <rect width="100" height="100" fill="#1A0B0F" />
                <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" 
                      font-family="Arial" font-size="40" fill="#E0115F">!</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Загрузить все изображения (fallback)
     */
    loadAllImages() {
        document.querySelectorAll('[data-lazy-src]').forEach(element => {
            this.loadImage(element);
        });
    }

    /**
     * Отменить наблюдение за элементом
     * @param {HTMLElement} element - Элемент
     */
    unobserve(element) {
        if (this.observer && element) {
            this.observer.unobserve(element);
        }
    }

    /**
     * Отключить наблюдение за всеми элементами
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.loadedImages.clear();
    }

    // Удобные методы для разных типов элементов

    /**
     * Ленивая загрузка для аватара
     * @param {HTMLElement} element - Элемент аватара
     * @param {string} src - URL аватара
     */
    loadAvatar(element, src) {
        if (!src) {
            // Использовать текстовый аватар
            return;
        }
        this.observe(element, src);
    }

    /**
     * Ленивая загрузка для изображения в сообщении
     * @param {HTMLElement} element - Элемент изображения
     * @param {string} src - URL изображения
     */
    loadMessageImage(element, src) {
        // Создать низкокачественный плейсхолдер
        const placeholder = this.createImagePlaceholder(400, 300);
        this.observe(element, src, placeholder);
    }

    /**
     * Ленивая загрузка для иконки сервера
     * @param {HTMLElement} element - Элемент иконки
     * @param {string} src - URL иконки
     */
    loadServerIcon(element, src) {
        this.observe(element, src);
    }

    /**
     * Создать плейсхолдер для изображения с заданными размерами
     * @param {number} width - Ширина
     * @param {number} height - Высота
     */
    createImagePlaceholder(width, height) {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <defs>
                    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#1A0B0F;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#E0115F;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#1A0B0F;stop-opacity:1" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            from="-1 0"
                            to="1 0"
                            dur="2s"
                            repeatCount="indefinite" />
                    </linearGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#shimmer)" />
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Применить ленивую загрузку ко всем изображениям на странице
     */
    applyToAll() {
        // Аватары пользователей
        document.querySelectorAll('.user-avatar img, .profile-avatar img').forEach(img => {
            const src = img.src;
            if (src && !src.startsWith('data:')) {
                img.removeAttribute('src');
                this.loadAvatar(img, src);
            }
        });

        // Изображения в сообщениях
        document.querySelectorAll('.message-image img').forEach(img => {
            const src = img.src;
            if (src && !src.startsWith('data:')) {
                img.removeAttribute('src');
                this.loadMessageImage(img, src);
            }
        });

        // Иконки серверов
        document.querySelectorAll('.server-icon img').forEach(img => {
            const src = img.src;
            if (src && !src.startsWith('data:')) {
                img.removeAttribute('src');
                this.loadServerIcon(img, src);
            }
        });
    }
}

// CSS для скелетонов и blur эффекта
const lazyLoadingStyles = `
    .lazy-image {
        filter: blur(10px);
        transition: filter 0.3s ease;
        background-color: rgba(26, 11, 15, 0.5);
    }

    .lazy-loaded {
        filter: blur(0);
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0.5;
        }
        to {
            opacity: 1;
        }
    }

    .lazy-error {
        opacity: 0.5;
        filter: grayscale(100%);
    }

    /* Skeleton loader для аватаров */
    .avatar-skeleton {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(
            90deg,
            rgba(26, 11, 15, 0.5) 0%,
            rgba(224, 17, 95, 0.3) 50%,
            rgba(26, 11, 15, 0.5) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    /* Skeleton loader для изображений */
    .image-skeleton {
        width: 100%;
        height: 200px;
        border-radius: 8px;
        background: linear-gradient(
            90deg,
            rgba(26, 11, 15, 0.5) 0%,
            rgba(224, 17, 95, 0.3) 50%,
            rgba(26, 11, 15, 0.5) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
    }
`;

// Добавить стили на страницу
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = lazyLoadingStyles;
    document.head.appendChild(styleElement);
}

// Глобальный экземпляр
window.lazyLoadingManager = new LazyLoadingManager();

// Автоматически применить к существующим изображениям при загрузке
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Можно вызвать applyToAll() автоматически, если нужно
            // window.lazyLoadingManager.applyToAll();
        });
    }
}
