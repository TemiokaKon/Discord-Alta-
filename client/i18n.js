/**
 * Russian Localization (ru-RU)
 * All UI strings in Russian
 */

const i18n = {
    locale: 'ru-RU',
    
    strings: {
        // General
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успешно',
        cancel: 'Отмена',
        confirm: 'Подтвердить',
        save: 'Сохранить',
        delete: 'Удалить',
        edit: 'Редактировать',
        close: 'Закрыть',
        
        // Auth
        login: 'Вход',
        logout: 'Выход',
        register: 'Регистрация',
        username: 'Имя пользователя',
        email: 'Email',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        
        // Navigation
        friends: 'Друзья',
        servers: 'Серверы',
        directMessages: 'Личные сообщения',
        settings: 'Настройки',
        
        // Friends
        friendsOnline: 'Онлайн',
        friendsAll: 'Все',
        friendsPending: 'Ожидание',
        friendsBlocked: 'Заблокированные',
        addFriend: 'Добавить друга',
        removeFriend: 'Удалить из друзей',
        acceptFriendRequest: 'Принять запрос',
        declineFriendRequest: 'Отклонить запрос',
        sendFriendRequest: 'Отправить запрос',
        
        // Messages
        typeMessage: 'Написать сообщение...',
        sendMessage: 'Отправить',
        editMessage: 'Редактировать сообщение',
        deleteMessage: 'Удалить сообщение',
        replyMessage: 'Ответить',
        pinMessage: 'Закрепить',
        unpinMessage: 'Открепить',
        
        // Servers
        createServer: 'Создать сервер',
        serverName: 'Название сервера',
        serverSettings: 'Настройки сервера',
        inviteToServer: 'Пригласить на сервер',
        leaveServer: 'Покинуть сервер',
        deleteServer: 'Удалить сервер',
        
        // Channels
        textChannel: 'Текстовый канал',
        voiceChannel: 'Голосовой канал',
        createChannel: 'Создать канал',
        channelName: 'Название канала',
        deleteChannel: 'Удалить канал',
        
        // Voice & Video
        joinVoice: 'Присоединиться к голосовому',
        leaveVoice: 'Покинуть голосовой',
        mute: 'Выключить микрофон',
        unmute: 'Включить микрофон',
        deafen: 'Выключить звук',
        undeafen: 'Включить звук',
        shareScreen: 'Демонстрация экрана',
        stopSharing: 'Остановить демонстрацию',
        enableVideo: 'Включить видео',
        disableVideo: 'Выключить видео',
        
        // Call states
        calling: 'Звоним...',
        ringing: 'Входящий звонок',
        connected: 'Подключено',
        disconnected: 'Отключено',
        reconnecting: 'Переподключение...',
        callEnded: 'Звонок завершён',
        incomingCall: 'Входящий вызов',
        acceptCall: 'Принять',
        declineCall: 'Отклонить',
        endCall: 'Завершить звонок',
        
        // Participants
        participants: 'Участники',
        speaking: 'Говорит',
        muted: 'Микрофон выключен',
        deafened: 'Звук выключен',
        
        // Settings categories
        settingsAccount: 'Аккаунт',
        settingsVoice: 'Голос и видео',
        settingsNotifications: 'Уведомления',
        settingsAppearance: 'Внешний вид',
        settingsPrivacy: 'Конфиденциальность',
        settingsLanguage: 'Язык',
        
        // Voice settings
        inputDevice: 'Устройство ввода',
        outputDevice: 'Устройство вывода',
        inputVolume: 'Громкость микрофона',
        outputVolume: 'Громкость звука',
        noiseSuppression: 'Шумоподавление',
        echoCancellation: 'Подавление эха',
        autoGainControl: 'Автоматическая регулировка усиления',
        
        // Notifications
        enableNotifications: 'Включить уведомления',
        messageSound: 'Звук сообщения',
        callSound: 'Звук звонка',
        
        // Status
        statusOnline: 'В сети',
        statusIdle: 'Отошёл',
        statusDnd: 'Не беспокоить',
        statusOffline: 'Не в сети',
        
        // Connection
        connecting: 'Подключение...',
        connectionLost: 'Соединение потеряно',
        connectionRestored: 'Соединение восстановлено',
        
        // Errors
        errorGeneric: 'Произошла ошибка',
        errorNetwork: 'Ошибка сети',
        errorAuth: 'Ошибка авторизации',
        errorPermission: 'Нет разрешения',
        errorNotFound: 'Не найдено',
        
        // Confirmations
        confirmLogout: 'Вы действительно хотите выйти?',
        confirmDeleteMessage: 'Удалить это сообщение?',
        confirmDeleteChannel: 'Удалить этот канал?',
        confirmDeleteServer: 'Удалить этот сервер?',
        confirmLeaveServer: 'Покинуть этот сервер?',
        
        // Empty states
        noFriends: 'У вас пока нет друзей',
        noMessages: 'Нет сообщений',
        noServers: 'У вас пока нет серверов',
        
        // Misc
        searchPlaceholder: 'Поиск',
        uploadFile: 'Загрузить файл',
        emoji: 'Эмодзи',
        reaction: 'Реакция',
    },
    
    /**
     * Get localized string
     * @param {string} key - String key
     * @param {Object} params - Replacement parameters
     * @returns {string}
     */
    t(key, params = {}) {
        let str = this.strings[key] || key;
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            str = str.replace(`{${param}}`, params[param]);
        });
        
        return str;
    },
    
    /**
     * Format date/time
     * @param {Date|string} date
     * @param {Object} options
     */
    formatDate(date, options = {}) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat(this.locale, options).format(d);
    },
    
    /**
     * Format time
     * @param {Date|string} date
     */
    formatTime(date) {
        return this.formatDate(date, {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Format relative time (e.g., "5 минут назад")
     * @param {Date|string} date
     */
    formatRelative(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = Math.floor((now - d) / 1000); // seconds
        
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} минут назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} часов назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дней назад`;
        
        return this.formatDate(d, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
};

// Make available globally
window.i18n = i18n;
