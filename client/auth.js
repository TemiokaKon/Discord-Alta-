let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

function initializeAuth() {
    const authForm = document.getElementById('authForm');
    const switchLink = document.getElementById('switchLink');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Проверяем, не авторизован ли уже пользователь
    checkExistingSession();
    
    authForm.addEventListener('submit', handleSubmit);
    switchLink.addEventListener('click', toggleMode);
    
    // Слушатели для проверки паролей в реальном времени
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (!isLoginMode) validatePasswordStrength(passwordInput.value);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (!isLoginMode) validatePasswordMatch();
        });
    }

    // Устанавливаем начальные тексты
    updateUITexts();
}

function checkExistingSession() {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (token && currentUser) {
        try {
            JSON.parse(currentUser);
            setTimeout(() => {
                window.location.replace('index.html');
            }, 100);
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    }
}

function toggleMode(e) {
    if (e) e.preventDefault();
    
    isLoginMode = !isLoginMode;
    updateUITexts();
    
    // Сброс ошибок и полей при переключении
    removeMessage('error-message');
    removeMessage('success-message');
    removePasswordStrengthIndicator();
    
    // Очистка полей, которые скрываются
    if (isLoginMode) {
        document.getElementById('username').value = '';
        document.getElementById('confirmPassword').value = '';
    }
}

function updateUITexts() {
    const usernameGroup = document.getElementById('usernameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const logoTitle = document.querySelector('.logo h1');
    const logoSubtitle = document.querySelector('.logo p');
    const rememberMeGroup = document.getElementById('rememberMeGroup');
    const forgotPasswordGroup = document.getElementById('forgotPasswordGroup');
    
    if (isLoginMode) {
        // Режим входа
        showElement(usernameGroup, false);
        showElement(confirmPasswordGroup, false);
        showElement(rememberMeGroup, true);
        showElement(forgotPasswordGroup, true);
        
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span id="submitText">Войти</span>';
        switchText.textContent = 'Нет аккаунта?';
        switchLink.textContent = 'Зарегистрироваться';
        logoTitle.textContent = 'Alta';
        logoSubtitle.textContent = 'Премиум общение в стиле рубина';
    } else {
        // Режим регистрации
        showElement(usernameGroup, true);
        showElement(confirmPasswordGroup, true);
        showElement(rememberMeGroup, false);
        showElement(forgotPasswordGroup, false);
        
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i><span id="submitText">Зарегистрироваться</span>';
        switchText.textContent = 'Уже есть аккаунт?';
        switchLink.textContent = 'Войти';
        logoTitle.textContent = 'Создать аккаунт';
        logoSubtitle.textContent = 'Добро пожаловать в Alta!';
    }
}

function showElement(element, show) {
    if (element) {
        element.style.display = show ? (element.classList.contains('remember-me') ? 'flex' : 'block') : 'none';
        
        // Управление атрибутом required для валидации браузера
        const input = element.querySelector('input');
        if (input) {
            input.required = show;
        }
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    removeMessage('error-message');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // 1. Валидация Email
    if (!validateEmail(email)) {
        showError('Пожалуйста, введите корректный email адрес');
        return;
    }

    if (isLoginMode) {
        // --- ЛОГИКА ВХОДА ---
        if (!password) {
            showError('Введите пароль');
            return;
        }
        await login(email, password, rememberMe);
    } else {
        // --- ЛОГИКА РЕГИСТРАЦИИ ---
        const username = document.getElementById('username').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 2. Валидация Имени пользователя
        const usernameError = validateUsername(username);
        if (usernameError) {
            showError(usernameError);
            return;
        }

        // 3. Валидация Пароля (сложность)
        const passwordStrengthError = validatePasswordStrength(password, true); // true = вернуть текст ошибки
        if (passwordStrengthError) {
            showError(passwordStrengthError);
            return;
        }

        // 4. Проверка совпадения паролей
        if (password !== confirmPassword) {
            showError('Пароли не совпадают');
            return;
        }

        await register(username, email, password);
    }
}

// --- ВАЛИДАТОРЫ ---

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateUsername(username) {
    if (!username) return 'Введите имя пользователя';
    if (username.length < 3) return 'Имя пользователя должно быть не менее 3 символов';
    if (username.length > 20) return 'Имя пользователя должно быть не более 20 символов';
    
    // Разрешаем только буквы (латиница/кириллица), цифры, подчеркивание и дефис
    const allowedChars = /^[a-zA-Zа-яА-Я0-9_\-]+$/;
    if (!allowedChars.test(username)) {
        return 'Имя пользователя содержит недопустимые символы. Используйте буквы, цифры, "-" или "_"';
    }
    return null;
}

function validatePasswordStrength(password, returnMessage = false) {
    let message = null;
    let strength = 0; // 0 - weak, 1 - medium, 2 - strong

    if (password.length < 6) {
        message = 'Пароль должен быть не менее 6 символов';
    } else {
        // Простые проверки надежности
        const hasLetters = /[a-zA-Zа-яА-Я]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasLetters && hasNumbers && hasSpecial && password.length >= 8) {
            strength = 2; // Strong
        } else if ((hasLetters && hasNumbers) || (hasLetters && hasSpecial) || password.length >= 8) {
            strength = 1; // Medium
        }
    }

    if (!isLoginMode) {
        updatePasswordStrengthUI(strength, password.length);
    }

    return returnMessage ? message : null;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (password && confirmPassword) {
        if (password === confirmPassword) {
            confirmInput.style.borderColor = '#22c55e'; // Green
        } else {
            confirmInput.style.borderColor = '#ef4444'; // Red
        }
    } else {
        confirmInput.style.borderColor = ''; // Reset
    }
}

// --- UI HELPERS ---

function updatePasswordStrengthUI(strength, length) {
    let indicator = document.getElementById('password-strength-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'password-strength-indicator';
        indicator.className = 'password-strength';
        indicator.style.cssText = 'height: 4px; margin-top: 5px; transition: all 0.3s; border-radius: 2px;';
        
        const passwordGroup = document.getElementById('password').parentElement.parentElement; // form-group
        passwordGroup.appendChild(indicator);
    }

    if (length === 0) {
        indicator.style.width = '0%';
        return;
    }

    if (length < 6) {
        indicator.style.width = '30%';
        indicator.style.backgroundColor = '#ef4444'; // Red (Too short)
    } else if (strength === 0) {
        indicator.style.width = '50%';
        indicator.style.backgroundColor = '#f59e0b'; // Orange (Weak)
    } else if (strength === 1) {
        indicator.style.width = '75%';
        indicator.style.backgroundColor = '#3b82f6'; // Blue (Medium)
    } else {
        indicator.style.width = '100%';
        indicator.style.backgroundColor = '#22c55e'; // Green (Strong)
    }
}

function removePasswordStrengthIndicator() {
    const indicator = document.getElementById('password-strength-indicator');
    if (indicator) indicator.remove();
    
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) confirmInput.style.borderColor = '';
}

// --- API CALLS ---

async function login(email, password, rememberMe) {
    showLoading(true);
    try {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || data.error || 'Ошибка входа');
        }
        
        handleAuthSuccess(data, rememberMe, 'Вход успешен! Перенаправляем...');
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function register(username, email, password) {
    showLoading(true);
    try {
        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || data.error || 'Ошибка регистрации');
        }
        
        handleAuthSuccess(data, false, 'Регистрация успешна! Добро пожаловать!');
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function handleAuthSuccess(data, rememberMe, message) {
    const token = data.data?.token || data.token;
    const user = data.data?.user || data.user;
    
    if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberMe');
        }
        
        showSuccess(message);
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showError('Ошибка получения данных пользователя');
    }
}

// --- SYSTEM MESSAGES ---

function showError(message) {
    removeMessage('error-message');
    removeMessage('success-message');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const form = document.getElementById('authForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Эффект тряски для формы при ошибке
    const authBox = document.querySelector('.auth-box');
    authBox.classList.add('shake-animation');
    setTimeout(() => authBox.classList.remove('shake-animation'), 500);
}

function showSuccess(message) {
    removeMessage('error-message');
    removeMessage('success-message');
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const form = document.getElementById('authForm');
    form.insertBefore(successDiv, form.firstChild);
}

function removeMessage(className) {
    const existingMessage = document.querySelector('.' + className);
    if (existingMessage) {
        existingMessage.remove();
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('show', show);
    }
    
    const btn = document.getElementById('submitBtn');
    if (btn) btn.disabled = show;
}

// CSS для анимации тряски (добавить программно, если нет в CSS)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes shake-horizontal {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake-animation {
        animation: shake-horizontal 0.4s ease-in-out;
    }
`;
document.head.appendChild(styleSheet);

// Проверяем remember me при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
        const rememberMeCheckbox = document.getElementById('rememberMe');
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }
});