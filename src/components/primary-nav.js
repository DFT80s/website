/*
 ** Primary Nav Component
 ** Displays the primary navigation menu
 ** Usage:
 ** <x-primary-nav>
 **   <nav class="site-nav" aria-label="Primary">...</nav>
 ** </x-primary-nav>
 **
 ** The <nav> is provided as Light DOM content for SEO discoverability.
 ** The component attaches behaviour and injects component styles.
 */

// Import nested components
import './icon.js';

// Import component stylesheet
import css from './primary-nav.css?inline';

// Inject component styles into the document head once
if (!document.querySelector('#primary-nav-styles')) {
    const style = document.createElement('style');
    style.id = 'primary-nav-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

class PrimaryNavComponent extends HTMLElement {
    // Private fields
    #initialized = false;
    #boundHandleDocumentClick = null;
    #boundHandleDocumentKeydown = null;
    #boundHandleResize = null;

    // Called when component is created
    constructor() {
        super();
        // Bind event handlers once in constructor
        this.#boundHandleDocumentClick = this.#handleDocumentClick.bind(this);
        this.#boundHandleDocumentKeydown =
            this.#handleDocumentKeydown.bind(this);
        this.#boundHandleResize = this.#handleResize.bind(this);
    }

    // Called when component is added to the DOM
    connectedCallback() {
        // Mark the current page link
        this.#markCurrentPage();

        // Initialise menu behaviour
        this.initializeMenu();

        // Add document listeners only once
        if (!this.#initialized) {
            document.addEventListener('click', this.#boundHandleDocumentClick);
            document.addEventListener(
                'keydown',
                this.#boundHandleDocumentKeydown,
            );
            window.addEventListener('resize', this.#boundHandleResize);
            this.#initialized = true;
        }
    }

    // Clean up when removed from DOM
    disconnectedCallback() {
        // Clean up document listeners
        document.removeEventListener('click', this.#boundHandleDocumentClick);
        document.removeEventListener(
            'keydown',
            this.#boundHandleDocumentKeydown,
        );
        window.removeEventListener('resize', this.#boundHandleResize);
        this.#initialized = false;
    }

    // Mark the current page link based on the URL
    #markCurrentPage() {
        const currentPath = window.location.pathname;
        this.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            const isCurrent =
                href === currentPath ||
                (href !== '/' && currentPath.startsWith(href + '/'));
            if (isCurrent) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    // Initialize menu functionality
    initializeMenu() {
        const toggleBtn = this.querySelector('.menu-toggle');
        const navList = this.querySelector('.nav-list');
        const overlay = this.querySelector('.drawer-overlay');

        const closeMenu = () => {
            navList.classList.remove('is-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            // Update inert state
            const isVisible =
                window.getComputedStyle(toggleBtn).display !== 'none';
            if (isVisible) {
                navList.setAttribute('inert', '');
            }
        };

        toggleBtn.addEventListener('click', () => {
            const isExpanded =
                toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            navList.classList.toggle('is-open');
            // Toggle inert if toggleBtn is visible
            const isVisible =
                window.getComputedStyle(toggleBtn).display !== 'none';
            if (isVisible) {
                navList.toggleAttribute(
                    'inert',
                    !navList.classList.contains('is-open'),
                );
            } else {
                navList.removeAttribute('inert');
            }
        });

        // Close menu when overlay is clicked
        if (overlay) {
            overlay.addEventListener('click', closeMenu);
        }

        // Set inert initially if toggleBtn is visible and navList is not open
        const isVisible = window.getComputedStyle(toggleBtn).display !== 'none';
        if (isVisible && !navList.classList.contains('is-open')) {
            navList.setAttribute('inert', '');
        } else {
            navList.removeAttribute('inert');
        }

        // Handle sub-nav toggling
        navList.querySelectorAll('.has-children > a').forEach(parentLink => {
            parentLink.setAttribute('aria-expanded', 'false');
            const subnav = parentLink.nextElementSibling;
            if (subnav) subnav.setAttribute('aria-hidden', 'true');

            parentLink.addEventListener('click', e => {
                // Prevent scroll for hash links
                if (parentLink.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                }
                // Toggle subnav
                const expanded =
                    parentLink.getAttribute('aria-expanded') === 'true';
                parentLink.setAttribute('aria-expanded', String(!expanded));
                if (subnav) {
                    subnav.setAttribute('aria-hidden', String(expanded));
                    subnav.classList.toggle('subnav-open', !expanded);
                }
            });
        });

        // Close menu when a link is clicked
        navList.querySelectorAll('li:not(.has-children) > a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });
    }

    // Handle document clicks to close menus
    #handleDocumentClick(e) {
        const navList = this.querySelector('.nav-list');
        const toggleBtn = this.querySelector('.menu-toggle');

        // Check if click originates inside the component shadow DOM
        // With Shadow DOM, 'this' refers to the host element
        // If the path doesn't include the host, it's an outside click
        const path = e.composedPath();
        const isInside = path.includes(this);

        // Close if nav-list is open and click is outside the component entirely
        // (Note: internal clicks on overlay/links are handled by internal listeners)
        if (navList?.classList.contains('is-open') && !isInside) {
            navList.classList.remove('is-open');
            toggleBtn?.setAttribute('aria-expanded', 'false');
            // Re-apply inert if needed
            const isVisible =
                window.getComputedStyle(toggleBtn).display !== 'none';
            if (isVisible) {
                navList.setAttribute('inert', '');
            }
        }

        // Hide all open subnavs if click is outside any parent link or subnav
        // If click was outside, we close subnavs.
        if (!isInside) {
            const parentLinks =
                navList?.querySelectorAll('.has-children > a') || [];
            parentLinks.forEach(parentLink => {
                parentLink.setAttribute('aria-expanded', 'false');
                const subnav = parentLink.nextElementSibling;
                if (subnav) {
                    subnav.setAttribute('aria-hidden', 'true');
                    subnav.classList.remove('subnav-open');
                }
            });
        }
    }

    // Handle Escape key to close menu
    #handleDocumentKeydown(e) {
        const navList = this.querySelector('.nav-list');
        const toggleBtn = this.querySelector('.menu-toggle');

        if (e.key === 'Escape' && navList?.classList.contains('is-open')) {
            navList.classList.remove('is-open');
            toggleBtn?.setAttribute('aria-expanded', 'false');
            toggleBtn?.focus();
            // Re-apply inert
            const isVisible =
                window.getComputedStyle(toggleBtn).display !== 'none';
            if (isVisible) {
                navList.setAttribute('inert', '');
            }
        }
    }

    // Responsive handling
    #handleResize() {
        const toggleBtn = this.querySelector('.menu-toggle');
        const navList = this.querySelector('.nav-list');
        if (toggleBtn && navList) {
            const isVisible =
                window.getComputedStyle(toggleBtn).display !== 'none';
            if (!isVisible) {
                navList.removeAttribute('inert');
            }
        }
    }
}

// Register the component
customElements.define('x-primary-nav', PrimaryNavComponent);
