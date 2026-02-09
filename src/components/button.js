/*
 ** Button Component
 ** Displays a clickable link or button element
 ** Usage:
 ** <x-button
 **   href="https://example.com"
 **   external="true"
 **   variant="outline"
 **   aria-label="View linked page"
 **   size="large"
 **   pill
 **   slanted
 ** >
 **   <span slot="label">More Info</span>
 ** </x-button>
 */

// Import stylesheets
import resetCss from '../css/reset.css?inline';
import typographyCss from '../css/typography.css?inline';
import eventsCss from '../css/events.css?inline';

// Prepare stylesheets
const resetStyles = new CSSStyleSheet();
resetStyles.replaceSync(resetCss);

const typographyStyles = new CSSStyleSheet();
typographyStyles.replaceSync(typographyCss);

const eventsStyles = new CSSStyleSheet();
eventsStyles.replaceSync(eventsCss);

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: inline-block;
        height: fit-content;
        width: fit-content;
        color: var(--white-clr, #ffffff);
        --fill-clr: var(--primary-clr, #1cade8);
        --bdr-rd: 0;
        --fs: var(--fs-std, 1rem);
        --pd: 0.5rem .75rem 0.5rem 1rem;
    }

    :host([round]) a,
    :host([round]) button {
        --bdr-rd: 0.6rem;
    }

    :host([pill]) a,
    :host([pill]) button {
        --bdr-rd: 10rem;
    }

    :host([slanted]) a,
    :host([slanted]) button {
        clip-path: polygon(0.6rem 0, 100% 0, calc(100% - 0.6rem) 100%, 0% 100%);
    }

    .small {
        --fs: var(--fs-sm, 0.875rem);
        --pd: 0.25rem 0.5rem 0.25rem 0.75rem;

        svg {
            scale: 0.875;
        }
    }

    .large {
        --fs: var(--fs-md, 1.25rem);
        --pd: 0.75rem 1.1rem 0.75rem 1.25rem;

        svg {
            scale: 1.25;
        }
    }

    button {
        appearance: none;
    }

    a, button {
        display: inline-flex;
        box-sizing: border-box;
        cursor: pointer;
        color: inherit;
        line-height: 1;
        text-decoration: none;
        font-size: var(--fs);
        font-family: var(--header-font, sans-serif);
        font-weight: var(--fw-semibold, 500);
        letter-spacing: 0.025rem;
        padding: var(--pd);
        align-items: center;
        border-radius: var(--bdr-rd);
        background-color: var(--fill-clr);
        border: 0.125rem var(--fill-clr) solid;
        box-shadow: var(--button-shadow, none);
    }

    svg {
        display: inline-block;
        overflow: visible;
        color: inherit;
        fill: currentColor;
        line-height: inherit;
        transition: transform 0.2s;
        transform: translateX(0);
        will-change: transform;

        path:nth-child(2) {
            stroke-dasharray: 10;
            stroke-dashoffset: 10;
            transition: stroke-dashoffset 0.2s;
            will-change: stroke-dashoffset;
        }
    }

    a:focus-visible, button:focus-visible {
        outline: 0.125rem solid var(--fill-clr);
        outline-offset: 0.125rem;

        svg {
            transform: translateX(30%);

            path:nth-child(2) {
                stroke-dashoffset: 20;
            }
        } 
    }

    :host(:hover), a:active, button:active {
        svg {
            transform: translateX(30%);

            path:nth-child(2) {
                stroke-dashoffset: 20;
            }
        }  
    }

    a:active, button:active {
        background-color: color-mix(in oklch, var(--fill-clr), var(--black-clr-fxd) 5%);
        border-color: color-mix(in oklch, var(--fill-clr), var(--black-clr-fxd) 5%);
    }

    :host([disabled]) {
        cursor: not-allowed;
    }

    :host([disabled]) a,
    :host([disabled]) button {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .white {
        --fill-clr: var(--white-clr-fxd, #ffffff);
        color: var(--black-clr-fxd);
    }

    .outline {
        color: var(--fill-clr);
        background-color: transparent;

        &:hover, &:active {
            background-color: transparent;
        }

        &:active {
            color: color-mix(in oklch, var(--fill-clr), var(--black-clr-fxd) 5%);
        }
    }
        
    @media (prefers-reduced-motion: reduce) {
        svg {
            transform: translateX(30%);
            
            path:nth-child(2) {
                stroke-dashoffset: 20;
            }
        }
    }
`);

class ButtonComponent extends HTMLElement {
    // Private fields
    #boundHandleClick = null;

    // Observe attributes
    static get observedAttributes() {
        return [
            'href',
            'variant',
            'size',
            'label',
            'aria-label',
            'aria-labelledby',
            'external',
            'target',
            'rel',
            'slanted',
        ];
    }

    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [
            resetStyles,
            typographyStyles,
            eventsStyles,
            componentStyles,
        ];
        this.#boundHandleClick = this.#handleClick.bind(this);
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
        this.addEventListener('click', this.#boundHandleClick);
    }

    // Clean up when removed from DOM
    disconnectedCallback() {
        this.removeEventListener('click', this.#boundHandleClick);
    }

    // Handle click events
    #handleClick(event) {
        if (this.hasAttribute('disabled')) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }

    // Called when observed attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Render the component
    render() {
        const href = this.getAttribute('href');
        const variant = this.getAttribute('variant') || 'primary';
        const size = this.getAttribute('size') || 'medium';
        const label = this.getAttribute('label') || 'More Info';
        const ariaLabel = this.getAttribute('aria-label');
        const ariaLabelledby = this.getAttribute('aria-labelledby');

        const isExternal = this.getAttribute('external') === 'true';
        const target =
            this.getAttribute('target') || (isExternal ? '_blank' : '');
        const rel =
            this.getAttribute('rel') ||
            (isExternal ? 'noopener noreferrer' : '');

        let content = `
            <slot name="label" part="label">${label}</slot>
        `;

        if (href) {
            this.shadowRoot.innerHTML = `
            <a href="${href}" class="${variant} ${size}" part="base"
               ${target ? `target="${target}"` : ''}
               ${rel ? `rel="${rel}"` : ''}
               ${this.hasAttribute('disabled') ? 'aria-disabled="true"' : ''}
               ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} ${
                   ariaLabelledby ? `aria-labelledby="${ariaLabelledby}"` : ''
               }>
                ${content}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    part="icon"
                >
                    <path
                        fill="currentColor"
                        d="M7.28033 3.21967C6.98744 2.92678 6.51256 2.92678 6.21967 3.21967C5.92678 3.51256 5.92678 3.98744 6.21967 4.28033L7.28033 3.21967ZM11 8L11.5303 8.53033C11.8232 8.23744 11.8232 7.76256 11.5303 7.46967L11 8ZM6.21967 11.7197C5.92678 12.0126 5.92678 12.4874 6.21967 12.7803C6.51256 13.0732 6.98744 13.0732 7.28033 12.7803L6.21967 11.7197ZM6.21967 4.28033L10.4697 8.53033L11.5303 7.46967L7.28033 3.21967L6.21967 4.28033ZM10.4697 7.46967L6.21967 11.7197L7.28033 12.7803L11.5303 8.53033L10.4697 7.46967Z"
                    ></path>
                    <path
                        stroke="currentColor"
                        d="M1.75 8H11"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    ></path>
                </svg>
            </a>
        `;
        } else {
            this.shadowRoot.innerHTML = `
            <button type="button" class="${variant} ${size}" part="base"
                ${this.hasAttribute('disabled') ? 'disabled' : ''}
                ${ariaLabel ? `aria-label="${ariaLabel}"` : ''} ${
                    ariaLabelledby ? `aria-labelledby="${ariaLabelledby}"` : ''
                }>
                ${content}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    part="icon"
                >
                    <path
                        fill="currentColor"
                        d="M7.28033 3.21967C6.98744 2.92678 6.51256 2.92678 6.21967 3.21967C5.92678 3.51256 5.92678 3.98744 6.21967 4.28033L7.28033 3.21967ZM11 8L11.5303 8.53033C11.8232 8.23744 11.8232 7.76256 11.5303 7.46967L11 8ZM6.21967 11.7197C5.92678 12.0126 5.92678 12.4874 6.21967 12.7803C6.51256 13.0732 6.98744 13.0732 7.28033 12.7803L6.21967 11.7197ZM6.21967 4.28033L10.4697 8.53033L11.5303 7.46967L7.28033 3.21967L6.21967 4.28033ZM10.4697 7.46967L6.21967 11.7197L7.28033 12.7803L11.5303 8.53033L10.4697 7.46967Z"
                    ></path>
                    <path
                        stroke="currentColor"
                        d="M1.75 8H11"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    ></path>
                </svg>
            </button>
        `;
        }
    }
}

// Register the component
customElements.define('x-button', ButtonComponent);
