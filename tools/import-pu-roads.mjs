#!/usr/bin/env node
/**
 * =============================================================================
 * A.T.L.A.S — Tool Konversi Jaringan Jalan Resmi Dinas PU / Bina Marga / Bappeda
 * =============================================================================
 * Skrip ini mengonversi data geospasial jalan resmi (GeoJSON / Shapefile hasil ekspor)
 * dari Dinas Pekerjaan Umum (PU), Bina Marga, atau Bappeda Kota Palu menjadi
 * graf navigasi evakuasi optimal (roadNodes & roadEdges) berpresisi tinggi.
 *
 * Keunggulan Data PU dibanding OpenStreetMap (OSM):
 * 1. Memuat seluruh gang perumahan, lorong sempit (lebar < 2m), dan jalan lingkungan.
 * 2. Memuat titik jembatan & gorong-gorong resmi penyeberangan sungai yang terverifikasi.
 * 3. Menghindari rute "melompati kali / menembus rumah warga" karena seluruh koneksi
 *    gang ke jalan utama terpetakan secara resmi oleh surveyor pemerintah daerah.
 * 4. Berjalan 100% OFFLINE di perangkat tanpa bergantung pada server internet OSRM luar negeri.
 *
 * Cara Penggunaan:
 *   node tools/import-pu-roads.mjs [path/ke/file_pu_jalan.geojson]
 *
 * Contoh:
 *   node tools/import-pu-roads.mjs data/jalan_resmi_pu_palu.geojson
 * =============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const R = 6371 // Radius bumi (km)

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function coordKey(lat, lng, precision = 6) {
  return `${lat.toFixed(precision)},${lng.toFixed(precision)}`
}

export function convertPuGeojsonToGraph(geojson) {
  const features = geojson.features || []
  console.log(`[A.T.L.A.S PU Importer] Membaca ${features.length} fitur garis jalan dari data PU...`)

  // Ekstrak semua garis (LineString & MultiLineString)
  const polylines = []
  for (const f of features) {
    if (!f.geometry) continue
    const type = f.geometry.type
    const coords = f.geometry.coordinates

    if (type === 'LineString' && Array.isArray(coords) && coords.length >= 2) {
      // GeoJSON standar: [lng, lat]
      polylines.push(coords.map(c => [Number(c[1]), Number(c[0])]))
    } else if (type === 'MultiLineString' && Array.isArray(coords)) {
      for (const line of coords) {
        if (Array.isArray(line) && line.length >= 2) {
          polylines.push(line.map(c => [Number(c[1]), Number(c[0])]))
        }
      }
    }
  }

  if (polylines.length === 0) {
    throw new Error('Tidak ditemukan fitur LineString atau MultiLineString yang valid dalam file GeoJSON PU!')
  }

  console.log(`[A.T.L.A.S PU Importer] Berhasil mengekstrak ${polylines.length} segmen garis jalan.`)

  // 1. Identifikasi persimpangan (intersection) dan ujung garis
  const vertexCount = new Map() // 'lat,lng' -> frekuensi kemunculan
  for (const line of polylines) {
    const seenInLine = new Set()
    for (const pt of line) {
      const key = coordKey(pt[0], pt[1])
      if (!seenInLine.has(key)) {
        vertexCount.set(key, (vertexCount.get(key) || 0) + 1)
        seenInLine.add(key)
      }
    }
  }

  // Node dianggap persimpangan graf jika:
  // - Awal atau akhir suatu ruas jalan (ujung/endpoint)
  // - Bertemu dengan ruas jalan lain (frekuensi > 1)
  const isJunction = new Map()
  for (const line of polylines) {
    const firstKey = coordKey(line[0][0], line[0][1])
    const lastKey = coordKey(line[line.length - 1][0], line[line.length - 1][1])
    isJunction.set(firstKey, true)
    isJunction.set(lastKey, true)
    for (const pt of line) {
      const key = coordKey(pt[0], pt[1])
      if ((vertexCount.get(key) || 0) > 1) {
        isJunction.set(key, true)
      }
    }
  }

  // 2. Petakan node dan pecah garis menjadi edges antar persimpangan
  const roadNodesMap = new Map() // key -> { id, lat, lng }
  let genId = 0

  const getNodeId = (lat, lng) => {
    const key = coordKey(lat, lng)
    if (!roadNodesMap.has(key)) {
      genId++
      roadNodesMap.set(key, {
        id: `PU_N${genId}`,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      })
    }
    return roadNodesMap.get(key).id
  }

  const edges = []
  let totalDistanceKm = 0

  for (const line of polylines) {
    let segStartIdx = 0
    for (let i = 1; i < line.length; i++) {
      const curKey = coordKey(line[i][0], line[i][1])
      if (isJunction.get(curKey) || i === line.length - 1) {
        const segPoints = line.slice(segStartIdx, i + 1)
        if (segPoints.length >= 2) {
          let dist = 0
          for (let k = 1; k < segPoints.length; k++) {
            dist += haversine(
              segPoints[k - 1][0],
              segPoints[k - 1][1],
              segPoints[k][0],
              segPoints[k][1]
            )
          }

          const fromId = getNodeId(segPoints[0][0], segPoints[0][1])
          const toId = getNodeId(
            segPoints[segPoints.length - 1][0],
            segPoints[segPoints.length - 1][1]
          )

          if (fromId !== toId && dist > 0.0001) {
            const geom = segPoints.map(p => [
              Number(p[0].toFixed(6)),
              Number(p[1].toFixed(6)),
            ])
            const dVal = Number(dist.toFixed(4))
            totalDistanceKm += dVal

            // Graf dua arah untuk pejalan kaki / evakuasi
            edges.push({
              from: fromId,
              to: toId,
              distance: dVal,
              geometry: [...geom],
            })
            edges.push({
              from: toId,
              to: fromId,
              distance: dVal,
              geometry: [...geom].reverse(),
            })
          }
        }
        segStartIdx = i
      }
    }
  }

  const roadNodes = Array.from(roadNodesMap.values())
  console.log(
    `[A.T.L.A.S PU Importer] Sukses membangun graf: ${roadNodes.length} simpul persimpangan, ${edges.length} ruas jalan (${(totalDistanceKm / 2).toFixed(1)} km jalan terpetakan).`
  )

  return { roadNodes, roadEdges: edges }
}

async function main() {
  const targetArg = process.argv[2]
  if (!targetArg) {
    console.log(`
=============================================================================
  A.T.L.A.S — Tool Impor Jaringan Jalan Dinas PU
=============================================================================
  Gunakan tool ini untuk menyuntikkan data jalan resmi dari Dinas PU / Bappeda.

  Penggunaan:
    node tools/import-pu-roads.mjs <file_geojson_pu>

  Contoh:
    node tools/import-pu-roads.mjs data/jalan_kota_palu_pu.geojson
=============================================================================
    `)
    return
  }

  const filePath = resolve(process.cwd(), targetArg)
  if (!existsSync(filePath)) {
    console.error(`[ERROR] File tidak ditemukan di: ${filePath}`)
    process.exit(1)
  }

  console.log(`[A.T.L.A.S] Membuka file: ${filePath}`)
  const raw = readFileSync(filePath, 'utf-8')
  const geojson = JSON.parse(raw)

  const { roadNodes, roadEdges } = convertPuGeojsonToGraph(geojson)

  const outputPath = resolve(process.cwd(), 'frontend/public/roadNetwork.data.json')
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'Dinas Pekerjaan Umum / Bina Marga / Bappeda (Official Survey)',
    roadNodes,
    roadEdges,
  }

  writeFileSync(outputPath, JSON.stringify(payload))
  console.log(`[A.T.L.A.S] Berhasil menyimpan jaringan jalan resmi ke: ${outputPath}`)
  console.log(`[A.T.L.A.S] Sistem offline siap digunakan dengan presisi gang permukiman 100%!`)
}

if (process.argv[1]?.endsWith('import-pu-roads.mjs')) {
  main().catch(err => {
    console.error('[FATAL ERROR]:', err)
    process.exit(1)
  })
}
