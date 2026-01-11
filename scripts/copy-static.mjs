import fs from 'fs/promises';
import path from 'node:path';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const CONFIG_KEY = 'devstackAssets';

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
    await ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
}

async function copyDir(srcDir, destDir) {
    await ensureDir(destDir);
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

async function copyRootHtml() {
    const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.html')) {
            const srcPath = path.join(SRC_DIR, entry.name);
            const destPath = path.join(DIST_DIR, entry.name);
            await copyFile(srcPath, destPath);
        }
    }
}

async function copyAssetsDir() {
    const assetsSrc = path.join(SRC_DIR, 'assets');

    try {
        const stat = await fs.stat(assetsSrc);
        if (stat.isDirectory()) {
            const assetsDest = path.join(DIST_DIR, 'assets');
            await copyDir(assetsSrc, assetsDest);
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        // src/assets does not exist – ignore
    }
}

function normalizeConfigEntry(entry) {
    if (typeof entry === 'string') {
        const [from, to] = entry.split(':');
        if (!from || !to) return null;
        return { from: from.trim(), to: to.trim() };
    }

    if (entry && typeof entry === 'object' && entry.from && entry.to) {
        return { from: entry.from, to: entry.to };
    }

    return null;
}

async function loadVendorAssetsConfig() {
    try {
        const pkgRaw = await fs.readFile('package.json', 'utf8');
        const pkg = JSON.parse(pkgRaw);
        const rawEntries = pkg[CONFIG_KEY];

        if (!Array.isArray(rawEntries)) {
            return [];
        }

        const normalized = rawEntries.map(normalizeConfigEntry).filter(Boolean);

        return normalized;
    } catch (err) {
        if (err.code === 'ENOENT') {
            // no package.json? should not happen in normal project
            console.warn('[copy-static] package.json not found, skipping vendor assets.');
            return [];
        }

        console.warn(`[copy-static] Failed to read "${CONFIG_KEY}" from package.json, skipping vendor assets.`);
        console.warn(err);
        return [];
    }
}

async function copyVendorAssets() {
    const mappings = await loadVendorAssetsConfig();

    for (const mapping of mappings) {
        const srcPath = mapping.from;
        const destPath = path.join(DIST_DIR, mapping.to);

        try {
            const stat = await fs.stat(srcPath);

            if (stat.isDirectory()) {
                console.log(`[copy-static] vendor dir: ${srcPath} -> ${destPath}`);
                await copyDir(srcPath, destPath);
            } else if (stat.isFile()) {
                console.log(`[copy-static] vendor file: ${srcPath} -> ${destPath}`);
                await copyFile(srcPath, destPath);
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.warn(`[copy-static] vendor path not found, skipping: ${srcPath}`);
            } else {
                throw err;
            }
        }
    }
}

async function main() {
    try {
        await ensureDir(DIST_DIR);

        await copyRootHtml();
        await copyAssetsDir();
        await copyVendorAssets();

        console.log('[copy-static] Static files copied.');
    } catch (err) {
        console.error('[copy-static] Error:', err);
        process.exit(1);
    }
}

main();
