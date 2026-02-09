/*
 ** Responsive Image Component with Cloudinary
 **
 ** Automatically uses Cloudinary if VITE_CLOUDINARY_CLOUD_NAME env variable is set.
 ** Falls back to original URLs if env variable is not present.
 **
 ** Supports 2 modes:
 ** 1. Direct Cloudinary upload (filename attribute)
 ** 2. External image URL with optional Cloudinary fetch (src attribute)
 **
 ** Usage Examples:
 **
 ** <!-- Direct Cloudinary upload (requires env variable) -->
 ** <x-image
 **   filename="sample.jpg"
 **   width="1792"
 **   height="1108"
 **   alt="Description of image"
 **   ar="true"
 ** ></x-image>
 **
 ** <!-- External image URL (uses Cloudinary if env set) -->
 ** <x-image
 **   src="https://example.com/wp-content/uploads/image.jpg"
 **   width="1920"
 **   height="1080"
 **   alt="Blog post image"
 ** ></x-image>
 **
 ** Attributes:
 ** - filename: Filename for direct Cloudinary uploads (requires VITE_CLOUDINARY_CLOUD_NAME)
 ** - src: External image URL (optimized via Cloudinary if env variable exists)
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
        const isDirectUpload = hasCloudinary && filename && !src;
        const isFetch = hasCloudinary && src;
        const isFallbackOnly = !hasCloudinary && src;

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
            const escapedSrc = src
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            pictureHTML = `
                <picture>
                    <source
                        media="(max-width: 767px)"
                        srcset="
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 640, src)} 640w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 768, src)} 768w
                        "
                        sizes="100vw"
                    >
                    <source
                        media="(min-width: 768px)"
                        srcset="
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1024, src)} 1024w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1280, src)} 1280w,
                            ${this.cloudinaryFetchUrl(cloudinaryUser, 1792, src)} 1792w
                        "
                        sizes="80vw"
                    >
                    <img
                        src="${this.cloudinaryFetchUrl(cloudinaryUser, 1792, src)}"
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
            // Mode 3: No Cloudinary env variable, use original URL
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
