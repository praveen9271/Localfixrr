import { spawn } from 'node:child_process';

const processes = [
  {
    name: 'server',
    command: 'npm --prefix server run dev',
  },
  {
    name: 'client',
    command: 'npm --prefix client run dev -- --host localhost',
  },
];

let shuttingDown = false;

const children = processes.map(({ name, command }) => {
  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    const reason = signal || `code ${code}`;
    console.log(`${name} stopped with ${reason}. Stopping local dev.`);
    shutdown(code || 1);
  });

  return child;
});

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill();
  }

  process.exit(code);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
