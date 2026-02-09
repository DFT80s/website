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
                    <x-logo height="75" link="/"></x-logo>
                </div>
                <div class="header-right">
                    <x-primary-nav></x-primary-nav>
                    <x-theme-toggle></x-theme-toggle>
                </div>
            </header>
        `;
    }
}

// Register the component
customElements.define('x-header', HeaderComponent);
