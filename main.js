/*
 ** Global JS for the application
 */

// Import global styles
import './main.css';

// Import components
import './src/components/loader.js';
import './src/components/header.js';
import './src/components/footer.js';
import './src/components/image.js';
import './src/components/icon.js';
import './src/components/button.js';
import './src/components/grid.js';
import './src/components/obscured-email.js';

// Load saved theme before page renders
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Initialize the app after DOM is loaded
let initialized = false;

const app = () => {
    // Prevent double initialization
    if (initialized) return;
    initialized = true;

    // Clone and append the template content to the body to ensure components are loaded before use
    const template = document.querySelector('template#page');
    if (template) {
        document.body.appendChild(template.content.cloneNode(true));
        // Remove template after use
        template.remove();
    }

    // Set menu items
    const nav = document.querySelector('x-primary-nav');
    if (nav) {
        nav.menuItems = [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Media', url: '/media' },
            { label: 'Book Us', url: '/book-us' },
        ];
    }
};

document.addEventListener('DOMContentLoaded', app);
