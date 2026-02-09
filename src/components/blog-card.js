/*
 ** Blog Card Component
 ** Displays a single blog post card
 ** Usage:
 ** <x-blog-card></x-blog-card>
 ** element.post = postObject;
 */

// Import API functions
import { getFeaturedImage, getExcerpt } from '../js/api/wordpress.js';

// Import DOMPurify for sanitization
import DOMPurify from 'dompurify';

// Import nested components
import './icon.js';
import './button.js';

// Import stylesheets
import resetCss from '../css/reset.css?inline';
import typographyCss from '../css/typography.css?inline';
import eventsCss from '../css/events.css?inline';
import css from './blog-card.css?inline';

// Prepare stylesheets
const resetStyles = new CSSStyleSheet();
resetStyles.replaceSync(resetCss);

const typographyStyles = new CSSStyleSheet();
typographyStyles.replaceSync(typographyCss);

const eventsStyles = new CSSStyleSheet();
eventsStyles.replaceSync(eventsCss);

const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(css);

class BlogCardComponent extends HTMLElement {
    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._post = null;
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Post property getter/setter
    set post(data) {
        this._post = data;
        this.render();
    }

    get post() {
        return this._post;
    }

    // Render the component
    render() {
        // Apply stylesheets
        this.shadowRoot.adoptedStyleSheets = [
            resetStyles,
            typographyStyles,
            eventsStyles,
            componentStyles,
        ];

        // Render nothing if no post data
        if (!this._post) {
            this.shadowRoot.innerHTML = '';
            return; // Render nothing if no post data
        }

        // Extract post data
        const post = this._post;
        const featuredImage = getFeaturedImage(post);
        const excerpt = getExcerpt(post);

        // Replace WordPress's […] truncation marker with clean ellipsis
        // Find the last [ and remove everything after it
        const lastBracketIndex = excerpt.lastIndexOf('[');
        const trimmedExcerpt =
            lastBracketIndex > 0
                ? excerpt.substring(0, lastBracketIndex).trim() + '...'
                : excerpt;

        // Sanitize content for security
        const safeTitle = DOMPurify.sanitize(post.title.rendered, {
            ALLOWED_TAGS: [],
        });
        const safeExcerpt = DOMPurify.sanitize(trimmedExcerpt);

        // Handle author name
        const authorName = DOMPurify.sanitize(
            post._embedded?.author?.[0]?.name ||
                post.yoast_head_json?.author ||
                'Admin',
            { ALLOWED_TAGS: [] },
        );

        // Extract categories from post
        const categories = post._embedded?.['wp:term']?.[0] || [];
        const categoriesHTML = categories.length
            ? `<div class="post-categories">
                ${categories
                    .map(
                        cat =>
                            `<a href="/blog/c/${
                                cat.slug
                            }" class="category-pill">${DOMPurify.sanitize(
                                cat.name,
                                { ALLOWED_TAGS: [] },
                            )}</a>`,
                    )
                    .join('')}
            </div>`
            : '';

        // Image handling
        let imageHTML = '';
        // Only render if we have a valid image URL
        if (featuredImage?.url) {
            const escapedUrl =
                featuredImage.url
                    ?.replace(/"/g, '&quot;')
                    ?.replace(/'/g, '&#39;') || '';
            const safeAlt = DOMPurify.sanitize(featuredImage.alt || safeTitle, {
                ALLOWED_TAGS: [],
            });

            if (escapedUrl) {
                const srcsetAttr = featuredImage.srcset
                    ? `srcset="${featuredImage.srcset.replace(/"/g, '&quot;')}" sizes="(max-width: 800px) 100vw, 800px"`
                    : '';

                // Note: loading/priority attributes are not easily passed from list context
                // unless we add specific properties for them.
                // For now, we'll default to lazy loading, as most cards are below fold.
                // If the first card needs priority, we can add an attribute 'priority' or 'eager'.

                const loadingAttr = this.hasAttribute('eager')
                    ? ''
                    : 'loading="lazy"';
                const fetchPriorityAttr = this.hasAttribute('eager')
                    ? 'fetchpriority="high"'
                    : '';

                imageHTML = `<img
                    src="${escapedUrl}"
                    ${srcsetAttr}
                    alt="${safeAlt}"
                    width="${parseInt(featuredImage.width) || 800}"
                    height="${parseInt(featuredImage.height) || 450}"
                    class="post-thumbnail"
                    ${loadingAttr}
                    ${fetchPriorityAttr}
                />`;
            }
        }

        // Format post date
        const postDate = new Date(post.date).toLocaleDateString();
        const postLink = `/blog/${encodeURIComponent(post.slug)}`;

        // Final render
        this.shadowRoot.innerHTML = `
            <article class="post-card">
                ${imageHTML}
                <div class="post-content">
                    <div class="post-header">
                        ${categoriesHTML}
                        <div class="post-meta">
                            ${postDate}
                        </div>
                    </div>
                    <h2><a href="${postLink}">${safeTitle}</a></h2>
                    <p class="post-excerpt">${safeExcerpt}</p>
                    <div class="post-footer">
                        <div class="post-author">
                            <x-icon name="circleUser" size="17"></x-icon>
                            <span>${authorName}</span>
                        </div>
                        <x-button href="${postLink}" size="small" pill>
                            <span slot="label">Read more</span>
                        </x-button>
                    </div>
                </div>
            </article>
        `;
    }
}

customElements.define('x-blog-card', BlogCardComponent);
