/**
 * build-i18n.mjs
 *
 * Reads HTML templates from src/, replaces {{key}} placeholders with
 * translations from src/locales/<lang>.json, injects hreflang <link> tags,
 * and writes results to:
 *   dist/           – default locale  (e.g. en)
 *   dist/<lang>/    – other locales   (e.g. dist/en/)
 *
 * Configuration is read from package.json → "devstackI18n":
 *   {
 *     "defaultLocale": "en",
 *     "localesDir":    "src/locales",
 *     "siteUrl":       "https://example.com"   // optional, used for hreflang hrefs
 *   }
 */

import fs   from 'fs/promises';
import path from 'node:path';
import { createRequire } from 'module';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read and parse package.json from the project root. */
async function readPackageJson() {
    const raw = await fs.readFile('package.json', 'utf-8');
    return JSON.parse(raw);
}

/**
 * Resolve a dot-notation key (e.g. "devCommands.heading") against a
 * translations object.  Returns the value as a string, or the original
 * placeholder when the key is not found.
 */
function resolve(translations, key, placeholder) {
    const parts = key.split('.');
    let cur = translations;
    for (const part of parts) {
        if (cur === null || typeof cur !== 'object' || !(part in cur)) {
            console.warn(`  [i18n] missing key: "${key}" – keeping placeholder`);
            return placeholder;
        }
        cur = cur[part];
    }
    return String(cur);
}

/**
 * Inject an inline <script> block that sets window.__i18n to the full
 * translations object for the current locale.  Replaces the
 * <!-- i18n:translations --> comment; falls back to inserting before </body>.
 *
 * @param {string} html         - HTML source
 * @param {object} translations - locale translations object
 */
function injectTranslationsScript(html, translations) {
    const json   = JSON.stringify(translations);
    const script = `<script>window.__i18n = ${json};</script>`;

    if (html.includes('<!-- i18n:translations -->')) {
        return html.replace('<!-- i18n:translations -->', script);
    }

    // Fallback: insert just before </body>
    return html.replace('</body>', `${script}\n    </body>`);
}

/**
 * Replace every {{key}} occurrence in `html` with the matching translation.
 */
function applyTranslations(html, translations) {
    return html.replace(/\{\{([^}]+)\}\}/g, (placeholder, key) => {
        return resolve(translations, key.trim(), placeholder);
    });
}

/**
 * Build the set of <link rel="alternate" hreflang="..."> tags for all locales
 * and inject them in place of the <!-- i18n:hreflang --> comment.
 *
 * @param {string}   html          - template source
 * @param {string}   currentFile   - e.g. "index.html"
 * @param {string[]} allLocales    - e.g. ["cs", "en"]
 * @param {string}   defaultLocale - e.g. "cs"
 * @param {string}   siteUrl       - e.g. "https://example.com"  (may be empty)
 */
function injectHreflang(html, currentFile, allLocales, defaultLocale, siteUrl) {
    const base = siteUrl ? siteUrl.replace(/\/$/, '') : '';

    const tags = allLocales.map((locale) => {
        const href = locale === defaultLocale
            ? `${base}/${currentFile}`
            : `${base}/${locale}/${currentFile}`;
        return `        <link rel="alternate" hreflang="${locale}" href="${href}" />`;
    });

    // x-default points to the default locale
    const defaultHref = `${base}/${currentFile}`;
    tags.push(`        <link rel="alternate" hreflang="x-default" href="${defaultHref}" />`);

    const block = tags.join('\n');

    if (html.includes('<!-- i18n:hreflang -->')) {
        return html.replace('<!-- i18n:hreflang -->', block);
    }

    // Fallback: insert before </head>
    return html.replace('</head>', `${block}\n    </head>`);
}

/**
 * For non-default locales the HTML is written one level deeper (dist/<locale>/)
 * so relative asset paths like ./assets/ or assets/ need to be rewritten to
 * ../assets/.  Absolute paths (starting with /) are left untouched.
 */
function rewriteRelativeAssetPaths(html) {
    // href="./assets/..." or src="./assets/..."
    html = html.replace(/(href|src)="\.\/assets\//g, '$1="../assets/');
    // href="assets/..." or src="assets/..." (no leading ./)
    html = html.replace(/(href|src)="assets\//g, '$1="../assets/');
    return html;
}

/** Ensure directory exists (mkdir -p). */
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    // 1. Read config from package.json
    const pkg = await readPackageJson();
    const config = pkg.devstackI18n;

    if (!config) {
        console.error('[i18n] No "devstackI18n" key found in package.json – skipping.');
        process.exit(0);
    }

    const defaultLocale = config.defaultLocale;
    const localesDir    = config.localesDir ?? 'src/locales';
    const siteUrl       = config.siteUrl ?? '';

    if (!defaultLocale) {
        console.error('[i18n] "devstackI18n.defaultLocale" is required.');
        process.exit(1);
    }

    // Dev mode: npm run dev --locale=en  →  process.env.npm_config_locale = "en"
    // When set, only the requested locale is processed and always written to dist/ root.
    const devLocale = process.env.npm_config_locale ?? null;
    const isDevMode = devLocale !== null;

    if (isDevMode) {
        console.log(`[i18n] Dev mode – locale: ${devLocale}`);
    }

    // 2. Load all JSON locale files
    const localeFiles = (await fs.readdir(localesDir))
        .filter(f => f.endsWith('.json'));

    if (localeFiles.length === 0) {
        console.warn(`[i18n] No JSON files found in "${localesDir}" – nothing to do.`);
        process.exit(0);
    }

    /** @type {Map<string, object>} locale code → translations object */
    const locales = new Map();

    for (const file of localeFiles) {
        const locale = path.basename(file, '.json');
        // In dev mode load only the requested locale for speed
        if (isDevMode && locale !== devLocale) continue;
        const raw = await fs.readFile(path.join(localesDir, file), 'utf-8');
        locales.set(locale, JSON.parse(raw));
        console.log(`[i18n] Loaded locale: ${locale}`);
    }

    if (locales.size === 0) {
        console.error(`[i18n] Locale "${devLocale}" not found in "${localesDir}".`);
        console.error(`[i18n] Available: ${localeFiles.map(f => path.basename(f, '.json')).join(', ')}`);
        process.exit(1);
    }

    const allLocales = isDevMode
        // In dev mode report all locale codes for hreflang, even though we only build one
        ? localeFiles.map(f => path.basename(f, '.json'))
        : [...locales.keys()];

    // 3. Collect HTML templates from src/
    const srcDir   = 'src';
    const distDir  = 'dist';
    const srcFiles = (await fs.readdir(srcDir, { withFileTypes: true }))
        .filter(e => e.isFile() && e.name.endsWith('.html'))
        .map(e => e.name);

    if (srcFiles.length === 0) {
        console.warn('[i18n] No HTML templates found in src/ – nothing to do.');
        process.exit(0);
    }

    if (!isDevMode) {
        console.log(`[i18n] Templates: ${srcFiles.join(', ')}`);
        console.log(`[i18n] Locales:   ${allLocales.join(', ')}  (default: ${defaultLocale})`);
    }

    // 4. Process each locale × each template
    for (const [locale, translations] of locales) {
        // In dev mode always write to dist/ root regardless of which locale it is
        const isDefault = isDevMode || locale === defaultLocale;
        const outDir    = isDefault ? distDir : path.join(distDir, locale);

        await ensureDir(outDir);

        for (const file of srcFiles) {
            const srcPath  = path.join(srcDir, file);
            let   html     = await fs.readFile(srcPath, 'utf-8');

            // Inject hreflang links
            html = injectHreflang(html, file, allLocales, defaultLocale, siteUrl);

            // Inject inline translations script (window.__i18n) for JS runtime use
            html = injectTranslationsScript(html, translations);

            // Replace translation placeholders
            html = applyTranslations(html, translations);

            // Rewrite relative asset paths for non-default locales (dist/<locale>/ is one level deeper)
            if (!isDefault) {
                html = rewriteRelativeAssetPaths(html);
            }

            const destPath = path.join(outDir, file);
            await fs.writeFile(destPath, html, 'utf-8');
            console.log(`[i18n] Written: ${destPath}`);
        }
    }

    console.log('[i18n] Done.');
}

main().catch(err => {
    console.error('[i18n] Error:', err);
    process.exit(1);
});
