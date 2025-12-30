// Alta52 - Channel Management
// Collapsible categories, drag-and-drop, context menus

// Initialize channel management
function initializeChannelManagement() {
    initializeCollapsibleCategories();
    initializeChannelDragAndDrop();
    initializeChannelContextMenu();
    initializeConnectionPing();
}

/**
 * Initialize collapsible categories
 */
function initializeCollapsibleCategories() {
    const categoryHeaders = document.querySelectorAll('.category-header[data-collapsible="true"]');
    
    categoryHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on add button
            if (e.target.closest('.category-add-btn')) {
                return;
            }
            
            const category = header.closest('.channel-category');
            if (category) {
                category.classList.toggle('collapsed');
                
                // Save state to localStorage
                const categoryId = category.dataset.categoryId;
                if (categoryId) {
                    const isCollapsed = category.classList.contains('collapsed');
                    localStorage.setItem(`category-collapsed-${categoryId}`, isCollapsed);
                }
            }
        });
    });
    
    // Restore collapsed state from localStorage
    document.querySelectorAll('.channel-category[data-category-id]').forEach(category => {
        const categoryId = category.dataset.categoryId;
        const isCollapsed = localStorage.getItem(`category-collapsed-${categoryId}`) === 'true';
        if (isCollapsed) {
            category.classList.add('collapsed');
        }
    });
}

/**
 * Initialize drag-and-drop for channels
 */
function initializeChannelDragAndDrop() {
    const channels = document.querySelectorAll('.channel[draggable="true"]');
    
    channels.forEach(channel => {
        channel.addEventListener('dragstart', handleDragStart);
        channel.addEventListener('dragend', handleDragEnd);
        channel.addEventListener('dragover', handleDragOver);
        channel.addEventListener('drop', handleDrop);
        channel.addEventListener('dragleave', handleDragLeave);
    });
}

let draggedChannel = null;

function handleDragStart(e) {
    draggedChannel = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove all drag-over classes
    document.querySelectorAll('.channel').forEach(channel => {
        channel.classList.remove('drag-over');
    });
    
    draggedChannel = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedChannel) {
        this.classList.add('drag-over');
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedChannel !== this) {
        // Get parent containers
        const draggedParent = draggedChannel.parentNode;
        const dropParent = this.parentNode;
        
        // Only allow drop within same category type
        const draggedCategory = draggedChannel.closest('.channel-category');
        const dropCategory = this.closest('.channel-category');
        
        if (draggedCategory === dropCategory) {
            // Insert before or after based on position
            const allChannels = Array.from(dropParent.children);
            const draggedIndex = allChannels.indexOf(draggedChannel);
            const dropIndex = allChannels.indexOf(this);
            
            if (draggedIndex < dropIndex) {
                dropParent.insertBefore(draggedChannel, this.nextSibling);
            } else {
                dropParent.insertBefore(draggedChannel, this);
            }
            
            // Save new order to localStorage
            saveChannelOrder();
            
            // Show success notification
            if (typeof toast !== 'undefined') {
                toast.success('Channel Moved', 'Channel order updated');
            }
        } else {
            // Show error notification
            if (typeof toast !== 'undefined') {
                toast.error('Invalid Move', 'Cannot move channel to different category type');
            }
        }
    }
    
    this.classList.remove('drag-over');
    
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

/**
 * Save channel order to localStorage
 */
function saveChannelOrder() {
    const categories = document.querySelectorAll('.channel-category[data-category-id]');
    const orderData = {};
    
    categories.forEach(category => {
        const categoryId = category.dataset.categoryId;
        const channels = category.querySelectorAll('.channel[data-channel]');
        const channelOrder = Array.from(channels).map(ch => ch.dataset.channel);
        orderData[categoryId] = channelOrder;
    });
    
    localStorage.setItem('channel-order', JSON.stringify(orderData));
}

/**
 * Load channel order from localStorage
 */
function loadChannelOrder() {
    const orderData = localStorage.getItem('channel-order');
    if (!orderData) return;
    
    try {
        const order = JSON.parse(orderData);
        
        Object.keys(order).forEach(categoryId => {
            const category = document.querySelector(`.channel-category[data-category-id="${categoryId}"]`);
            if (!category) return;
            
            const channelsContainer = category.querySelector('.category-channels');
            if (!channelsContainer) return;
            
            const channelOrder = order[categoryId];
            const channels = Array.from(channelsContainer.querySelectorAll('.channel[data-channel]'));
            
            // Reorder channels based on saved order
            channelOrder.forEach(channelId => {
                const channel = channels.find(ch => ch.dataset.channel === channelId);
                if (channel) {
                    channelsContainer.appendChild(channel);
                }
            });
        });
    } catch (e) {
        console.error('Error loading channel order:', e);
    }
}

/**
 * Initialize context menu for channels
 */
function initializeChannelContextMenu() {
    const channels = document.querySelectorAll('.channel');
    
    channels.forEach(channel => {
        channel.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showChannelContextMenu(e, channel);
        });
    });
}

/**
 * Show context menu for channel
 */
function showChannelContextMenu(e, channel) {
    const isVoiceChannel = channel.classList.contains('voice-channel');
    const channelName = channel.querySelector('span').textContent;
    
    const menuItems = [
        {
            text: isVoiceChannel ? 'Join Voice Channel' : 'Open Channel',
            icon: isVoiceChannel ? 'volume-up' : 'hashtag',
            onClick: () => {
                channel.click();
            }
        },
        {
            text: 'Invite People',
            icon: 'user-plus',
            onClick: () => {
                if (typeof toast !== 'undefined') {
                    toast.info('Coming Soon', 'Invite feature coming soon');
                }
            }
        },
        {
            separator: true
        },
        {
            text: 'Edit Channel',
            icon: 'edit',
            onClick: () => {
                if (typeof toast !== 'undefined') {
                    toast.info('Coming Soon', 'Channel editing coming soon');
                }
            }
        },
        {
            text: 'Copy Channel Link',
            icon: 'link',
            onClick: () => {
                // Copy channel link to clipboard
                const channelId = channel.dataset.channel;
                const link = `${window.location.origin}/channels/${channelId}`;
                navigator.clipboard.writeText(link).then(() => {
                    if (typeof toast !== 'undefined') {
                        toast.success('Copied!', 'Channel link copied to clipboard');
                    }
                });
            }
        },
        {
            separator: true
        },
        {
            text: 'Delete Channel',
            icon: 'trash',
            danger: true,
            onClick: () => {
                if (typeof modalManager !== 'undefined') {
                    modalManager.confirm(
                        `Are you sure you want to delete #${channelName}?`,
                        () => {
                            if (typeof toast !== 'undefined') {
                                toast.info('Coming Soon', 'Channel deletion coming soon');
                            }
                        }
                    );
                }
            }
        }
    ];
    
    if (typeof window.contextMenu !== 'undefined') {
        window.contextMenu.show(e.pageX, e.pageY, menuItems);
    }
}

/**
 * Initialize connection ping monitor
 */
function initializeConnectionPing() {
    const connectionStatusMini = document.getElementById('connectionStatusMini');
    if (!connectionStatusMini) return;
    
    let pingValue = 0;
    
    // Simulate ping monitoring (replace with actual WebSocket ping)
    function updatePing() {
        // In real implementation, measure actual ping to server
        if (typeof socket !== 'undefined' && socket && socket.connected) {
            // Simulate ping between 10-100ms
            pingValue = Math.floor(Math.random() * 90) + 10;
            
            const pingElement = connectionStatusMini.querySelector('.connection-ping');
            if (pingElement) {
                pingElement.textContent = `${pingValue}ms`;
            }
            
            // Update color based on ping
            connectionStatusMini.classList.remove('good', 'medium', 'poor');
            if (pingValue < 50) {
                connectionStatusMini.classList.add('good');
            } else if (pingValue < 100) {
                connectionStatusMini.classList.add('medium');
            } else {
                connectionStatusMini.classList.add('poor');
            }
        } else {
            const pingElement = connectionStatusMini.querySelector('.connection-ping');
            if (pingElement) {
                pingElement.textContent = '--ms';
            }
            connectionStatusMini.classList.remove('good', 'medium', 'poor');
        }
    }
    
    // Update ping every 5 seconds
    updatePing();
    setInterval(updatePing, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeChannelManagement();
        loadChannelOrder();
    });
} else {
    initializeChannelManagement();
    loadChannelOrder();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeChannelManagement,
        loadChannelOrder,
        saveChannelOrder
    };
}
