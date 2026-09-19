import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    ps.on('close', (code) => (code === 0 ? resolve(code) : reject(new Error(`${cmd} exited ${code}`))));
    ps.on('error', reject);
  });
}

(async () => {
  try {
    const root = path.resolve('.');
    const hasAstro = existsSync(path.join(root, 'astro.config.mjs')) || existsSync(path.join(root, 'src'));

    if (hasAstro) {
      console.log('Astro detected — running `astro preview` to serve dist/');
      // Use npx so the local binary is preferred when available
      await runCommand('npx', ['astro', 'preview', '--port=4321']);
    } else {
      console.log('No Astro detected — running live-server to serve dist/');
      await runCommand('npx', ['live-server', 'dist', '--port=4321', '--no-browser', '--quiet']);
    }
  } catch (err) {
    console.error('Failed to start server:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();

