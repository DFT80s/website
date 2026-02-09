/*
 ** Footer Component
 ** Displays the global footer for the site
 ** Usage:
 ** <x-footer></x-footer>
 */

// Import nested components
import './current-year.js';
import './icon.js';
import './obscured-email.js';

class FooterComponent extends HTMLElement {
    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Render the component
    render() {
        this.innerHTML = `
            <footer>
                <div class="footer-left">
                    <x-current-year
                        prepend="© "
                        append=" Company Name. All rights reserved."
                    ></x-current-year>
                    <div class="footer-social">
                        <a href="https://meta.com/yourusername" aria-label="Meta" target="_blank" rel="noopener noreferrer">
                            <x-icon name="meta" size="20"></x-icon>
                        </a>
                        <a href="https://x.com/yourusername" aria-label="X" target="_blank" rel="noopener noreferrer">
                            <x-icon name="x" size="16"></x-icon>
                        </a>
                    </div>
                </div>
                <div class="footer-right">
                    <div class="footer-links">
                        <a href="/privacy">Privacy</a>
                        <span aria-hidden="true">|</span>
                        <a href="/cookies">Cookie</a>
                        <span aria-hidden="true">|</span>
                        <a href="/terms">Terms</a>
                    </div>
                </div>
            </footer>
        `;
    }
}

// Register the component
customElements.define('x-footer', FooterComponent);
