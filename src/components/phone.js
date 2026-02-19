/*
 ** Phone Component
 ** Displays a phone link with an optional icon
 ** Automatically converts UK numbers (starting with 0) to international format (+44)
 **
 ** Usage:
 ** <x-phone number="01234 567890" icon="phone"></x-phone>
 ** <x-phone number="01234 567890" icon="phone" country="uk"></x-phone>
 **
 ** For international numbers, pass them already in international format with +:
 ** <x-phone number="+1 555 123 4567" icon="phone"></x-phone>
 ** <x-phone number="+33 6 12 34 56 78" icon="phone"></x-phone>
 **
 ** The component only auto-converts UK numbers starting with 0.
 ** For other countries, provide the number in international format.
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
`);

class PhoneComponent extends HTMLElement {
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
        const number = this.getAttribute('number') || '';
        const icon = this.getAttribute('icon') || '';
        const country = this.getAttribute('country') || 'uk';

        const iconHTML = icon
            ? `<x-icon name="${icon}" size="20"></x-icon>`
            : '';

        // Strip spaces and other formatting for tel: link
        let telNumber = number.replace(/\s+/g, '');

        // Convert UK numbers starting with 0 to international format
        if (country.toLowerCase() === 'uk' && telNumber.startsWith('0')) {
            telNumber = '+44' + telNumber.slice(1);
        }

        this.shadowRoot.innerHTML = `<a href="tel:${telNumber}" part="link" aria-label="Call ${number}">${iconHTML}${number}</a>`;
    }
}

// Register the component
customElements.define('x-phone', PhoneComponent);
