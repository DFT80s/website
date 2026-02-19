/*
 ** Obscured Email Component
 ** Displays an email link with obfuscation to prevent scraping
 ** Uses Shadow DOM to hide structure from bots
 ** Usage:
 ** <x-email user="username" domain="example.com" icon="mail"></x-email>
 */

// Import nested components
import './icon.js';

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: inline;
        color: var(--link-clr, var(--primary-clr, #1cade8));
    }

    x-icon {
        color: inherit;
        margin-right: 0.4rem;
        display: inline-flex;
        vertical-align: middle;
        translate: 0 -0.0625rem;
    }

    a {
        color: inherit;
        text-decoration: none;
        cursor: pointer;
    }

    a:hover {
        text-decoration: underline;
    }
        
    .at {
        user-select: none;
    }
`);

class ObscuredEmailComponent extends HTMLElement {
    // Called when component is created
    constructor() {
        super();
        // Attach shadow DOM
        this.attachShadow({ mode: 'open' });

        // Adopt the stylesheet
        this.shadowRoot.adoptedStyleSheets = [componentStyles];
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Render the component
    render() {
        const user = this.getAttribute('user') || '';
        const domain = this.getAttribute('domain') || '';
        const icon = this.getAttribute('icon') || '';

        const iconHTML = icon
            ? `<x-icon name="${icon}" size="20"></x-icon>`
            : '';

        const email = `${user}@${domain}`;

        this.shadowRoot.innerHTML = `<a href="mailto:${email}" part="link" aria-label="Email ${user} at ${domain}">${iconHTML}${user}<span class="at">@</span>${domain}</a>`;
    }
}

// Register the component
customElements.define('x-email', ObscuredEmailComponent);
