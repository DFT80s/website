// Import process to access environment variables in Netlify Edge Functions
import process from 'node:process';

/**
 ** Netlify Edge Function - Blog Post Meta Tag Injection
 ** Intercepts blog post requests and injects correct meta tags server-side
 **
 ** How it works:
 ** 1. Intercepts requests to /blog/post
 ** 2. Extracts slug from URL query parameter
 ** 3. Fetches post data from WordPress (via Netlify Function)
 ** 4. Injects meta tags into HTML before sending to browser/crawler
 */

export default async (request, context) => {
    const url = new URL(request.url);

    // Skip the blog list page
    if (
        url.pathname === '/blog' ||
        url.pathname === '/blog/' ||
        url.pathname === '/blog/index.html'
    ) {
        return context.next();
    }

    // Get slug from query parameter OR path
    let slug = url.searchParams.get('slug');

    if (!slug) {
        // Extract slug from path: /blog/my-post-slug → my-post-slug
        const pathParts = url.pathname.split('/').filter(Boolean);
        slug = pathParts[pathParts.length - 1];

        // If accessing the bare template (/blog/post or /blog/post.html), inject noindex
        if (slug === 'post' || slug === 'post.html') {
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
    }

    if (!slug) {
        return context.next();
    }

    // Validate slug format - only allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
        console.error('[blog-meta] Invalid slug format');
        return context.next();
    }

    try {
        // Fetch post data from WordPress via our Netlify Function
        const wpResponse = await fetch(
            `${url.origin}/.netlify/functions/get-blog?slug=${slug}`,
        );

        if (!wpResponse.ok) {
            console.error(
                '[blog-meta] Failed to fetch post data. Status:',
                wpResponse.status,
                'Slug:',
                slug,
            );
            return context.next();
        }

        const posts = await wpResponse.json();
        const post = posts[0];

        if (!post) {
            console.error('[blog-meta] Post not found for slug:', slug);
            return context.next();
        }

        // Extract plain text excerpt (remove HTML tags)
        let excerpt = '';
        if (post.excerpt?.rendered) {
            excerpt = post.excerpt.rendered
                .replace(/<[^>]*>/g, '') // Strip HTML tags
                .replace(/&[^;]+;/g, ' ') // Remove HTML entities
                .trim()
                .substring(0, 160); // Limit to 160 chars
        }

        // Get featured image URL
        const featuredImage =
            post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

        // Get post date
        const publishedDate = post.date || new Date().toISOString();
        const modifiedDate = post.modified || publishedDate;

        // Get author info
        const authorName = post._embedded?.author?.[0]?.name || 'Site Author';

        // Construct clean URL using SITE_URL env variable
        const siteUrl = process.env.SITE_URL || url.origin;
        const siteTitle = process.env.SITE_TITLE || '';
        const socialHandle = process.env.SOCIAL_HANDLE || '';
        const cleanUrl = `${siteUrl}/blog/${slug}`;

        // Get the original HTML response
        const response = await context.next();
        const html = await response.text();

        // Escape special characters for safe use in HTML attributes
        // This prevents attribute breakout and XSS attacks
        const escapeHtmlAttr = str =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

        const safeTitle = escapeHtmlAttr(post.title.rendered);
        const safeExcerpt = escapeHtmlAttr(
            excerpt ||
                'Read this article for insights, tips, and valuable information.',
        );

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
                    '[blog-meta] Invalid WORDPRESS_API_URL:',
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
            // Update title
            .replace(
                /<title>.*?<\/title>/,
                `<title>${safeTitle} | ${siteTitle}</title>`,
            )
            // Update canonical (match with single or double quotes, with or without trailing slash)
            .replace(
                /<link rel="canonical" href=["'].*?["'][\s]*\/?>/,
                `<link rel="canonical" href="${cleanUrl}">`,
            );

        // Update or skip description tag replacement based on whether it exists
        if (hasDescriptionTag) {
            transformedHtml = transformedHtml.replace(
                /<meta name="description" content=".*?">/,
                `<meta name="description" content="${safeExcerpt}">`,
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
                    ? `\n                    <meta name="description" content="${safeExcerpt}">`
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
                    <meta property="og:title" content="${safeTitle} | ${siteTitle}">
                    <meta property="og:description" content="${safeExcerpt}">
                    <meta property="og:url" content="${cleanUrl}">
                    <meta property="og:type" content="article">
                    ${
                        featuredImage
                            ? `<meta property="og:image" content="${featuredImage}">`
                            : ''
                    }
                    <meta property="og:site_name" content="${siteTitle}">
                    <meta property="og:locale" content="en_GB">
                    
                    <!-- Twitter Card Meta Tags -->
                    <meta name="twitter:card" content="summary_large_image">
                    <meta name="twitter:site" content="${socialHandle}">
                    <meta name="twitter:url" content="${cleanUrl}">
                    <meta name="twitter:title" content="${safeTitle} | ${siteTitle}">
                    <meta name="twitter:description" content="${safeExcerpt}">
                    ${
                        featuredImage
                            ? `<meta name="twitter:image" content="${featuredImage}">`
                            : ''
                    }
                    
                    <!-- JSON-LD Structured Data -->
                    <script type="application/ld+json">
                    {
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": "${safeTitle} | ${siteTitle}",
                        "description": "${safeExcerpt}",
                        "url": "${cleanUrl}",
                        "datePublished": "${publishedDate}",
                        "dateModified": "${modifiedDate}",
                        "author": {
                            "@type": "Person",
                            "name": "${escapeHtmlAttr(authorName)}"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "${siteTitle}"
                        }${
                            featuredImage
                                ? `,
                        "image": "${featuredImage}"`
                                : ''
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
            '[blog-meta] Error processing request:',
            error.message,
            'Slug:',
            slug,
        );
        // On error, return original page
        return context.next();
    }
};

// Configure which paths this edge function runs on
export const config = {
    path: '/blog/*',
};
