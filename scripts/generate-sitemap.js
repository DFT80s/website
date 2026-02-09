#!/usr/bin/env node

/**
 ** Custom Static Sitemap Generator
 ** Generates sitemap-static.xml for all static HTML pages
 ** Runs after Vite build to scan dist/ folder
 **
 ** Features:
 ** - Custom priority/changefreq per page type
 ** - Excludes templates and error pages
 ** - Handles clean URLs (removes .html extension)
 ** - Fast and simple (no external dependencies)
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DIST_DIR = join(__dirname, '../dist');
const SITE_URL = process.env.SITE_URL;

// Validate required environment variables
if (!SITE_URL) {
    console.error('[sitemap] ERROR: SITE_URL environment variable is required');
    console.error(
        '[sitemap] Set it in .env file or pass it: SITE_URL=https://yoursite.com npm run build',
    );
    process.exit(1);
}

// Page priorities and change frequencies
const PAGE_CONFIG = {
    '/': { priority: '1.0', changefreq: 'weekly' },
    '/about': { priority: '0.8', changefreq: 'monthly' },
    '/blog': { priority: '0.9', changefreq: 'daily' },
    '/contact': { priority: '0.7', changefreq: 'monthly' },
    '/Services/service': { priority: '0.8', changefreq: 'monthly' },
    '/Services/service-two': { priority: '0.8', changefreq: 'monthly' },
};

// Pages to exclude from sitemap
const EXCLUDE_PATTERNS = ['404.html', 'blog/post.html', 'blog/category.html'];

/**
 * Recursively find all HTML files in a directory
 */
async function findHtmlFiles(dir, baseDir = dir) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            // Recursively search subdirectories
            files.push(...(await findHtmlFiles(fullPath, baseDir)));
        } else if (entry.name.endsWith('.html')) {
            // Get relative path from dist folder
            const relativePath = relative(baseDir, fullPath);
            files.push(relativePath);
        }
    }

    return files;
}

/**
 * Check if a file should be excluded from sitemap
 */
function shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => {
        // Normalize paths for comparison (use forward slashes)
        const normalizedPath = filePath.replace(/\\/g, '/');
        return (
            normalizedPath === pattern || normalizedPath.endsWith(`/${pattern}`)
        );
    });
}

/**
 * Convert file path to clean URL
 */
function filePathToUrl(filePath) {
    // Normalize to forward slashes
    let url = filePath.replace(/\\/g, '/');

    // Remove .html extension
    url = url.replace(/\.html$/, '');

    // Handle index files
    url = url.replace(/\/index$/, '');
    if (url === 'index') url = '';

    // Ensure leading slash
    url = '/' + url;

    // Remove trailing slash (except for root)
    if (url !== '/' && url.endsWith('/')) {
        url = url.slice(0, -1);
    }

    return url;
}

/**
 * Get page configuration (priority, changefreq)
 */
function getPageConfig(url) {
    // Check for exact match
    if (PAGE_CONFIG[url]) {
        return PAGE_CONFIG[url];
    }

    // Default configuration
    return { priority: '0.5', changefreq: 'monthly' };
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generate sitemap XML
 */
async function generateSitemap() {
    console.log('[sitemap] Scanning dist folder for HTML files...');

    // Find all HTML files
    const htmlFiles = await findHtmlFiles(DIST_DIR);
    console.log(`[sitemap] Found ${htmlFiles.length} HTML files`);

    // Filter out excluded files
    const includedFiles = htmlFiles.filter(file => !shouldExclude(file));
    console.log(`[sitemap] Including ${includedFiles.length} pages in sitemap`);

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const currentDate = new Date().toISOString().split('T')[0];

    for (const file of includedFiles) {
        const url = filePathToUrl(file);
        const config = getPageConfig(url);
        const fullUrl = escapeXml(SITE_URL + url);

        xml += '  <url>\n';
        xml += `    <loc>${fullUrl}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>${config.changefreq}</changefreq>\n`;
        xml += `    <priority>${config.priority}</priority>\n`;
        xml += '  </url>\n';

        console.log(`[sitemap] Added: ${url} (priority: ${config.priority})`);
    }

    xml += '</urlset>';

    // Write sitemap to dist folder
    const sitemapPath = join(DIST_DIR, 'sitemap-static.xml');
    await writeFile(sitemapPath, xml, 'utf8');

    console.log(
        `[sitemap] ✓ Generated sitemap-static.xml with ${includedFiles.length} URLs`,
    );
    console.log(`[sitemap] Output: ${sitemapPath}`);
}

// Run the generator
generateSitemap().catch(error => {
    console.error('[sitemap] Error generating sitemap:', error);
    process.exit(1);
});
