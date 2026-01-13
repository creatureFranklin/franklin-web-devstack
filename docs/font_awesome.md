# Using Font Awesome with Franklin's web devstack

Font Awesome is **not** included by default, but the devstack is ready to support it in a clean and reusable way.

This guide shows how to:

-   install Font Awesome,
-   wire it through SCSS,
-   configure the devstack so webfonts are automatically copied from `node_modules` into `dist`.

> This assumes you are using the universal `devstackAssets` configuration in `package.json` and the updated `scripts/copy-static.mjs` that reads it.

---

## 1. Install Font Awesome

From the root of your project:

```bash
npm install @fortawesome/fontawesome-free
```

This adds Font Awesome to `node_modules/@fortawesome/fontawesome-free`.

---

## 2. Configure SCSS

Open `src/scss/main.scss` and add Font Awesome imports near the top.

Recommended setup:

```scss
// Make sure Font Awesome looks for fonts in ../webfonts
// relative to your compiled CSS (dist/assets/css/main.css)
$fa-font-path: '../webfonts';

// Core + icon styles
@use '@fortawesome/fontawesome-free/scss/fontawesome';
@use '@fortawesome/fontawesome-free/scss/solid';
@use '@fortawesome/fontawesome-free/scss/regular';
@use '@fortawesome/fontawesome-free/scss/brands';

// Your custom SCSS below...
// @use "variables";
// @use "layout";
// ...
```

Why this works:

-   Your compiled CSS lives in `dist/assets/css/main.css`.
-   `$fa-font-path: "../webfonts";` tells Font Awesome to generate URLs like:

    ```css
    url("../webfonts/fa-regular-400.woff2");
    ```

-   Browsers will resolve that to: `dist/assets/webfonts/fa-regular-400.woff2`.

So the only thing we must ensure is that the **webfont files actually exist** at `dist/assets/webfonts`.

---

## 3. Configure vendor assets in `package.json`

To automatically copy Font Awesome webfonts from `node_modules` into `dist` on every build, use the `devstackAssets` configuration.

In your root `package.json`, add (or extend) this section:

```jsonc
{
    // ...
    "devstackAssets": [
        {
            "from": "node_modules/@fortawesome/fontawesome-free/webfonts",
            "to": "assets/webfonts"
        }
    ]
}
```

-   `from` – path to the directory in `node_modules` containing the font files.
-   `to` – path **relative to `dist/`**, so the final location will be:
    -   `dist/assets/webfonts/*`

> ✅ This works together with the updated `scripts/copy-static.mjs`, which:
>
> -   always copies `src/assets` → `dist/assets`, and
> -   reads `devstackAssets` from `package.json` and copies those extra vendor assets as well.

If you later decide to add other libraries (e.g. Bootstrap JS), you can extend `devstackAssets` with more entries.

---

## 4. Use icons in your HTML

Once SCSS is compiled and webfonts are in place, you can use Font Awesome icons directly in your HTML templates:

```html
<i class="fa-solid fa-circle-info tw-mr-1"></i> <span>Some text with an icon</span>
```

Examples:

```html
<!-- Solid icon -->
<i class="fa-solid fa-circle-check tw-mr-1"></i>
<span>Success message</span>

<!-- Brand icon -->
<i class="fa-brands fa-github tw-mr-1"></i>
<span>View on GitHub</span>
```

Remember that the Tailwind prefix in this devstack is `tw-`, so don’t forget to use `tw-` in your utility classes (e.g. `tw-mr-1`, `tw-text-sm`, etc.).

---

## 5. Build & verify

Run the dev server:

```bash
npm run dev
```

Or production build:

```bash
npm run build
```

Then check that:

1. Font Awesome CSS is present in `dist/assets/css/main.css`.
2. The `dist/assets/webfonts` folder exists and contains files like:
    - `fa-solid-900.woff2`
    - `fa-regular-400.woff2`
    - etc.
3. The browser no longer shows 404 for `/assets/webfonts/...`.

If all of that is true, your Font Awesome setup is complete 🎉

---

## Summary

-   Install Font Awesome via npm.
-   Import its SCSS partials in `src/scss/main.scss`, with `$fa-font-path: "../webfonts";`.
-   Configure `devstackAssets` in `package.json` so the devstack copies webfonts from `node_modules` into `dist`.
-   Use `<i>` tags with Font Awesome classes in your HTML.
