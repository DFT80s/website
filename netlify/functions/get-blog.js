/**
 ** Netlify Function - WordPress Blog Proxy
 ** Fetches blog posts from WordPress and caches them on Netlify CDN
 ** Supports preview mode with JWT authentication for draft/private posts
 **
 ** Usage:
 ** /.netlify/functions/get-blog?slug=my-post
 ** /.netlify/functions/get-blog?posts=5 (get latest posts)
 ** /.netlify/functions/get-blog?slug=my-post&preview=true&token=secret (preview draft)
 */

export default async (request, context) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const posts = url.searchParams.get('posts');
    const offset = Math.max(
        0,
        parseInt(url.searchParams.get('offset') || '0', 10),
    );
    const category = url.searchParams.get('category');
    const categories = url.searchParams.get('categories');
    const preview = url.searchParams.get('preview') === 'true';
    const previewToken = url.searchParams.get('token');

    // Validate posts parameter to prevent excessive requests
    const validatedPosts = posts
        ? Math.min(100, Math.max(1, parseInt(posts, 10)))
        : null;

    // Check preview authentication
    if (preview) {
        const expectedToken = process.env.PREVIEW_TOKEN;
        if (!expectedToken || previewToken !== expectedToken) {
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Invalid preview token',
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }
    }

    // WordPress site URL from environment variable
    const wpBaseUrl = process.env.WORDPRESS_API_URL;
    if (!wpBaseUrl) {
        throw new Error('WORDPRESS_API_URL environment variable is required');
    }

    let wpUrl;
    if (categories) {
        // Fetch all categories
        wpUrl = `${wpBaseUrl}/categories?per_page=100`;
    } else if (slug) {
        // Fetch single post by slug
        wpUrl = `${wpBaseUrl}/posts?slug=${slug}&_embed`;

        // In preview mode, include draft and private posts
        if (preview) {
            wpUrl += '&status=publish,draft,private';
        }
    } else if (validatedPosts) {
        // Fetch multiple posts with pagination support
        wpUrl = `${wpBaseUrl}/posts?per_page=${validatedPosts}&offset=${offset}&_embed`;

        // Add category filter if provided
        if (category) {
            wpUrl += `&categories=${category}`;
        }
    } else {
        // Default: get latest 10 posts
        wpUrl = `${wpBaseUrl}/posts?per_page=10&_embed`;
    }

    try {
        let headers = {};

        // If preview mode, authenticate with JWT
        if (preview) {
            const jwtToken = await getJWTToken(wpBaseUrl);
            if (!jwtToken) {
                throw new Error('Failed to authenticate with WordPress');
            }
            headers['Authorization'] = `Bearer ${jwtToken}`;
        }

        // Fetch from WordPress
        const wpResponse = await fetch(wpUrl, { headers });

        if (!wpResponse.ok) {
            throw new Error(`WordPress API error: ${wpResponse.status}`);
        }

        const data = await wpResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                // Cache on CDN for 1 hour (3600s)
                // Serve stale content while revalidating for 24 hours
                'Cache-Control':
                    'public, s-maxage=3600, stale-while-revalidate=86400',
                'Netlify-CDN-Cache-Control':
                    'public, s-maxage=3600, stale-while-revalidate=86400',
                // CORS headers if needed
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch blog posts',
                message: error.message,
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    }
};

/**
 * Get JWT token from WordPress
 * @param {string} wpBaseUrl - WordPress base URL
 * @returns {Promise<string|null>} JWT token or null
 */
async function getJWTToken(wpBaseUrl) {
    const username = process.env.WP_USERNAME;
    const password = process.env.WP_PASSWORD;

    if (!username || !password) {
        console.error('[get-blog] Missing WP_USERNAME or WP_PASSWORD');
        return null;
    }

    try {
        // Extract base URL (remove /wp-json/wp/v2 if present)
        const baseUrl = wpBaseUrl.replace(/\/wp-json.*$/, '');
        const jwtUrl = `${baseUrl}/wp-json/jwt-auth/v1/token`;

        const response = await fetch(jwtUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                '[get-blog] JWT auth failed:',
                response.status,
                errorText,
            );
            return null;
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('[get-blog] JWT authentication error:', error.message);
        return null;
    }
}
