// Query DOM elements with null checks
const searchButton = document.querySelector("nav .nav-utilities .link-search");
const closeButton = document.querySelector(".search-container button.link-close");
const navLinks = document.querySelector(".nav-links");
const searchContainer = document.querySelector(".search-container");
const overlay = document.querySelector(".overlay");
const menuIconContainer = document.querySelector("nav button.menu-icon-container");
const navContainer = document.querySelector(".nav-container");
const mobileSearchInput = document.querySelector("#mobile-search-input");
const cancelBtn = document.querySelector("button.cancel-btn");

// Initialize event listeners with null guards
function initializeEventListeners() {
    // Desktop Search
    if (searchButton) {
        searchButton.addEventListener("click", (e) => {
            e.preventDefault();
            openSearch();
        });

        searchButton.addEventListener("keydown", (e) => {
            if (e.key === " ") {
                e.preventDefault();
                openSearch();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeSearch);
    }

    if (overlay) {
        overlay.addEventListener("click", closeSearch);
    }

    // Mobile Menu
    if (menuIconContainer) {
        menuIconContainer.addEventListener("click", toggleMobileMenu);
    }

    // Mobile Search
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("click", openMobileSearch);
        mobileSearchInput.addEventListener("focus", openMobileSearch);

        // Add Enter key handler for mobile search input to prevent form submission
        mobileSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeMobileSearch);
    }

    // Skip link
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('main-content');
            if (target) {
                target.tabIndex = -1;
                target.focus();
                setTimeout(() => target.removeAttribute('tabindex'), 1000);
            }
        });
    }
}

// Store references for focus management
let lastFocusedElement = null;
let removeTrapFocus = null; // For desktop search
let removeMobileTrapFocus = null; // For mobile search

// Mega Menu State Management
let currentMegaMenu = null;
let megaMenuOpenTimer = null;
let megaMenuCloseTimer = null;
let megaMenusInitialized = false;
const MEGA_MENU_OPEN_DELAY = 110;
const MEGA_MENU_CLOSE_DELAY = 220;

// Mega Menu Initialization
function initializeMegaMenus() {
    const navItems = document.querySelectorAll('.nav-links li');
    const megaMenus = document.querySelectorAll('.mega-menu');
    const megaMenuBackdrop = document.querySelector('.mega-menu-backdrop');
    
    // Only initialize on desktop and if not already initialized
    if (window.innerWidth <= 768 || megaMenusInitialized) return;
    
    megaMenusInitialized = true;
    
    navItems.forEach(navItem => {
        const link = navItem.querySelector('a');
        const menuId = link?.getAttribute('data-menu');
        
        if (!menuId) return;
        
        const menuPanel = document.getElementById(menuId);
        if (!menuPanel) return;
        
        // Mouse events
        navItem.addEventListener('mouseenter', () => openMegaMenu(menuId, link));
        navItem.addEventListener('mouseleave', () => closeMegaMenu(currentMegaMenu));
        
        // Focus events
        navItem.addEventListener('focusin', () => openMegaMenu(menuId, link));
        navItem.addEventListener('focusout', (e) => {
            if (!navItem.contains(e.relatedTarget) && !menuPanel.contains(e.relatedTarget)) {
                closeMegaMenu(currentMegaMenu);
            }
        });
        
        // Keyboard events
        link.addEventListener('keydown', (e) => handleMegaMenuKeyboard(e, menuId, link));
        menuPanel.addEventListener('keydown', (e) => handleMegaMenuKeyboard(e, menuId, link));
        
        // Menu panel hover events to prevent unexpected closing
        menuPanel.addEventListener('mouseenter', () => {
            clearTimeout(megaMenuCloseTimer);
        });
        
        menuPanel.addEventListener('mouseleave', () => {
            megaMenuCloseTimer = setTimeout(() => {
                closeMegaMenu(menuPanel);
            }, MEGA_MENU_CLOSE_DELAY);
        });
    });
    
    // Backdrop click handler
    if (megaMenuBackdrop) {
        megaMenuBackdrop.addEventListener('click', () => {
            if (currentMegaMenu) closeMegaMenu(currentMegaMenu);
        });
    }
}

// Mega Menu Open Function
function openMegaMenu(menuId, triggerElement, immediate = false) {
    clearTimeout(megaMenuOpenTimer);
    clearTimeout(megaMenuCloseTimer);
    
    const openLogic = () => {
        if (currentMegaMenu && currentMegaMenu.id !== menuId) {
            closeMegaMenu(currentMegaMenu, true);
        }
        
        const menuPanel = document.getElementById(menuId);
        const megaMenuBackdrop = document.querySelector('.mega-menu-backdrop');
        
        if (!menuPanel) return;
        
        menuPanel.classList.add('is-open');
        triggerElement.parentElement.classList.add('has-open-menu');
        
        if (megaMenuBackdrop) {
            megaMenuBackdrop.classList.add('show');
            megaMenuBackdrop.setAttribute('aria-hidden', 'false');
        }
        
        triggerElement.setAttribute('aria-expanded', 'true');
        menuPanel.setAttribute('aria-hidden', 'false');
        
        currentMegaMenu = menuPanel;
    };
    
    if (immediate) {
        openLogic();
    } else {
        megaMenuOpenTimer = setTimeout(openLogic, MEGA_MENU_OPEN_DELAY);
    }
}

// Mega Menu Close Function
function closeMegaMenu(menuPanel, immediate = false) {
    clearTimeout(megaMenuOpenTimer);
    clearTimeout(megaMenuCloseTimer);
    
    const closeLogic = () => {
        if (!menuPanel) return;
        
        menuPanel.classList.add('is-closing');
        
        setTimeout(() => {
            menuPanel.classList.remove('is-open', 'is-closing');
            
            const triggerElement = document.querySelector(`[data-menu="${menuPanel.id}"]`);
            if (triggerElement) {
                triggerElement.parentElement.classList.remove('has-open-menu');
                triggerElement.setAttribute('aria-expanded', 'false');
            }
            
            menuPanel.setAttribute('aria-hidden', 'true');
            
            const megaMenuBackdrop = document.querySelector('.mega-menu-backdrop');
            if (megaMenuBackdrop && !document.querySelector('.mega-menu.is-open')) {
                megaMenuBackdrop.classList.remove('show');
                megaMenuBackdrop.setAttribute('aria-hidden', 'true');
            }
            
            currentMegaMenu = null;
        }, 200);
    };
    
    if (immediate) {
        closeLogic();
    } else {
        megaMenuCloseTimer = setTimeout(closeLogic, MEGA_MENU_CLOSE_DELAY);
    }
}

// Mega Menu Keyboard Navigation
function handleMegaMenuKeyboard(event, menuId, triggerElement) {
    const menuPanel = document.getElementById(menuId);
    if (!menuPanel) return;
    
    switch (event.key) {
        case 'Escape':
            event.preventDefault();
            closeMegaMenu(menuPanel, true);
            triggerElement.focus();
            break;
            
        case 'ArrowDown':
            if (document.activeElement === triggerElement) {
                event.preventDefault();
                openMegaMenu(menuId, triggerElement, true);
                setTimeout(() => {
                    const firstLink = menuPanel.querySelector('a');
                    if (firstLink) firstLink.focus();
                }, 50);
            }
            break;
            
        case 'ArrowUp':
            if (menuPanel.contains(document.activeElement)) {
                event.preventDefault();
                const links = Array.from(menuPanel.querySelectorAll('a'));
                const currentIndex = links.indexOf(document.activeElement);
                
                if (currentIndex > 0) {
                    links[currentIndex - 1].focus();
                } else {
                    triggerElement.focus();
                }
            }
            break;
            
        case 'ArrowRight':
        case 'ArrowLeft':
            const navLinks = document.querySelectorAll('.nav-links li a[data-menu]');
            const currentNavIndex = Array.from(navLinks).indexOf(triggerElement);
            
            if (event.key === 'ArrowRight' && currentNavIndex < navLinks.length - 1) {
                event.preventDefault();
                navLinks[currentNavIndex + 1].focus();
            } else if (event.key === 'ArrowLeft' && currentNavIndex > 0) {
                event.preventDefault();
                navLinks[currentNavIndex - 1].focus();
            }
            break;
            
        case 'Tab':
            if (menuPanel.contains(document.activeElement)) {
                const links = Array.from(menuPanel.querySelectorAll('a'));
                const lastLink = links[links.length - 1];
                
                if (event.shiftKey && document.activeElement === links[0]) {
                    event.preventDefault();
                    triggerElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastLink) {
                    setTimeout(() => closeMegaMenu(menuPanel), 100);
                }
            }
            break;
    }
}

// Focus trap utility
function trapFocus(element) {
    const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Return a function to remove the event listener when done
    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}

// Escape key handlers
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        // Mega menu priority
        if (currentMegaMenu && !currentMegaMenu.classList.contains("is-closing")) {
            closeMegaMenu(currentMegaMenu, true);
            return;
        }
        
        // Desktop search overlay
        if (searchContainer && !searchContainer.classList.contains("hide")) {
            closeSearch();
        }
        
        // Mobile search overlay
        const mobileOverlay = document.getElementById("mobile-search-overlay");
        if (mobileOverlay && mobileOverlay.getAttribute("aria-hidden") === "false") {
            closeMobileSearch();
        }
    }
});

function openSearch() {
    if (!navLinks || !searchContainer || !overlay) return;
    
    lastFocusedElement = document.activeElement;
    navLinks.classList.add("hide");
    searchContainer.classList.remove("hide");
    overlay.classList.add("show");
    
    // Update ARIA
    searchContainer.setAttribute("aria-hidden", "false");
    navLinks.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "false");
    
    // Focus search input
    const desktopSearchInput = document.getElementById("desktop-search-input");
    if (desktopSearchInput) {
        desktopSearchInput.focus();
    }

    // Apply focus trap
    if (removeTrapFocus) removeTrapFocus(); // Cleanup any existing
    removeTrapFocus = trapFocus(searchContainer);
}

function closeSearch() {
    if (!navLinks || !searchContainer || !overlay) return;
    
    navLinks.classList.remove("hide");
    searchContainer.classList.add("hide");
    overlay.classList.remove("show");
    
    // Update ARIA
    searchContainer.setAttribute("aria-hidden", "true");
    navLinks.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "true");
    
    // Cleanup focus trap
    if (removeTrapFocus) {
        removeTrapFocus();
        removeTrapFocus = null;
    }
    
    // Restore focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

// Mobile Menu
function toggleMobileMenu() {
    if (!navContainer || !menuIconContainer) return;
    
    const isExpanded = navContainer.classList.contains("active");
    navContainer.classList.toggle("active");
    
    // Update ARIA
    menuIconContainer.setAttribute("aria-expanded", String(!isExpanded));
    const navLinksElement = document.getElementById("nav-links");
    if (navLinksElement) {
        navLinksElement.setAttribute("aria-hidden", String(isExpanded));
    }
}

// Mobile Search
function openMobileSearch() {
    if (!mobileSearchInput) return;
    
    lastFocusedElement = document.activeElement;
    const mobileOverlay = document.getElementById("mobile-search-overlay");
    if (mobileOverlay) {
        mobileOverlay.setAttribute("aria-hidden", "false");
        
        // Apply focus trap
        if (removeMobileTrapFocus) removeMobileTrapFocus(); // Cleanup any existing
        removeMobileTrapFocus = trapFocus(mobileOverlay);
    }
}

function closeMobileSearch() {
    const mobileOverlay = document.getElementById("mobile-search-overlay");
    if (mobileOverlay) {
        mobileOverlay.setAttribute("aria-hidden", "true");
    }
    
    // Cleanup focus trap
    if (removeMobileTrapFocus) {
        removeMobileTrapFocus();
        removeMobileTrapFocus = null;
    }
    
    // Restore focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

// Initialize ARIA states
function initARIA() {
    if (searchContainer) {
        searchContainer.setAttribute("aria-hidden", "true");
    }
    
    const mobileOverlay = document.getElementById("mobile-search-overlay");
    if (mobileOverlay) {
        mobileOverlay.setAttribute("aria-hidden", "true");
    }
    
    if (menuIconContainer) {
        menuIconContainer.setAttribute("aria-expanded", "false");
    }
    
    if (overlay) {
        overlay.setAttribute("aria-hidden", "true");
    }
    
    // Initialize mega menu ARIA states
    const megaMenus = document.querySelectorAll('.mega-menu');
    megaMenus.forEach(menu => {
        menu.setAttribute("aria-hidden", "true");
    });
    
    const megaMenuLinks = document.querySelectorAll('.nav-links a[data-menu]');
    megaMenuLinks.forEach(link => {
        link.setAttribute("aria-expanded", "false");
    });
    
    const megaMenuBackdrop = document.querySelector('.mega-menu-backdrop');
    if (megaMenuBackdrop) {
        megaMenuBackdrop.setAttribute("aria-hidden", "true");
    }
    
    // Initialize event listeners after DOM is ready
    initializeEventListeners();
    
    // Initialize mega menus
    initializeMegaMenus();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initARIA);

// Window Resize Handler for Mega Menus
function handleMegaMenuResize() {
    const isDesktop = window.innerWidth > 768;
    const wasDesktop = megaMenusInitialized;
    
    // Transition from desktop to mobile
    if (!isDesktop && wasDesktop) {
        if (currentMegaMenu) {
            closeMegaMenu(currentMegaMenu, true);
        }
        megaMenusInitialized = false;
        
        // Update ARIA attributes for mobile
        const megaMenuLinks = document.querySelectorAll('.nav-links a[data-menu]');
        megaMenuLinks.forEach(link => {
            link.setAttribute('aria-expanded', 'false');
            link.setAttribute('aria-haspopup', 'false');
        });
        
        // Ensure panels remain hidden on mobile
        const megaMenus = document.querySelectorAll('.mega-menu');
        megaMenus.forEach(menu => {
            menu.setAttribute('aria-hidden', 'true');
        });
    }
    // Transition from mobile to desktop
    else if (isDesktop && !wasDesktop) {
        initializeMegaMenus();
        
        // Restore ARIA attributes for desktop
        const megaMenuLinks = document.querySelectorAll('.nav-links a[data-menu]');
        megaMenuLinks.forEach(link => {
            link.setAttribute('aria-expanded', 'false');
            link.setAttribute('aria-haspopup', 'true');
        });
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add resize listener
window.addEventListener('resize', debounce(handleMegaMenuResize, 150));