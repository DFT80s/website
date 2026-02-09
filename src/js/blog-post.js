/**
 ** Blog Post Page Script
 ** Extracts slug from URL and displays the blog post
 */

// Import nested components
import '../components/blog-post.js';
import '../components/alert.js';
import '../components/button.js';

// Initialize the app after DOM is loaded
let initialized = false;

const app = () => {
    // Prevent double initialization
    if (initialized) return;
    initialized = true;

    // Get slug from URL path
    // Expected URL format: /blog/my-post-slug or /blog/post?slug=my-post-slug
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromQuery = urlParams.get('slug');

    // Get slug from path (e.g., /blog/my-post-slug)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const slugFromPath = pathParts[pathParts.length - 1];

    // Use query parameter first, then fall back to path
    const slug = slugFromQuery || slugFromPath;

    if (!slug || slug === 'post' || slug === 'blog') {
        // No valid slug found
        const container = document.getElementById('blog-post-container');
        if (container) {
            container.innerHTML = `
                <x-alert variant="error">
                    <x-icon slot="icon" name="error" size="20"></x-icon>
                    <span slot="message"><strong>Error: </strong>No blog post data found.</span>
                </x-alert>
                <x-button href="/blog" pill>
                    <span slot="label">Back to Blog</span>
                </x-button>
            `;
        }
        return;
    }

    // Create and inject the blog post component
    const container = document.getElementById('blog-post-container');
    if (container) {
        const blogPost = document.createElement('x-blog-post');
        blogPost.setAttribute('slug', slug);
        container.appendChild(blogPost);
    }
};

document.addEventListener('DOMContentLoaded', app);
