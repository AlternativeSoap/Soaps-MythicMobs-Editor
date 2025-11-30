/**
 * SearchableDropdown Component
 * Custom dropdown with search/filter functionality for large lists
 */
class SearchableDropdown {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.items = options.items || [];
        this.placeholder = options.placeholder || 'Search...';
        this.onSelect = options.onSelect || (() => {});
        this.currentValue = options.value || '';
        this.isOpen = false;
        this.filteredItems = [...this.items];
        this.selectedIndex = -1;
        
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="searchable-dropdown">
                <div class="searchable-dropdown-input-wrapper">
                    <input 
                        type="text" 
                        class="form-input searchable-dropdown-input" 
                        placeholder="${this.placeholder}"
                        value="${this.currentValue}"
                        autocomplete="off"
                    >
                    <i class="fas fa-chevron-down searchable-dropdown-icon"></i>
                </div>
                <div class="searchable-dropdown-list" style="display: none;">
                    ${this.renderItems()}
                </div>
            </div>
        `;
    }
    
    renderItems() {
        if (this.filteredItems.length === 0) {
            return '<div class="searchable-dropdown-item searchable-dropdown-empty">No results found</div>';
        }
        
        return this.filteredItems
            .map((item, index) => `
                <div class="searchable-dropdown-item ${index === this.selectedIndex ? 'selected' : ''}" data-value="${item}">
                    ${item}
                </div>
            `)
            .join('');
    }
    
    attachEventListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const input = container.querySelector('.searchable-dropdown-input');
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        
        // Input focus - show dropdown
        input.addEventListener('focus', () => {
            this.openDropdown();
        });
        
        // Input typing - filter items
        input.addEventListener('input', (e) => {
            this.filterItems(e.target.value);
            this.openDropdown();
        });
        
        // Icon click - toggle dropdown
        icon.addEventListener('click', () => {
            if (this.isOpen) {
                this.closeDropdown();
            } else {
                input.focus();
            }
        });
        
        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                this.openDropdown();
                e.preventDefault();
                return;
            }
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
                    this.updateList();
                    this.scrollToSelected();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this.updateList();
                    this.scrollToSelected();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
                        this.selectItem(this.filteredItems[this.selectedIndex]);
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
        
        // Item click
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.searchable-dropdown-item');
            if (item && !item.classList.contains('searchable-dropdown-empty')) {
                this.selectItem(item.dataset.value);
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Close on scroll (since position is fixed and won't move with content)
        const scrollContainers = [window, document.querySelector('.editor-content'), document.querySelector('.mob-editor-view')];
        scrollContainers.forEach(scrollContainer => {
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', () => {
                    if (this.isOpen) {
                        this.closeDropdown();
                    }
                }, { passive: true });
            }
        });
    }
    
    filterItems(query) {
        const lowerQuery = query.toLowerCase();
        this.filteredItems = this.items.filter(item => 
            item.toLowerCase().includes(lowerQuery)
        );
        this.selectedIndex = -1;
        this.updateList();
    }
    
    updateList() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        list.innerHTML = this.renderItems();
    }
    
    selectItem(value) {
        this.currentValue = value;
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            input.value = value;
        }
        this.closeDropdown();
        this.onSelect(value);
    }
    
    openDropdown() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        const inputWrapper = container.querySelector('.searchable-dropdown-input-wrapper');
        
        // Calculate position for fixed positioning
        const rect = inputWrapper.getBoundingClientRect();
        list.style.top = `${rect.bottom + 4}px`;
        list.style.left = `${rect.left}px`;
        list.style.width = `${rect.width}px`;
        
        list.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
        this.isOpen = true;
    }
    
    closeDropdown() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const icon = container.querySelector('.searchable-dropdown-icon');
        
        if (list) list.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        this.isOpen = false;
        this.selectedIndex = -1;
    }
    
    scrollToSelected() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const list = container.querySelector('.searchable-dropdown-list');
        const selectedItem = list.querySelector('.searchable-dropdown-item.selected');
        
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    setValue(value) {
        this.currentValue = value;
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            if (input) input.value = value;
        }
    }
    
    getValue() {
        const container = document.getElementById(this.containerId);
        if (container) {
            const input = container.querySelector('.searchable-dropdown-input');
            return input ? input.value : this.currentValue;
        }
        return this.currentValue;
    }
}
