// Alta52 - Enhanced Search (Discord Style)
// Modern search with autocomplete, history, and quick actions

class EnhancedSearch {
    constructor() {
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        this.searchModal = null;
        this.searchInput = null;
        this.resultsContainer = null;
        this.isOpen = false;
        this.loadSearchHistory();
        this.init();
    }

    /**
     * Initialize search functionality
     */
    init() {
        // Listen for Ctrl+K hotkey
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            
            // Close on Escape
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Replace existing search bar functionality
        const dmSearchInput = document.querySelector('.dm-search-bar input');
        if (dmSearchInput) {
            dmSearchInput.addEventListener('focus', () => {
                this.open();
            });
        }
    }

    /**
     * Open search modal
     */
    open() {
        if (this.isOpen) return;

        // Create modal if it doesn't exist
        if (!this.searchModal) {
            this.createSearchModal();
        }

        this.searchModal.classList.remove('hidden');
        this.searchModal.classList.add('search-modal-show');
        this.isOpen = true;

        // Focus on input
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }, 100);

        // Show search history by default
        this.showSearchHistory();
    }

    /**
     * Close search modal
     */
    close() {
        if (!this.isOpen) return;

        this.searchModal.classList.remove('search-modal-show');
        this.searchModal.classList.add('search-modal-hide');

        setTimeout(() => {
            this.searchModal.classList.add('hidden');
            this.searchModal.classList.remove('search-modal-hide');
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            this.isOpen = false;
        }, 300);
    }

    /**
     * Create search modal DOM
     */
    createSearchModal() {
        this.searchModal = document.createElement('div');
        this.searchModal.className = 'search-modal hidden';
        this.searchModal.innerHTML = `
            <div class="search-modal-backdrop"></div>
            <div class="search-modal-container">
                <div class="search-modal-header">
                    <div class="search-input-wrapper">
                        <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.707 20.293L16.314 14.9C17.403 13.504 18 11.799 18 10C18 7.863 17.167 5.854 15.656 4.344C14.146 2.832 12.137 2 10 2C7.863 2 5.854 2.832 4.344 4.344C2.833 5.854 2 7.863 2 10C2 12.137 2.833 14.146 4.344 15.656C5.854 17.168 7.863 18 10 18C11.799 18 13.504 17.404 14.9 16.314L20.293 21.706L21.707 20.293ZM10 16C8.397 16 6.891 15.376 5.758 14.243C4.624 13.11 4 11.603 4 10C4 8.398 4.624 6.891 5.758 5.758C6.891 4.624 8.397 4 10 4C11.603 4 13.109 4.624 14.242 5.758C15.376 6.891 16 8.398 16 10C16 11.603 15.376 13.11 14.242 14.243C13.109 15.376 11.603 16 10 16Z"/>
                        </svg>
                        <input type="text" class="search-modal-input" placeholder="Поиск или новый разговор" autocomplete="off">
                        <div class="search-hotkey">Ctrl+K</div>
                    </div>
                </div>
                <div class="search-modal-body">
                    <div class="search-results" id="searchResults"></div>
                </div>
                <div class="search-modal-footer">
                    <div class="search-quick-actions">
                        <button class="search-quick-action" data-action="create-group">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 8.00598C14 10.211 12.206 12.006 10 12.006C7.795 12.006 6 10.211 6 8.00598C6 5.80098 7.794 4.00598 10 4.00598C12.206 4.00598 14 5.80098 14 8.00598ZM2 19.006C2 15.473 5.29 13.006 10 13.006C14.711 13.006 18 15.473 18 19.006V20.006H2V19.006Z"/>
                                <path d="M20.0001 20.006H22.0001V19.006C22.0001 16.4433 20.2697 14.4415 17.5213 13.5352C19.0621 14.9127 20.0001 16.8059 20.0001 19.006V20.006Z"/>
                            </svg>
                            <span>Создать группу</span>
                        </button>
                        <button class="search-quick-action" data-action="add-friend">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2C16.75 2 21 6.25 21 11.5ZM11.5 7C11.5 6.72386 11.7239 6.5 12 6.5C12.2761 6.5 12.5 6.72386 12.5 7V11H16.5C16.7761 11 17 11.2239 17 11.5C17 11.7761 16.7761 12 16.5 12H12.5V16C12.5 16.2761 12.2761 16.5 12 16.5C11.7239 16.5 11.5 16.2761 11.5 16V12H7.5C7.22386 12 7 11.7761 7 11.5C7 11.2239 7.22386 11 7.5 11H11.5V7Z"/>
                            </svg>
                            <span>Добавить друга</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.searchModal);

        // Get references
        this.searchInput = this.searchModal.querySelector('.search-modal-input');
        this.resultsContainer = this.searchModal.querySelector('#searchResults');

        // Add event listeners
        this.attachSearchEventListeners();
    }

    /**
     * Attach event listeners to search modal
     */
    attachSearchEventListeners() {
        // Close on backdrop click
        const backdrop = this.searchModal.querySelector('.search-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }

        // Handle input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query) {
                    this.performSearch(query);
                } else {
                    this.showSearchHistory();
                }
            });

            // Handle Enter key
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const query = this.searchInput.value.trim();
                    if (query) {
                        this.executeSearch(query);
                    }
                }
            });
        }

        // Quick actions
        const quickActions = this.searchModal.querySelectorAll('.search-quick-action');
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const actionType = action.dataset.action;
                this.executeQuickAction(actionType);
            });
        });
    }

    /**
     * Perform search
     */
    performSearch(query) {
        if (!query) {
            this.showSearchHistory();
            return;
        }

        // Clear results
        this.resultsContainer.innerHTML = '';

        // Search in different categories
        const results = {
            users: this.searchUsers(query),
            channels: this.searchChannels(query),
            messages: this.searchMessages(query)
        };

        // Display results
        this.displaySearchResults(results, query);
    }

    /**
     * Search users
     */
    searchUsers(query) {
        // Mock data - replace with actual user search
        const mockUsers = [
            { id: 1, username: 'User1#0001', avatar: 'U1', online: true },
            { id: 2, username: 'User2#0002', avatar: 'U2', online: false },
            { id: 3, username: 'TestUser#0003', avatar: 'TU', online: true }
        ];

        return mockUsers.filter(user =>
            user.username.toLowerCase().includes(query.toLowerCase())
        );
    }

    /**
     * Search channels
     */
    searchChannels(query) {
        const channels = document.querySelectorAll('.channel[data-channel]');
        const results = [];

        channels.forEach(channel => {
            const channelName = channel.querySelector('span').textContent;
            if (channelName.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    id: channel.dataset.channel,
                    name: channelName,
                    type: channel.classList.contains('voice-channel') ? 'voice' : 'text',
                    element: channel
                });
            }
        });

        return results;
    }

    /**
     * Search messages
     */
    searchMessages(query) {
        // Mock data - replace with actual message search
        return [];
    }

    /**
     * Display search results
     */
    displaySearchResults(results, query) {
        let html = '';

        // Users
        if (results.users.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="search-category-header">Пользователи</div>';
            results.users.forEach(user => {
                html += `
                    <div class="search-result-item" data-type="user" data-id="${user.id}">
                        <div class="search-result-avatar">${user.avatar}</div>
                        <div class="search-result-info">
                            <div class="search-result-title">${this.highlightMatch(user.username, query)}</div>
                            <div class="search-result-subtitle">${user.online ? 'В сети' : 'Не в сети'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Channels
        if (results.channels.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="search-category-header">Каналы</div>';
            results.channels.forEach(channel => {
                const icon = channel.type === 'voice' ? '🔊' : '#';
                html += `
                    <div class="search-result-item" data-type="channel" data-id="${channel.id}">
                        <div class="search-result-icon">${icon}</div>
                        <div class="search-result-info">
                            <div class="search-result-title">${this.highlightMatch(channel.name, query)}</div>
                            <div class="search-result-subtitle">${channel.type === 'voice' ? 'Голосовой канал' : 'Текстовый канал'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // No results
        if (results.users.length === 0 && results.channels.length === 0 && results.messages.length === 0) {
            html = '<div class="search-no-results">Ничего не найдено</div>';
        }

        this.resultsContainer.innerHTML = html;

        // Add click handlers to results
        this.resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.selectSearchResult(type, id);
            });
        });
    }

    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    /**
     * Show search history
     */
    showSearchHistory() {
        let html = '';

        if (this.searchHistory.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="search-category-header">Недавние поиски</div>';
            this.searchHistory.slice(0, this.maxHistoryItems).forEach((item, index) => {
                html += `
                    <div class="search-history-item" data-query="${item}">
                        <svg class="search-history-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z"/>
                        </svg>
                        <span>${item}</span>
                        <button class="search-history-remove" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                            </svg>
                        </button>
                    </div>
                `;
            });
            html += '</div>';

            this.resultsContainer.innerHTML = html;

            // Add click handlers
            this.resultsContainer.querySelectorAll('.search-history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.search-history-remove')) {
                        const query = item.dataset.query;
                        if (this.searchInput) {
                            this.searchInput.value = query;
                            this.performSearch(query);
                        }
                    }
                });
            });

            // Remove history item
            this.resultsContainer.querySelectorAll('.search-history-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    this.removeFromHistory(index);
                });
            });
        } else {
            html = '<div class="search-empty-state">Начните вводить для поиска...</div>';
            this.resultsContainer.innerHTML = html;
        }
    }

    /**
     * Execute search
     */
    executeSearch(query) {
        // Add to history
        this.addToHistory(query);
        
        // Perform search
        this.performSearch(query);
    }

    /**
     * Select search result
     */
    selectSearchResult(type, id) {
        if (type === 'channel') {
            const channel = document.querySelector(`.channel[data-channel="${id}"]`);
            if (channel) {
                channel.click();
                this.close();
            }
        } else if (type === 'user') {
            // Open DM with user
            if (typeof toast !== 'undefined') {
                toast.info('Coming Soon', 'Opening DM coming soon');
            }
            this.close();
        }
    }

    /**
     * Execute quick action
     */
    executeQuickAction(action) {
        if (action === 'create-group') {
            if (typeof toast !== 'undefined') {
                toast.info('Coming Soon', 'Create group feature coming soon');
            }
        } else if (action === 'add-friend') {
            // Switch to add friend tab
            const addFriendTab = document.querySelector('[data-tab="add"]');
            if (addFriendTab) {
                addFriendTab.click();
            }
        }
        this.close();
    }

    /**
     * Add to search history
     */
    addToHistory(query) {
        // Remove if already exists
        const index = this.searchHistory.indexOf(query);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }

        // Add to beginning
        this.searchHistory.unshift(query);

        // Limit history size
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }

        // Save to localStorage
        this.saveSearchHistory();
    }

    /**
     * Remove from search history
     */
    removeFromHistory(index) {
        this.searchHistory.splice(index, 1);
        this.saveSearchHistory();
        this.showSearchHistory();
    }

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        const saved = localStorage.getItem('search-history');
        if (saved) {
            try {
                this.searchHistory = JSON.parse(saved);
            } catch (e) {
                this.searchHistory = [];
            }
        }
    }
}

// Create global instance
window.enhancedSearch = new EnhancedSearch();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSearch;
}
