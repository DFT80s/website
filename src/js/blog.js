/*
 ** Blog Page JS
 */

// Import blog list component
import '../components/blog-list.js';

// Initialize the app after DOM is loaded
let initialized = false;

const app = () => {
    // Prevent double initialization
    if (initialized) return;
    initialized = true;

    // No additional page logic needed currently
};

// document.addEventListener('DOMContentLoaded', app);
