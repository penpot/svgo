'use strict';

const { spawn } = require('child_process');
const path = require('path');

const runCli = (input) =>
  new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [path.resolve(__dirname, '../../src/svgoCli.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`svgoCli exited ${code}; stderr=${stderr}`));
        return;
      }
      resolve(stdout);
    });
    proc.stdin.end(input);
  });

test('reads SVG from stdin and writes optimized SVG to stdout', async () => {
  const out = await runCli('<svg><title>x</title><desc>y</desc></svg>');
  expect(out).toBe('<svg/>');
});
