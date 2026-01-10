import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else if (entry.isFile()) {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function copyStaticOnce() {
    await fs.mkdir(distDir, { recursive: true });

    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);

        // Copy root-level HTML files
        if (entry.isFile() && entry.name.endsWith('.html')) {
            const destPath = path.join(distDir, entry.name);
            await fs.copyFile(srcPath, destPath);
            continue;
        }

        // Copy the assets directory
        if (entry.isDirectory() && entry.name === 'assets') {
            const destPath = path.join(distDir, 'assets');
            await copyDir(srcPath, destPath);
            continue;
        }

        // Other directories (js, scss, styles) are handled by builders
    }
}

async function main() {
    await copyStaticOnce();
    console.log('[copy-static] Static files copied.');
}

main().catch((err) => {
    console.error('[copy-static] Error:', err);
    process.exit(1);
});
