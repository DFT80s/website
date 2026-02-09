/*
 ** Alert Component
 ** Displays alert messages with different variants
 ** Usage:
 ** <x-alert variant="success">
 **   <x-icon slot="icon" name="check" size="20"></x-icon>
 **   <span slot="message"><strong>Succes: </strong>Your changes have been saved!</span>
 ** </x-alert>
 */

// Import nested components
import './icon.js';

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: block;
        margin-block: 1rem;
    }
    
    .alert-container {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        border-radius: 10rem;
        border: 1px solid;
        font-size: var(--fs-std, 1rem);
        line-height: 1.5;
    }
    
    /* Default variant */
    .alert-container.default {
        background-color: light-dark(
            oklch(from var(--primary-clr, #f0f9ff) l c h / 0.15),
            oklch(from var(--white-clr-fxd, #080808ff ) l c h / 0.05)
        );
        border-color: var(--primary-clr, #1cade8);
        color: color-mix(in oklch, var(--primary-clr, #1cade8), var(--black-clr-fxd, #000000ff) 10%);
    }
    
    /* Error variant */
    .alert-container.error {
        background-color: light-dark(
            oklch(from var(--error-clr, #fef2f2) l c h / 0.15),
            oklch(from var(--white-clr-fxd, #080808ff ) l c h / 0.05)
        );
        border-color: var(--error-clr, #ef4444);
        color: color-mix(in oklch, var(--error-clr, #991b1b), var(--black-clr-fxd, #000000ff) 10%);
    }
    
    /* Warning variant */
    .alert-container.warning {
        background-color: light-dark(
            oklch(from var(--warning-clr, #fefce8) l c h / 0.15),
            oklch(from var(--white-clr-fxd, #080808ff ) l c h / 0.05)
        );
        border-color: var(--warning-clr, #eab308);
        color: color-mix(in oklch, var(--warning-clr, #854d0e), var(--black-clr-fxd, #000000ff) 10%);
    }
    
    /* Success variant */
    .alert-container.success {
        background-color: light-dark(
            oklch(from var(--success-clr, #f0fdf4) l c h / 0.15),
            oklch(from var(--white-clr-fxd, #080808ff ) l c h / 0.05)
        );
        border-color: var(--success-clr, #22c55e);
        color: color-mix(in oklch, var(--success-clr, #166534), var(--black-clr-fxd, #000000ff) 10%);
    }
    
    .alert-icon {
        flex-shrink: 0;
        margin-top: 0.125rem;
    }
    
    .alert-content {
        flex: 1;
    }
`);

class AlertComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['variant'];
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

    // Render the component
    render() {
        const variant = this.getAttribute('variant') || 'default';

        this.shadowRoot.innerHTML = `
            <div class="alert-container ${variant}">
                <div class="alert-icon">
                    <slot name="icon"></slot>
                </div>
                <div class="alert-content">
                    <slot name="message">Alert message</slot>
                </div>
            </div>
        `;
    }
}

// Register the component
customElements.define('x-alert', AlertComponent);
