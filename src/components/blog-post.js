/*
 ** Blog Post Component
 ** Displays a single blog post from WordPress
 **
 ** Usage:
 ** <x-blog-post slug="my-post-slug"></x-blog-post>
 **
 ** Preview Mode (for draft/private posts):
 ** http://localhost:8888/blog/post-slug?preview=true&token=YOUR_PREVIEW_TOKEN
 ** Production: https://yourdomain.com/blog/post-slug?preview=true&token=YOUR_PREVIEW_TOKEN
 **
 ** Requirements:
 ** - WordPress JWT Authentication plugin installed and configured
 ** - Environment variables: WP_USERNAME, WP_PASSWORD, PREVIEW_TOKEN
 */

// Import API functions
import { getPost, getFeaturedImage } from '../js/api/wordpress.js';

// Import DOMPurify for sanitization
import DOMPurify from 'dompurify';

// Import nested components
import './loader.js';
import './alert.js';
import './icon.js';

// Import stylesheets
import resetCss from '../css/reset.css?inline';
import typographyCss from '../css/typography.css?inline';
import eventsCss from '../css/events.css?inline';
import css from './blog-post.css?inline';

// Prepare stylesheets
const resetStyles = new CSSStyleSheet();
resetStyles.replaceSync(resetCss);

const typographyStyles = new CSSStyleSheet();
typographyStyles.replaceSync(typographyCss);

const eventsStyles = new CSSStyleSheet();
eventsStyles.replaceSync(eventsCss);

const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(css);

class BlogPostComponent extends HTMLElement {
    // Observed attributes
    static get observedAttributes() {
        return ['slug'];
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
    }

    // Called when component is added to the DOM
    async connectedCallback() {
        const slug = this.getAttribute('slug');

        // Check for preview mode in URL
        const urlParams = new URLSearchParams(window.location.search);
        const preview = urlParams.has('preview');
        const token = urlParams.get('token');

        if (slug) {
            await this.loadPost(slug, preview, token);
        } else {
            this.renderError('No slug provided');
        }
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && oldValue !== newValue && this.isConnected) {
            // Check for preview mode when attribute changes
            const urlParams = new URLSearchParams(window.location.search);
            const preview = urlParams.has('preview');
            const token = urlParams.get('token');
            this.loadPost(newValue, preview, token);
        }
    }

    // Load post data
    async loadPost(slug, preview = false, token = null) {
        this.renderLoading();

        try {
            this.post = await getPost(slug, preview, token);
            this.render();
        } catch (error) {
            this.renderError('Failed to load blog post');
        }
    }

    // Render loading state
    renderLoading() {
        this.shadowRoot.innerHTML = `<x-loader></x-loader>`;
    }

    // Render error state
    renderError(message) {
        this.shadowRoot.innerHTML = `
            <x-alert variant="error">
                <x-icon slot="icon" name="error" size="20"></x-icon>
                <span slot="message"><strong>Error: </strong>${message}</span>
            </x-alert>
        `;
    }

    // Render the component
    render() {
        if (!this.post) return;

        const featuredImageData = getFeaturedImage(this.post);

        // Use WordPress URL directly (WP already provides responsive srcsets)
        let featuredImageHTML = '';
        if (featuredImageData?.url) {
            const escapedUrl =
                featuredImageData.url
                    ?.replace(/"/g, '&quot;')
                    ?.replace(/'/g, '&#39;') || '';
            const safeAlt = DOMPurify.sanitize(
                featuredImageData.alt || this.post.title.rendered,
                { ALLOWED_TAGS: [] },
            );

            if (escapedUrl) {
                const srcsetAttr = featuredImageData.srcset
                    ? `srcset="${featuredImageData.srcset.replace(/"/g, '&quot;')}" sizes="(max-width: 1200px) 100vw, 1200px"`
                    : '';
                featuredImageHTML = `<img
                    src="${escapedUrl}"
                    ${srcsetAttr}
                    alt="${safeAlt}"
                    width="${parseInt(featuredImageData.width) || 1200}"
                    height="${parseInt(featuredImageData.height) || 675}"
                    class="featured-image"
                    fetchpriority="high"
                />`;
            }
        }

        // Sanitize content for security
        const safeTitle = DOMPurify.sanitize(this.post.title.rendered, {
            ALLOWED_TAGS: [],
        });
        const safeContent = DOMPurify.sanitize(this.post.content.rendered);

        // Extract categories from post
        const categories = this.post._embedded?.['wp:term']?.[0] || [];
        const categoriesHTML = categories.length
            ? `<div class="post-categories">
                ${categories
                    .map(
                        cat =>
                            `<a href="/blog/c/${cat.slug}" class="category-pill">${DOMPurify.sanitize(
                                cat.name,
                                { ALLOWED_TAGS: [] },
                            )}</a>`,
                    )
                    .join('')}
            </div>`
            : '';

        this.shadowRoot.innerHTML = `
            <article class="post-article">
                <div class="post-header">
                    ${categoriesHTML}
                    <div class="post-title">
                        <h1>${safeTitle}</h1>
                    </div>
                    <div class="post-meta">
                        <div class="post-author">
                            <x-icon name="circleUser" size="18"></x-icon>
                            <span>${DOMPurify.sanitize(
                                this.post._embedded?.author?.[0]?.name ||
                                    this.post.yoast_head_json?.author ||
                                    'Admin',
                                { ALLOWED_TAGS: [] },
                            )}</span>
                        </div>
                        <div class="post-date">
                            <x-icon name="calendar" size="18"></x-icon>
                            <span>${new Date(this.post.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                ${featuredImageHTML}
                <div class="post-content txt-flw">
                    ${safeContent}
                </div>
            </article>
        `;
    }
}

// Register the component
customElements.define('x-blog-post', BlogPostComponent);
