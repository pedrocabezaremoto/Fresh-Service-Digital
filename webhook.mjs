/* webhook.mjs — Listener de GitHub que dispara deploy.sh en cada push a main.
 *
 * Seguridad: verifica la firma HMAC-SHA256 (X-Hub-Signature-256) con el secreto
 * de /root/.fresh-webhook-secret. Solo despliega en push a refs/heads/main.
 * Responde rápido (202) y corre el deploy en segundo plano, con lock anti-solape.
 *
 * Sin dependencias externas. Uso:  PORT=4200 node webhook.mjs
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync, existsSync, appendFileSync, openSync } from 'node:fs';
import { spawn } from 'node:child_process';

const PORT       = process.env.PORT || 4200;
const REPO_DIR   = '/root/Fresh-Service-Digital';
const DEPLOY     = `${REPO_DIR}/deploy.sh`;
const LOGFILE    = `${REPO_DIR}/deploy-webhook.log`;
const SECRET_FILE = '/root/.fresh-webhook-secret';
const BRANCH_REF = 'refs/heads/main';

const SECRET = process.env.WEBHOOK_SECRET
  || (existsSync(SECRET_FILE) ? readFileSync(SECRET_FILE, 'utf8').trim() : '');

if (!SECRET) {
  console.error('FATAL: no hay secreto (WEBHOOK_SECRET o /root/.fresh-webhook-secret). Abortando.');
  process.exit(1);
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { appendFileSync(LOGFILE, line); } catch {}
  process.stdout.write(line);
}

function validSignature(sig, body) {
  if (!sig) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let deploying = false;

const server = http.createServer((req, res) => {
  // GET de cortesía (para probar que está vivo desde el navegador)
  if (req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('Fresh Service webhook activo. Envia un POST firmado de GitHub.\n');
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body  = Buffer.concat(chunks);
    const sig   = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];

    if (!validSignature(sig, body)) {
      log('✖ Firma inválida — petición rechazada (401).');
      res.writeHead(401); return res.end('firma invalida\n');
    }

    if (event === 'ping') {
      log('✔ Ping de GitHub recibido (webhook configurado correctamente).');
      res.writeHead(200); return res.end('pong\n');
    }

    if (event !== 'push') {
      res.writeHead(200); return res.end(`evento ${event} ignorado\n`);
    }

    let payload = {};
    try { payload = JSON.parse(body.toString('utf8')); } catch {}

    if (payload.ref !== BRANCH_REF) {
      log(`Push a ${payload.ref} ignorado (solo se despliega ${BRANCH_REF}).`);
      res.writeHead(200); return res.end('rama ignorada\n');
    }

    // Responder ya (GitHub corta a los 10s); el deploy corre en background.
    res.writeHead(202); res.end('deploy encolado\n');

    if (deploying) {
      log('Ya hay un deploy en curso — este push se procesará por el que corre ahora.');
      return;
    }
    deploying = true;
    const pusher = (payload.pusher && payload.pusher.name) || 'alguien';
    const head = (payload.head_commit && payload.head_commit.message || '').split('\n')[0];
    log(`▶ Push a main por ${pusher}: "${head}" — iniciando deploy...`);

    const out = openSync(LOGFILE, 'a');
    const child = spawn('bash', [DEPLOY], {
      cwd: REPO_DIR,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', out, out],
    });
    child.on('close', (code) => {
      deploying = false;
      log(code === 0
        ? '✅ Deploy COMPLETO (exit 0).'
        : `✖ Deploy FALLÓ (exit ${code}). Revisa arriba en este log.`);
    });
    child.on('error', (err) => {
      deploying = false;
      log(`✖ No se pudo lanzar deploy.sh: ${err.message}`);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => log(`Webhook escuchando en http://0.0.0.0:${PORT}`));
