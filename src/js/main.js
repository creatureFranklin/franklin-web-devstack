// Entry point for the main application bundle.

// Simple demo of DOM interaction
console.log("[FWP] Franklin's web devstack is ready.");

const demoButton = document.querySelector('#demo-button');

if (demoButton) {
    demoButton.addEventListener('click', () => {
        console.log('[FWP] Hello from main.js! 🎉');
        demoButton.textContent = 'Check console 👀';
    });
}

// Copy-to-clipboard for <pre> blocks
function setupCopyButtons() {
    const buttons = document.querySelectorAll('[data-copy-target]');

    buttons.forEach((button) => {
        const targetId = button.getAttribute('data-copy-target');
        const target = document.getElementById(targetId);

        if (!target) return;

        button.addEventListener('click', async () => {
            const text = target.innerText.trim();

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }

                // Small visual feedback
                const originalLabel = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalLabel;
                }, 1200);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        });
    });
}

// init
setupCopyButtons();

// This is a good place to bootstrap your application state, routing, etc.
