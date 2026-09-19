import { existsSync } from 'fs';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

const root = path.resolve('.');
const dist = path.join(root, 'dist');

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    ps.on('close', (code) => (code === 0 ? resolve(code) : reject(new Error(`${cmd} exited ${code}`))));
    ps.on('error', reject);
  });
}

async function simpleCopyBuild() {
  console.log('No Astro config detected — running simple "main" build (copy index.html, styles.css, CNAME)...');
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  const filesToCopy = ['index.html', 'styles.css', 'CNAME'];
  for (const f of filesToCopy) {
    const src = path.join(root, f);
    const dest = path.join(dist, f);
    try {
      await fs.copyFile(src, dest);
      console.log(`copied ${f} -> dist/${f}`);
    } catch (err) {
      console.warn(`file not found: ${f} (skipping)`);
    }
  }

  // Also copy public/ if present (useful to preserve uploads or other assets)
  const publicDir = path.join(root, 'public');
  if (existsSync(publicDir)) {
    // naive recursive copy
    await copyDir(publicDir, path.join(dist, 'public'));
    console.log('copied public/ -> dist/public/');
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

(async () => {
  try {
    const forceSimple = process.env.FORCE_SIMPLE_BUILD === '1' || process.env.FORCE_SIMPLE_BUILD === 'true';
    const hasAstro = !forceSimple && (existsSync(path.join(root, 'astro.config.mjs')) || existsSync(path.join(root, 'src')));
    if (hasAstro) {
      console.log('Astro project detected — running `astro build`');
      // Use npx to ensure workspace-local binary is used if available
      await runCommand('npx', ['astro', 'build']);
      console.log('astro build completed');
    } else {
      await simpleCopyBuild();
      console.log('simple build completed');
    }
    process.exit(0);
  } catch (err) {
    console.error('Build failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();


