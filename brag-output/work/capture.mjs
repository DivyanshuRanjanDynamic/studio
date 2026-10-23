// usage: node capture.mjs stills t1 t2 ...   |   node capture.mjs frames [fps] [start] [end]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const [mode = 'stills', ...args] = process.argv.slice(2);

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(here, 'chrome-profile')}`,
  '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--no-first-run', '--no-default-browser-check', '--window-size=1920,1080', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 80 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((x) => x.type === 'page');
  } catch { await sleep(150); }
}
if (!target) { chrome.kill(); throw new Error('Chrome did not start'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(resolve(here, 'video.html')).href });
for (let i = 0; i < 100; i++) { try { if (await evalJs('window.ready && window.ready.then(() => true)')) break; } catch {} await sleep(100); }

async function shot(t, file, format = 'jpeg') {
  await evalJs(`renderAt(${t})`);
  await evalJs('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
  const { data } = await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 94 : undefined, captureBeyondViewport: false });
  writeFileSync(file, Buffer.from(data, 'base64'));
}

if (mode === 'stills') {
  mkdirSync(resolve(here, 'stills'), { recursive: true });
  for (const t of args) await shot(parseFloat(t), resolve(here, 'stills', `t${parseFloat(t).toFixed(2)}.jpg`));
  console.log('stills done');
} else {
  const fps = parseFloat(args[0] || 30), start = parseFloat(args[1] || 0);
  const end = parseFloat(args[2] || (await evalJs('DUR')));
  const out = resolve(here, 'frames'); mkdirSync(out, { recursive: true });
  const n0 = Math.round(start * fps), n1 = Math.round(end * fps);
  const t0 = Date.now();
  for (let n = n0; n < n1; n++) {
    await shot(n / fps, resolve(out, `${String(n).padStart(5, '0')}.jpg`));
    if (n % 60 === 0) console.log(`frame ${n}/${n1} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log(`frames done: ${n1 - n0}`);
}
ws.close(); chrome.kill();
process.exit(0);
