/**
 ** WordPress API Client
 ** Fetches blog posts via Netlify Function proxy
 */

/**
 * Fetch a single blog post by slug
 * @param {string} slug - Post slug
 * @param {boolean} preview - Whether to fetch draft/private posts
 * @param {string} token - Preview token for authentication
 * @returns {Promise<Object>} Post data
 */
export async function getPost(slug, preview = false, token = null) {
    if (!slug || typeof slug !== 'string') {
        throw new Error('Invalid slug parameter');
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        // Build URL with preview parameters
        let url = `/.netlify/functions/get-blog?slug=${encodeURIComponent(slug)}`;
        if (preview && token) {
            url += `&preview=true&token=${encodeURIComponent(token)}`;
        }

        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            // Check if we got HTML instead of JSON (function not running)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error(
                    'Netlify Functions not running. Use "netlify dev" instead of "npm run dev"',
                );
            }
            throw new Error(`Failed to fetch post: ${response.status}`);
        }

        const data = await response.json();
        return data[0]; // WordPress returns array, get first item
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
    }
}

/**
 * Fetch multiple blog posts with pagination support
 * @param {number} count - Number of posts to fetch
 * @param {number} offset - Number of posts to skip for pagination
 * @param {string} category - Optional category ID to filter posts
 * @returns {Promise<Array>} Array of posts
 */
export async function getPosts(count = 10, offset = 0, category = null) {
    // Validate inputs
    const validCount = Math.min(100, Math.max(1, parseInt(count, 10) || 10));
    const validOffset = Math.max(0, parseInt(offset, 10) || 0);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        let url = `/.netlify/functions/get-blog?posts=${validCount}&offset=${validOffset}`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        const response = await fetch(url, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            // Check if we got HTML instead of JSON (function not running)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error(
                    'Netlify Functions not running. Use "netlify dev" instead of "npm run dev"',
                );
            }
            throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
}

/**
 * Extract featured image data from post
 * @param {Object} post - Post object
 * @returns {Object|null} Image data with url, width, height, and alt
 */
export function getFeaturedImage(post) {
    const media = post?._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;

    // Build srcset from WordPress sizes
    let srcset = '';
    const sizes = media.media_details?.sizes;
    if (sizes) {
        srcset = Object.values(sizes)
            .map(size => `${size.source_url} ${size.width}w`)
            .join(', ');
    }

    return {
        url: media.source_url,
        width: media.media_details?.width || 1792,
        height: media.media_details?.height || 1008,
        alt: media.alt_text || media.title?.rendered || '',
        srcset: srcset,
    };
}

/**
 * Extract filename from Cloudinary or WordPress URL
 * @param {string} url - Image URL
 * @returns {string} Filename
 */
export function extractFilename(url) {
    if (!url) return '';

    // For Cloudinary URLs, extract filename after /upload/
    if (url.includes('res.cloudinary.com')) {
        const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+)/);
        return match ? match[1] : url.split('/').pop();
    }

    // For WordPress URLs, get the filename
    return url.split('/').pop() || '';
}

/**
 * Check if URL is already a Cloudinary URL (plugin installed)
 * @param {string} url - Image URL to check
 * @returns {boolean}
 */
function isCloudinaryUrl(url) {
    return url && url.includes('res.cloudinary.com');
}

/**
 * Get optimized image URL with 3-tier fallback strategy:
 * 1. Use Cloudinary URL if plugin is installed (already optimized)
 * 2. Transform WordPress URL via Cloudinary fetch (uses API credits)
 * 3. Fallback to original WordPress URL if Cloudinary fails
 *
 * @param {string} wpImageUrl - WordPress or Cloudinary image URL
 * @param {string} cloudName - Cloudinary cloud name
 * @param {string} transformations - Cloudinary transformations
 * @returns {string|null} Optimized image URL
 */
export function getOptimizedImageUrl(
    wpImageUrl,
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    transformations = 'f_auto,q_auto,w_1280',
) {
    if (!wpImageUrl) return null;

    // Tier 1: Check if already a Cloudinary URL (plugin installed)
    if (isCloudinaryUrl(wpImageUrl)) {
        return wpImageUrl;
    }

    // Tier 2: Try Cloudinary fetch transformation
    try {
        if (!cloudName) {
            console.warn(
                '[Image] Cloudinary cloud name not configured, using WordPress URL',
            );
            return wpImageUrl;
        }

        const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/${transformations}/${wpImageUrl}`;
        return cloudinaryUrl;
    } catch (error) {
        // Tier 3: Fallback to WordPress URL
        console.warn(
            '[Image] Cloudinary transformation failed, using WordPress URL:',
            error,
        );
        return wpImageUrl;
    }
}

/**
 * @deprecated Use getOptimizedImageUrl instead
 * Convert WordPress image URL to Cloudinary fetch URL
 * @param {string} wpImageUrl - WordPress image URL
 * @param {string} cloudName - Cloudinary cloud name (default: 'demo')
 * @param {string} transformations - Cloudinary transformations (default: 'f_auto,q_auto')
 * @returns {string} Cloudinary fetch URL
 */
export function getCloudinaryUrl(
    wpImageUrl,
    cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    transformations = 'f_auto,q_auto',
) {
    return getOptimizedImageUrl(wpImageUrl, cloudName, transformations);
}

/**
 * Fetch all blog categories from WordPress
 * @returns {Promise<Array>} Array of category objects
 */
export async function getCategories() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(
            `/.netlify/functions/get-blog?categories=true`,
            { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            // Check if we got HTML instead of JSON (function not running)
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error(
                    'Netlify Functions not running. Use "netlify dev" instead of "npm run dev"',
                );
            }
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

/**
 * Extract excerpt text without HTML
 * @param {Object} post - Post object
 * @returns {string} Plain text excerpt
 */
export function getExcerpt(post) {
    const div = document.createElement('div');
    div.innerHTML = post.excerpt?.rendered || '';
    return div.textContent || div.innerText || '';
}
