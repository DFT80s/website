/**
 ** Netlify Edge Function - Social Meta Tag Injection
 ** Automatically adds Open Graph and Twitter Card meta tags based on existing HTML meta tags
 **
 ** How it works:
 ** 1. Intercepts requests to static pages (excludes blog posts)
 ** 2. Parses existing <title> and <meta name="description"> from HTML
 ** 3. Injects Open Graph and Twitter Card meta tags
 ** 4. Preserves all existing meta tags
 */

// Import process to access environment variables in Netlify Edge Functions
import process from 'node:process';

export default async (request, context) => {
    const url = new URL(request.url);

    // Get site URL from environment variable or use request URL as fallback
    const siteUrl = process.env.SITE_URL || url.origin;
    const siteTitle = process.env.SITE_TITLE || '';
    const socialHandle = process.env.SOCIAL_HANDLE || '';

    // Skip individual blog posts - they have their own edge function
    // But allow the blog listing page (/blog or /blog/) to be processed
    if (
        url.pathname.startsWith('/blog/') ||
        (url.pathname === '/blog' && url.searchParams.has('slug'))
    ) {
        return context.next();
    }

    // Skip 404 error page - don't enhance error pages with social tags
    if (url.pathname === '/404' || url.pathname === '/404.html') {
        return context.next();
    }

    try {
        // Get the original HTML response
        const response = await context.next();
        const contentType = response.headers.get('content-type') || '';

        // Only process HTML responses (skips CSS, JS, images, etc. automatically)
        // This is more reliable than checking file extensions
        if (!contentType.includes('text/html')) {
            return response;
        }

        const html = await response.text();

        // Extract existing title from HTML
        // Use it as-is if found, otherwise fallback to SITE_TITLE env variable
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const pageTitle =
            titleMatch && titleMatch[1]
                ? titleMatch[1].trim()
                : process.env.SITE_TITLE || '';

        // Build full title with site name for meta tags
        // Format: "Page Title | Site Name"
        const fullTitle =
            pageTitle && siteTitle && pageTitle !== siteTitle
                ? `${pageTitle} | ${siteTitle}`
                : pageTitle || siteTitle;

        // Extract existing description meta tag
        // Regex: /<meta\s+name="description"\s+content="([^"]*)"/i
        // \s+ matches whitespace, ([^"]*) captures everything inside the content="..." quotes
        // The /i flag makes it case-insensitive (matches <meta>, <META>, etc.)
        // descMatch[1] contains the captured content value
        const descMatch = html.match(
            /<meta\s+name="description"\s+content="([^"]*)"/i,
        );
        const hasDescriptionTag = descMatch !== null;
        const existingDescription = descMatch ? descMatch[1].trim() : '';
        const description =
            existingDescription || process.env.SITE_DESCRIPTION || '';

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

        // Extract canonical URL from the link tag
        // Always rebuild with SITE_URL env variable to ensure correct domain
        const canonicalMatch = html.match(
            /<link\s+rel="canonical"\s+href="([^"]*)"/i,
        );
        let canonicalUrl = siteUrl + url.pathname;

        if (canonicalMatch && canonicalMatch[1].trim()) {
            // If canonical exists, extract just the path and rebuild with SITE_URL
            try {
                const urlObj = new URL(canonicalMatch[1]);
                canonicalUrl = siteUrl + urlObj.pathname;
            } catch {
                // If it's not a valid URL, just use the path directly
                canonicalUrl =
                    siteUrl +
                    (canonicalMatch[1].startsWith('/')
                        ? canonicalMatch[1]
                        : '/' + canonicalMatch[1]);
            }
        }

        // Extract existing og:image meta tag or use fallback
        // Regex searches for <meta property="og:image" content="...">
        // If not found on blog listing, fetch most recent post's featured image
        // Otherwise defaults to /social.jpg using SITE_URL
        const ogImageMatch = html.match(
            /<meta\s+property="og:image"\s+content="([^"]*)"/i,
        );

        let imageUrl = ogImageMatch ? ogImageMatch[1] : siteUrl + '/social.jpg';

        // Determine if this is the blog listing page
        const isBlogListing =
            url.pathname === '/blog' || url.pathname === '/blog/';

        // If blog listing and no og:image found, get latest post's featured image
        if (isBlogListing && !ogImageMatch) {
            try {
                const postsResponse = await fetch(
                    `${url.origin}/.netlify/functions/get-blog?posts=1`,
                );
                if (postsResponse.ok) {
                    const posts = await postsResponse.json();
                    const latestPost = posts[0];
                    const latestImage =
                        latestPost?._embedded?.['wp:featuredmedia']?.[0]
                            ?.source_url || null;
                    if (latestImage) {
                        imageUrl = latestImage;
                    }
                }
            } catch (error) {
                console.error(
                    '[social-meta] Failed to fetch latest post image:',
                    error.message,
                );
            }
        }

        // Build JSON-LD structured data for the page
        // Use CollectionPage for blog listing, WebPage for others
        const schemaType = isBlogListing ? 'CollectionPage' : 'WebPage';
        const jsonLd = `
        
        <!-- JSON-LD Structured Data -->
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "${schemaType}",
            "name": "${fullTitle}",
            "description": "${description}",
            "url": "${canonicalUrl}",
            "image": "${imageUrl}",
            "publisher": {
                "@type": "Organization",
                "name": "${siteTitle}"
            }
        }
        </script>`;

        // Extract WordPress domain for resource hints on blog listing
        let wpResourceLinks = '';
        if (isBlogListing) {
            const wpApiUrl = process.env.WORDPRESS_API_URL;
            if (wpApiUrl) {
                try {
                    const wpUrl = new URL(wpApiUrl);
                    const wpDomain = wpUrl.origin;
                    wpResourceLinks = `
        <link rel="dns-prefetch" href="${wpDomain}" />
        <link rel="preconnect" href="${wpDomain}" />`;
                } catch (_e) {
                    console.error(
                        '[social-meta] Invalid WORDPRESS_API_URL:',
                        wpApiUrl,
                    );
                }
            }
        }

        // Add Cloudinary resource hints for image optimization
        const cloudinaryLinks = `
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />`;

        // Inject standard meta description if missing or empty, and we have content
        const metaDescriptionTag =
            (!hasDescriptionTag || !existingDescription) && description
                ? `\n        <meta name="description" content="${description}">`
                : '';

        // Inject author and publisher meta tags if missing
        const metaAuthorTag =
            !hasAuthorTag || !existingAuthor
                ? `\n        <meta name="author" content="${siteTitle}">`
                : '';

        const metaPublisherTag =
            !hasPublisherTag || !existingPublisher
                ? `\n        <meta name="publisher" content="${siteTitle}">`
                : '';

        // Build social meta tags (URL replacements handled separately below)
        const socialMeta = `${metaDescriptionTag}${metaAuthorTag}${metaPublisherTag}
        <!-- Open Graph Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${canonicalUrl}">
        <meta property="og:title" content="${fullTitle}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:site_name" content="${siteTitle}">
        <meta property="og:locale" content="en_GB">
        
        <!-- Twitter Card Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="${socialHandle}">
        <meta name="twitter:url" content="${canonicalUrl}">
        <meta name="twitter:title" content="${fullTitle}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${imageUrl}">${jsonLd}`;

        // Insert social meta tags and JSON-LD right before </head>
        // Always replace og:url and twitter:url with canonical URL (handles empty ones too)

        // Inject canonical tag if it doesn't exist in the HTML
        const canonicalTag = !canonicalMatch
            ? `<link rel="canonical" href="${canonicalUrl}">\n        `
            : '';

        let transformedHtml = html.replace(
            '</head>',
            `${wpResourceLinks}${cloudinaryLinks}${canonicalTag}${socialMeta}\n    </head>`,
        );

        // Update the title tag with full title including site name
        transformedHtml = transformedHtml.replace(
            /<title>.*?<\/title>/i,
            `<title>${fullTitle}</title>`,
        );

        // Replace canonical URL with correct one (handles empty or incorrect ones)
        transformedHtml = transformedHtml.replace(
            /<link\s+rel="canonical"\s+href="[^"]*"/i,
            `<link rel="canonical" href="${canonicalUrl}"`,
        );

        // Replace empty or missing og:url with canonical
        transformedHtml = transformedHtml.replace(
            /<meta\s+property="og:url"\s+content="[^"]*"/i,
            `<meta property="og:url" content="${canonicalUrl}"`,
        );

        // Replace empty or missing twitter:url with canonical
        transformedHtml = transformedHtml.replace(
            /<meta\s+name="twitter:url"\s+content="[^"]*"/i,
            `<meta name="twitter:url" content="${canonicalUrl}"`,
        );

        // Return new response with transformed HTML
        return new Response(transformedHtml, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error(
            '[social-meta] Error processing request:',
            error.message,
            'Path:',
            url.pathname,
        );
        // Return original response on error
        return context.next();
    }
};

// Configure which paths this edge function runs on
// Excludes /blog/* (handled by blog-meta.js) and /404
export const config = {
    path: '/*',
    excludedPath: ['/blog/*', '/404', '/404.html'],
};
