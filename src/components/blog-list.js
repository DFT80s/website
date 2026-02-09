/*
 ** Blog List Component
 ** Displays a list of blog posts from WordPress
 ** Usage:
 ** <x-blog-list count="5"></x-blog-list>
 */

// Import API functions
import { getPosts, getCategories } from '../js/api/wordpress.js';

// Import DOMPurify for sanitization
import DOMPurify from 'dompurify';

// Import nested components
import './blog-card.js';
import './loader.js';
import './button.js';
import './alert.js';
import './grid.js';
import './icon.js';

// Import stylesheets
import resetCss from '../css/reset.css?inline';
import typographyCss from '../css/typography.css?inline';
import eventsCss from '../css/events.css?inline';
import css from './blog-list.css?inline';

// Prepare stylesheets
const resetStyles = new CSSStyleSheet();
resetStyles.replaceSync(resetCss);

const typographyStyles = new CSSStyleSheet();
typographyStyles.replaceSync(typographyCss);

const eventsStyles = new CSSStyleSheet();
eventsStyles.replaceSync(eventsCss);

const componentStyles = new CSSStyleSheet();
componentStyles.replaceSync(css);

class BlogListComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return ['count', 'category', 'show-categories'];
    }

    // Called when component is created
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.allPosts = []; // Store all posts loaded from API
        this.categories = []; // Store all categories
        this.displayCount = 6; // How many to display initially
        this.isLoading = false;
        this.category = null; // Category ID for filtering
        this.categorySlug = null; // Category slug for matching active state
        this.showCategories = false; // Whether to show category links

        // Bind event handlers
        this.clickHandler = e => {
            if (
                e.target.closest('x-button[data-load-more]') &&
                !this.isLoading
            ) {
                this.showMorePosts();
            }
        };

        // Bind change handler for category select
        this.changeHandler = e => {
            if (e.target.matches('.category-select')) {
                window.location.href = e.target.value;
            }
        };

        // Bind resize handler to re-render categories on viewport change
        this.resizeHandler = () => {
            if (this.showCategories && this.categories.length > 0) {
                this.render();
            }
        };
    }

    // Called when component is added to the DOM
    async connectedCallback() {
        this.shadowRoot.addEventListener('click', this.clickHandler);
        this.shadowRoot.addEventListener('change', this.changeHandler);
        window.addEventListener('resize', this.resizeHandler);

        // Start loading state immediately
        this.isLoading = true;
        this.renderLoading();

        // Check for category in URL if not set via attribute
        if (!this.category) {
            // Try path-based routing first: /blog/c/category-slug
            const pathParts = window.location.pathname
                .split('/')
                .filter(Boolean);
            if (
                pathParts[0] === 'blog' &&
                pathParts[1] === 'c' &&
                pathParts[2]
            ) {
                this.categorySlug = pathParts[2];
            } else {
                // Fall back to query parameter: ?category=123
                const urlParams = new URLSearchParams(window.location.search);
                const categoryParam = urlParams.get('category');
                if (categoryParam) {
                    this.category = categoryParam;
                }
            }
        }

        // Keep local loading state for categories check
        // If we have a slug but no ID, we need to resolve it
        if (this.categorySlug && !this.category) {
            // Ensure categories are loaded to find the ID
            if (this.categories.length === 0) {
                await this.loadCategories();
            }

            const matchedCategory = this.categories.find(
                cat => cat.slug === this.categorySlug,
            );

            if (matchedCategory) {
                this.category = matchedCategory.id;

                // Optional: Update document title/heading to match category
                // This is a bit of a side effect, but helpful for this specific template
                const titleEl = document.getElementById('category-title');
                const descEl = document.getElementById('category-description');

                if (titleEl)
                    titleEl.textContent = `Blog: ${matchedCategory.name}`;
                if (descEl)
                    descEl.textContent =
                        matchedCategory.description ||
                        `Browse articles in ${matchedCategory.name}`;
            }
        }

        await this.loadAllPosts();
    }

    // Called when component is removed from the DOM
    disconnectedCallback() {
        this.shadowRoot.removeEventListener('click', this.clickHandler);
        this.shadowRoot.removeEventListener('change', this.changeHandler);
        window.removeEventListener('resize', this.resizeHandler);
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'count' && oldValue !== newValue && this.isConnected) {
            this.displayCount = parseInt(newValue);
            this.render();
        }
        if (name === 'category' && oldValue !== newValue && this.isConnected) {
            this.category = newValue;
            // Only reload if posts were already loaded
            if (this.allPosts.length > 0 || oldValue !== null) {
                this.loadAllPosts();
            }
        }
        if (
            name === 'show-categories' &&
            oldValue !== newValue &&
            this.isConnected
        ) {
            this.showCategories = newValue !== null;
            if (this.showCategories && this.categories.length === 0) {
                this.loadCategories();
            } else {
                this.render();
            }
        }
    }

    // Load categories from WordPress
    async loadCategories() {
        try {
            const allCategories = await getCategories();
            // Filter out WordPress default "Uncategorized" category and empty categories
            // Handles different languages and spellings
            const excludeSlugs = [
                'uncategorized',
                'uncategorised',
                'non-classe',
                'sin-categoria',
                'sem-categoria',
            ];

            this.categories = allCategories.filter(
                cat => !excludeSlugs.includes(cat.slug) && cat.count > 0,
            );
            this.render();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    // Load all blog posts at once (SEO friendly)
    async loadAllPosts() {
        this.renderLoading();
        this.isLoading = true;

        try {
            // Fetch a large batch of posts to get them all in one request
            // WordPress API returns max 100, so this loads everything
            const allPosts = await getPosts(100, 0, this.category);
            this.allPosts = allPosts;
        } catch (error) {
            this.renderError('Failed to load blog posts');
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    // Show more posts (progressive enhancement)
    showMorePosts() {
        this.displayCount += 6;
        this.render();
    }

    // Apply styles to shadow root
    applyStyles() {
        this.shadowRoot.adoptedStyleSheets = [
            resetStyles,
            typographyStyles,
            eventsStyles,
            componentStyles,
        ];
    }

    // Render loading state
    renderLoading() {
        this.applyStyles();
        this.shadowRoot.innerHTML = `<x-loader></x-loader>`;
    }

    // Render error state
    renderError(message) {
        this.applyStyles();
        this.shadowRoot.innerHTML = `
            <x-alert variant="error">
                <x-icon slot="icon" name="error" size="20"></x-icon>
                <span slot="message"><strong>Error: </strong> ${message}</span>
            </x-alert>
        `;
    }

    // Render category links (pills on desktop, select on mobile)
    renderCategories() {
        if (!this.showCategories || !this.categories.length) {
            return '';
        }

        const currentCategory = this.category;
        const isMobile = window.matchMedia('(max-width: 767px)').matches;

        // Mobile: Select dropdown
        if (isMobile) {
            const selectOptions = this.categories
                .map(cat => {
                    // Check by slug if available, otherwise by ID
                    const isSelected = this.categorySlug
                        ? cat.slug === this.categorySlug
                        : currentCategory === String(cat.id);
                    const selectedAttr = isSelected ? ' selected' : '';
                    const safeName = DOMPurify.sanitize(cat.name, {
                        ALLOWED_TAGS: [],
                    });
                    const safeSlug = encodeURIComponent(cat.slug);
                    return `<option value="/blog/c/${safeSlug}" ${selectedAttr}>${safeName}</option>`;
                })
                .join('');

            return `
                <div class="category-filter">
                    <div class="custom-select">
                        <select 
                            id="category-filter"
                            class="category-select" 
                            aria-label="Filter articles by category"
                        >
                            <option value="" disabled${
                                !currentCategory && !this.categorySlug
                                    ? ' selected'
                                    : ''
                            }>- Filter articles -</option>
                            <option value="/blog">All Posts</option>
                            ${selectOptions}
                        </select>
                    </div>
                </div>
            `;
        }

        // Desktop: Pill links
        const categoriesHTML = this.categories
            .map(cat => {
                // Check by slug if available, otherwise by ID
                const isActive = this.categorySlug
                    ? cat.slug === this.categorySlug
                    : currentCategory === String(cat.id);
                const activeClass = isActive ? ' class="active"' : '';
                const ariaAttr = isActive ? ' aria-current="page"' : '';
                const safeName = DOMPurify.sanitize(cat.name, {
                    ALLOWED_TAGS: [],
                });
                return `<a href="/blog/c/${cat.slug}"${activeClass}${ariaAttr}>${safeName}</a>`;
            })
            .join('');

        return `
            <nav class="category-filter" aria-label="Blog category filter">
                <span class="filter-label" aria-hidden="true">Filter:</span>
                <a href="/blog"${
                    !currentCategory && !this.categorySlug
                        ? ' class="active" aria-current="page"'
                        : ''
                }>All Articles</a>
                ${categoriesHTML}
            </nav>
        `;
    }

    // Render the component
    render() {
        this.applyStyles();

        // Don't show "no posts" message while still loading
        if (!this.allPosts.length) {
            if (this.isLoading) {
                this.shadowRoot.innerHTML = `<x-loader></x-loader>`;
                return;
            }
            this.shadowRoot.innerHTML = `
                <x-alert variant="default">
                    <x-icon slot="icon" name="info" size="20"></x-icon>
                    <span slot="message"><strong>No articles found.</strong></span>
                </x-alert>
            `;
            return;
        }

        // Get posts to display (slice to displayCount)
        const visiblePosts = this.allPosts.slice(0, this.displayCount);
        const hasMoreToShow = this.displayCount < this.allPosts.length;

        const postsHTML = visiblePosts
            .map((post, index) => {
                const isFirstImage = index === 0;
                return `<x-blog-card id="post-${post.id}" ${
                    isFirstImage ? 'eager' : ''
                }></x-blog-card>`;
            })
            .join('');

        // Final render
        this.shadowRoot.innerHTML = `
            ${this.renderCategories()}
            <x-grid auto-fit min-col-width="20rem" gap="medium">
                ${postsHTML}
            </x-grid>
            ${
                hasMoreToShow
                    ? `<div class="pagination">
                <x-button data-load-more${
                    this.isLoading ? ' disabled' : ''
                } pill>
                    <span slot="label">Load More Posts</span>
                </x-button>
            </div>`
                    : ''
            }
        `;

        // Pass data to components
        visiblePosts.forEach(post => {
            const card = this.shadowRoot.querySelector(`#post-${post.id}`);
            if (card) {
                card.post = post;
            }
        });
    }
}

// Register the component
customElements.define('x-blog-list', BlogListComponent);
