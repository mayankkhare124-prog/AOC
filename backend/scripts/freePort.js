const { execSync } = require('child_process');

const port = process.argv[2] || process.env.PORT || '5000';

function run(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function freePortWindows(targetPort) {
  const output = run(`netstat -ano -p tcp | findstr :${targetPort}`);
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\sLISTENING\s/i.test(line));

  const pids = [...new Set(lines.map((line) => line.split(/\s+/).pop()).filter(Boolean))];

  for (const pid of pids) {
    if (Number(pid) === process.pid) continue;
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`Freed port ${targetPort} by stopping PID ${pid}`);
    } catch {
      // Ignore failures so dev startup can proceed and show a normal bind error if needed.
    }
  }
}

function freePortUnix(targetPort) {
  const output = run(`lsof -ti tcp:${targetPort}`);
  const pids = [...new Set(output.split(/\r?\n/).map((pid) => pid.trim()).filter(Boolean))];

  for (const pid of pids) {
    if (Number(pid) === process.pid) continue;
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`Freed port ${targetPort} by stopping PID ${pid}`);
    } catch {
      // Ignore failures so dev startup can proceed and show a normal bind error if needed.
    }
  }
}

try {
  if (process.platform === 'win32') {
    freePortWindows(port);
  } else {
    freePortUnix(port);
  }
} catch {
  // Nothing to stop on this port, continue silently.
}