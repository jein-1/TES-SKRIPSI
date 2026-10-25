import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';

// Load .env if not loaded
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const PORT = process.env.API_PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Compatibility rewrites (NERVE & Vercel)
  if (pathname.startsWith('/api/v2/home') || pathname.startsWith('/v2/home')) {
    pathname = '/api/disaster/home';
  } else if (pathname.startsWith('/api/v2/timeline') || pathname.startsWith('/v2/timeline')) {
    pathname = '/api/disaster/timeline';
  } else if (pathname.startsWith('/api/rain') || pathname.startsWith('/rain')) {
    pathname = '/api/disaster/tiles';
  }

  // Map /api/<route> to ./api/<route>.js
  let relativePath = pathname.replace(/^\/api\//, '');
  let filePath = path.join(process.cwd(), 'api', `${relativePath}.js`);

  // Check if directory index exists (e.g., api/disaster/home/index.js)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'api', relativePath, 'index.js');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Route not found: ${pathname}` }));
  }

  // Parse body
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      if (raw) body = JSON.parse(raw);
    } catch (e) {
      body = {};
    }
  }

  // Build mock req/res compatible with Vercel serverless
  req.query = parsedUrl.query;
  req.body = body;

  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  };

  try {
    const module = await import(`file://${filePath}?t=${Date.now()}`);
    const handler = module.default;
    await handler(req, res);
  } catch (error) {
    console.error(`[DevServer] Error in ${pathname}:`, error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️ Port ${PORT} sedang dipakai. Matikan proses port ${PORT} sebelumnya.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 ATLAS Local API Dev Server running at: http://localhost:${PORT}`);
  console.log(`   - Home:     http://localhost:${PORT}/api/disaster/home`);
  console.log(`   - Timeline: http://localhost:${PORT}/api/disaster/timeline`);
  console.log(`   - BMKG:     http://localhost:${PORT}/api/disaster/bmkg`);
  console.log(`   - USGS:     http://localhost:${PORT}/api/disaster/usgs`);
  console.log(`   - Sync:     http://localhost:${PORT}/api/disaster/sync\n`);
});
