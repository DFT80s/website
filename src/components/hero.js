/*
 ** Hero Component
 ** Full-bleed hero section with background media, vertically/horizontally aligned content.
 ** Content is in the light DOM — pass heading, standfirst, and button as direct children.
 **
 ** Usage:
 ** <x-hero
 **   brightness="0.5"
 **   min-height="70vh"
 **   align-v="center"
 **   align-h="left"
 ** >
 **   <x-image slot="background" src="..." alt="..." width="..." height="..." fetchpriority="high"></x-image>
 **   <h1 slot="heading" class="hero-txt wht-txt">Heading</h1>
 **   <h2 slot="standfirst" class="stndfrst-txt wht-txt">Standfirst text</h2>
 **   <x-button slot="button" href="..." variant="white" pill>
 **     <span slot="label">CTA Label</span>
 **   </x-button>
 ** </x-hero>
 **
 ** Attributes:
 ** - brightness: Filter brightness applied to the background media (0–1, default: 0.7)
 ** - min-height:  Minimum height of the hero section (any CSS value, default: '40rem')
 ** - height:       Exact height of the hero section (any CSS value, default: 'auto')
 ** - align-v:      Vertical alignment of content — 'top', 'center', 'bottom' (default: 'center')
 ** - align-h:      Horizontal alignment of content text — 'left', 'center', 'right' (default: 'left')
 */

/* Import stylesheets */
import './hero.css';

class HeroComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['brightness', 'min-height', 'height', 'align-v', 'align-h'];
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.#wrapContent();
        this.render();
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Wrap non-background children in a .hero-content div (once only)
    // This keeps light DOM content whilst adding the layout wrapper
    #wrapContent() {
        if (this.querySelector('.hero-content')) return;

        const bgEl = this.querySelector('[slot="background"]');
        const contentChildren = [...this.children].filter(el => el !== bgEl);

        if (contentChildren.length) {
            const wrapper = document.createElement('div');
            wrapper.className = 'hero-content c-grid txt-flw';
            contentChildren.forEach(el => wrapper.appendChild(el));
            this.appendChild(wrapper);
        }
    }

    // Map valign attribute to CSS align-content values for grid
    #resolveValign(valign) {
        const map = { top: 'start', center: 'center', bottom: 'end' };
        return map[valign] || valign;
    }

    // Map halign attribute to CSS justify-items values for grid
    #resolveHalign(halign) {
        const map = { left: 'start', center: 'center', right: 'end' };
        return map[halign] || halign;
    }

    // Map halign attribute to CSS text-align values
    #resolveTextAlign(halign) {
        const map = { left: 'left', center: 'center', right: 'right' };
        return map[halign] || halign;
    }

    // Apply attributes as CSS custom properties and inline styles
    render() {
        if (this.hasAttribute('brightness')) {
            this.style.setProperty(
                '--hero-brightness',
                this.getAttribute('brightness'),
            );
        }
        if (this.hasAttribute('min-height')) {
            this.style.setProperty(
                '--hero-min-height',
                this.getAttribute('min-height'),
            );
        }
        if (this.hasAttribute('height')) {
            this.style.setProperty(
                '--hero-height',
                this.getAttribute('height'),
            );
        }
        if (this.hasAttribute('align-v')) {
            this.style.setProperty(
                '--hero-align-v',
                this.#resolveValign(this.getAttribute('align-v')),
            );
        }
        if (this.hasAttribute('align-h')) {
            this.style.setProperty(
                '--hero-align-h',
                this.#resolveHalign(this.getAttribute('align-h')),
            );
            this.style.setProperty(
                '--hero-text-align',
                this.#resolveTextAlign(this.getAttribute('align-h')),
            );
        }
    }
}

// Register the component
customElements.define('x-hero', HeroComponent);
