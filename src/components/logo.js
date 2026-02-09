/*
 ** Logo Component
 ** Displays the global header for the site
 ** Usage:
 ** <x-logo height="50" link="https://example.com" external="true"></x-logo>
 */

// Import nested components
import './primary-nav.js';
import './theme-toggle.js';

class LogoComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['height', 'link', 'external'];
    }

    // Called when component is created
    constructor() {
        super();
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Render the component
    render() {
        const size = this.getAttribute('height') || '50'; // Default to 50px
        const link = this.getAttribute('link');
        const external = this.getAttribute('external') === 'true';

        const svg = `
            <svg
                height="${size}"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Site Logo"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                style="height: ${size}px;width: auto; max-width: 100%; display: block;"
            >
                <circle cx="12" cy="12" r="12" fill="var(--black-clr)" />
            </svg>
        `;

        let content = svg;
        if (link) {
            const target = external
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
            content = `<a href="${link}"${target}>${svg}</a>`;
        }

        this.innerHTML = content;
    }
}

// Register the component
customElements.define('x-logo', LogoComponent);
