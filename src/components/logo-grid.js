/*
 ** Logo Grid Component
 ** Displays a responsive grid of logo images, each optionally wrapped in a link
 **
 ** Usage:
 ** <x-logo-grid>
 **   <x-image src="/images/logo-a.svg" alt="Brand A" width="160" height="60"></x-image>
 **   <a href="https://example.com" target="_blank" rel="noopener noreferrer">
 **     <x-image src="/images/logo-b.svg" alt="Brand B" width="160" height="60"></x-image>
 **   </a>
 **   <x-image src="/images/logo-c.svg" alt="Brand C" width="160" height="60"></x-image>
 ** </x-logo-grid>
 **
 ** Attributes:
 ** - min-width: Minimum column width before wrapping (default: '120px')
 ** - max-height: Maximum height of each logo (default: '64px')
 ** - gap:        Gap size ('small', 'medium', 'large') or custom CSS value (default: 'medium')
 ** - align:      Set to 'center' to enable last-row centering via ResizeObserver (default: off)
 */

/* Import stylesheets */
import './logo-grid.css';

class LogoGridComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['min-width', 'max-height', 'gap', 'align'];
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
        this.#updateObserver();
    }

    // Called when component is removed from the DOM
    disconnectedCallback() {
        this.#observer?.disconnect();
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
            if (name === 'align') {
                this.#updateObserver();
            } else {
                this.#centerLastRow();
            }
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

    // Render the component
    render() {
        const gap = this.getAttribute('gap') || 'medium';

        if (this.hasAttribute('min-width')) {
            this.style.setProperty(
                '--logo-grid-min-width',
                this.getAttribute('min-width'),
            );
        }
        if (this.hasAttribute('max-height')) {
            this.style.setProperty(
                '--logo-grid-max-height',
                this.getAttribute('max-height'),
            );
        }
        this.style.setProperty('--logo-grid-gap', this.getGapValue(gap));
    }

    // Start or stop the ResizeObserver based on the align attribute
    #observer = null;

    #updateObserver() {
        if (this.getAttribute('align') === 'center') {
            if (!this.#observer) {
                this.#observer = new ResizeObserver(() =>
                    this.#centerLastRow(),
                );
            }
            this.#observer.observe(this);
        } else {
            this.#observer?.disconnect();
            // Reset any previously applied column placements
            [...this.children].forEach(item =>
                item.style.removeProperty('grid-column-start'),
            );
        }
    }

    // Center items in partially-filled last rows by setting explicit grid-column-start
    #centerLastRow() {
        const items = [...this.children];
        if (!items.length) return;

        // Count active columns from computed style (auto-fit collapses empty tracks)
        const computed = getComputedStyle(this);
        const columns = computed.gridTemplateColumns.trim().split(/\s+/).length;

        // Reset all explicit placements first
        items.forEach(item => item.style.removeProperty('grid-column-start'));

        const remainder = items.length % columns;
        if (remainder === 0) return; // All rows are full — nothing to center

        // Calculate the starting column so remainder items are centred
        const startCol = Math.floor((columns - remainder) / 2) + 1;
        items.slice(-remainder).forEach((item, i) => {
            item.style.gridColumnStart = startCol + i;
        });
    }
}

// Register the component
customElements.define('x-logo-grid', LogoGridComponent);
