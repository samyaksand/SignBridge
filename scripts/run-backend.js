#!/usr/bin/env node
/**
 * Tries to start the optional FastAPI backend. If Python or its deps are
 * missing, prints a clear, friendly warning instead of crashing, and exits
 * cleanly so the frontend can keep running on its own.
 */
const { spawnSync, spawn } = require('node:child_process');

function hasCommand(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'ignore', shell: process.platform === 'win32' });
  return result.status === 0;
}

function findPython() {
  const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
  for (const candidate of candidates) {
    if (hasCommand(candidate, ['--version'])) return candidate;
  }
  return null;
}

const python = findPython();

if (!python) {
  console.log('[backend] Python was not found on this machine.');
  console.log('[backend] Skipping the backend. The frontend will still run fine on its own.');
  console.log('[backend] Want to try the backend? Install Python 3.10+, then run:');
  console.log('[backend]   cd backend && pip install -r requirements.txt');
  process.exit(0);
}

const hasFastapi = spawnSync(python, ['-c', 'import fastapi, uvicorn'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

if (hasFastapi.status !== 0) {
  console.log('[backend] Python was found, but FastAPI and uvicorn are not installed yet.');
  console.log('[backend] Skipping the backend. The frontend will still run fine on its own.');
  console.log('[backend] Want to try the backend? Run:');
  console.log('[backend]   cd backend && pip install -r requirements.txt');
  process.exit(0);
}

console.log('[backend] Starting the backend at http://localhost:8000 ...');

const child = spawn(
  python,
  ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'],
  {
    cwd: require('node:path').join(__dirname, '..', 'backend'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

child.on('exit', (code) => process.exit(code ?? 0));

const stop = () => {
  child.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
