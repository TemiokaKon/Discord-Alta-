// Alta52 - Анимация искр от костра
document.addEventListener('DOMContentLoaded', () => {
    // Создать фоновые искры для главной страницы
    if (document.body) {
        createCampfireSparks();
    }
});

// Создать анимацию искр от костра
function createCampfireSparks() {
    const sparkContainer = document.createElement('div');
    sparkContainer.className = 'background-sparks';
    sparkContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    document.body.appendChild(sparkContainer);

    // Создать искры (30-40 вместо 50)
    const sparkCount = 35;
    for (let i = 0; i < sparkCount; i++) {
        createSpark(sparkContainer, i);
    }
}

function createSpark(container, index) {
    const spark = document.createElement('div');
    spark.className = 'campfire-spark';
    
    // Случайная позиция (начинаем снизу)
    const left = 20 + Math.random() * 60; // Более сконцентрированно в центре
    const delay = Math.random() * 6;
    const duration = 3 + Math.random() * 4; // Более плавное движение
    const size = 1.5 + Math.random() * 2.5;
    
    // Боковое покачивание
    const swayAmount = -20 + Math.random() * 40;
    
    spark.style.cssText = `
        position: absolute;
        left: ${left}%;
        bottom: -10px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(${0.5 + Math.random() * 0.5}px);
    `;
    
    // Оранжево-красные оттенки
    const colors = [
        'rgba(255, 100, 0, 0.9)',   // Ярко-оранжевый
        'rgba(255, 140, 0, 0.8)',   // Тёмно-оранжевый
        'rgba(255, 69, 0, 0.9)',    // Красно-оранжевый
        'rgba(255, 200, 50, 0.7)',  // Жёлто-оранжевый
        'rgba(220, 50, 50, 0.8)'    // Красноватый
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    spark.style.background = `radial-gradient(circle, ${color}, transparent)`;
    spark.style.boxShadow = `0 0 ${size * 2}px ${color}`;
    
    // Анимация
    spark.style.animation = `
        campfireSpark ${duration}s ease-out ${delay}s infinite,
        sparkFlicker ${0.3 + Math.random() * 0.5}s ease-in-out infinite,
        sparkSway ${2 + Math.random() * 2}s ease-in-out infinite
    `;
    
    spark.style.setProperty('--sway-amount', `${swayAmount}px`);
    
    container.appendChild(spark);
}

// Добавить CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes campfireSpark {
        0% {
            transform: translateY(0) scale(1);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        70% {
            opacity: 0.8;
        }
        100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
        }
    }
    
    @keyframes sparkFlicker {
        0%, 100% {
            opacity: 0.8;
            filter: brightness(1);
        }
        50% {
            opacity: 0.4;
            filter: brightness(1.3);
        }
    }
    
    @keyframes sparkSway {
        0%, 100% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(var(--sway-amount, 20px));
        }
    }
    
    @keyframes float {
        0%, 100% { 
            transform: translateY(0) rotate(0deg); 
        }
        25% { 
            transform: translateY(-20px) rotate(5deg); 
        }
        50% { 
            transform: translateY(0) rotate(0deg); 
        }
        75% { 
            transform: translateY(20px) rotate(-5deg); 
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.7;
            transform: scale(1.05);
        }
    }
`;
document.head.appendChild(style);

// Плавная прокрутка
function smoothScroll(element, target, duration = 300) {
    const start = element.scrollTop;
    const change = target - start;
    let startTime = null;

    function animateScroll(currentTime) {
        if (!startTime) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Функция плавности (easeInOutCubic)
        const ease = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.scrollTop = start + change * ease;
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
}

// Индикатор печати
class TypingIndicator {
    constructor() {
        this.activeUsers = new Map();
        this.element = null;
    }

    show(username) {
        if (!this.element) {
            this.createElement();
        }
        
        this.activeUsers.set(username, Date.now());
        this.updateDisplay();
        
        // Автоматически скрыть через 3 секунды
        setTimeout(() => {
            if (this.activeUsers.has(username)) {
                const lastUpdate = this.activeUsers.get(username);
                if (Date.now() - lastUpdate >= 3000) {
                    this.activeUsers.delete(username);
                    this.updateDisplay();
                }
            }
        }, 3000);
    }

    hide(username) {
        this.activeUsers.delete(username);
        this.updateDisplay();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'typing-indicator';
        this.element.style.cssText = `
            padding: 8px 16px;
            color: rgba(255, 228, 236, 0.6);
            font-size: 12px;
            font-style: italic;
            display: none;
        `;
        
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer && messagesContainer.parentNode) {
            messagesContainer.parentNode.insertBefore(this.element, messagesContainer.nextSibling);
        }
    }

    updateDisplay() {
        if (!this.element) return;
        
        if (this.activeUsers.size === 0) {
            this.element.style.display = 'none';
            return;
        }
        
        const usernames = Array.from(this.activeUsers.keys());
        let text = '';
        
        if (usernames.length === 1) {
            text = `${usernames[0]} печатает`;
        } else if (usernames.length === 2) {
            text = `${usernames[0]} и ${usernames[1]} печатают`;
        } else {
            text = `Несколько пользователей печатают`;
        }
        
        this.element.innerHTML = `
            ${text}
            <span class="typing-dots">
                <span>●</span><span>●</span><span>●</span>
            </span>
        `;
        this.element.style.display = 'block';
        
        // Добавить CSS для анимированных точек
        if (!document.getElementById('typing-dots-style')) {
            const dotsStyle = document.createElement('style');
            dotsStyle.id = 'typing-dots-style';
            dotsStyle.textContent = `
                .typing-dots {
                    display: inline-block;
                    margin-left: 4px;
                }
                .typing-dots span {
                    animation: typingDot 1.4s infinite;
                    opacity: 0.4;
                }
                .typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                @keyframes typingDot {
                    0%, 60%, 100% { opacity: 0.4; }
                    30% { opacity: 1; }
                }
            `;
            document.head.appendChild(dotsStyle);
        }
    }
}

// Анимация отправленного сообщения
function animateMessageSent(messageElement) {
    messageElement.style.transform = 'scale(0.95) translateY(10px)';
    messageElement.style.opacity = '0';
    
    setTimeout(() => {
        messageElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        messageElement.style.transform = 'scale(1) translateY(0)';
        messageElement.style.opacity = '1';
        
        setTimeout(() => {
            messageElement.style.transition = '';
        }, 300);
    }, 50);
}

// Индикатор статуса подключения
function updateConnectionStatus(status) {
    const statusIndicator = document.getElementById('connectionStatus');
    if (!statusIndicator) return;

    statusIndicator.textContent = status;
    statusIndicator.className = `connection-status ${status.toLowerCase()}`;
    
    // Добавить анимацию пульсации
    statusIndicator.style.animation = 'none';
    setTimeout(() => {
        statusIndicator.style.animation = 'pulse 2s infinite';
    }, 10);
}

// Наблюдать за новым контентом
function observeNewContent() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Узел элемента
                        if (node.classList && node.classList.contains('message-group')) {
                            // Анимировать новые сообщения
                            animateMessageSent(node);
                        }
                    }
                });
            }
        });
    });

    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true });
    }
}

// Экспорт функций
window.Alta52Animations = {
    createCampfireSparks,
    smoothScroll,
    TypingIndicator,
    animateMessageSent,
    updateConnectionStatus,
    observeNewContent
};

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observeNewContent();
    });
} else {
    observeNewContent();
}