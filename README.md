# >\_ Franklin's web devstack

> Classic HTML + Tailwind (with `tw-` prefix) + SCSS + ESBuild bundling + simple hash-based cache busting.

This devstack is meant for small to medium front-end projects where you don’t want a full SPA framework, but still want a modern DX:

-   plain HTML templates in `src/`
-   Tailwind CSS (JIT, with `tw-` prefix)
-   SCSS for your own styles
-   ESBuild for JS bundling
-   watch mode with live reload
-   production build with cache-busted JS/CSS file names

---

## Requirements

-   **Node.js**: `>= 18` recommended  
    (older versions may work but some tools show engine warnings)
-   **npm**: comes with Node

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (watch + live reload)
npm run dev
```

Then open the URL printed in the terminal (by default something like `http://127.0.0.1:4173`).

You should see the brown themed landing page with:

-   “It works! 🚀”
-   Dev commands cheat sheet
-   Tailwind / SCSS info
-   Copy buttons for basic commands

---

## Available scripts

### Main scripts

```bash
npm run dev
```

Runs everything in **watch mode**:

-   Tailwind CLI (watch)
-   SCSS → CSS (watch)
-   ESBuild (watch)
-   copies HTML/static assets on change
-   serves `dist/` via `live-server` with auto reload

The dev server runs on port **4173** by default. To use a different port:

```bash
npm run dev --port=8000
```

The URL is printed in the terminal when the server starts.

```bash
npm run build
```

Creates a **production build**:

1. cleans `dist`
2. builds Tailwind CSS (minified)
3. builds SCSS → CSS (minified)
4. bundles & minifies JS with ESBuild
5. copies HTML + static assets from `src/` to `dist/`
6. renames CSS/JS files with a content hash  
   (e.g. `main.3f19c8a1.js`, `tailwind.5489a9c3.css`)
7. updates all HTML references to use the new hashed filenames

Result: a ready-to-deploy `dist/` folder with cache-busted assets.

---

### Partial build scripts

You can also run individual steps:

```bash
# Clean dist/
npm run clean

# Tailwind + SCSS
npm run build:css
npm run build:css:tailwind
npm run build:css:scss

# JS (all entrypoints in src/js/*.js)
npm run build:js

# Copy HTML + static assets from src/ to dist/
npm run build:static

# Rename CSS/JS with hashes and update HTML
npm run build:rev
```

These are the same commands that `npm run build` uses under the hood.

---

## Project structure

Simplified structure:

```text
.
├─ package.json
├─ tailwind.config.cjs
├─ scripts/
│  ├─ copy-static.mjs      # copies HTML + assets from src/ to dist/
│  ├─ build-i18n.mjs       # i18n build – replaces {{placeholders}}, injects hreflang
│  └─ rev-assets.mjs       # adds hashes to CSS/JS and updates HTML
├─ src/
│  ├─ index.html           # main template (uses {{key}} placeholders)
│  ├─ locales/
│  │  ├─ en.json           # English translations (default locale)
│  │  └─ cs.json           # Czech translations
│  ├─ styles/
│  │  └─ tailwind.css      # Tailwind entry (@tailwind base; components; utilities;)
│  ├─ scss/
│  │  └─ main.scss         # your custom SCSS
│  ├─ js/
│  │  ├─ main.js           # demo JS (button + copy-to-clipboard)
│  │  └─ i18n.js           # runtime t() helper – reads window.__i18n
│  └─ assets/
│     └─ ...               # images, fonts, extra static files
└─ dist/
   ├─ index.html           # default locale (en)
   ├─ cs/
   │  └─ index.html        # Czech variant
   └─ ...                  # built output (generated)
```

You should treat `dist/` as **build output only** – everything you edit manually should live in `src/`.

---

## Tailwind

-   Tailwind is configured with the **`tw-` prefix**:

    ```js
    // tailwind.config.cjs (snippet)
    module.exports = {
        prefix: 'tw-',
        content: ['./src/**/*.html', './src/**/*.js'],
        theme: {
            extend: {
                // you can put your custom colors / spacing / etc here
            },
        },
        plugins: [],
    };
    ```

-   Only classes found in `./src/**/*.html` and `./src/**/*.js` are generated
    (JIT mode, no unused utilities).
-   Tailwind entry file is `src/styles/tailwind.css`, typically with:

    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

In the demo layout you’ll see classes like:

```html
<body class="tw-min-h-screen tw-bg-[#cbbba6] tw-text-[#3d2a1c]">
    ...
    <button class="tw-rounded-lg tw-bg-[#4c382b] tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-[#fdf8f3]"></button
></body>
```

### Tailwind extras (custom components)

If you want to create reusable components based on Tailwind utilities (buttons, badges, etc.) using `@apply`, define them in `src/styles/tailwind.css` inside a `@layer` block, for example:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
    .btn {
        @apply tw-rounded-full tw-font-medium tw-transition-all tw-duration-300;
    }
}
```

@apply must go through the Tailwind pipeline, so keep these “extras” in src/styles/tailwind.css, not in SCSS.

---

> 💡 **Customize me:**
> Feel free to tweak Tailwind in `tailwind.config.cjs` – add brand colors, fonts, spacing, etc.
> Just keep the `tw-` prefix unless you explicitly want to use the default one.

---

## SCSS

-   Place your SCSS files in `src/scss/`.
-   By default, `main.scss` is compiled to:

    ```text
    dist/assets/css/main.css
    ```

-   The build command uses:

    ```bash
    sass --load-path=node_modules ./src/scss:./dist/assets/css
    ```

    So you can import packages from `node_modules`, for example:

    ```scss
    @import '@fortawesome/fontawesome-free/css/all.min.css';
    ```

Use SCSS for your custom styles that don’t fit well into utility classes, or for global tokens (variables, mixins, etc.).

---

## JavaScript bundling (ESBuild)

-   All entrypoints in `src/js/*.js` are bundled with ESBuild to:

    ```text
    dist/assets/js/<name>.js
    ```

    For example:

    -   `src/js/main.js` → `dist/assets/js/main.js`
    -   `src/js/admin.js` → `dist/assets/js/admin.js`

-   In production (`npm run build`), JS files are also **minified** and renamed with a content hash.
    The HTML is automatically updated, so you don’t have to change script tags manually.

### Demo logic

`src/js/main.js` contains a tiny bit of demo logic:

-   logs a message to the console to confirm JS bundling
-   hooks the “Click and check console!” button
-   implements **copy-to-clipboard** for the “Copy code” buttons in the dev commands section

You can safely delete or replace this file with your actual application code – just keep the `script type="module"` tag in `index.html` pointing to the correct JS entrypoint.

---

## Static assets & HTML

-   HTML templates live in `src/` (e.g. `src/index.html`).
-   `scripts/copy-static.mjs` copies:

    -   root-level `*.html` files from `src/` to `dist/`
    -   the `src/assets/` directory into `dist/assets/`

You can add more HTML files (e.g. `about.html`, `docs.html`) directly to `src/`. They’ll be copied during:

```bash
npm run dev      # (on start + when HTML changes)
npm run build
```

In production (`npm run build`), all `.html` files in `dist/` get their `<link>` and `<script>` references updated to point at the hashed CSS/JS filenames.

---

## Internationalisation (i18n)

The devstack has built-in support for generating multiple language variants from a single set of HTML templates.  
See the full guide: **[docs/i18n.md](docs/i18n.md)**

### Quick overview

| What | Where |
|------|-------|
| Translation files | `src/locales/<lang>.json` |
| Placeholder syntax | `{{key}}` / `{{section.key}}` in HTML |
| Runtime JS helper | `import { t } from './i18n.js'` |
| Config | `package.json` → `devstackI18n` |

```jsonc
// package.json
"devstackI18n": {
    "defaultLocale": "en",   // goes to dist/ root
    "localesDir": "src/locales",
    "siteUrl": "https://example.com"  // used for hreflang href attributes
}
```

**Build output:**
- `example.com/` → English (default)
- `example.com/cs/` → Czech

**Dev server with a specific locale:**

```bash
npm run dev               # default locale (en)
npm run dev --locale=cs   # Czech
```

---

## Vendor assets (`devstackAssets`)

If you need to copy extra vendor files from `node_modules` into `dist` (fonts, JS bundles, …), you can configure them in `package.json` under the `devstackAssets` field.

Example for Font Awesome webfonts:

```jsonc
{
    "devstackAssets": [
        {
            "from": "node_modules/@fortawesome/fontawesome-free/webfonts",
            "to": "assets/webfonts"
        }
    ]
}
```

-   `from` – path relative to the project root (usually inside `node_modules/...`).
-   `to` – path **relative to `dist/`**, so this example copies to `dist/assets/webfonts`.

The `scripts/copy-static.mjs` script automatically reads `devstackAssets` and copies these files on both `npm run dev` and `npm run build`.

---

## What this devstack does _not_ include

Deliberately **not** included:

-   no framework (no React/Vue/Angular)
-   no routing or templating engine

This keeps the devstack focused and easy to customize.  
You can build your own “pro” version on top of it (e.g. add a Bootstrap, React, Vue, etc.) without carrying extra weight in the base template.

---

## Tips for extending the stack

-   Add more HTML pages directly into `src/`.
-   Create additional JS entry files in `src/js/` for different pages/sections.
-   Extend Tailwind’s theme with your brand palette.
-   Add SCSS partials for reusable components (buttons, forms, layout).
-   If the project grows, you can still keep this stack and progressively enhance it.

---

## Additional docs

For more detailed guides and recipes, check the `/docs` folder in this project:

-   [Font Awesome setup](docs/font_awesome.md) – how to install and configure Font Awesome (SCSS + webfonts via `devstackAssets`)
-   [i18n / Internationalisation](docs/i18n.md) – full guide to multi-language support, placeholders, JS runtime helper, hreflang

---

## ☕ Support Development

If you like this project and want to support future updates, you can buy me a coffee:

[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy%20Me%20a%20Coffee-orange)](https://buymeacoffee.com/reminektomq)

Every coffee helps me keep improving ❤️

---

## 🤝 Contributing

Suggestions and bug reports are welcome!  
Feel free to open an issue or contact me directly.

---

## 📜 License

MIT License – free to use, modify, and distribute.

---

### 💡 Author

Developed with ❤️ by Franklin
