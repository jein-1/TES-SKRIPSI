const fs = require('fs');

const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  "import { AlertTriangle, Navigation, Shield, MapPin, Info, ChevronRight, X, Zap, Locate, Volume2, VolumeX, Bell, Menu } from 'lucide-react'",
  "import { AlertTriangle, Navigation, Shield, MapPin, Info, ChevronRight, X, Zap, Locate, Volume2, VolumeX, Bell, Menu, Radio, Satellite, Map as MapIcon, Clock, Settings, HelpCircle, Cpu } from 'lucide-react'"
);

// 2. Replace the entire return statement
const returnIndex = content.indexOf('return (');
if (returnIndex === -1) {
  console.log('Return statement not found!');
  process.exit(1);
}

const beforeReturn = content.slice(0, returnIndex);

const newUI = `return (
    <div className="w-full h-screen bg-[#0b1120] text-slate-300 flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className={\`h-[60px] shrink-0 border-b flex items-center justify-between px-6 z-50 relative transition-colors duration-500 \${tsunamiAlert ? 'bg-red-950 border-red-900/50' : 'bg-[#0f172a] border-slate-800'}\`}>
        <div className="flex items-center gap-3">
          <Shield className={\`w-6 h-6 \${tsunamiAlert ? 'text-red-500' : 'text-indigo-500'}\`} />
          <h1 className="text-white font-black text-xl tracking-tighter">TES SKRIPSI</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-slate-500">
             <Radio className="w-5 h-5" />
             <Satellite className="w-5 h-5" />
          </div>
          <button 
            onClick={() => {
              if (tsunamiAlert) {
                deactivateTsunamiAlert()
              } else {
                setShowTsunamiConfirm(true)
              }
            }}
            className={\`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all \${tsunamiAlert ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-red-600 hover:bg-red-500 text-white border border-transparent'}\`}>
             <AlertTriangle className={\`w-4 h-4 \${tsunamiAlert ? 'animate-pulse text-red-400' : ''}\`} />
             {tsunamiAlert ? 'HENTIKAN SIMULASI' : 'SIMULASI TSUNAMI'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Tsunami Alert Flashing Overlay */}
        <div className={\`absolute inset-0 z-[400] pointer-events-none transition-opacity duration-1000 \${tsunamiAlert ? 'bg-red-900/20' : 'opacity-0'}\`} />
        <div className={\`absolute inset-0 z-[400] pointer-events-none border-4 transition-colors duration-500 \${tsunamiAlert ? 'border-red-500/50 animate-[borderFlash_2s_infinite]' : 'border-transparent'}\`} />

        {/* Left Sidebar */}
        <aside className="w-[240px] bg-[#0b1120] border-r border-slate-800 flex flex-col z-40 relative hidden lg:flex shrink-0">
          <div className="p-6 pb-2">
            <h3 className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">Navigation</h3>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">System Active</p>
          </div>
          <nav className="flex-1 mt-4">
            <a href="#" className="flex items-center gap-3 px-6 py-3 bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300">
              <MapIcon className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">MAP</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-slate-300 transition-colors pointer-events-none opacity-50">
              <Clock className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">HISTORY</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-6 py-3 text-slate-500 hover:text-slate-300 transition-colors pointer-events-none opacity-50">
              <Settings className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">SETTINGS</span>
            </a>
          </nav>
          <div className="p-6">
            <button
               onClick={() => setShowShelters(true)}
               className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-semibold text-sm tracking-wide">SUPPORT / INFO</span>
            </button>
          </div>
        </aside>

        {/* Center Map */}
        <main className="flex-1 relative z-0 bg-[#0b1120]">
          
          {/* GPS Control OSD */}
          <div className="absolute top-4 left-4 flex gap-2 z-[1000]">
            <button 
              onClick={() => gpsTracking ? stopGpsTracking() : startGpsTracking()}
              className={\`px-3 py-1.5 rounded-full flex items-center gap-2 border shadow-lg transition-colors text-xs font-bold tracking-wide \${gpsTracking ? 'bg-green-900/60 border-green-500/50 text-green-300' : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-slate-400'}\`}>
              <div className={\`w-2 h-2 rounded-full \${gpsTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}\`} />
              {gpsTracking ? 'GPS AKTIF' : 'ACTIVATE GPS'}
            </button>
            {gpsTracking && (
              <div className="px-3 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center gap-2 text-xs font-bold tracking-wide text-indigo-300">
                <Locate className="w-3.5 h-3.5" /> TRACKING
              </div>
            )}
          </div>

          <MapContainer
            center={[-0.8917, 119.8577]}
            zoom={14}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; CARTO'
              url={TILE_DARK}
            />
            <LocationMarker onLocationSet={handleLocationSet} />
            {flyToPos && <MapFlyTo position={flyToPos} zoom={15} />}

            {/* Hazard zones */}
            {hazardZones.map((zone, i) => (
              <Polygon
                key={i}
                positions={zone.coords}
                pathOptions={{
                  color: tsunamiAlert ? '#ff0000' : '#ef4444',
                  fillColor: tsunamiAlert ? '#ff0000' : '#ef4444',
                  fillOpacity: tsunamiAlert ? 0.35 : 0.15,
                  weight: tsunamiAlert ? 3 : 1
                }}
              />
            ))}

            {/* Shelters */}
            {shelters.map((shelter) => (
              <Marker 
                key={shelter.id} 
                position={[shelter.lat, shelter.lng]}
                icon={shelterIcon}
              >
                <Popup className="shelter-popup">
                  <div className="font-bold text-slate-800">{shelter.name}</div>
                  <div className="text-sm text-slate-600">Kapasitas: {shelter.capacity} orang</div>
                  {!isCalculating && !tsunamiAlert && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (userPosition) {
                          setIsCalculating(true)
                          setTimeout(() => {
                            const params = new URLSearchParams(window.location.search)
                            params.set('dest', shelter.id)
                            window.history.pushState({}, '', \`?\${params.toString()}\`)
                            const routeResults = findOptimalEvacuationRoutes(userPosition[0], userPosition[1])
                            setRoutes(routeResults)
                            setSelectedRoute(0)
                            setShowPanel(true)
                            setIsCalculating(false)
                          }, 300)
                        } else {
                          alert('Klik peta terlebih dahulu untuk menentukan lokasi Anda!')
                        }
                      }}
                      className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Evakuasi ke Sini
                    </button>
                  )}
                </Popup>
              </Marker>
            ))}

            {/* User Position */}
            {userPosition && (
              <Marker 
                position={userPosition} 
                icon={tsunamiAlert ? userIconAlert : userIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <strong>{gpsTracking ? 'Lokasi GPS Anda' : 'Lokasi Terpilih'}</strong>
                </Popup>
              </Marker>
            )}

            {/* Evacuation Routes */}
            {routes.map((route, i) => (
              <Polyline
                key={i}
                positions={route.coordinates}
                pathOptions={{
                  color: routeColors[i],
                  weight: i === selectedRoute ? 6 : 3,
                  opacity: i === selectedRoute ? 0.9 : 0.4,
                  dashArray: i === selectedRoute ? undefined : '10 6',
                }}
              />
            ))}
          </MapContainer>
        </main>

        {/* Right Sidebar (Evacuation Routes Panel) */}
        <AnimatePresence>
          {showPanel && routes.length > 0 && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[400px] h-full absolute md:relative right-0 bg-[#0f172a] border-l border-slate-800 flex flex-col z-50 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">Rute Evakuasi</h2>
                  <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white">
                     <X className="w-5 h-5"/>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                  NEAREST SAFE ZONES
                </p>
              </div>

              {/* Rute List (Scrollable Area) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 flex flex-col gap-4">
                {routes.map((route, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedRoute(i)
                      if (route.coordinates.length > 0) {
                        const endPoint = route.coordinates[route.coordinates.length - 1]
                        setFlyToPos([endPoint[0], endPoint[1]])
                      }
                    }}
                    className={\`w-full text-left p-5 rounded-xl border transition-all duration-300 relative group \${
                      selectedRoute === i
                        ? 'bg-[#1e293b]/80 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                        : 'bg-[#1e293b]/30 border-slate-800 hover:bg-[#1e293b]/50 hover:border-slate-700'
                    }\`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={\`text-[10px] font-bold tracking-wider px-2 py-1 rounded \${selectedRoute === i ? (i===0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-slate-300') : 'text-slate-500'}\`}>
                        {i === 0 ? 'FASTEST' : 'ALTERNATIVE'}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                        {i + 1}
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-white mb-3">
                      {route.shelterName}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {route.totalDistance === Infinity ? 'N/A' : \`\${route.totalDistance.toFixed(2)} km\`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {route.totalDistance === Infinity ? 'N/A' : \`~\${route.walkingTime} min\`}
                      </span>
                    </div>

                    {selectedRoute === i && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors">
                          Go to Point <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Bottom Pathfinding Logic Info */}
              <div className="p-6 border-t border-slate-800 bg-[#0b1120]/50">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> PATHFINDING LOGIC
                </h4>
                <div className="flex flex-col gap-3">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Distance Algo</span>
                     <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Haversine</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Route Optimization</span>
                     <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Dijkstra</span>
                   </div>
                </div>
                {!gpsTracking && (
                  <button 
                    onClick={() => {
                      setUserPosition(null)
                      setRoutes([])
                      setShowPanel(false)
                    }}
                    className="w-full mt-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    RESET POSITION
                  </button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* Fullscreen Overlay Modals */}
      {/* Tsunami confirmation */}
      <AnimatePresence>
        {showTsunamiConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Simulasi Tsunami?</h2>
              <p className="text-sm text-slate-400 mb-8">
                Sistem akan membunyikan sirine peringatan dini dan menyiagakan rute evakuasi darurat.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={activateTsunamiAlert}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  MULAI SIMULASI
                </button>
                <button
                  onClick={() => setShowTsunamiConfirm(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  BATALKAN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shelter List Modal */}
      <AnimatePresence>
        {showShelters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Daftar Lokasi Shelter
                </h2>
                <button
                  onClick={() => setShowShelters(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Pilih lokasi di bawah ini untuk melihat letak titik evakuasi aman secara manual di atas peta.
              </p>
              
              <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
                {shelters.map((s, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-colors flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">{s.name}</h3>
                        <p className="text-xs text-slate-500">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setFlyToPos([s.lat, s.lng])
                        setShowShelters(false)
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      LIHAT DI PETA
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Error message */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-4 z-[2000]"
          >
            <div className="pl-4 pr-2 py-2 rounded-xl bg-amber-500 border border-amber-400 shadow-xl shadow-amber-900/30 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-bold tracking-wide">{gpsError}</span>
              <button onClick={() => setGpsError(null)} className="ml-2 p-1 bg-amber-400/50 hover:bg-amber-400 rounded-lg text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default App
`

fs.writeFileSync(path, beforeReturn + newUI);

console.log('App.tsx updated successfully.');
