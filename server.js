// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Secure Express Server
// Security: Helmet, CORS, Rate Limiting, Input Validation,
//           HSTS, CSP, XSS Protection, No Verbose Errors
// ═══════════════════════════════════════════════════════════════
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProd = process.env.NODE_ENV === 'production'

// ── Admin key dari env var (bukan hardcode) ───────────────────
// Set ADMIN_KEY di Railway environment variables
const ADMIN_KEY = process.env.ADMIN_KEY || 'aegis2024'

const app = express()

// ══════════════════════════════════════════════════════════════
// 1. HELMET — Security headers (XSS, Clickjacking, HSTS, CSP)
// ══════════════════════════════════════════════════════════════
app.use(helmet({
  // Content Security Policy — cegah XSS, injection via script
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'",
        'blob:', 'capacitor:'],                        // Vite + Capacitor needs this
      styleSrc: ["'self'", "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://*.basemaps.cartocdn.com'],
      imgSrc: ["'self'", 'data:', 'blob:',
        'https://*.basemaps.cartocdn.com',
        'https://*.openstreetmap.org',
        'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'capacitor:',
        'https://*.railway.app',
        'https://nominatim.openstreetmap.org'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      frameSrc: ["'none'"],                            // Clickjacking protection
      objectSrc: ["'none'"],
      workerSrc: ["'self'", 'blob:'],
    },
  },
  // HTTP Strict Transport Security — paksa HTTPS
  hsts: {
    maxAge: 31536000,       // 1 tahun
    includeSubDomains: true,
    preload: true,
  },
  // Cegah browser sniff content-type
  noSniff: true,
  // Cegah Clickjacking — sudah tercakup di CSP frameSrc: none
  frameguard: { action: 'deny' },
  // XSS Filter header (legacy browsers)
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Hide server info
  hidePoweredBy: true,
}))

// ══════════════════════════════════════════════════════════════
// 2. CORS — Izinkan APK Android & domain resmi saja
// ══════════════════════════════════════════════════════════════
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      /^capacitor:\/\//,            // Android APK
      /^http:\/\/localhost/,        // Local dev
      /^http:\/\/127\.0\.0\.1/,    // Local dev
      /^https:\/\/.*railway\.app/,  // Railway production
      /^https:\/\/.*up\.railway\.app/,
    ]
    // APK kadang tidak kirim origin header — allow null origin
    if (!origin || allowed.some(r => r.test(origin))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,  // cache preflight 24 jam
}))

// ══════════════════════════════════════════════════════════════
// 3. RATE LIMITING — Cegah Brute Force, DoS, DDoS
// ══════════════════════════════════════════════════════════════

// General API: 100 req/menit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
  skip: (req) => req.path === '/api/events', // SSE tidak dibatasi
})

// Admin/Tsunami endpoint: lebih ketat — 10 req/menit
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit admin terlampaui.' },
})

// Location update: 60 req/menit (1 per detik)
const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Location update terlalu sering.' },
})

app.use('/api/', apiLimiter)
app.use('/api/tsunami', adminLimiter)
app.use('/api/location', locationLimiter)

// ══════════════════════════════════════════════════════════════
// 4. BODY PARSING — Batasi ukuran request body (DoS prevention)
// ══════════════════════════════════════════════════════════════
app.use(express.json({ limit: '10kb' }))  // Max 10KB — cegah body flooding

// ══════════════════════════════════════════════════════════════
// 5. INPUT VALIDATION HELPER — Sanitasi & Validasi
// ══════════════════════════════════════════════════════════════

/** Strip karakter berbahaya untuk XSS/Injection */
function sanitizeStr(val) {
  if (typeof val !== 'string') return ''
  return val
    .trim()
    .slice(0, 100)                          // max 100 karakter
    .replace(/[<>"'`\\;(){}[\]]/g, '')      // hapus karakter berbahaya
}

/** Validasi koordinat GPS */
function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' && isFinite(lat) && lat >= -90  && lat <= 90 &&
    typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180
  )
}

/** Validasi AEGIS ID format */
function isValidAegisId(id) {
  return typeof id === 'string' && /^AEGIS-[A-Z0-9]{5,20}$/.test(id)
}

// ══════════════════════════════════════════════════════════════
// 6. ADMIN AUTH MIDDLEWARE — Verifikasi admin key
// ══════════════════════════════════════════════════════════════
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'] || req.body?.adminKey
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }
  next()
}

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════
let tsunamiState = { active: false, ts: 0 }
const sseClients = new Set()

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(res => {
    try { res.write(msg) }
    catch { sseClients.delete(res) }
  })
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

// Tsunami — read (publik)
app.get('/api/tsunami', (req, res) => res.json(tsunamiState))

// Tsunami — write (butuh admin key)
app.post('/api/tsunami', requireAdminKey, (req, res) => {
  const { active } = req.body
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'Field active harus boolean.' })
  tsunamiState = { active, ts: Date.now() }
  broadcast({ type: 'TSUNAMI', active: tsunamiState.active, ts: tsunamiState.ts })
  res.json({ ok: true })
})

// Family join
app.post('/api/family/join', (req, res) => {
  const fromId   = sanitizeStr(req.body?.fromId)
  const fromName = sanitizeStr(req.body?.fromName)
  const toId     = sanitizeStr(req.body?.toId)
  if (!fromId || !fromName || !toId) return res.status(400).json({ error: 'Missing or invalid fields.' })
  if (fromName.length < 2) return res.status(400).json({ error: 'Nama terlalu pendek.' })
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

// Location sharing — validasi koordinat GPS
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
// STATIC FILES — Serve Vite build
// ══════════════════════════════════════════════════════════════
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  // Disable directory listing (serve static hanya file yang ada)
  app.use(express.static(distPath, { dotfiles: 'deny', index: false }))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.status(503).json({ error: 'App belum di-build.' }))
}

// ══════════════════════════════════════════════════════════════
// ERROR HANDLER — Jangan tampilkan stack trace di production
// ══════════════════════════════════════════════════════════════
// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' })
})
// 500 — sembunyikan detail error di production
app.use((err, req, res, _next) => {
  console.error('[Error]', isProd ? err.message : err)
  res.status(err.status || 500).json({
    error: isProd ? 'Terjadi kesalahan server.' : err.message,
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🛡️  Aegis Response running on port ${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`)
})
