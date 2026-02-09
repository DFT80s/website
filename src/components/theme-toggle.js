/*
 ** Theme Toggle Component
 ** Displays a toggle switch for light/dark mode
 ** Usage:
 ** <x-theme-toggle></x-theme-toggle>
 */

// Create component stylesheet
const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(`
    :host {
        display: block;
    }

    .toggle-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    label {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        user-select: none;
    }

    input[type="checkbox"] {
        width: 3rem;
        height: 1.5rem;
        margin: 0;
        cursor: pointer;
        appearance: none;
        background-color: var(--grey-clr, #aebfd8);
        border-radius: 1rem;
        position: relative;
        transition: background-color 0.3s ease-in-out;
        will-change: background-color;
        border: none;
        flex-shrink: 0;
    }

    input[type="checkbox"]:focus-visible {
        outline: 0.125rem solid var(--primary-clr, #1cade8);
        outline-offset: 0.125rem;
    }

    input[type="checkbox"]:checked {
        background-color: var(--primary-clr, #1cade8);
    }

    input[type="checkbox"]::before {
        content: '';
        width: 1.1rem;
        height: 1.1rem;
        border-radius: 50%;
        border: solid 0.1rem var(--white-clr, #ffffff);
        background-color: var(--white-clr, #ffffff);
        background: linear-gradient(
            90deg,
            transparent 0% 50%,
            var(--white-clr, #ffffff) 50% 100%
        );
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(0.1rem, -50%);
        transition: transform 0.4s cubic-bezier(0.2, 0.85, 0.32, 1.2), background 0.1s linear;
        will-change: transform, background;
    }

    input[type="checkbox"]:checked::before {
        transform: translate(1.6rem, -50%);
    }

    @media (prefers-reduced-motion: reduce) {
        input[type="checkbox"],
        input[type="checkbox"]::before {
            transition: none;
        }
    }
        
    .visually-hidden {
        clip: rect(0 0 0 0);
        clip-path: inset(100%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
    }
`);

class ThemeToggleComponent extends HTMLElement {
    // Private fields
    #checkbox = null;
    #boundHandleThemeChange = null;

    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [componentStyles];
        // Bind the handler once in constructor
        this.#boundHandleThemeChange = this.#handleThemeChange.bind(this);
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
        this.initializeTheme();
    }

    // Clean up when component is removed
    disconnectedCallback() {
        // Clean up event listener
        if (this.#checkbox && this.#boundHandleThemeChange) {
            this.#checkbox.removeEventListener(
                'change',
                this.#boundHandleThemeChange,
            );
        }
    }

    // Render the component
    render() {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'toggle-wrapper';

        // Create label
        const label = document.createElement('label');
        label.setAttribute('for', 'theme-toggle');

        // Create checkbox
        this.#checkbox = document.createElement('input');
        this.#checkbox.type = 'checkbox';
        this.#checkbox.id = 'theme-toggle';
        this.#checkbox.setAttribute('role', 'switch');
        this.#checkbox.setAttribute('aria-label', 'Toggle dark mode');

        // Create label text (visually hidden but screen reader accessible)
        const labelText = document.createElement('span');
        labelText.className = 'visually-hidden';
        labelText.textContent = 'Toggle dark mode';

        // Assemble elements
        label.appendChild(this.#checkbox);
        label.appendChild(labelText);
        wrapper.appendChild(label);

        // Clear shadow root before appending
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(wrapper);
    }

    // Initialize theme based on saved preference or default
    initializeTheme() {
        // Load saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        this.#checkbox.checked = savedTheme === 'dark';

        // Listen for checkbox changes using bound handler
        this.#checkbox.addEventListener('change', this.#boundHandleThemeChange);

        // Add Enter key support for accessibility (ARIA switch pattern)
        this.#checkbox.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.#checkbox.checked = !this.#checkbox.checked;
                this.#checkbox.dispatchEvent(
                    new Event('change', { bubbles: true }),
                );
            }
        });
    }

    // Handle theme change
    #handleThemeChange(e) {
        // Add the class to disable transitions
        document.documentElement.classList.add('disable-transitions');

        // Handle theme change
        const newTheme = e.target.checked ? 'dark' : 'light';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Remove transition class after delay
        setTimeout(() => {
            document.documentElement.classList.remove('disable-transitions');
        }, 300);
    }

    // Set the theme on the document and update aria-checked
    setTheme(theme) {
        // Set data-theme on document root (html element)
        document.documentElement.setAttribute('data-theme', theme);

        // Update aria-checked for screen readers
        if (this.#checkbox) {
            this.#checkbox.setAttribute(
                'aria-checked',
                String(theme === 'dark'),
            );
        }
    }
}

// Register the component
customElements.define('x-theme-toggle', ThemeToggleComponent);
