import { spawn } from 'child_process';

console.log('Starting APILens backend and frontend dev servers...');

// Spawn backend development server
const backend = spawn('npm', ['run', 'dev'], {
  cwd: 'backend',
  shell: true,
  stdio: 'inherit'
});

// Spawn frontend development server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: 'frontend',
  shell: true,
  stdio: 'inherit'
});

// Clean up processes on exit
const cleanExit = () => {
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
