const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('           FILEFORGE DOCUMENT WORKBENCH             ');
console.log('====================================================');
console.log('Initializing backend engine and Vite development server...\n');

// 1. Launch Backend Server
const server = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

// 2. Launch Vite Client
const client = spawn('npm', ['--prefix', 'client', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit();
});
