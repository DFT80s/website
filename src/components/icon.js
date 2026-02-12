/*
 ** Icon Component
 ** Displays inline SVG icons from Lucide
 ** Get more icons: https://lucide.dev/ or https://simpleicons.org/
 ** Usage:
 ** <x-icon name="icon-name" size="20"></x-icon>
 */

// Import icon data
import { icons } from './icon-data.js';

class IconComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['name', 'size'];
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
        // Get icon name and size from attributes
        const name = this.getAttribute('name');
        const size = this.getAttribute('size') || '24'; // Default to 24px
        const icon = icons[name];

        // Warn if icon doesn't exist
        if (!icon) {
            console.warn(`Icon "${name}" not found`);
            this.innerHTML = '';
            return;
        }

        // Parse SVG string into DOM element
        const parser = new DOMParser();
        const doc = parser.parseFromString(icon, 'image/svg+xml');
        const svg = doc.querySelector('svg');

        // Update SVG attributes
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('focusable', 'false'); // Prevent focus for accessibility

        // Transfer aria-label or aria-labelledby from component to SVG
        if (this.hasAttribute('aria-label')) {
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', this.getAttribute('aria-label'));
        } else if (this.hasAttribute('aria-labelledby')) {
            svg.setAttribute('role', 'img');
            svg.setAttribute(
                'aria-labelledby',
                this.getAttribute('aria-labelledby'),
            );
        } else {
            // Hide from screen readers if no label provided (decorative)
            svg.setAttribute('aria-hidden', 'true');
        }

        // Insert SVG into component
        this.innerHTML = svg.outerHTML;
    }
}

// Register the component as <x-icon>
customElements.define('x-icon', IconComponent);
