const { spawn } = require('child_process');
const net = require('net');

const APP_ID = process.env.APP_ID || 'raydent-16571';
const candidatePorts = [8000, 8080, 3000, 5173];

function findOpenPort(ports, index = 0) {
  return new Promise((resolve, reject) => {
    if (index >= ports.length) {
      reject(new Error(`No open port found in: ${ports.join(', ')}`));
      return;
    }

    const port = ports[index];
    const server = net.createServer();

    server.once('error', () => {
      server.close(() => findOpenPort(ports, index + 1).then(resolve).catch(reject));
    });

    server.once('listening', () => {
      server.close(() => resolve(port));
    });

    server.listen(port, '0.0.0.0');
  });
}

function findEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      reject(err);
    });

    server.once('listening', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : null;
      server.close(() => {
        if (!port) {
          reject(new Error('Failed to reserve an ephemeral port'));
          return;
        }
        resolve(port);
      });
    });

    server.listen(0, '0.0.0.0');
  });
}

async function start() {
  let port;
  try {
    port = await findOpenPort(candidatePorts);
    console.log(`Starting dev server on preferred open port ${port}...`);
  } catch {
    port = await findEphemeralPort();
    console.log(`Preferred ports busy. Starting dev server on fallback port ${port}...`);
  }

  try {

    const child = spawn(process.execPath, ['dev-server.js', `--appId=${APP_ID}`, `--port=${port}`], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

start();
