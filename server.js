// ═══════════════════════════════════════════════════════════════
// AEGIS RESPONSE — Express server with SSE for real-time sync
// Handles: tsunami alerts, family joins, pings across all devices
// ═══════════════════════════════════════════════════════════════
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// ── In-memory state (resets on redeploy — fine for demo) ─────
let tsunamiState = { active: false, ts: 0 }
const sseClients = new Set()          // active SSE connections

// ── Broadcast to all connected clients ────────────────────────
function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(res => {
    try { res.write(msg) }
    catch { sseClients.delete(res) }
  })
}

// ── SSE endpoint — clients connect here for real-time events ──
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',   // disable nginx buffering on Railway
  })
  // Send current state immediately on connect
  res.write(`data: ${JSON.stringify({ type: 'INIT', tsunami: tsunamiState })}\n\n`)
  sseClients.add(res)
  // Heartbeat every 25s to keep connection alive
  const hb = setInterval(() => { try { res.write(': heartbeat\n\n') } catch { clearInterval(hb) } }, 25000)
  req.on('close', () => { sseClients.delete(res); clearInterval(hb) })
})

// ── Tsunami control ───────────────────────────────────────────
app.post('/api/tsunami', (req, res) => {
  const { active } = req.body
  tsunamiState = { active: !!active, ts: Date.now() }
  broadcast({ type: 'TSUNAMI', active: tsunamiState.active, ts: tsunamiState.ts })
  res.json({ ok: true })
})

app.get('/api/tsunami', (req, res) => res.json(tsunamiState))

// ── Family join — when A scans B's QR, broadcast so B adds A ─
app.post('/api/family/join', (req, res) => {
  const { fromId, fromName, toId } = req.body
  if (!fromId || !fromName || !toId) return res.status(400).json({ error: 'Missing fields' })
  // Broadcast specifically to the target device
  broadcast({ type: 'FAMILY_JOIN', fromId, fromName, toId })
  res.json({ ok: true })
})

// ── Ping — broadcast to all, target devices respond ──────────
app.post('/api/ping', (req, res) => {
  const { fromId, fromName } = req.body
  broadcast({ type: 'PING', fromId, fromName })
  res.json({ ok: true })
})

// Ping reply
app.post('/api/ping/reply', (req, res) => {
  const { fromId, fromName, toId } = req.body
  broadcast({ type: 'PING_REPLY', fromId, fromName, toId })
  res.json({ ok: true })
})

// ── Location sharing — member broadcasts their GPS position ──
app.post('/api/location', (req, res) => {
  const { id, name, lat, lng } = req.body
  if (!id || lat == null || lng == null) return res.status(400).json({ error: 'Missing fields' })
  broadcast({ type: 'LOCATION_UPDATE', id, name, lat, lng })
  res.json({ ok: true })
})

// ── Serve Vite build ──────────────────────────────────────────
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/{*path}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.send('Vite build not found. Run: npm run build'))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🛡️  Aegis Response running on port ${PORT}`)
})
