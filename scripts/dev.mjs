/**
 * Dev runner: start Vite, wait for it to answer, then launch ow-electron
 * pointed at it. Avoids pulling in concurrently + wait-on for six lines.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const DEV_URL = 'http://localhost:5173';
const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';

const children = [];
function run(cmd, args, extraEnv = {}) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...extraEnv },
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const c of children) if (!c.killed) c.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 404) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Vite did not start at ${url} within ${timeoutMs}ms`);
}

run(npx, ['vite']);

// Main is plain tsc output; rebuild on change.
run(npx, ['tsc', '-p', 'tsconfig.main.json', '--watch', '--preserveWatchOutput']);

// The preload MUST be a single bundled file: it runs sandboxed, where
// require() is limited to electron and a few built-ins, so a relative
// require('../shared/ipc') throws and the bridge is never installed.
run(npx, [
  'esbuild', 'src/preload/index.ts', '--bundle', '--platform=node',
  '--format=cjs', '--external:electron', '--outfile=dist/preload/index.js',
  '--sourcemap', '--watch=forever',
]);

await waitForServer(DEV_URL);

// tsc --watch needs a beat to emit the first dist/main/index.js.
await new Promise((r) => setTimeout(r, 1500));

const electron = run(npx, ['ow-electron', '.'], { VITE_DEV_SERVER_URL: DEV_URL });
const [code] = await once(electron, 'exit');
shutdown(code ?? 0);
