/*
 ** Current Year Component
 ** Displays the current year with optional prepend/append text
 ** Usage:
 ** <x-current-year prepend="© " append=" My Company"></x-current-year>
 */
class CurrentYearComponent extends HTMLElement {
    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Observe attributes
    static get observedAttributes() {
        return ['prepend', 'append'];
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Update the component's content
    render() {
        // Get the current year
        const d = new Date();
        const year = d.getFullYear();

        // Get prepend and append attributes (default to empty string)
        const prepend = this.getAttribute('prepend') || '';
        const append = this.getAttribute('append') || '';

        // Set the text content with prepend + year + append
        this.textContent = `${prepend}${year}${append}`;
    }
}

// Register the component
customElements.define('x-current-year', CurrentYearComponent);
