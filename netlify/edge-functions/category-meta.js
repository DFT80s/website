// Import process to access environment variables in Netlify Edge Functions
import process from 'node:process';

/**
 ** Netlify Edge Function - Blog Category Meta Tag Injection
 ** Intercepts blog category requests and injects correct meta tags server-side
 **
 ** How it works:
 ** 1. Intercepts requests to /blog/c/:category
 ** 2. Extracts category slug from URL
 ** 3. Fetches category data from WordPress (via Netlify Function)
 ** 4. Injects meta tags into HTML before sending to browser/crawler
 */

export default async (request, context) => {
    const url = new URL(request.url);

    // Get category slug from either query parameter OR path
    let categorySlug = url.searchParams.get('cat');

    // If not in query, extract from path: /blog/c/category-slug
    if (!categorySlug && url.pathname.startsWith('/blog/c/')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        categorySlug = pathParts[2] || null; // blog, c, [slug]
        // Sanitize slug - only allow alphanumeric, hyphens, and underscores
        if (categorySlug && !/^[a-zA-Z0-9_-]+$/.test(categorySlug)) {
            console.error('[category-meta] Invalid category slug format');
            categorySlug = null;
        }
    }

    // If accessing the bare template (/blog/category.html), inject noindex
    if (!categorySlug && url.pathname === '/blog/category.html') {
        const response = await context.next();
        const html = await response.text();

        // Inject noindex meta tags to prevent indexing of bare template
        const noindexHtml = html
            .replace(
                /<meta name="robots" content="index, follow" \/>/,
                '<meta name="robots" content="noindex, follow" />',
            )
            .replace(
                /<meta name="googlebot" content="index, follow" \/>/,
                '<meta name="googlebot" content="noindex, follow" />',
            );

        return new Response(noindexHtml, {
            status: response.status,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    }

    if (!categorySlug) {
        return context.next();
    }

    try {
        // Fetch all categories from WordPress via our Netlify Function
        const wpResponse = await fetch(
            `${url.origin}/.netlify/functions/get-blog?categories=true`,
        );

        if (!wpResponse.ok) {
            console.error(
                '[category-meta] Failed to fetch categories. Status:',
                wpResponse.status,
            );
            return context.next();
        }

        const categories = await wpResponse.json();

        // Find the matching category by slug
        const category = categories.find(cat => cat.slug === categorySlug);

        if (!category) {
            console.error(
                '[category-meta] Category not found for slug:',
                categorySlug,
            );
            // Return 404 - the category doesn't exist
            return new Response(null, {
                status: 404,
                headers: {
                    Location: '/404',
                },
            });
        }

        // Use category description or create a default one
        const description =
            category.description ||
            `Browse ${category.name} posts on our blog.`;

        // Construct clean URL using SITE_URL env variable
        const siteUrl = process.env.SITE_URL || url.origin;
        const siteTitle = process.env.SITE_TITLE || '';
        const socialHandle = process.env.SOCIAL_HANDLE || '';
        const cleanUrl = `${siteUrl}/blog/c/${categorySlug}`;

        // Get the original HTML response
        const response = await context.next();
        const html = await response.text();

        // Escape special characters for safe use in HTML attributes
        const escapeHtmlAttr = str =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

        const safeTitle = escapeHtmlAttr(category.name);
        const safeDescription = escapeHtmlAttr(description);

        // Check if description tag exists and has content
        const descMatch = html.match(
            /<meta\s+name="description"\s+content="([^"]*)"/i,
        );
        const hasDescriptionTag = descMatch !== null;
        const existingDescription = descMatch ? descMatch[1].trim() : '';

        // Check if canonical tag exists
        const canonicalMatch = html.match(
            /<link\s+rel="canonical"\s+href="([^"]*)"/i,
        );
        const hasCanonicalTag = canonicalMatch !== null;

        // Check for existing author and publisher meta tags
        const authorMatch = html.match(
            /<meta\s+name="author"\s+content="([^"]*)"/i,
        );
        const hasAuthorTag = authorMatch !== null;
        const existingAuthor = authorMatch ? authorMatch[1].trim() : '';

        const publisherMatch = html.match(
            /<meta\s+name="publisher"\s+content="([^"]*)"/i,
        );
        const hasPublisherTag = publisherMatch !== null;
        const existingPublisher = publisherMatch
            ? publisherMatch[1].trim()
            : '';

        // Extract domain from WordPress API URL for prefetch/preconnect
        let wpDomain = '';
        const wpApiUrl = process.env.WORDPRESS_API_URL;
        if (wpApiUrl) {
            try {
                const wpUrl = new URL(wpApiUrl);
                wpDomain = wpUrl.origin;
            } catch (_e) {
                console.error(
                    '[category-meta] Invalid WORDPRESS_API_URL:',
                    wpApiUrl,
                );
            }
        }

        // Build prefetch/preconnect links if WordPress domain is available
        const wpResourceLinks = wpDomain
            ? `
                    <link rel="dns-prefetch" href="${wpDomain}" />
                    <link rel="preconnect" href="${wpDomain}" />`
            : '';

        // Add Cloudinary resource hints for image optimization
        const cloudinaryLinks = `
                    <link rel="dns-prefetch" href="https://res.cloudinary.com" />
                    <link rel="preconnect" href="https://res.cloudinary.com" />`;

        // Get most recent post's featured image for og:image
        let fallbackImage = null;
        try {
            const postsResponse = await fetch(
                `${url.origin}/.netlify/functions/get-blog?posts=1${category.id ? `&category=${category.id}` : ''}`,
            );
            if (postsResponse.ok) {
                const posts = await postsResponse.json();
                const latestPost = posts[0];
                fallbackImage =
                    latestPost?._embedded?.['wp:featuredmedia']?.[0]
                        ?.source_url || null;
            }
        } catch (error) {
            console.error(
                '[category-meta] Failed to fetch latest post image:',
                error.message,
            );
        }

        // Determine if we need to inject or update the description tag
        const needsDescriptionInjection =
            !hasDescriptionTag || !existingDescription;

        // Determine if we need to inject canonical tag
        const needsCanonicalInjection = !hasCanonicalTag;

        // Determine if we need to inject author and publisher tags
        const needsAuthorInjection = !hasAuthorTag || !existingAuthor;
        const needsPublisherInjection = !hasPublisherTag || !existingPublisher;

        // Transform HTML with correct meta tags
        let transformedHtml = html
            // Update title in head
            .replace(
                /<title>.*?<\/title>/,
                `<title>Blog: ${safeTitle} | ${siteTitle}</title>`,
            )
            // Update canonical
            .replace(
                /<link rel="canonical" href=["'].*?["'][\s]*\/?>/,
                `<link rel="canonical" href="${cleanUrl}">`,
            )
            // Update h1 title (handles both inside and outside template)
            .replace(
                /<h1 id="category-title">[^<]*<\/h1>/g,
                `<h1 id="category-title">Blog: ${safeTitle}</h1>`,
            )
            // Update description paragraph (handles both inside and outside template)
            .replace(
                /<p id="category-description">\s*[^<]*\s*<\/p>/g,
                `<p id="category-description">${safeDescription}</p>`,
            )
            // Inject category ID into blog-list component
            .replace(
                /<x-blog-list id="category-posts"><\/x-blog-list>/,
                `<x-blog-list id="category-posts" category="${category.id}"></x-blog-list>`,
            );

        // Update description tag if it exists
        if (hasDescriptionTag) {
            transformedHtml = transformedHtml.replace(
                /<meta name="description" content=".*?">/,
                `<meta name="description" content="${safeDescription}">`,
            );
        }

        // Add all tags before closing head in one replacement
        transformedHtml = transformedHtml.replace(
            '</head>',
            `${wpResourceLinks}${cloudinaryLinks}${
                needsCanonicalInjection
                    ? `\n                    <link rel="canonical" href="${cleanUrl}">`
                    : ''
            }${
                needsDescriptionInjection
                    ? `\n                    <meta name="description" content="${safeDescription}">`
                    : ''
            }${
                needsAuthorInjection
                    ? `\n                    <meta name="author" content="${siteTitle}">`
                    : ''
            }${
                needsPublisherInjection
                    ? `\n                    <meta name="publisher" content="${siteTitle}">`
                    : ''
            }
                    <!-- Open Graph Meta Tags -->
                    <meta property="og:title" content="Blog: ${safeTitle} | ${siteTitle}">
                    <meta property="og:description" content="${safeDescription}">
                    <meta property="og:url" content="${cleanUrl}">
                    <meta property="og:type" content="website">
                    ${
                        fallbackImage
                            ? `<meta property="og:image" content="${fallbackImage}">`
                            : `<meta property="og:image" content="${url.origin}/social.jpg">`
                    }
                    <meta property="og:site_name" content="${siteTitle}">
                    <meta property="og:locale" content="en_GB">
                    
                    <!-- Twitter Card Meta Tags -->
                    <meta name="twitter:card" content="summary_large_image">
                    <meta name="twitter:site" content="${socialHandle}">
                    <meta name="twitter:url" content="${cleanUrl}">
                    <meta name="twitter:title" content="Blog: ${safeTitle} | ${siteTitle}">
                    <meta name="twitter:description" content="${safeDescription}">
                    ${
                        fallbackImage
                            ? `<meta name="twitter:image" content="${fallbackImage}">`
                            : `<meta name="twitter:image" content="${url.origin}/social.jpg">`
                    }
                    
                    <!-- JSON-LD Structured Data -->
                    <script type="application/ld+json">
                    {
                        "@context": "https://schema.org",
                        "@type": "CollectionPage",
                        "name": "Blog: ${safeTitle} | ${siteTitle}",
                        "description": "${safeDescription}",
                        "url": "${cleanUrl}",
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "${siteTitle}",
                            "url": "${siteUrl}"
                        }
                    }
                    </script>
                </head>`,
        );

        // Return transformed HTML
        return new Response(transformedHtml, {
            status: response.status,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error(
            '[category-meta] Error processing request:',
            error.message,
            'Category:',
            categorySlug,
        );
        // On error, return original page
        return context.next();
    }
};

// Configure which paths this edge function runs on
export const config = {
    path: ['/blog/c/*', '/blog/category.html'],
};
