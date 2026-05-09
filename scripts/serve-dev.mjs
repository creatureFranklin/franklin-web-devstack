import { spawn } from 'child_process';
import { resolve } from 'path';

const rawPort = process.env.npm_config_port || process.env.PORT || 4173;
const port = parseInt(rawPort, 10);

if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`❌ Invalid port: "${rawPort}". Must be an integer between 1 and 65535.`);
    process.exit(1);
}

// Resolve the live-server binary directly to avoid shell injection.
// node_modules/.bin/live-server is a symlink to the actual binary.
const bin = resolve('node_modules', '.bin', 'live-server');

console.log(`🚀 Dev server running at http://localhost:${port}`);

const child = spawn(bin, ['dist', `--port=${port}`, '--quiet'], {
    stdio: 'inherit',
    shell: false,
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
    } else {
        process.exit(code ?? 1);
    }
});

child.on('error', (err) => {
    console.error(`❌ Failed to start live-server: ${err.message}`);
    process.exit(1);
});
