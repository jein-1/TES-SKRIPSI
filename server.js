// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Secure Express Server + Web Push Notifications
// Security: Helmet, Rate Limiting, Input Validation, CORS
// Real-time: SSE + Web Push (background notification)
// ═══════════════════════════════════════════════════════════════
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import webpush from 'web-push'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProd = process.env.NODE_ENV === 'production'

// ── VAPID keys (set di Railway environment variables) ──────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BFcCpHwa6FOqP6M02MHCyQPXRKQ5XpaeQ4_ZIoljRHAwtOj7ie7rV3hrCpfs2Y3_7Ze9yP2wviq6btboRyKL8L8'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'n8b7fVM4bYhpYzF6YPUvPkgjSoPRv2jR3OcjBedl2Pw'
webpush.setVapidDetails('mailto:admin@aegis.local', VAPID_PUBLIC, VAPID_PRIVATE)

// ── Admin key ──────────────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || 'aegis2024'

const app = express()

// ══════════════════════════════════════════════════════════════
// 1. HELMET — Security headers
// ══════════════════════════════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:', 'capacitor:'],
      styleSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://*.basemaps.cartocdn.com'],
      imgSrc:    ["'self'", 'data:', 'blob:', 'https://*.basemaps.cartocdn.com', 'https://*.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
      connectSrc:["'self'", 'capacitor:', 'https://*.railway.app', 'https://nominatim.openstreetmap.org'],
      fontSrc:   ["'self'", 'https://fonts.gstatic.com', 'data:'],
      frameSrc:  ["'none'"],
      objectSrc: ["'none'"],
      workerSrc: ["'self'", 'blob:'],
    },
  },
  hsts:          { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:       true,
  frameguard:    { action: 'deny' },
  xssFilter:     true,
  referrerPolicy:{ policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,
}))

// ══════════════════════════════════════════════════════════════
// 2. CORS
// ══════════════════════════════════════════════════════════════
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      /^capacitor:\/\//,
      /^http:\/\/localhost/,
      /^http:\/\/127\.0\.0\.1/,
      /^https:\/\/.*railway\.app/,
      /^https:\/\/.*up\.railway\.app/,
    ]
    if (!origin || allowed.some(r => r.test(origin))) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Key'],
  credentials: true,
  maxAge: 86400,
}))

// ══════════════════════════════════════════════════════════════
// 3. RATE LIMITING
// ══════════════════════════════════════════════════════════════
const apiLimiter      = rateLimit({ windowMs: 60000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limit.' }, skip: (req) => req.path === '/api/events' })
const adminLimiter    = rateLimit({ windowMs: 60000, max: 10,  standardHeaders: true, legacyHeaders: false, message: { error: 'Admin rate limit.' } })
const locationLimiter = rateLimit({ windowMs: 60000, max: 60,  standardHeaders: true, legacyHeaders: false, message: { error: 'Location rate limit.' } })
app.use('/api/', apiLimiter)
app.use('/api/tsunami', adminLimiter)
app.use('/api/location', locationLimiter)

// ══════════════════════════════════════════════════════════════
// 4. BODY PARSING (10KB max)
// ══════════════════════════════════════════════════════════════
app.use(express.json({ limit: '10kb' }))

// ══════════════════════════════════════════════════════════════
// 5. INPUT VALIDATION HELPERS
// ══════════════════════════════════════════════════════════════
function sanitizeStr(val) {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, 100).replace(/[<>"'`\\;(){}[\]]/g, '')
}
function isValidCoord(lat, lng) {
  return typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90 &&
         typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180
}

// ══════════════════════════════════════════════════════════════
// 6. ADMIN AUTH
// ══════════════════════════════════════════════════════════════
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'] || req.body?.adminKey
  if (key !== ADMIN_KEY) return res.status(403).json({ error: 'Akses ditolak.' })
  next()
}

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
let tsunamiState = { active: false, ts: 0 }
const sseClients       = new Set()
const pushSubscriptions = new Map()   // key: endpoint → sub object

// Expose VAPID public key to frontend
app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC })
})

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(res => {
    try { res.write(msg) } catch { sseClients.delete(res) }
  })
}

// Kirim Web Push ke semua subscriber
async function sendPushToAll(payload) {
  const dead = []
  for (const [endpoint, sub] of pushSubscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload))
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(endpoint)
      else console.warn('[Push] sendNotification failed:', e.message)
    }
  }
  dead.forEach(ep => pushSubscriptions.delete(ep))
  console.log(`[Push] Sent to ${pushSubscriptions.size} subscribers (${dead.length} expired removed)`)
}

// ══════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════

// SSE — real-time events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.write(`data: ${JSON.stringify({ type: 'INIT', tsunami: tsunamiState })}\n\n`)
  sseClients.add(res)
  const hb = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { clearInterval(hb) }
  }, 25000)
  req.on('close', () => { sseClients.delete(res); clearInterval(hb) })
})

// Tsunami — GET (public)
app.get('/api/tsunami', (req, res) => res.json(tsunamiState))

// Tsunami — POST (admin only) + Web Push
app.post('/api/tsunami', requireAdminKey, async (req, res) => {
  const { active } = req.body
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'Field active harus boolean.' })
  tsunamiState = { active, ts: Date.now() }
  // SSE broadcast
  broadcast({ type: 'TSUNAMI', active: tsunamiState.active, ts: tsunamiState.ts })
  // Web Push — kirim ke semua subscriber yang app-nya closed
  if (active) {
    sendPushToAll({
      title: '🚨 PERINGATAN TSUNAMI!',
      body: 'Segera lakukan evakuasi! Buka aplikasi untuk rute aman terdekat.',
      url: '/',
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      requireInteraction: true,
    }).catch(e => console.error('[Push] Error:', e))
  } else {
    sendPushToAll({
      title: '✅ Simulasi Selesai',
      body: 'Status tsunami telah dinonaktifkan.',
      url: '/',
      tag: 'tsunami-clear',
    }).catch(() => {})
  }
  res.json({ ok: true, subscribers: pushSubscriptions.size })
})

// Web Push — Subscribe
app.post('/api/push/subscribe', (req, res) => {
  const sub = req.body
  if (!sub?.endpoint) return res.status(400).json({ error: 'Invalid subscription.' })
  pushSubscriptions.set(sub.endpoint, sub)
  console.log(`[Push] New subscriber. Total: ${pushSubscriptions.size}`)
  res.json({ ok: true })
})

// Web Push — Unsubscribe
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body
  if (endpoint) pushSubscriptions.delete(endpoint)
  res.json({ ok: true })
})

// Family join
app.post('/api/family/join', (req, res) => {
  const fromId   = sanitizeStr(req.body?.fromId)
  const fromName = sanitizeStr(req.body?.fromName)
  const toId     = sanitizeStr(req.body?.toId)
  if (!fromId || !fromName || !toId) return res.status(400).json({ error: 'Missing or invalid fields.' })
  broadcast({ type: 'FAMILY_JOIN', fromId, fromName, toId })
  res.json({ ok: true })
})

// Ping
app.post('/api/ping', (req, res) => {
  const fromId   = sanitizeStr(req.body?.fromId)
  const fromName = sanitizeStr(req.body?.fromName)
  if (!fromId || !fromName) return res.status(400).json({ error: 'Missing fields.' })
  broadcast({ type: 'PING', fromId, fromName })
  res.json({ ok: true })
})

// Ping reply
app.post('/api/ping/reply', (req, res) => {
  const fromId   = sanitizeStr(req.body?.fromId)
  const fromName = sanitizeStr(req.body?.fromName)
  const toId     = sanitizeStr(req.body?.toId)
  if (!fromId || !fromName || !toId) return res.status(400).json({ error: 'Missing fields.' })
  broadcast({ type: 'PING_REPLY', fromId, fromName, toId })
  res.json({ ok: true })
})

// Location sharing
app.post('/api/location', (req, res) => {
  const id   = sanitizeStr(req.body?.id)
  const name = sanitizeStr(req.body?.name)
  const lat  = Number(req.body?.lat)
  const lng  = Number(req.body?.lng)
  if (!id) return res.status(400).json({ error: 'ID tidak valid.' })
  if (!isValidCoord(lat, lng)) return res.status(400).json({ error: 'Koordinat GPS tidak valid.' })
  broadcast({ type: 'LOCATION_UPDATE', id, name, lat, lng })
  res.json({ ok: true })
})

// ══════════════════════════════════════════════════════════════
// STATIC FILES
// ══════════════════════════════════════════════════════════════
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath, { dotfiles: 'deny', index: false }))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.status(503).json({ error: 'App belum di-build.' }))
}

// ══════════════════════════════════════════════════════════════
// ERROR HANDLER
// ══════════════════════════════════════════════════════════════
app.use((req, res) => { res.status(404).json({ error: 'Endpoint tidak ditemukan.' }) })
app.use((err, req, res, _next) => {
  console.error('[Error]', isProd ? err.message : err)
  res.status(err.status || 500).json({ error: isProd ? 'Terjadi kesalahan server.' : err.message })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🛡️  Aegis Response running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`)
  console.log(`📣  Web Push: ${pushSubscriptions.size} subscribers`)
})
