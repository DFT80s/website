/*
 ** Grid Component
 ** Displays a grid layout with responsive and flexible options
 ** Usage:
 ** <x-grid columns="3" gap="large" align-items="center" justify-content="space-between">
 **   <div>Column 1</div>
 **   <div>Column 2</div>
 **   <div>Column 3</div>
 ** </x-grid>
 **
 ** <x-grid auto-fit min-col-width="220px" gap="small">
 **   <div>Auto 1</div>
 **   <div>Auto 2</div>
 **   <div>Auto 3</div>
 ** </x-grid>
 **
 ** <x-grid columns="2">
 **   <div class="col-span-all">Full width</div>
 **   <div>Item 1</div>
 **   <div>Item 2</div>
 ** </x-grid>
 **
 ** Attributes:
 ** - columns: Number of columns (1-4)
 ** - gap: Gap size ('small', 'medium', 'large') or custom CSS value
 ** - align-items: Vertical alignment (start, center, end, stretch)
 ** - justify-content: Horizontal alignment (start, center, end, space-between, space-around)
 ** - min-col-width: Minimum column width for auto-fit mode (e.g., '250px')
 ** - auto-fit: Enable auto-fit responsive mode (no value needed)
 */

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: block;
        --gap: 2rem;
        --gap-md: 4rem;
        --gap-lg: 6rem;
        --gap-small: 1rem;
        --gap-medium: 2rem;
        --gap-large: 4rem;
        --align-items: stretch;
        --justify-content: start;
    }

    .grid {
        display: grid;
        gap: var(--grid-gap, var(--gap));
        align-items: var(--align-items);
        justify-content: var(--justify-content);
    }

    @media (min-width: 768px) {
        .grid {
            gap: var(--grid-gap-md, var(--gap-md));
        }
    }

    @media (min-width: 1024px) {
        .grid {
            gap: var(--grid-gap-lg, var(--gap-lg));
        }
    }

    .grid.no-row-gap {
        row-gap: 0;
    }

    .grid.no-col-gap {
        column-gap: 0;
    }

    .grid > .col-span-all {
        grid-column: 1 / -1;
    }

    .grid > .can-span:only-child {
        grid-column: 1 / -1;
    }

    .grid.col-1 { grid-template-columns: 1fr; }
    .grid.col-2 { grid-template-columns: 1fr; }
    .grid.col-3 { grid-template-columns: 1fr; }
    .grid.col-4 { grid-template-columns: 1fr; }

    .grid > .col-span-2 { grid-column: span 2; }

    .grid.auto-fit {
        grid-template-columns: repeat(auto-fit, minmax(var(--min-col-width, 250px), 1fr));
    }

    @media (min-width: 768px) {
        .grid.col-2 { grid-template-columns: repeat(2, 1fr); }
        .grid.col-3 { grid-template-columns: repeat(3, 1fr); }
        .grid.col-4 { grid-template-columns: repeat(2, 1fr); }
        .grid > .col-span-2 { grid-column: span 2; }
    }

    @media (min-width: 1024px) {
        .grid.col-2 { grid-template-columns: repeat(2, 1fr); }
        .grid.col-3 { grid-template-columns: repeat(3, 1fr); }
        .grid.col-4 { grid-template-columns: repeat(4, 1fr); }
        .grid > .col-span-3 { grid-column: span 3; }
        .grid > .col-span-4 { grid-column: span 4; }
    }
`);

class GridComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return [
            'columns',
            'gap',
            'align-items',
            'justify-content',
            'min-col-width',
            'auto-fit',
        ];
    }

    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [componentStyles];
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

    // Map gap values to CSS custom properties
    getGapValue(gap) {
        const gapMap = {
            small: 'var(--gap-small)',
            medium: 'var(--gap-medium)',
            large: 'var(--gap-large)',
        };
        return gapMap[gap] || gap;
    }

    // Validate alignment values
    validateAlignment(value, type) {
        const alignOptions = ['start', 'center', 'end', 'stretch'];
        const justifyOptions = [
            'start',
            'center',
            'end',
            'space-between',
            'space-around',
        ];

        if (type === 'align-items') {
            return alignOptions.includes(value) ? value : 'stretch';
        } else if (type === 'justify-content') {
            return justifyOptions.includes(value) ? value : 'start';
        }
        return value;
    }

    // Render the component
    render() {
        const columns = this.getAttribute('columns');
        const gap = this.getAttribute('gap');
        const alignItems = this.getAttribute('align-items');
        const justifyContent = this.getAttribute('justify-content');
        const minColWidth = this.getAttribute('min-col-width');
        const autoFit = this.hasAttribute('auto-fit');

        // Build classes
        let classes = 'grid';

        // Add column class if not auto-fit
        if (!autoFit && columns) {
            const colNum = Math.max(1, Math.min(parseInt(columns), 4));
            classes += ` col-${colNum}`;
        }

        // Add auto-fit class
        if (autoFit) {
            classes += ' auto-fit';
        }

        // Render the HTML structure
        this.shadowRoot.innerHTML = `
            <div class="${classes}">
                <slot></slot>
            </div>
        `;

        // Get the grid element and apply dynamic styles
        const gridEl = this.shadowRoot.querySelector('.grid');

        // Apply gap styles
        if (gap) {
            const gapValue = this.getGapValue(gap);
            gridEl.style.setProperty('--grid-gap', gapValue);
            gridEl.style.setProperty('--grid-gap-md', gapValue);
            gridEl.style.setProperty('--grid-gap-lg', gapValue);
        }

        // Apply alignment styles
        if (alignItems) {
            const validAlign = this.validateAlignment(
                alignItems,
                'align-items',
            );
            gridEl.style.setProperty('--align-items', validAlign);
        }

        // Apply justify content styles
        if (justifyContent) {
            const validJustify = this.validateAlignment(
                justifyContent,
                'justify-content',
            );
            gridEl.style.setProperty('--justify-content', validJustify);
        }

        // Apply min column width for auto-fit
        if (minColWidth) {
            gridEl.style.setProperty('--min-col-width', minColWidth);
        }
    }
}

// Register the component
customElements.define('x-grid', GridComponent);
