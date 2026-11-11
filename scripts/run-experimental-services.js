#!/usr/bin/env node
/**
 * Starts the optional experimental demo services (soundsigns) alongside the
 * main app. ISL recognition used to run here too, but it is now merged
 * into backend/app (see backend/app/isl_recognition), started by
 * scripts/run-backend.js instead. If a service's dependencies are not
 * installed yet, this prints a friendly skip message and keeps going
 * instead of crashing the whole dev session.
 */
const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const root = path.join(__dirname, '..');
const isWin = process.platform === 'win32';

function findPython(cwd) {
  const venvPython = path.join(cwd, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPython)) return venvPython;
  const candidates = isWin ? ['py', 'python', 'python3'] : ['python3', 'python'];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: isWin });
    if (result.status === 0) return candidate;
  }
  return null;
}

const children = [];

function logSkip(name, reason) {
  console.log(`[${name}] Skipping: ${reason}`);
}

function startPythonService(name, dir, port, entry, importCheck = 'import fastapi, uvicorn') {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) {
    logSkip(name, `folder not found at ${dir}`);
    return;
  }
  const python = findPython(fullDir);
  if (!python) {
    logSkip(name, 'Python was not found on this machine.');
    return;
  }
  // Note: this must run without shell: true. On Windows, cmd.exe mangles the
  // comma-separated import list (e.g. "import fastapi, uvicorn") when the
  // command is re-quoted through the shell, which made every venv look like
  // it was missing its dependencies even when it was not.
  const check = spawnSync(python, ['-c', importCheck], { stdio: 'ignore' });
  if (check.status !== 0) {
    logSkip(name, `Dependencies not installed. Run: cd ${dir} && pip install -r requirements.txt`);
    return;
  }
  console.log(`[${name}] Starting at http://localhost:${port} ...`);
  // `entry` is either a script that runs itself (has its own
  // `if __name__ == "__main__": uvicorn.run(...)` block), or a
  // "module:attr" ASGI target (e.g. "main:app") for services whose entry
  // file does not start its own server. The latter is launched through
  // `python -m uvicorn` directly instead.
  const isAsgiTarget = entry.includes(':');
  const args = isAsgiTarget
    ? ['-m', 'uvicorn', entry, '--host', '127.0.0.1', '--port', String(port)]
    : [entry];
  const child = spawn(python, args, {
    cwd: fullDir,
    stdio: 'inherit',
    shell: isWin,
  });
  children.push(child);
}

startPythonService(
  'soundsigns',
  'backend/services/soundsigns',
  8122,
  'transcription.py',
  'import flask, flask_cors, openai, dotenv'
);

if (children.length === 0) {
  console.log('[experimental] No experimental services could be started. The main app will still run fine.');
  process.exit(0);
}

const stop = () => {
  children.forEach((child) => child.kill());
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
