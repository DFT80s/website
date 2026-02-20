/*
 ** Contact Page JS
 */

// Track page load time for submission speed checking (must be at top)
window.pageLoadTime = Date.now();

// Development mode detection
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';

// Initialize the app after DOM is loaded
let initialized = false;

const app = () => {
    // Prevent double initialization
    if (initialized) return;
    initialized = true;

    // Initialize anti-spam protection
    initAntiSpam();
};

// Anti-spam protection system
const initAntiSpam = () => {
    // Target Netlify forms specifically (more robust than all forms)
    const forms = document.querySelectorAll(
        'form[data-netlify="true"], form[name="contact"]',
    );
    if (forms.length === 0) return;

    forms.forEach(form => {
        // Set up honeypot fields for this form
        setupHoneypots(form);

        // Set up human verification for this form
        setupHumanVerification(form);

        // Set up simple validation error display
        setupValidationError(form);

        // Handle form submission with spam checking
        form.addEventListener('submit', handleFormSubmit);
    });
};

// Set up hidden honeypot fields that bots might fill
const setupHoneypots = form => {
    // Create hidden company field (bots often fill company fields)
    if (!form.querySelector('input[name="company"]')) {
        const companyField = document.createElement('input');
        companyField.type = 'hidden';
        companyField.name = 'company';
        companyField.value = 'please-leave-empty'; // Pre-filled to require interaction clearing
        companyField.autocomplete = 'off';

        // Insert after the visible email field
        const emailField = form.querySelector('input[name="email"]');
        if (emailField) {
            emailField.parentNode.insertBefore(
                companyField,
                emailField.nextSibling,
            );
        }
    }

    // Create hidden name field
    if (!form.querySelector('input[name="bot_name"]')) {
        const nameField = document.createElement('input');
        nameField.type = 'text';
        nameField.name = 'bot_name';
        nameField.style.display = 'none';
        nameField.tabIndex = -1;
        nameField.setAttribute('aria-hidden', 'true');
        nameField.autocomplete = 'off';

        // Insert after message field
        const messageField = form.querySelector('textarea[name="message"]');
        if (messageField) {
            messageField.parentNode.insertBefore(
                nameField,
                messageField.nextSibling,
            );
        }
    }
};

// Set up human verification (checkbox test)
const setupHumanVerification = form => {
    // The checkbox in HTML serves as human verification
    // No additional setup needed for now

    // Clear honeypot fields on user interaction (proves human behavior)
    const inputs = form.querySelectorAll(
        'input:not([type="hidden"]), textarea',
    );
    inputs.forEach(input => {
        input.addEventListener('input', () => clearHoneypots(form));
        input.addEventListener('focus', () => clearHoneypots(form));
    });
};

// Clear honeypot fields when user interacts with form
const clearHoneypots = form => {
    const companyField = form.querySelector('input[name="company"]');
    const nameField = form.querySelector('input[name="bot_name"]');

    if (companyField) companyField.value = '';
    if (nameField) nameField.value = '';
};

// Set up simple validation error and success messages
const setupValidationError = form => {
    // Create a single form-level message container
    const submitButton = form.querySelector('x-button[type="submit"]');
    if (!submitButton) return;

    // Create error container if it doesn't exist
    let formError = form.querySelector('.form-error');
    if (!formError) {
        formError = document.createElement('div');
        formError.className = 'form-error';
        formError.setAttribute('aria-live', 'polite');
        formError.setAttribute('role', 'alert');
        // Insert before the submit button inside the form
        submitButton.parentNode.insertBefore(formError, submitButton);
    }

    // Create success container if it doesn't exist
    let formSuccess = form.querySelector('.form-success');
    if (!formSuccess) {
        formSuccess = document.createElement('div');
        formSuccess.className = 'form-success';
        formSuccess.setAttribute('aria-live', 'polite');
        formSuccess.setAttribute('role', 'status');
        // Insert before the submit button inside the form
        submitButton.parentNode.insertBefore(formSuccess, submitButton);
    }

    // Show generic error message when validation fails
    // Note: 'invalid' event fires when HTML5 validation fails (before submit is blocked)
    form.addEventListener(
        'invalid',
        () => {
            formError.textContent =
                'Please fill out all required fields correctly.';
            formSuccess.textContent = ''; // Clear success on error
        },
        true, // Use capture phase to catch the event
    );

    // Clear messages when user interacts with any field
    form.addEventListener('input', () => {
        formError.textContent = '';
        formSuccess.textContent = '';
    });

    // Clear error on submit start
    form.addEventListener('submit', () => {
        formError.textContent = '';
    });
};

// Handle form submission with spam checking and Netlify submission
const handleFormSubmit = event => {
    const form = event.target;

    // First check if form is valid - let browser validation run if not
    if (!form.checkValidity()) {
        return; // Let browser handle validation
    }

    // Form is valid - now check for bot behavior
    const isBot = checkForBotBehavior(form);

    if (isBot) {
        event.preventDefault();
        alert('Form submission blocked. Please try again.');
        return false;
    }

    // Human submission with valid data - handle with Netlify
    event.preventDefault();

    // Find and disable submit button
    const submitButton = form.querySelector('x-button[type="submit"]');
    if (submitButton) {
        submitButton.setAttribute('disabled', '');
    }

    // In development mode, log the form data instead of submitting
    if (isDevelopment) {
        // Development mode: Log data and show success
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log('📝 Form submitted in development mode:', data);

        // Show success message
        const formSuccess = form.querySelector('.form-success');
        if (formSuccess) {
            formSuccess.textContent =
                '✅ Development mode: Form data logged to console. Check browser console for details.';
        }

        alert(
            '✅ Development mode: Form data logged to console!\n\nCheck browser console for submitted data.',
        );
        form.reset();

        // Re-enable submit button
        if (submitButton) {
            submitButton.removeAttribute('disabled');
        }
        return false;
    }

    // Netlify form submission using fetch API
    const formData = new FormData(form);

    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
    })
        .then(() => {
            // Show success message
            const formSuccess = form.querySelector('.form-success');
            if (formSuccess) {
                formSuccess.textContent =
                    "✅ Thank you for your message! We'll get back to you soon.";
            }

            alert("Thank you for your message! We'll get back to you soon.");
            form.reset();
        })
        .catch(error => {
            if (isDevelopment) {
                console.error('Form submission error:', error);
            }

            // Show error message
            const formError = form.querySelector('.form-error');
            if (formError) {
                formError.textContent =
                    'Sorry, there was an error sending your message. Please try again.';
            }

            alert(
                'Sorry, there was an error sending your message. Please try again.',
            );
        })
        .finally(() => {
            // Re-enable submit button after submission completes
            if (submitButton) {
                submitButton.removeAttribute('disabled');
            }
        });

    return false;
};

// Check various indicators of bot behavior
const checkForBotBehavior = form => {
    // Check honeypot fields (should be empty for humans)
    const companyField = form.querySelector('input[name="company"]');
    const nameField = form.querySelector('input[name="bot_name"]');

    if (companyField && companyField.value.trim() !== '') {
        return true; // Bot filled honeypot
    }

    if (nameField && nameField.value.trim() !== '') {
        return true; // Bot filled honeypot
    }

    // Check human verification checkbox (should be checked by humans)
    const humanCheck = form.querySelector('input[name="human_check"]');
    if (humanCheck && !humanCheck.checked) {
        return true; // Human didn't verify
    }

    // Check submission speed (too fast = likely bot)
    const timeSinceLoad = Date.now() - window.pageLoadTime;
    if (timeSinceLoad < 3000) {
        // Less than 3 seconds
        return true; // Too fast for human
    }

    return false; // Appears human
};

document.addEventListener('DOMContentLoaded', app);
