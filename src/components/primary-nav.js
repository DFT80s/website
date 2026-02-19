/*
 ** Primary Nav Component
 ** Displays the primary navigation menu
 ** Usage:
 ** <x-primary-nav></x-primary-nav>
 */

// Import nested components
import './icon.js';

// Import stylesheets
import resetCss from '../css/reset.css?inline';
import typographyCss from '../css/typography.css?inline';
import eventsCss from '../css/events.css?inline';
import css from './primary-nav.css?inline';

// Prepare stylesheets
const resetStyles = new CSSStyleSheet();
resetStyles.replaceSync(resetCss);

const typographyStyles = new CSSStyleSheet();
typographyStyles.replaceSync(typographyCss);

const eventsStyles = new CSSStyleSheet();
eventsStyles.replaceSync(eventsCss);

const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(css);

class PrimaryNavComponent extends HTMLElement {
    // Private fields
    #menuItems = null;
    #initialized = false;
    #boundHandleDocumentClick = null;
    #boundHandleDocumentKeydown = null;
    #boundHandleResize = null;

    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Bind event handlers once in constructor
        this.#boundHandleDocumentClick = this.#handleDocumentClick.bind(this);
        this.#boundHandleDocumentKeydown =
            this.#handleDocumentKeydown.bind(this);
        this.#boundHandleResize = this.#handleResize.bind(this);
    }

    // Property setter
    set menuItems(items) {
        this.#menuItems = items;
        if (this.isConnected) {
            this.render();
        }
    }

    // Property getter
    get menuItems() {
        return this.#menuItems || this.getDefaultMenu();
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();

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

    // Default menu items
    getDefaultMenu() {
        return [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Contact', url: '/contact' },
        ];
    }

    // Helper to recursively render menu items
    renderMenu(items, currentPath) {
        return items
            .map(item => {
                // Exact match or prefix match for section pages (blog/slug, projects/slug, etc)
                const isCurrent =
                    item.url === currentPath ||
                    currentPath.startsWith(item.url + '/');
                const hasChildren =
                    Array.isArray(item.children) && item.children.length > 0;
                return `
                    <li${hasChildren ? ' class="has-children"' : ''}>
                        <a href="${item.url}"${
                            isCurrent ? ' aria-current="page"' : ''
                        }>${item.label}</a>
                        ${
                            hasChildren
                                ? `<ul class="nav-sublist">${this.renderMenu(
                                      item.children,
                                      currentPath,
                                  )}</ul>`
                                : ''
                        }
                    </li>
                `;
            })
            .join('');
    }

    // Render the component
    render() {
        const currentPath = window.location.pathname;
        const menuHTML = this.renderMenu(this.menuItems, currentPath);

        this.shadowRoot.adoptedStyleSheets = [
            resetStyles,
            typographyStyles,
            eventsStyles,
            componentStyles,
        ];

        this.shadowRoot.innerHTML = `
            <nav class="site-nav" aria-label="Primary">
                <button class="menu-toggle" aria-label="Toggle menu button" aria-controls="primary-nav-list" aria-expanded="false">
                    <svg
                        class="hamburger"
                        viewBox="0 0 50 50"
                        width="40"
                        xml:space="preserve"
                    >
                        <path
                            class="line"
                            d="M11.6,16.96h32.16c2.96,0,5.36,2.4,5.36,5.36s-2.4,5.36-5.36,5.36H11.6c-5.92,0-10.72-4.8-10.72-10.72S5.68,6.24,11.6,6.24h16.08v37.52"
                            fill="none"
                            stroke="var(--white-clr, #ffffff)"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                        />
                    </svg>
                </button>

                <ul id="primary-nav-list" class="nav-list">
                    ${menuHTML}
                    <li class="social-icons">
                        <a href="https://www.facebook.com/share/1FAswXcV69/" aria-label="Meta" target="_blank" rel="noopener noreferrer">
                            <x-icon name="meta" size="20"></x-icon>
                        </a>
                        <!--<a href="https://x.com/dft80s" aria-label="X" target="_blank" rel="noopener noreferrer">
                            <x-icon name="x" size="16"></x-icon>
                        </a>-->
                    </li>
                </ul>

                <div class="drawer-overlay" aria-hidden="true"></div>
            </nav>
        `;

        this.initializeMenu();
    }

    // Initialize menu functionality
    initializeMenu() {
        const toggleBtn = this.shadowRoot.querySelector('.menu-toggle');
        const navList = this.shadowRoot.querySelector('.nav-list');
        const overlay = this.shadowRoot.querySelector('.drawer-overlay');

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
        const navList = this.shadowRoot.querySelector('.nav-list');
        const toggleBtn = this.shadowRoot.querySelector('.menu-toggle');

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
        const navList = this.shadowRoot.querySelector('.nav-list');
        const toggleBtn = this.shadowRoot.querySelector('.menu-toggle');

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
        const toggleBtn = this.shadowRoot.querySelector('.menu-toggle');
        const navList = this.shadowRoot.querySelector('.nav-list');
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
