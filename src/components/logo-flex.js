/*
 ** Logo Flex Component
 ** Displays a responsive flex row of logo images, each optionally wrapped in a link.
 ** Items wrap and center automatically — no JS centering logic needed.
 **
 ** Usage:
 ** <x-logo-flex>
 **   <x-image src="/images/logo-a.svg" alt="Brand A" width="160" height="60"></x-image>
 **   <a href="https://example.com" target="_blank" rel="noopener noreferrer">
 **     <x-image src="/images/logo-b.svg" alt="Brand B" width="160" height="60"></x-image>
 **   </a>
 **   <x-image src="/images/logo-c.svg" alt="Brand C" width="160" height="60"></x-image>
 ** </x-logo-flex>
 **
 ** Attributes:
 ** - min-width:        Item width on desktop (default: '160px')
 ** - min-width-mobile: Item width on mobile (default: '120px')
 ** - max-height:       Maximum height of each logo (default: '64px')
 ** - gap:              Gap size ('small', 'medium', 'large') or custom CSS value (default: 'medium')
 */

/* Import stylesheets */
import './logo-flex.css';

class LogoFlexComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['min-width', 'min-width-mobile', 'max-height', 'gap'];
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

    // Map named gap values to CSS custom properties
    getGapValue(gap) {
        const gapMap = {
            small: 'var(--space-sm, 1.5rem)',
            medium: 'var(--space-md, 2rem)',
            large: 'var(--space-lg, 4rem)',
        };
        return gapMap[gap] || gap;
    }

    // Apply attributes as CSS custom properties
    render() {
        const gap = this.getAttribute('gap') || 'medium';

        if (this.hasAttribute('min-width')) {
            this.style.setProperty(
                '--logo-flex-min-width',
                this.getAttribute('min-width'),
            );
        }
        if (this.hasAttribute('min-width-mobile')) {
            this.style.setProperty(
                '--logo-flex-min-width-mobile',
                this.getAttribute('min-width-mobile'),
            );
        }
        if (this.hasAttribute('max-height')) {
            this.style.setProperty(
                '--logo-flex-max-height',
                this.getAttribute('max-height'),
            );
        }
        this.style.setProperty('--logo-flex-gap', this.getGapValue(gap));
    }
}

// Register the component
customElements.define('x-logo-flex', LogoFlexComponent);
