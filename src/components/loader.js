/*
 ** Loader Component
 ** Displays a loading spinner
 ** Usage:
 ** <x-loader></x-loader>
 */

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: grid;
        place-items: center;
        min-height: 200px;
    }

    svg {
        width: 64px;
        height: 64px;
    }

    svg circle:last-child {
        animation: spin 1s linear infinite;
        transform-origin: center;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`);

class LoaderComponent extends HTMLElement {
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

    // Render the component
    render() {
        this.shadowRoot.innerHTML = `
            <svg
                width="64"
                height="64"
                viewBox="0 0 50 50"
                aria-label="Loading"
            >
                <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="var(--grey-clr, #cccccc)"
                    stroke-width="1"
                />
                <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="var(--primary-clr, #1cade8)"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-dasharray="80,200"
                />
            </svg>
        `;
    }
}

// Register the component
customElements.define('x-loader', LoaderComponent);
