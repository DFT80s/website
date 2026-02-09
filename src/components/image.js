/*
 ** Responsive Image Component with Cloudinary
 **
 ** Supports 3 modes based on environment variables and attributes:
 ** 1. Direct Cloudinary upload (filename attribute)
 ** 2. Cloudinary fetch (src with external URL, OR src with local path when VITE_IMAGE_URL_BASE is set)
 ** 3. Direct image URL without Cloudinary optimization (src with local path, no VITE_IMAGE_URL_BASE)
 **
 ** Environment Variables:
 ** - VITE_CLOUDINARY_CLOUD_NAME: Enables Cloudinary optimization
 ** - VITE_IMAGE_URL_BASE: When set, enables Cloudinary fetch for local/relative paths
 **
 ** Usage Examples:
 **
 ** <!-- Mode 1: Direct Cloudinary upload -->
 ** <x-image
 **   filename="sample.jpg"
 **   width="1792"
 **   height="1108"
 **   alt="Description of image"
 **   ar="true"
 ** ></x-image>
 **
 ** <!-- Mode 2: External image with Cloudinary fetch -->
 ** <x-image
 **   src="https://example.com/wp-content/uploads/image.jpg"
 **   width="1920"
 **   height="1080"
 **   alt="Blog post image"
 ** ></x-image>
 **
 ** <!-- Mode 2: Local image with Cloudinary fetch (requires VITE_IMAGE_URL_BASE set) -->
 ** <x-image
 **   src="social.jpg"
 **   width="1792"
 **   height="1008"
 **   alt="Local image optimized by Cloudinary"
 ** ></x-image>
 **
 ** <!-- Mode 3: Local image without Cloudinary (VITE_IMAGE_URL_BASE not set) -->
 ** <x-image
 **   src="/images/photo.jpg"
 **   width="800"
 **   height="600"
 **   alt="Direct local image"
 ** ></x-image>
 **
 ** Attributes:
 ** - filename: Filename for direct Cloudinary uploads (requires VITE_CLOUDINARY_CLOUD_NAME)
 ** - src: Image URL (external or local path)
 ** - width: Image width in pixels
 ** - height: Image height in pixels
 ** - alt: Alt text for accessibility
 ** - loading: "lazy" (default) or "eager"
 ** - fetchpriority: "auto" (default), "high", or "low"
 ** - decoding: "async" (default), "sync", or "auto"
 ** - ar: "true" disables mobile aspect ratio transformation
 */

class ImageComponent extends HTMLElement {
    // Observe attributes
    static get observedAttributes() {
        return [
            'filename',
            'src',
            'width',
            'height',
            'alt',
            'loading',
            'fetchpriority',
            'decoding',
            'ar',
        ];
    }

    // Called when component is created
    constructor() {
        super();
        this.currentImg = null;

        // Bind error handler for image fallback
        this.errorHandler = () => {
            if (this.currentImg) {
                const fallback = this.currentImg.getAttribute('data-fallback');
                if (fallback && this.currentImg.src !== fallback) {
                    console.log(
                        '[x-image] Cloudinary failed, using fallback URL',
                    );
                    this.currentImg.src = fallback;
                    // Remove data-fallback to prevent infinite loop
                    this.currentImg.removeAttribute('data-fallback');
                }
            }
        };
    }

    // Called when component is added to the DOM
    connectedCallback() {
        this.render();
    }

    // Called when component is removed from the DOM
    disconnectedCallback() {
        if (this.currentImg) {
            this.currentImg.removeEventListener('error', this.errorHandler);
            this.currentImg = null;
        }
    }

    // Called when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Helper to build a Cloudinary URL for direct uploads
    cloudinaryUrl(user, width, filename) {
        return `https://res.cloudinary.com/${user}/image/upload/w_${width}/q_auto/f_auto/${filename}`;
    }

    // Helper to build a Cloudinary fetch URL for external images
    cloudinaryFetchUrl(user, width, sourceUrl) {
        return `https://res.cloudinary.com/${user}/image/fetch/w_${width},f_auto,q_auto/${sourceUrl}`;
    }

    // Helper to insert aspect ratio transformation for Cloudinary URLs
    withAspectRatio(url, aspect) {
        return url.replace(/\/upload\//, `/upload/ar_${aspect},c_fill/`);
    }

    // Render the <picture> element with responsive srcset and sizes
    render() {
        const cloudinaryUser = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
        const imageUrlBase = import.meta.env.VITE_IMAGE_URL_BASE || '';
        const filename = this.getAttribute('filename') || '';
        const src = this.getAttribute('src') || '';
        const width = this.getAttribute('width') || '1792';
        const height = this.getAttribute('height') || '1108';
        const alt = this.getAttribute('alt') || '';
        const loading = this.getAttribute('loading') || 'lazy';
        const fetchpriority = this.getAttribute('fetchpriority') || 'auto';
        const decoding = this.getAttribute('decoding') || 'async';
        const ar = this.getAttribute('ar') === 'true';

        // Determine rendering mode based on env variable and attributes
        const hasCloudinary = !!cloudinaryUser;
        const isExternalUrl =
            src && (src.startsWith('http://') || src.startsWith('https://'));
        // Use Cloudinary fetch for external URLs, or local paths when VITE_IMAGE_URL_BASE is set
        const shouldUseFetch =
            hasCloudinary && src && (isExternalUrl || !!imageUrlBase);

        const isDirectUpload = hasCloudinary && filename && !src;
        const isFetch = shouldUseFetch;
        const isFallbackOnly = src && !shouldUseFetch;

        let pictureHTML = '';

        if (isDirectUpload) {
            // Mode 1: Direct Cloudinary upload
            pictureHTML = `
                <picture>
                    <source
                        media="(max-width: 767px)"
                        srcset="
                            ${
                                ar
                                    ? this.cloudinaryUrl(
                                          cloudinaryUser,
                                          640,
                                          filename,
                                      )
                                    : this.withAspectRatio(
                                          this.cloudinaryUrl(
                                              cloudinaryUser,
                                              640,
                                              filename,
                                          ),
                                          '0.9',
                                      )
                            } 640w,
                            ${
                                ar
                                    ? this.cloudinaryUrl(
                                          cloudinaryUser,
                                          768,
                                          filename,
                                      )
                                    : this.withAspectRatio(
                                          this.cloudinaryUrl(
                                              cloudinaryUser,
                                              768,
                                              filename,
                                          ),
                                          '0.9',
                                      )
                            } 768w
                        "
                        sizes="100vw"
                    >
                    <source
                        media="(min-width: 768px)"
                        srcset="
                            ${this.cloudinaryUrl(cloudinaryUser, 1024, filename)} 1024w,
                            ${this.cloudinaryUrl(cloudinaryUser, 1280, filename)} 1280w,
                            ${this.cloudinaryUrl(cloudinaryUser, 1792, filename)} 1792w
                        "
                        sizes="80vw"
                    >
                    <img
                        src="${this.cloudinaryUrl(cloudinaryUser, 1792, filename)}"
                        width="${width}"
                        height="${height}"
                        alt="${alt}"
                        loading="${loading}"
                        fetchpriority="${fetchpriority}"
                        decoding="${decoding}"
                        draggable="false"
                    />
                </picture>
            `;
        } else if (isFetch) {
            // Mode 2: Cloudinary fetch with fallback to original URL
            // For local paths, prepend VITE_IMAGE_URL_BASE to create a full URL
            let fullSrc = src;
            if (!isExternalUrl) {
                // Ensure proper path joining with single slash
                const base = imageUrlBase.endsWith('/')
                    ? imageUrlBase.slice(0, -1)
                    : imageUrlBase;
                const path = src.startsWith('/') ? src : `/${src}`;
                fullSrc = `${base}${path}`;
            }
            const escapedSrc = src
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            pictureHTML = `
                <picture>
                    <source
                        media="(max-width: 767px)"
                        srcset="
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 640, fullSrc)} 640w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 768, fullSrc)} 768w
                        "
                        sizes="100vw"
                    >
                    <source
                        media="(min-width: 768px)"
                        srcset="
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1024, fullSrc)} 1024w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1280, fullSrc)} 1280w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1792, fullSrc)} 1792w
                        "
                        sizes="80vw"
                    >
                    <img
                        src="${this.cloudinaryFetchUrl(cloudinaryUser, 1792, fullSrc)}"
                        data-fallback="${escapedSrc}"
                        width="${width}"
                        height="${height}"
                        alt="${alt}"
                        loading="${loading}"
                        fetchpriority="${fetchpriority}"
                        decoding="${decoding}"
                        draggable="false"
                    />
                </picture>
            `;
        } else if (isFallbackOnly) {
            // Mode 3: Direct image URL without Cloudinary optimization
            const escapedSrc = src
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            pictureHTML = `
                <img
                    src="${escapedSrc}"
                    width="${width}"
                    height="${height}"
                    alt="${alt}"
                    loading="${loading}"
                    fetchpriority="${fetchpriority}"
                    decoding="${decoding}"
                    draggable="false"
                />
    `;
        }

        this.innerHTML = pictureHTML;

        // Attach error handler for fallback (only in fetch mode)
        if (isFetch) {
            // Remove old listener if exists
            if (this.currentImg) {
                this.currentImg.removeEventListener('error', this.errorHandler);
            }

            this.currentImg = this.querySelector('img[data-fallback]');
            if (this.currentImg) {
                this.currentImg.addEventListener('error', this.errorHandler);
            }
        } else {
            // Clean up if mode changed
            if (this.currentImg) {
                this.currentImg.removeEventListener('error', this.errorHandler);
                this.currentImg = null;
            }
        }
    }
}

// Register the component
customElements.define('x-image', ImageComponent);
