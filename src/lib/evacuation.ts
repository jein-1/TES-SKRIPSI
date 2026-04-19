/**
 * =============================================================================
 * SISTEM EVAKUASI TSUNAMI KOTA PALU
 * =============================================================================
 * 
 * Metodologi Pencarian Rute Evakuasi:
 * 
 * 1. FORMULA HAVERSINE
 *    Digunakan untuk menghitung jarak geografis (garis lurus) antara dua titik
 *    koordinat di permukaan bumi. Formula ini memperhitungkan kelengkungan bumi
 *    sehingga memberikan estimasi jarak yang akurat.
 *    
 *    Aplikasi dalam sistem:
 *    - Menghitung bobot (weight) setiap edge pada graf jaringan jalan
 *    - Estimasi jarak awal dari posisi user ke node jalan terdekat
 *    - Estimasi jarak dari node jalan ke shelter terdekat
 * 
 * 2. ALGORITMA DIJKSTRA
 *    Digunakan untuk mencari rute terpendek (shortest path) pada graf jaringan
 *    jalan berbobot. Karena evakuasi dilakukan melalui jalan raya yang memiliki
 *    belokan dan hambatan, Dijkstra memastikan rute yang ditemukan adalah rute
 *    nyata yang paling efisien melalui akses jalan yang ada.
 * 
 * GABUNGAN KEDUA METODE:
 * Haversine memberikan estimasi jarak cepat secara geografis, sementara Dijkstra
 * memberikan rute jalan nyata yang paling efisien. Gabungan ini memastikan sistem
 * tidak hanya memberikan shelter yang dekat secara lokasi, tetapi juga yang paling
 * cepat dicapai melalui akses jalan yang ada.
 * 
 * Alur perhitungan:
 *   1. Posisi user diterima (GPS real-time / klik peta)
 *   2. Haversine → cari node jalan terdekat dari posisi user
 *   3. Untuk setiap shelter:
 *      a. Haversine → cari node jalan terdekat dari shelter
 *      b. Dijkstra → hitung rute terpendek dari node user ke node shelter
 *      c. Haversine → tambahkan jarak user→node dan node→shelter
 *   4. Sortir semua rute berdasarkan total jarak jalan (terpendek dahulu)
 *   5. Tampilkan 3 rute evakuasi terbaik
 * =============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// TIPE DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface Point {
  lat: number;
  lng: number;
}

export interface Shelter extends Point {
  id: string;
  name: string;
  capacity: number;
}

export interface RoadNode extends Point {
  id: string;
}

export interface RoadEdge {
  from: string;
  to: string;
  distance: number; // Jarak dalam km, dihitung menggunakan Formula Haversine
}

export interface RouteResult {
  shelterName: string;
  shelterId: string;
  shelterCapacity: number;
  haversineDistance: number;  // Jarak lurus Haversine (km)
  dijkstraDistance: number;   // Jarak via jalan Dijkstra (km)
  totalDistance: number;      // Total jarak realistis (km)
  coordinates: [number, number][];
  walkingTime: number;       // Estimasi waktu jalan kaki (menit)
  runningTime: number;       // Estimasi waktu berlari (menit)
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA SHELTER EVAKUASI
// Titik-titik evakuasi tsunami di Kota Palu
// ─────────────────────────────────────────────────────────────────────────────

export const shelters: Shelter[] = [
  {
    id: 'S1',
    name: 'Masjid Raya Baitul Khairaat (Eks Masjid Agung)',
    lat: -0.8936,
    lng: 119.8531,
    capacity: 1000
  },
  {
    id: 'S2',
    name: 'GOR Talise (Mockup Darat)',
    lat: -0.8851,
    lng: 119.8680,
    capacity: 500
  },
  {
    id: 'S3',
    name: 'Hutan Kota Kaombona',
    lat: -0.8800,
    lng: 119.8800,
    capacity: 2000
  },
  {
    id: 'S4',
    name: 'Kantor Gubernur Sulawesi Tengah',
    lat: -0.8973,
    lng: 119.8652,
    capacity: 1500
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// JARINGAN JALAN (ROAD NETWORK GRAPH)
// Node = persimpangan jalan, Edge = ruas jalan antar persimpangan
// Bobot edge dihitung menggunakan Formula Haversine
// ─────────────────────────────────────────────────────────────────────────────

export const roadNodes: RoadNode[] = [
  // Area Lere (Barat)
  { id: 'N1',  lat: -0.8960, lng: 119.8380 },  // Jl. Pattimura ujung barat
  { id: 'N2',  lat: -0.8940, lng: 119.8410 },  // Persimpangan Jl. Pattimura
  { id: 'N3',  lat: -0.8912, lng: 119.8456 },  // Dekat Masjid Agung (S1)
  { id: 'N4',  lat: -0.8930, lng: 119.8480 },  // Jl. Hasanuddin

  // Area Pusat - Besusu
  { id: 'N5',  lat: -0.8910, lng: 119.8510 },  // Jl. Sam Ratulangi
  { id: 'N6',  lat: -0.8890, lng: 119.8540 },  // Persimpangan Jl. Gajah Mada
  { id: 'N7',  lat: -0.8870, lng: 119.8570 },  // Jl. Moh. Yamin

  // Area Talise
  { id: 'N8',  lat: -0.8860, lng: 119.8600 },  // Jl. Towua
  { id: 'N9',  lat: -0.8850, lng: 119.8620 },  // Dekat GOR Talise (S2)
  { id: 'N10', lat: -0.8840, lng: 119.8650 },  // Jl. Talise Raya

  // Area Kaombona (Timur)
  { id: 'N11', lat: -0.8820, lng: 119.8680 },  // Jl. Soekarno Hatta
  { id: 'N12', lat: -0.8800, lng: 119.8710 },  // Persimpangan Kaombona
  { id: 'N13', lat: -0.8780, lng: 119.8750 },  // Dekat Hutan Kota (S3)

  // Area Selatan - Palu Selatan
  { id: 'N14', lat: -0.8950, lng: 119.8550 },  // Jl. Juanda
  { id: 'N15', lat: -0.8960, lng: 119.8600 },  // Persimpangan Jl. Basuki Rahmat
  { id: 'N16', lat: -0.8955, lng: 119.8650 },  // Jl. Monginsidi
  { id: 'N17', lat: -0.8960, lng: 119.8700 },  // Jl. Wolter Monginsidi
  { id: 'N18', lat: -0.8970, lng: 119.8720 },  // Dekat Kantor Gubernur (S4)

  // Node tambahan - jalur penghubung
  { id: 'N19', lat: -0.8900, lng: 119.8470 },  // Penghubung Lere-Pusat
  { id: 'N20', lat: -0.8880, lng: 119.8500 },  // Jl. Diponegoro
  { id: 'N21', lat: -0.8930, lng: 119.8550 },  // Jl. Sudirman
  { id: 'N22', lat: -0.8920, lng: 119.8630 },  // Jl. Ahmad Yani (selatan Talise)
  { id: 'N23', lat: -0.8810, lng: 119.8620 },  // Jl. Talise Pantai (utara)
  { id: 'N24', lat: -0.8835, lng: 119.8560 },  // Penghubung utara pusat
];

/**
 * Membangun daftar edge (ruas jalan) dengan bobot jarak Haversine.
 * Setiap ruas bersifat dua arah (bidirectional).
 */
function buildRoadEdges(): RoadEdge[] {
  // Definisi koneksi jalan: [nodeA, nodeB]
  const connections: [string, string][] = [
    // Jalur utama barat (Lere) → Pusat
    ['N1', 'N2'],    // Jl. Pattimura
    ['N2', 'N3'],    // Menuju Masjid Agung
    ['N2', 'N4'],    // Jl. Hasanuddin
    ['N3', 'N19'],   // Masjid Agung → penghubung
    ['N4', 'N19'],   // Hasanuddin → penghubung
    ['N19', 'N5'],   // Penghubung → Sam Ratulangi

    // Jalur pusat
    ['N5', 'N6'],    // Jl. Sam Ratulangi → Gajah Mada
    ['N5', 'N20'],   // Sam Ratulangi → Diponegoro
    ['N6', 'N7'],    // Gajah Mada → Moh. Yamin
    ['N6', 'N20'],   // Gajah Mada → Diponegoro
    ['N20', 'N24'],  // Diponegoro → penghubung utara

    // Jalur pusat → Talise
    ['N7', 'N8'],    // Moh. Yamin → Towua
    ['N7', 'N24'],   // Moh. Yamin → penghubung utara
    ['N8', 'N9'],    // Towua → GOR Talise
    ['N24', 'N23'],  // Penghubung utara → Talise Pantai
    ['N23', 'N9'],   // Talise Pantai → GOR Talise

    // Jalur Talise → Kaombona
    ['N9', 'N10'],   // GOR Talise → Talise Raya
    ['N10', 'N11'],  // Talise Raya → Soekarno Hatta
    ['N10', 'N23'],  // Talise Raya → Talise Pantai
    ['N11', 'N12'],  // Soekarno Hatta → Kaombona
    ['N12', 'N13'],  // Kaombona → Hutan Kota

    // Jalur selatan (alternatif)
    ['N4', 'N21'],   // Hasanuddin → Sudirman
    ['N5', 'N21'],   // Sam Ratulangi → Sudirman
    ['N21', 'N14'],  // Sudirman → Juanda
    ['N14', 'N15'],  // Juanda → Basuki Rahmat
    ['N15', 'N16'],  // Basuki Rahmat → Monginsidi
    ['N16', 'N17'],  // Monginsidi → Wolter Monginsidi
    ['N17', 'N18'],  // Wolter Monginsidi → Kantor Gubernur

    // Jalur penghubung selatan-tengah
    ['N6', 'N21'],   // Gajah Mada → Sudirman
    ['N8', 'N22'],   // Towua → Ahmad Yani
    ['N15', 'N22'],  // Basuki Rahmat → Ahmad Yani
    ['N22', 'N9'],   // Ahmad Yani → GOR Talise
    ['N16', 'N22'],  // Monginsidi → Ahmad Yani
    ['N11', 'N17'],  // Soekarno Hatta → Wolter Monginsidi
    ['N14', 'N6'],   // Juanda → Gajah Mada (jalan tembus)
  ];

  const edges: RoadEdge[] = [];
  const nodeMap = new Map(roadNodes.map(n => [n.id, n]));

  for (const [fromId, toId] of connections) {
    const from = nodeMap.get(fromId);
    const to = nodeMap.get(toId);
    if (!from || !to) continue;

    // Bobot edge = jarak Haversine antara dua node
    const distance = calculateHaversine(from.lat, from.lng, to.lat, to.lng);

    // Bidirectional: tambahkan dua arah
    edges.push({ from: fromId, to: toId, distance });
    edges.push({ from: toId, to: fromId, distance });
  }

  return edges;
}

// Build edges saat module di-load
export const roadEdges: RoadEdge[] = buildRoadEdges();

// ─────────────────────────────────────────────────────────────────────────────
// ZONA BAHAYA TSUNAMI
// ─────────────────────────────────────────────────────────────────────────────

export const hazardZones = [
  {
    name: "Zona Pesisir Barat (Kecamatan Ulujadi & Barat)",
    coords: [
      [-0.8800, 119.8350],
      [-0.8980, 119.8350],
      [-0.8980, 119.8420],
      [-0.8800, 119.8420]
    ] as [number, number][]
  },
  {
    name: "Zona Pesisir Timur Laut (Besusu - Talise)",
    coords: [
      [-0.8750, 119.8480],
      [-0.8920, 119.8480],
      [-0.8920, 119.8540],
      [-0.8750, 119.8540]
    ] as [number, number][]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// FORMULA HAVERSINE
// Menghitung jarak geografis (great-circle distance) antara dua titik koordinat
// pada permukaan bumi berdasarkan lintang dan bujur.
// 
// Formula:
//   a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlon/2)
//   c = 2 · atan2(√a, √(1-a))
//   d = R · c
// 
// dimana R = 6371 km (radius rata-rata bumi)
// 
// Return: jarak dalam kilometer (km)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateHaversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const toRad = (deg: number) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam km
}

// ─────────────────────────────────────────────────────────────────────────────
// MENCARI NODE JALAN TERDEKAT
// Menggunakan Haversine untuk mencari node pada graf jaringan jalan yang paling
// dekat secara geografis dari suatu titik koordinat.
// ─────────────────────────────────────────────────────────────────────────────

export function findNearestNode(lat: number, lng: number): RoadNode {
  let nearest = roadNodes[0];
  let minDist = Infinity;

  for (const node of roadNodes) {
    const dist = calculateHaversine(lat, lng, node.lat, node.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }

  return nearest;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITMA DIJKSTRA
// Mencari rute terpendek (shortest path) pada graf berbobot jaringan jalan.
// 
// Input:
//   - startNodeId: ID node awal (node jalan terdekat dari posisi user)
//   - endNodeId: ID node tujuan (node jalan terdekat dari shelter)
// 
// Proses:
//   1. Inisialisasi: semua node jarak = ∞, kecuali start = 0
//   2. Pilih node dengan jarak terkecil yang belum dikunjungi
//   3. Untuk setiap tetangga, hitung: jarak_baru = jarak_saat_ini + bobot_edge
//   4. Jika jarak_baru < jarak_lama, update jarak dan predecessor
//   5. Ulangi sampai node tujuan dicapai atau semua node dikunjungi
// 
// Output:
//   - distance: total jarak rute via jalan (km)
//   - path: daftar node ID yang dilalui
//   - coordinates: daftar koordinat [lat, lng] rute
// ─────────────────────────────────────────────────────────────────────────────

export interface DijkstraResult {
  distance: number;
  path: string[];
  coordinates: [number, number][];
}

export function dijkstra(startNodeId: string, endNodeId: string): DijkstraResult {
  // Langkah 1: Inisialisasi
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const node of roadNodes) {
    distances[node.id] = node.id === startNodeId ? 0 : Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  }

  // Langkah 2-4: Iterasi Dijkstra
  while (unvisited.size > 0) {
    // Pilih node dengan jarak terkecil dari set yang belum dikunjungi
    let currentNode: string | null = null;
    let currentDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < currentDist) {
        currentDist = distances[nodeId];
        currentNode = nodeId;
      }
    }

    // Jika tidak ada node yang bisa dicapai atau sudah sampai tujuan, berhenti
    if (currentNode === null || currentDist === Infinity) break;
    if (currentNode === endNodeId) break;

    // Tandai node sebagai sudah dikunjungi
    unvisited.delete(currentNode);

    // Periksa semua tetangga (adjacent nodes) melalui edge yang keluar
    const neighborEdges = roadEdges.filter(e => e.from === currentNode);

    for (const edge of neighborEdges) {
      if (!unvisited.has(edge.to)) continue; // Skip node yang sudah dikunjungi

      // Hitung jarak alternatif melalui node saat ini
      const alternativeDistance = distances[currentNode] + edge.distance;

      // Jika jarak alternatif lebih pendek, update (relaxation)
      if (alternativeDistance < distances[edge.to]) {
        distances[edge.to] = alternativeDistance;
        previous[edge.to] = currentNode;
      }
    }
  }

  // Langkah 5: Rekonstruksi path dari endNode ke startNode
  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  // Konversi path (node IDs) ke koordinat
  const nodeMap = new Map(roadNodes.map(n => [n.id, n]));
  const coordinates: [number, number][] = path
    .map(id => {
      const node = nodeMap.get(id);
      return node ? [node.lat, node.lng] as [number, number] : null;
    })
    .filter((c): c is [number, number] => c !== null);

  return {
    distance: distances[endNodeId] ?? Infinity,
    path,
    coordinates
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PENCARIAN RUTE EVAKUASI OPTIMAL
// Menggabungkan Haversine + Dijkstra untuk menemukan rute evakuasi terbaik
// 
// Alur:
//  1. Haversine → Cari node jalan terdekat dari posisi user
//  2. Untuk SETIAP shelter:
//     a. Haversine → Hitung jarak lurus user → shelter (estimasi cepat)
//     b. Haversine → Cari node jalan terdekat dari shelter
//     c. Dijkstra  → Hitung rute terpendek via jaringan jalan
//     d. Haversine → Tambahkan jarak user→node dan node→shelter
//  3. Sortir berdasarkan total jarak jalan (bukan jarak lurus)
//  4. Kembalikan 3 rute terbaik
// ─────────────────────────────────────────────────────────────────────────────

export function findOptimalEvacuationRoutes(
  userLat: number,
  userLng: number,
  maxRoutes: number = 3
): RouteResult[] {
  // 1. Inisialisasi Dijkstra dari titik user secara dinamis
  // Alih-alih melakukan snap ke 1 node terdekat yang bisa menyebabkan garis mundur (back-tracking),
  // kita hubungkan titik user ke 3 node terdekat dan biarkan Dijkstra memilih jalan terbaik ke tujuan.
  
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  for (const node of roadNodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  }
  
  // Tambahkan titik user sebagai node awal (START)
  const USER_NODE_ID = 'USER_START';
  distances[USER_NODE_ID] = 0;
  previous[USER_NODE_ID] = null;
  unvisited.add(USER_NODE_ID);

  // Cari 3 node terdekat dari user untuk disambungkan sebagai edge dinamis
  const nearestNodes = [...roadNodes]
    .map(node => ({ node, dist: calculateHaversine(userLat, userLng, node.lat, node.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3); // 3 akses jalan terdekat

  const userEdges: RoadEdge[] = nearestNodes.map(n => ({
    from: USER_NODE_ID,
    to: n.node.id,
    distance: n.dist
  }));

  // Jalankan Dijkstra menyapu seluruh graf
  while (unvisited.size > 0) {
    let currentNode: string | null = null;
    let currentDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < currentDist) {
        currentDist = distances[nodeId];
        currentNode = nodeId;
      }
    }

    if (currentNode === null || currentDist === Infinity) break;
    unvisited.delete(currentNode);

    let neighborEdges: RoadEdge[] = [];
    if (currentNode === USER_NODE_ID) {
      neighborEdges = userEdges;
    } else {
      neighborEdges = roadEdges.filter(e => e.from === currentNode);
    }

    for (const edge of neighborEdges) {
      if (!unvisited.has(edge.to)) continue;

      const alt = distances[currentNode] + edge.distance;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = currentNode;
      }
    }
  }

  // 2. Hitung rute ke setiap shelter
  const allRoutes: RouteResult[] = shelters.map(shelter => {
    const haversineDistance = calculateHaversine(userLat, userLng, shelter.lat, shelter.lng);
    const shelterNode = findNearestNode(shelter.lat, shelter.lng);
    const distNodeToShelter = calculateHaversine(
      shelterNode.lat, shelterNode.lng,
      shelter.lat, shelter.lng
    );

    // Rekonstruksi rute dari shelterNode mundur ke USER_START
    const path: string[] = [];
    let curr: string | null = shelterNode.id;
    while (curr !== null && curr !== USER_NODE_ID) {
      path.unshift(curr);
      curr = previous[curr];
    }

    const nodeMap = new Map(roadNodes.map(n => [n.id, n]));
    const dijkstraPathCoords: [number, number][] = path
      .map(id => {
        const node = nodeMap.get(id);
        return node ? [node.lat, node.lng] as [number, number] : null;
      })
      .filter((c): c is [number, number] => c !== null);

    // Jarak total = Jarak dari user ke shelterNode via graf + jarak node akhir ke shelter
    const dijkstraDistance = distances[shelterNode.id];
    const totalDistance = dijkstraDistance + distNodeToShelter;

    const walkingSpeed = 5;
    const runningSpeed = 10;

    const coordinates: [number, number][] = [
      [userLat, userLng],           // Titik asli user
      ...dijkstraPathCoords,        // Rute jalan optimal tanpa snap mundur
      [shelter.lat, shelter.lng]    // Titik lokasi shelter
    ];

    return {
      shelterName: shelter.name,
      shelterId: shelter.id,
      shelterCapacity: shelter.capacity,
      haversineDistance,
      dijkstraDistance,
      totalDistance,
      coordinates,
      walkingTime: Math.ceil((totalDistance / walkingSpeed) * 60),
      runningTime: Math.ceil((totalDistance / runningSpeed) * 60),
    };
  });

  return allRoutes
    .filter(r => isFinite(r.totalDistance))
    .sort((a, b) => a.totalDistance - b.totalDistance)
    .slice(0, maxRoutes);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAS TAMBAHAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mendapatkan shelter terdekat berdasarkan jarak lurus Haversine saja.
 * Berguna untuk estimasi cepat atau fallback.
 */
export function getNearestSheltersByHaversine(lat: number, lng: number, count: number = 3) {
  return shelters
    .map(s => ({
      ...s,
      haversineDistance: calculateHaversine(lat, lng, s.lat, s.lng)
    }))
    .sort((a, b) => a.haversineDistance - b.haversineDistance)
    .slice(0, count);
}