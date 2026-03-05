/*
 ** Header Component
 ** Displays the global header for the site
 ** Usage:
 ** <x-header></x-header>
 */

// Import nested components
import './logo.js';
import './primary-nav.js';
import './theme-toggle.js';

class HeaderComponent extends HTMLElement {
    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Render the component
    render() {
        this.innerHTML = `
            <header class="site-header">
                <div class="header-left">
                    <x-logo height="60" link="/"></x-logo>
                </div>
                <div class="header-right">
                    <x-primary-nav>
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
                                <li><a href="/">Home</a></li>
                                <li><a href="/about">About</a></li>
                                <li><a href="/media">Media</a></li>
                                <li><a href="/contact-us">Contact</a></li>
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
                    </x-primary-nav>
                    <x-theme-toggle></x-theme-toggle>
                </div>
            </header>
        `;
    }
}

// Register the component
customElements.define('x-header', HeaderComponent);
