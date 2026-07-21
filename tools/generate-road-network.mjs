// tools/generate-road-network.mjs
// Fetch real Kota Palu road network from OpenStreetMap (Overpass API)
// and build an intersection-level graph with full polyline geometry per edge.

import { writeFileSync } from 'fs'

// ── Config ──────────────────────────────────────────────────────
// Bounding box mencakup seluruh Kota Palu (south, west, north, east)
const BBOX = [-1.00, 119.78, -0.80, 119.92]

const OVERPASS_ENDPOINTS = [
  'https://z.overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const HIGHWAY_TAGS = [
  'motorway','trunk','primary','secondary','tertiary',
  'unclassified','residential','living_street',
  'pedestrian','footway','path','steps',
]

const query = `
[out:json][timeout:90];
way["highway"~"^(${HIGHWAY_TAGS.join('|')})$"]["access"!~"private"]
  (${BBOX.join(',')});
(._;>;);
out body;
`

const R = 6371 // km
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchOverpass() {
  let lastErr
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain', 
          'Accept': 'application/json', 
          'User-Agent': 'AegisResponse-PaluTsunami/1.0 (admin@aegis-tsunami.local)' 
        },
        body: query,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      lastErr = e
      console.warn(`Endpoint gagal (${endpoint}): ${e.message}, coba mirror lain...`)
    }
  }
  throw lastErr
}

function buildGraph(osm) {
  const nodeCoord = new Map() // id -> {lat,lng}
  const ways = []

  for (const el of osm.elements) {
    if (el.type === 'node') {
      nodeCoord.set(el.id, { lat: el.lat, lng: el.lon })
    } else if (el.type === 'way') {
      ways.push(el.nodes)
    }
  }

  // Hitung berapa kali tiap node muncul lintas way (persimpangan = degree > 1 antar way,
  // atau node yang jadi titik tengah suatu way dan disebut di way lain)
  const nodeWayCount = new Map()
  for (const nodes of ways) {
    const uniqueInWay = new Set(nodes)
    for (const id of uniqueInWay) {
      nodeWayCount.set(id, (nodeWayCount.get(id) || 0) + 1)
    }
  }

  // Node dianggap "intersection" (jadi titik graf) kalau:
  // - jadi endpoint (awal/akhir) suatu way, ATAU
  // - muncul di lebih dari 1 way, ATAU
  // - muncul lebih dari sekali dalam 1 way yang sama (loop)
  const isIntersection = new Map()
  for (const nodes of ways) {
    isIntersection.set(nodes[0], true)
    isIntersection.set(nodes[nodes.length - 1], true)
    const seen = new Set()
    for (const id of nodes) {
      if (seen.has(id)) isIntersection.set(id, true)
      seen.add(id)
    }
  }
  for (const [id, count] of nodeWayCount) {
    if (count > 1) isIntersection.set(id, true)
  }

  // Pecah tiap way jadi segmen antar node-intersection, simpan geometry penuh per segmen
  const roadNodesMap = new Map() // id -> {id, lat, lng}
  const edges = [] // {from, to, distance, geometry}
  let genId = 0
  const idFor = (osmId) => {
    if (!roadNodesMap.has(osmId)) {
      const c = nodeCoord.get(osmId)
      if (!c) return null
      roadNodesMap.set(osmId, { id: 'N' + (++genId), osmId, lat: Number(c.lat.toFixed(6)), lng: Number(c.lng.toFixed(6)) })
    }
    return roadNodesMap.get(osmId).id
  }

  for (const nodes of ways) {
    let segStart = 0
    for (let i = 1; i < nodes.length; i++) {
      if (isIntersection.get(nodes[i])) {
        const segNodeIds = nodes.slice(segStart, i + 1)
        const coords = segNodeIds.map(id => nodeCoord.get(id)).filter(Boolean)
        if (coords.length >= 2) {
          let dist = 0
          for (let k = 1; k < coords.length; k++) {
            dist += haversine(coords[k - 1].lat, coords[k - 1].lng, coords[k].lat, coords[k].lng)
          }
          const fromId = idFor(segNodeIds[0])
          const toId = idFor(segNodeIds[segNodeIds.length - 1])
          if (fromId && toId && fromId !== toId && dist > 0) {
            const geometry = coords.map(c => [Number(c.lat.toFixed(6)), Number(c.lng.toFixed(6))])
            edges.push({ from: fromId, to: toId, distance: Number(dist.toFixed(4)), geometry: [...geometry] })
            edges.push({ from: toId, to: fromId, distance: Number(dist.toFixed(4)), geometry: [...geometry].reverse() })
          }
        }
        segStart = i
      }
    }
  }

  const roadNodes = [...roadNodesMap.values()].map(({ id, lat, lng }) => ({ id, lat, lng }))
  return { roadNodes, roadEdges: edges }
}

async function main() {
  console.log('Mengambil data jalan Kota Palu dari OpenStreetMap...')
  const osm = await fetchOverpass()
  console.log(`Diterima ${osm.elements.length} elemen OSM.`)
  const { roadNodes, roadEdges } = buildGraph(osm)
  console.log(`Graf dibangun: ${roadNodes.length} node persimpangan, ${roadEdges.length} edge (dua arah).`)

  const out = { generatedAt: new Date().toISOString(), bbox: BBOX, roadNodes, roadEdges }
  writeFileSync('frontend/public/roadNetwork.data.json', JSON.stringify(out))
  console.log('Tersimpan ke frontend/public/roadNetwork.data.json')
}

main().catch(e => { console.error(e); process.exit(1) })
