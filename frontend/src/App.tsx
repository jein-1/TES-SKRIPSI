import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Map, MapMarker, MarkerContent, MapRoute, MapGeoJSON, type MapRef, type MapViewport } from '@/components/ui/map'
// â”€â”€ Modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  shelters,
  hazardZones,
  findOptimalEvacuationRoutes,
  addCustomShelter,
  type RouteResult,
  loadRoadNetwork,
} from "./lib/evacuation";
import {
  TILE_NORMAL,
  TILE_DARK,
  TILE_SATELLITE,
  routeColors,
  routeBadgeColors,
} from "./constants/mapConfig";
// Map components Removed
import type {
  ActivePage,
  HistoryFilter,
  EvacuationRecord,
  AppSettings,
  AppUserRole,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import LoginPage from "./components/pages/LoginPage";
import FirstVisitModal from "./components/modals/FirstVisitModal";
import type { UserRole } from "./types";
// â”€â”€ New Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import SensorsPage from "./components/pages/SensorsPage";
import StatusPage from "./components/pages/StatusPage";
import NavigatePage from "./components/pages/NavigatePage";
import FamilyPage from "./components/pages/FamilyPage";
import GuidesPage from "./components/pages/GuidesPage";
import { useAegisSync, aegisApi } from "./lib/useAegisSync";
import { useBMKG, createCirclePolygon } from "./lib/useBMKG";
import {
  requestNotifPermission,
  sendTsunamiNotification,
} from "./lib/useTsunamiAlert";
import { registerWebPush } from "./lib/usePushNotification";
import { Geolocation } from "@capacitor/geolocation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
// â”€â”€ UI Libraries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  AlertTriangle,
  Shield,
  MapPin,
  Info,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  Locate,
  Volume2,
  Menu,
  Radio,
  Satellite,
  Map as MapIcon,
  HelpCircle,
  Cpu,
  ArrowRight,
  History,
  Bell,
  Vibrate,
  Crosshair,
  SlidersHorizontal,
  Trash2,
  Navigation2,
  Lock,
  RefreshCw,
  Activity,
  Clock,
  Check,
  CheckCircle2,
  Users,
  BookOpen,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ALARM SOUND
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function createAlarmSound(): { start: () => void; stop: () => void } {
  let audioCtx: AudioContext | null = null;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let lfoNode: OscillatorNode | null = null;

  return {
    start() {
      if (audioCtx) return;
      audioCtx = new AudioContext();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.3;
      gain.connect(audioCtx.destination);
      osc1 = audioCtx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.value = 440;
      lfoNode = audioCtx.createOscillator();
      lfoNode.type = "sine";
      lfoNode.frequency.value = 1.5;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 200;
      lfoNode.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      osc1.connect(gain);
      osc1.start();
      lfoNode.start();
      osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 660;
      const gain2 = audioCtx.createGain();
      gain2.gain.value = 0.15;
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      const lfo2 = audioCtx.createOscillator();
      lfo2.type = "sine";
      lfo2.frequency.value = 1.5;
      const lfoGain2 = audioCtx.createGain();
      lfoGain2.gain.value = 300;
      lfo2.connect(lfoGain2);
      lfoGain2.connect(osc2.frequency);
      osc2.start();
      lfo2.start();
    },
    stop() {
      try {
        osc1?.stop();
        osc2?.stop();
        lfoNode?.stop();
        audioCtx?.close();
      } catch (_) {}
      audioCtx = null;
      osc1 = null;
      osc2 = null;
      lfoNode = null;
    },
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAP CHILD COMPONENTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Leaflet helper components Removed

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MINI ROUTE MAP â€” decorative SVG for history log cards
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function MiniRouteMap({
  type,
  seed,
}: {
  type: "real" | "simulation";
  seed?: number;
}) {
  const col = type === "simulation" ? "#6366f1" : "#ef4444";
  const glow =
    type === "simulation" ? "rgba(99,102,241,0.25)" : "rgba(239,68,68,0.25)";
  // slight variation by seed so cards look different
  const mid = seed ? 28 + (seed % 10) * 2 : 32;
  const id = `mg-${type}-${seed ?? 0}`;
  return (
    <div
      className="w-full h-[68px] rounded-xl overflow-hidden"
      style={{ background: "#060d1a" }}
    >
      <svg
        width="100%"
        height="68"
        viewBox="0 0 280 68"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={id}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* grid */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={17 * i}
            x2="280"
            y2={17 * i}
            stroke="#0d1e3a"
            strokeWidth="1"
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={`v${i}`}
            x1={40 * i}
            y1="0"
            x2={40 * i}
            y2="68"
            stroke="#0d1e3a"
            strokeWidth="1"
          />
        ))}
        {/* glow path */}
        <path
          d={`M14,56 C55,56 55,${mid} 100,${mid - 4} C145,${mid - 8} 160,42 205,18 C230,8 256,14 268,10`}
          stroke={glow}
          strokeWidth="5"
          fill="none"
          filter={`url(#${id})`}
        />
        {/* route line */}
        <path
          d={`M14,56 C55,56 55,${mid} 100,${mid - 4} C145,${mid - 8} 160,42 205,18 C230,8 256,14 268,10`}
          stroke={col}
          strokeWidth="1.8"
          fill="none"
          strokeDasharray="5 3"
        />
        {/* origin */}
        <circle cx="14" cy="56" r="4" fill={col} />
        {/* waypoints */}
        <circle cx="100" cy={mid - 4} r="2.5" fill={col} opacity="0.55" />
        <circle cx="205" cy="18" r="2.5" fill={col} opacity="0.55" />
        {/* destination */}
        <circle cx="268" cy="10" r="9" fill="#22c55e" opacity="0.18" />
        <circle cx="268" cy="10" r="5" fill="#22c55e" />
      </svg>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function fmtDate(d: Date) {
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " â€¢ " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// APP
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€ Arrival detection radius (metres)
const ARRIVAL_RADIUS_METERS = 50;

// AdminBearingTracker Removed

function App() {
  // â”€â”€ Map state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null,
  );
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null); // metres
  const [arrivedShelterId, setArrivedShelterId] = useState<string | null>(null);
  // Arrival modal state â€” stores snapshot at time of arrival

  const [arrivalSummary, setArrivalSummary] = useState<{
    shelter: (typeof shelters)[0];
    distanceKm: number;
    walkingMin: number;
  } | null>(null);

  // â”€â”€ GPS & Alert state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tsunamiAlert, setTsunamiAlert] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("aegisSimulating") === "true" || localStorage.getItem("aegisRealTsunami") === "true";
    }
    return false;
  });
  const tsunamiAlertRef = useRef(tsunamiAlert);
  useEffect(() => {
    tsunamiAlertRef.current = tsunamiAlert;
  }, [tsunamiAlert]);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [showTsunamiConfirm, setShowTsunamiConfirm] = useState(false);
  const [showShelters, setShowShelters] = useState(false);
  const [showAddShelter, setShowAddShelter] = useState(false);
  const [newShelter, setNewShelter] = useState({ name: '', lat: '', lng: '', capacity: '', radius: '50' });
  const [pickingLocationMode, setPickingLocationMode] = useState(false);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSavingShelter, setIsSavingShelter] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [adminMapBearing, setAdminMapBearing] = useState(0);
  const adminMapRef = useRef<MapRef | null>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    center: [119.8577, -0.8917], // [lng, lat]
    zoom: 14,
    bearing: 0,
    pitch: 0
  });
  // Lokasi user aktif untuk peta admin (hanya saat simulasi)
  const [activeUsers, setActiveUsers] = useState<
    Record<
      string,
      {
        id: string;
        name: string;
        deviceModel: string;
        lat: number;
        lng: number;
        ts: number;
        battery?: number;
        isOffline?: boolean;
      }
    >
  >({});

  // — URL-based Admin Detection ———————————————————————————————————————————
  // Admin mode: URL contains ?admin OR ?key=aegis2024 OR hash #admin
  // Admin mode: URL contains ?admin OR hash #admin
  // ── Mode Pilih di Peta ──
  const handleReverseGeocode = useCallback((lat: number, lng: number) => {
    if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
    geoDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          const locationName = data.road || data.displayName || 'Alamat tidak diketahui';
          setNewShelter(prev => ({ ...prev, name: locationName }));
        }
      } catch (err) {
        console.error("Geocode error", err);
      }
    }, 600);
  }, []);

  useEffect(() => {
    if (pickingLocationMode && adminMapRef.current) {
      const map = adminMapRef.current;
      const handleClick = (e: any) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;
        setNewShelter(prev => ({ ...prev, lat: String(lat), lng: String(lng) }));
        setPickingLocationMode(false);
        setShowAddShelter(true);
        handleReverseGeocode(lat, lng);
      };
      map.once('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [pickingLocationMode, handleReverseGeocode]);

  // User mode:  any other URL (default — no login required)
  const isAdminURL = (() => {
    // APK Admin build: env var set at build time via .env.admin
    if (import.meta.env.VITE_ADMIN_APP === "true") return true;
    const p = new URLSearchParams(window.location.search);
    return (
      p.has("admin") ||
      window.location.hash === "#admin"
    );
  })();
  const [adminPing, setAdminPing] = useState<{
    fromName: string;
    role: string;
    fromId: string;
  } | null>(null);
  const [hasFamilyPing, setHasFamilyPing] = useState(false);

  const [userRole, setUserRole] = useState<AppUserRole>(() => {
    if (!isAdminURL) return "user"; // Regular URL → instant user mode
    return (sessionStorage.getItem("aegisRole") as AppUserRole) ?? null;
  });

  // User display name — stored in localStorage, set on first visit
  const [userName, setUserName] = useState<string>(() => {
    const ls = localStorage.getItem("aegisUserName");
    if (ls) return ls;
    const m = document.cookie.match(/(?:^|; )aegisUserName=([^;]*)/);
    if (m) {
      const n = decodeURIComponent(m[1]);
      localStorage.setItem("aegisUserName", n);
      return n;
    }
    return "";
  });
  const [showFirstVisit, setShowFirstVisit] = useState(() => {
    const registered = localStorage.getItem("aegisRegistered");
    const hasName = !!localStorage.getItem("aegisUserName");
    return !isAdminURL && (!registered || !hasName);
  });
  const [showEditProfile, setShowEditProfile] = useState(false);

  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Admin starts on 'map', public user starts on 'status'
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    if (typeof window !== "undefined") {
      const isSimulating = sessionStorage.getItem("aegisSimulating") === "true";
      const isRealTsunami = localStorage.getItem("aegisRealTsunami") === "true";
      if (isSimulating || isRealTsunami) return "navigate";
    }
    if (!isAdminURL) return "status";
    const role = sessionStorage.getItem("aegisRole") as UserRole;
    return role === "user" ? "status" : "map";
  });
  const { gempa } = useBMKG();
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [dismissedGempaTime, setDismissedGempaTime] = useState<string | null>(null);

  const isGempaDismissed = useMemo(() => {
    if (!gempa) return true;
    if (dismissedGempaTime === gempa.DateTime) return true;
    try {
      const stored = localStorage.getItem('dismissedGempas');
      if (!stored) return false;
      const history = JSON.parse(stored);
      if (Array.isArray(history)) {
        return history.includes(gempa.DateTime);
      }
      return false;
    } catch {
      return false;
    }
  }, [gempa, dismissedGempaTime]);

  const handleDismissGempa = useCallback(() => {
    if (!gempa) return;
    try {
      const stored = localStorage.getItem('dismissedGempas');
      let history: string[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) history = parsed;
        } catch (e) {} // Ignore parse error and use empty array
      }
      if (!history.includes(gempa.DateTime)) {
        history.push(gempa.DateTime);
        if (history.length > 7) {
          history = history.slice(-7);
        }
        localStorage.setItem('dismissedGempas', JSON.stringify(history));
      }
    } catch (e) {}
    setDismissedGempaTime(gempa.DateTime);
  }, [gempa]);

  // â”€â”€ Persistent Terminal ID â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [terminalId] = useState(() => {
    const s = localStorage.getItem("aegisTerminalId");
    if (s) return s;
    const id = `AEGIS-${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem("aegisTerminalId", id);
    return id;
  });

  // â”€â”€ History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [evacuationHistory, setEvacuationHistory] = useState<
    EvacuationRecord[]
  >(() => {
    try {
      const s = localStorage.getItem("evacuationHistory");
      if (s)
        return JSON.parse(s).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          eventName: r.eventName ?? r.routeName ?? "Unknown Event",
        }));
    } catch (_) {}
    return [];
  });

  // â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem("appSettings");
      if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
    } catch (_) {}
    return DEFAULT_SETTINGS;
  });

  // â”€â”€ Misc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isMobile, setIsMobile] = useState(false);
  const alarmRef = useRef(createAlarmSound());
  const gpsWatchRef = useRef<string | number | null>(null);
  const gpsAutoStartedRef = useRef(false);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  ); // loop getar
  // FIX: track if user manually closed the panel so GPS updates don't reopen it
  const panelUserClosedRef = useRef(false);
  // FIX: only fly to GPS position on first fix to prevent map shaking
  const hasFirstGPSFixRef = useRef(false);
  // Prevent arrival from firing more than once per session
  const arrivedFiredRef = useRef(false);

  // Persist
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(
      "evacuationHistory",
      JSON.stringify(evacuationHistory),
    );
  }, [evacuationHistory]);

  // Mobile detection â€” MUST be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auth handlers ──────────────────────────────────────────────────────────
  // Admin login (only called when isAdminURL)
  const [adminRole, setAdminRole] = useState<string>("Admin");
  const handleLogin = (role: UserRole, name: string, specificRole?: string) => {
    if (specificRole) setAdminRole(specificRole);
    sessionStorage.setItem("aegisRole", role ?? "");
    sessionStorage.setItem("aegisUser", name);
    setUserRole(role);
    setUserName(name);
    setActivePage(role === "user" ? "status" : "map");
  };

  // Admin logout â†’ back to admin login screen
  const handleLogout = () => {
    sessionStorage.removeItem("aegisRole");
    sessionStorage.removeItem("aegisUser");
    setUserRole(isAdminURL ? null : "user");
    setActivePage("status");
  };

  // First visit name completion
  const handleFirstVisit = (name: string) => {
    localStorage.setItem("aegisUserName", name);
    localStorage.setItem("aegisRegistered", "1");
    document.cookie = `aegisUserName=${encodeURIComponent(name)};max-age=${365 * 24 * 3600};path=/;SameSite=Lax`;
    setUserName(name);
    setShowFirstVisit(false);
    setTimeout(() => startGpsTracking(), 800);
  };

  // Profile edit (name change only — device stays registered)
  const handleEditProfile = (name: string) => {
    localStorage.setItem("aegisUserName", name);
    document.cookie = `aegisUserName=${encodeURIComponent(name)};max-age=${365 * 24 * 3600};path=/;SameSite=Lax`;
    setUserName(name);
    setShowEditProfile(false);
  };

  // ── GPS ────────────────────────────────────────────────────────────────────

  // ── Save history record ────────────────────────────────────────────────────
  const saveHistoryRecord = useCallback(
    (
      routeResults: RouteResult[],
      type: "simulation" | "real",
      pos: [number, number],
    ) => {
      if (routeResults.length === 0) return;
      const best = routeResults[0];
      const sector = (Math.abs(Math.floor(pos[0] * 17 + pos[1] * 13)) % 12) + 1;
      const eventName =
        type === "simulation"
          ? `Coastal Surge: Sector ${sector} Evacuation`
          : `Live Navigation: Route Alpha`;
      const record: EvacuationRecord = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type,
        eventName,
        routeName: best.shelterName,
        distance: best.totalDistance === Infinity ? null : best.totalDistance,
        walkingTime: best.totalDistance === Infinity ? null : best.walkingTime,
        algorithm:
          settings.algorithm === "haversine" ? "HAVERSINE" : "DIJKSTRA",
        userLat: pos[0],
        userLng: pos[1],
      };
      setEvacuationHistory((prev) => [record, ...prev].slice(0, 50));
    },
    [settings.algorithm],
  );

  // â”€â”€ GPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startGpsTracking = useCallback(async () => {
    // Admin dashboard tidak boleh meminta lokasi atau melacak GPS-nya sendiri
    if (isAdminURL) return;

    // Clear any existing watch first to prevent duplicate watchers
    if (gpsWatchRef.current !== null) {
      if (typeof gpsWatchRef.current === "string") {
        await Geolocation.clearWatch({ id: gpsWatchRef.current });
      } else {
        navigator.geolocation.clearWatch(gpsWatchRef.current as number);
      }
      gpsWatchRef.current = null;
    }

    try {
      await Geolocation.requestPermissions();
    } catch {}

    // Reset flags when GPS is freshly started
    panelUserClosedRef.current = false;
    hasFirstGPSFixRef.current = false;
    arrivedFiredRef.current = false;
    setArrivedShelterId(null);
    setArrivalSummary(null);
    setGpsTracking(true);
    setGpsError(null);
    setIsCalculating(true);

    try {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        (pos, err) => {
          if (err) {
            console.warn("GPS Error:", err);
            // Don't abort tracking on temporary errors like signal loss!
            // Just notify user temporarily.
            setGpsError("Mencari sinyal GPS...");
            return;
          }
          if (!pos) return;

          // Show accuracy badge but don't filter â€” let all positions through
          setGpsAccuracy(pos.coords.accuracy);
          const newPos: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setUserPosition(newPos);
          // Only fly to position on the FIRST GPS fix to prevent map shaking
          if (!hasFirstGPSFixRef.current) {
            hasFirstGPSFixRef.current = true;
            setFlyToPos(newPos);
          }
          const routeResults = findOptimalEvacuationRoutes(
            newPos[0],
            newPos[1],
          );
          setRoutes(routeResults);
          setSelectedRoute(0);
          setIsCalculating(false);
          // Only open panel if user hasn't manually closed it
          if (!panelUserClosedRef.current) {
            setShowPanel(true);
          }
          saveHistoryRecord(
            routeResults,
            tsunamiAlertRef.current ? "simulation" : "real",
            newPos,
          );

          // ── Broadcast Lokasi ke Admin (HANYA saat simulasi / emergency) ──
          if (tsunamiAlertRef.current) {
            const deviceInfo =
              (window as any).__DEVICE_MODEL__ || navigator.userAgent;
            import("@capacitor/device")
              .then(({ Device }) => {
                Device.getBatteryInfo()
                  .then((info) => {
                    const bat = info.batteryLevel
                      ? Math.round(info.batteryLevel * 100)
                      : 100;
                    aegisApi
                      .broadcastLocation(
                        terminalId,
                        userName || "Pengguna",
                        deviceInfo,
                        newPos[0],
                        newPos[1],
                        bat,
                      )
                      .catch(() => {});
                  })
                  .catch(() => {
                    aegisApi
                      .broadcastLocation(
                        terminalId,
                        userName || "Pengguna",
                        deviceInfo,
                        newPos[0],
                        newPos[1],
                        100,
                      )
                      .catch(() => {});
                  });
              })
              .catch(() => {
                aegisApi
                  .broadcastLocation(
                    terminalId,
                    userName || "Pengguna",
                    deviceInfo,
                    newPos[0],
                    newPos[1],
                    100,
                  )
                  .catch(() => {});
              });
          }

          // â”€â”€ Arrival detection: check if within ARRIVAL_RADIUS_METERS of any shelter â”€â”€
          // ── Arrival detection: check if within ARRIVAL_RADIUS_METERS of any shelter ──
          // Only fires once per GPS session (arrivedFiredRef prevents repeat triggers)
          if (!arrivedFiredRef.current) {
            const toRad = (d: number) => d * (Math.PI / 180);
            const arrived = shelters.find((sh) => {
              const R = 6371000; // metres
              const dLat = toRad(sh.lat - newPos[0]);
              const dLng = toRad(sh.lng - newPos[1]);
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(newPos[0])) *
                  Math.cos(toRad(sh.lat)) *
                  Math.sin(dLng / 2) ** 2;
              const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              return dist <= (sh.radiusMeters ?? ARRIVAL_RADIUS_METERS);
            });
            if (arrived) {
              arrivedFiredRef.current = true;
              // ── STOP EVERYTHING — like Google Maps ending navigation ──
              // 1. Stop GPS watch
              if (gpsWatchRef.current !== null) {
                if (typeof gpsWatchRef.current === "string") {
                  Geolocation.clearWatch({ id: gpsWatchRef.current });
                } else {
                  navigator.geolocation.clearWatch(
                    gpsWatchRef.current as number,
                  );
                }
                gpsWatchRef.current = null;
              }
              // 2. Stop alarm & deactivate tsunami alert
              alarmRef.current.stop();
              setGpsTracking(false);
              setTsunamiAlert(false);
              setShowPanel(false);
              // 3. Haptic feedback (arrived!)
              if ("vibrate" in navigator)
                navigator.vibrate([200, 100, 200, 100, 400]);
              // 4. Show arrival state
              setArrivedShelterId(arrived.id);
              const bestRoute = routeResults[0];
              setArrivalSummary({
                shelter: arrived,
                distanceKm:
                  bestRoute?.totalDistance === Infinity
                    ? 0
                    : (bestRoute?.totalDistance ?? 0),
                walkingMin: bestRoute?.walkingTime ?? 0,
              });
            }
          }
        },
      );
      gpsWatchRef.current = watchId;
    } catch (e) {
      setIsCalculating(false);
      setGpsError("Gagal mengaktifkan sensor lokasi GPS.");
      setGpsTracking(false);
    }
  }, [saveHistoryRecord, tsunamiAlert]);

  const stopGpsTracking = useCallback(async () => {
    if (gpsWatchRef.current !== null) {
      if (typeof gpsWatchRef.current === "string") {
        await Geolocation.clearWatch({ id: gpsWatchRef.current });
      } else {
        navigator.geolocation.clearWatch(gpsWatchRef.current as number);
      }
      gpsWatchRef.current = null;
    }
    setGpsTracking(false);
  }, []);

  // Auto-start GPS on mobile
  useEffect(() => {
    if (isMobile && settings.autoStartGPS && !gpsAutoStartedRef.current) {
      gpsAutoStartedRef.current = true;
      const t = setTimeout(() => startGpsTracking(), 1000);
      return () => clearTimeout(t);
    }
  }, [isMobile, settings.autoStartGPS, startGpsTracking]);

  // â”€â”€ Tsunami â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aegisSimulating", "true");
    }
    setShowTsunamiConfirm(false);
    if (!alarmMuted && settings.soundAlert) alarmRef.current.start();
    if (settings.vibrationAlert) {
      if (typeof window !== "undefined" && "vibrate" in navigator)
        navigator.vibrate([500, 200, 500, 200, 500]);
      else Haptics.vibrate({ duration: 1000 }).catch(() => {});
    }
    startGpsTracking();
    aegisApi.setTsunami(true);
  }, [
    alarmMuted,
    settings.soundAlert,
    settings.vibrationAlert,
    startGpsTracking,
  ]);

  const deactivateTsunamiAlert = useCallback(() => {
    setTsunamiAlert(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("aegisSimulating");
    }
    alarmRef.current.stop();
    aegisApi.setTsunami(false);
  }, []);

  useEffect(() => {
    if (tsunamiAlert) {
      if (alarmMuted || !settings.soundAlert) alarmRef.current.stop();
      else alarmRef.current.start();
    }
  }, [alarmMuted, tsunamiAlert, settings.soundAlert]);

  useEffect(
    () => () => {
      alarmRef.current.stop();
      if (gpsWatchRef.current !== null) {
        if (typeof gpsWatchRef.current === "string") {
          Geolocation.clearWatch({ id: gpsWatchRef.current });
        } else {
          navigator.geolocation.clearWatch(gpsWatchRef.current as number);
        }
      }
    },
    [],
  );

  // â”€â”€ Map click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLocationSet = useCallback(
    (lat: number, lng: number) => {
      if (gpsTracking) return;
      setUserPosition([lat, lng]);
      setIsCalculating(true);
      setTimeout(() => {
        const routeResults = findOptimalEvacuationRoutes(lat, lng);
        setRoutes(routeResults);
        setSelectedRoute(0);
        setShowPanel(true);
        setIsCalculating(false);
        saveHistoryRecord(routeResults, "real", [lat, lng]);
      }, 300);
    },
    [gpsTracking, saveHistoryRecord],
  );

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mapTileUrl = tsunamiAlert
    ? TILE_NORMAL // Force bright/normal map during emergency for better visibility
    : settings.cartographyTheme === "satellite-hud"
      ? TILE_SATELLITE
      : settings.cartographyTheme === "tactical-dark"
        ? TILE_DARK
        : TILE_NORMAL;

  const mapTileKey = tsunamiAlert
    ? "tsunami-normal"
    : settings.cartographyTheme;

  // FIX: maxNativeZoom prevents blank tiles when zoomed past the tile provider's max zoom
  // Tiles will stretch instead of going blank
  const mapMaxNativeZoom =
    tsunamiAlert || settings.cartographyTheme === "tactical-dark"
      ? 20 // CartoDB dark supports up to zoom 20
      : settings.cartographyTheme === "satellite-hud"
        ? 19 // ArcGIS World Imagery native (safe cap)
        : 19; // OpenStreetMap max native zoom

  const routeColors = tsunamiAlert
    ? ["#ef4444", "#f59e0b", "#22c55e"]
    : ["#6366f1", "#f59e0b", "#10b981"];
  const routeBadgeColors = ["bg-indigo-500", "bg-amber-500", "bg-emerald-500"];

  const avgResponse =
    evacuationHistory.length > 0
      ? (
          evacuationHistory.reduce((s, r) => s + (r.walkingTime ?? 0), 0) /
          evacuationHistory.length
        ).toFixed(1)
      : null;

  const filteredHistory =
    historyFilter === "all"
      ? evacuationHistory
      : evacuationHistory.filter(
          (r) => r.type === (historyFilter === "real" ? "real" : "simulation"),
        );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER â€” Split by role (no z-index conflicts)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // -- SSE real-time sync -- cross-device via Railway server
  useAegisSync((event) => {
    if (event.type === "TSUNAMI") {
      const active = event.active as boolean;
      if (active) {
        if (typeof window !== "undefined") localStorage.setItem("aegisRealTsunami", "true");
        setTsunamiAlert(true);
        setActivePage("navigate");
        if (vibrateIntervalRef.current)
          clearInterval(vibrateIntervalRef.current);
        const doVibrate = () => {
          Haptics.vibrate({ duration: 800 }).catch(() => {
            if (typeof window !== "undefined" && "vibrate" in navigator)
              navigator.vibrate([800, 400]);
          });
        };
        doVibrate();
        vibrateIntervalRef.current = setInterval(doVibrate, 1200);
        if (settings.soundAlert) alarmRef.current.start();
        if (!gpsAutoStartedRef.current) {
          gpsAutoStartedRef.current = true;
          setTimeout(() => startGpsTracking(), 500);
        }
        sendTsunamiNotification(true);
      } else {
        if (typeof window !== "undefined") localStorage.removeItem("aegisRealTsunami");
        setTsunamiAlert(false);
        alarmRef.current.stop();
        if (vibrateIntervalRef.current) {
          clearInterval(vibrateIntervalRef.current);
          vibrateIntervalRef.current = null;
        }
        if ("vibrate" in navigator) navigator.vibrate(0);
        sendTsunamiNotification(false);
        gpsAutoStartedRef.current = false;
        setActiveUsers({}); // Bersihkan user aktif saat simulasi berhenti
      }
    }
    if (event.type === "PING") {
      const ev = event as any;
      if (ev.toId === terminalId || (!ev.toId && ev.fromId !== terminalId)) {
        if (ev.role) {
          // Admin ping — only show popup during tsunami/emergency
          if (tsunamiAlertRef.current && !isAdminURL) {
            setAdminPing({
              fromName: ev.fromName,
              role: ev.role,
              fromId: ev.fromId,
            });
          }
        } else {
          setHasFamilyPing(true);
        }
      }
    }
    // Track lokasi user aktif untuk peta admin
    if (event.type === "LOCATION_UPDATE") {
      const ev = event as any;
      if (ev.id && ev.lat && ev.lng) {
        setActiveUsers((prev) => ({
          ...prev,
          [ev.id]: {
            id: ev.id,
            name: ev.name || ev.id,
            deviceModel: ev.deviceModel || "Unknown Device",
            lat: ev.lat,
            lng: ev.lng,
            battery: ev.battery,
            ts: Date.now(),
            isOffline: false,
          },
        }));
      }
    }
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const adminPingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  useEffect(() => {
    if (adminPing && !isAdminURL) {
      const doVibrate = () => {
        Haptics.vibrate({ duration: 400 }).catch(() => {
          if ("vibrate" in navigator) navigator.vibrate([400, 200, 400]);
        });
      };
      doVibrate();
      adminPingIntervalRef.current = setInterval(doVibrate, 1500);
      return () => {
        if (adminPingIntervalRef.current)
          clearInterval(adminPingIntervalRef.current);
      };
    }
  }, [adminPing]);

  // ── Cleanup offline users (set isOffline = true) ──
  useEffect(() => {
    if (!isAdminURL) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveUsers(prev => {
        let changed = false;
        const next = { ...prev };
        for (const id in next) {
          if (!next[id].isOffline && now - next[id].ts > 60000) {
            next[id] = { ...next[id], isOffline: true };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [isAdminURL]);

  useEffect(() => {
    // Ambil info device (brand + model) untuk admin
    import("@capacitor/device").then(({ Device }) => {
      Device.getInfo()
        .then((info) => {
          (window as any).__DEVICE_MODEL__ =
            `${info.manufacturer} ${info.model}`;
        })
        .catch(() => {});
    });

    // 1. Izin notifikasi Capacitor
    requestNotifPermission();
    // 2. Web Push agar notif masuk saat app ditutup
    registerWebPush().catch(() => {});
    // 3. Minta izin GPS (foreground + background) sebelum mulai tracking
    Geolocation.requestPermissions().catch(() => {});
    // 4. AUTO-START GPS saat app dibuka (user mode selalu, tanpa syarat registrasi)
    if (!isAdminURL) {
      setTimeout(() => startGpsTracking(), 600);
    }
    // 4b. Load custom shelters dari Supabase & Road Network
    loadRoadNetwork();
    aegisApi.fetchCustomShelters().then(data => {
      data.forEach(s => addCustomShelter(s as any));
    });
    // 4c. Load active users dari Supabase jika admin
    if (isAdminURL) {
      aegisApi.fetchActiveUsers().then(users => {
        const initialUsers: Record<string, any> = {};
        users.forEach(u => { initialUsers[u.id] = u; });
        setActiveUsers(initialUsers);
      });
    }
    // 5. Cek status tsunami saat app dibuka
    const fetchTsunamiState = async (retries = 3, delay = 1000) => {
      const { active, ok } = await aegisApi.getTsunami();
      if (ok) {
        if (active) {
          if (typeof window !== "undefined") localStorage.setItem("aegisRealTsunami", "true");
          setTsunamiAlert(true);
          setActivePage("navigate");
        } else {
          if (typeof window !== "undefined" && localStorage.getItem("aegisRealTsunami") === "true") {
            localStorage.removeItem("aegisRealTsunami");
            setTsunamiAlert(false);
            if (!isAdminURL) setActivePage("status");
          }
        }
      } else {
        if (retries > 0) {
          setTimeout(() => fetchTsunamiState(retries - 1, delay * 2), delay);
        } else {
          console.warn("Gagal mengecek status tsunami dari server, mempertahankan status lokal.");
        }
      }
    };
    fetchTsunamiState();
    // 6. Minta agar tidak dimatikan oleh battery optimizer (Android)
    try {
      const { App: CapApp } = require('@capacitor/app');
      CapApp.addListener('appStateChange', () => {});
    } catch {}
  }, []);

  // â”€â”€ PUBLIC USER layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Pages use fixed inset-0 z-[1800]; nav uses fixed z-[1900]
  if (userRole === "user") {
    return (
      <div
        className="fixed inset-0 bg-[#080e1a] text-slate-300 font-sans"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Pages */}
        <AnimatePresence mode="wait">
          {activePage === "status" && (
            <StatusPage
              key="status"
              onNavigate={(p) => setActivePage(p)}
              userLocation={
                userPosition ? "Palu, Sulawesi Tengah" : "Mendeteksi lokasi..."
              }
              userName={userName}
              onRequestGps={!gpsTracking ? startGpsTracking : undefined}
              gpsTracking={gpsTracking}
            />
          )}
          {activePage === "navigate" && (
            <NavigatePage
              key="navigate"
              routes={routes}
              selectedRoute={selectedRoute}
              tsunamiAlert={tsunamiAlert}
              userPosition={userPosition}
              onBack={() => setActivePage("status")}
              adminPing={adminPing}
              onAdminPingDismiss={() => setAdminPing(null)}
              onStartGps={!gpsTracking ? startGpsTracking : undefined}
            />
          )}
          {activePage === "family" && (
            <FamilyPage
              key="family"
              onBack={() => setActivePage("status")}
              onPingClear={() => setHasFamilyPing(false)}
            />
          )}
          {activePage === "guides" && (
            <GuidesPage
              key="guides"
              onNavigateMap={() => setActivePage("navigate")}
              onBack={() => setActivePage("status")}
            />
          )}
        </AnimatePresence>
        {/* HISTORY PAGE â€” "TACTICAL ARCHIVE"                        */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <AnimatePresence>
          {activePage === "history" && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[1800] flex flex-col"
              style={{ background: "#080e1a" }}
            >
              {/* AEGIS top bar */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 shrink-0"
                style={{ background: "#0a1020" }}
              >
                <button
                  onClick={() => setActivePage("map")}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-wide">
                    KEMBALI
                  </span>
                </button>
                <span className="text-sm font-black text-white tracking-widest">
                  TACTICAL ARCHIVE
                </span>
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              {/* Title */}
              <div className="px-5 pt-5 pb-3 shrink-0">
                <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">
                  Tactical Archive
                </p>
                <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                  EVACUATION
                  <br />
                  HISTORY
                </h2>
              </div>

              {/* Avg Response card + Visual Gauge */}
              <div className="px-5 pb-4 shrink-0">
                <div
                  className="p-4 rounded-2xl border border-slate-700/40"
                  style={{ background: "#0f1a2e" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Avg. Response Time
                      </p>
                      {avgResponse ? (
                        <p className="text-4xl font-black text-white">
                          {avgResponse}
                          <span className="text-xl text-slate-400 font-bold ml-1">
                            m
                          </span>
                        </p>
                      ) : (
                        <p className="text-xl font-black text-slate-600">
                          â€” m
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  {/* Visual Gauge - KPI performance bar */}
                  {avgResponse &&
                    (() => {
                      const val = parseFloat(avgResponse);
                      const target = 30; // 30 menit = target ideal
                      const pct = Math.min((val / target) * 100, 100);
                      const color =
                        val <= 20
                          ? "#22c55e"
                          : val <= 35
                            ? "#f59e0b"
                            : "#ef4444";
                      const label =
                        val <= 20
                          ? "EXCELLENT"
                          : val <= 35
                            ? "GOOD"
                            : "NEEDS IMPROVEMENT";
                      return (
                        <div>
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1.5">
                            <span className="text-slate-600">
                              Performance KPI
                            </span>
                            <span style={{ color }}>{label}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-600 mt-1">
                            <span>0m</span>
                            <span className="text-slate-500">
                              Target â‰¤ {target}m
                            </span>
                            <span>{target}m+</span>
                          </div>
                          {/* Trend bars â€” last 5 logs */}
                          {evacuationHistory.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/60">
                              <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5 font-bold">
                                Last {Math.min(evacuationHistory.length, 6)}{" "}
                                Sessions
                              </p>
                              <div className="flex items-end gap-1 h-8">
                                {evacuationHistory
                                  .slice(0, 6)
                                  .reverse()
                                  .map((r, i) => {
                                    const t = r.walkingTime ?? 0;
                                    const h = Math.max(
                                      Math.min((t / 60) * 100, 100),
                                      10,
                                    );
                                    const c =
                                      t <= 20
                                        ? "#22c55e"
                                        : t <= 35
                                          ? "#f59e0b"
                                          : "#ef4444";
                                    return (
                                      <div
                                        key={i}
                                        className="flex-1 rounded-sm transition-all"
                                        style={{
                                          height: `${h}%`,
                                          background: c,
                                          opacity: 0.7,
                                        }}
                                      />
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  {!avgResponse && (
                    <p className="text-[10px] text-slate-600">
                      Jalankan simulasi untuk melihat statistik performa.
                    </p>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="px-5 pb-3 flex gap-2 shrink-0 overflow-x-auto">
                {[
                  { id: "all" as HistoryFilter, label: "âˆž ALL LOGS" },
                  { id: "real" as HistoryFilter, label: "â–² REAL ALERTS" },
                  {
                    id: "simulation" as HistoryFilter,
                    label: "â—ˆ SIMULATION",
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                    ${historyFilter === tab.id ? "bg-indigo-600 text-white" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Log list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24">
                {evacuationHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800/40 flex items-center justify-center">
                      <History className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 font-semibold">
                        Tidak ada log
                      </p>
                      <p className="text-xs text-slate-600 mt-1 max-w-[240px]">
                        Jalankan simulasi atau klik peta untuk mencatat riwayat
                        evakuasi.
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePage("map")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                      Buka Peta
                    </button>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <p className="text-slate-500 text-sm">
                      Tidak ada log untuk filter ini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((record, idx) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-slate-800/60 overflow-hidden"
                        style={{ background: "#0c1525" }}
                      >
                        {/* Card header */}
                        <div className="px-4 pt-4 pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0
                            ${
                              record.type === "real"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            }`}
                            >
                              {record.type === "real"
                                ? "Real Alert"
                                : "Simulation"}
                            </span>
                            <span className="text-[10px] text-slate-600 text-right">
                              {fmtDate(record.timestamp)}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-white leading-tight mb-1">
                            {record.eventName}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Navigation2 className="w-3 h-3 shrink-0" />
                            To {record.routeName} (Primary Shelter)
                          </p>
                        </div>

                        {/* Stats + status */}
                        <div className="px-4 pb-3 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest
                          ${record.type === "simulation" ? "text-indigo-500/50" : "text-red-500/60"}`}
                          >
                            {record.type === "simulation"
                              ? "Simulation Complete"
                              : "Alert Dismissed"}
                          </span>
                          <div className="flex items-center gap-5">
                            <div className="text-right">
                              <p className="text-xs font-black text-white">
                                {record.walkingTime != null
                                  ? `${record.walkingTime}m`
                                  : "â€”"}
                              </p>
                              <p className="text-[9px] text-slate-600 uppercase tracking-wider">
                                TIME
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white">
                                {record.distance != null
                                  ? `${record.distance.toFixed(1)}km`
                                  : "â€”"}
                              </p>
                              <p className="text-[9px] text-slate-600 uppercase tracking-wider">
                                DIST
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mini route map */}
                        <div className="px-4 pb-4">
                          <MiniRouteMap type={record.type} seed={idx} />
                        </div>
                      </div>
                    ))}

                    {/* Clear all */}
                    <button
                      onClick={() => {
                        if (confirm("Hapus semua riwayat evakuasi?")) {
                          setEvacuationHistory([]);
                          localStorage.removeItem("evacuationHistory");
                        }
                      }}
                      className="w-full py-3 border border-red-900/40 text-red-500/60 rounded-xl text-xs font-bold hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Riwayat
                    </button>
                    <div className="h-4" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* USER BOTTOM NAV â€” fixed z-[1900] sits on top of pages */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-[1900] flex items-center gap-4 px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap hide-scrollbar border-t bg-[#0a1020]/98 border-slate-800/60 backdrop-blur-xl"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "60px",
          }}
        >
          {[
            { page: "status" as ActivePage, Icon: Home, label: "STATUS" },
            {
              page: "navigate" as ActivePage,
              Icon: Navigation2,
              label: "NAVIGATE",
            },
            { page: "history" as ActivePage, Icon: History, label: "HISTORY" },
            { page: "family" as ActivePage, Icon: Users, label: "FAMILY" },
            { page: "guides" as ActivePage, Icon: BookOpen, label: "GUIDES" },
          ].map(({ page, Icon, label }) => {
            const isAlert = page === "navigate" && tsunamiAlert;
            const isFamilyAlert = page === "family" && hasFamilyPing;
            const isActive = activePage === page;
            return (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`flex flex-col items-center justify-center shrink-0 min-w-[60px] gap-1 py-2 px-4 transition-colors ${isAlert ? "text-red-400" : isActive ? "text-emerald-400" : "text-slate-600 active:text-slate-400"}`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${isAlert ? "animate-pulse" : ""}`}
                  />
                  {isAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-ping block" />
                  )}
                  {isFamilyAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 block border-2 border-[#0a1020]" />
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-wider">
                  {label}
                </span>
              </button>
            );
          })}
          {/* Logout only shown when accessed via admin URL */}
          {isAdminURL ? (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-2 px-4 text-slate-700 active:text-red-400 transition-colors"
            >
              <Lock className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wider">
                KELUAR
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex flex-col items-center gap-1 py-2 px-4 text-slate-600 active:text-indigo-400 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wider">
                PROFIL
              </span>
            </button>
          )}
        </nav>

        {/* First Visit Modal â€” shown when no name stored yet */}
        {/* â•â• ARRIVAL MODAL â€” full-screen, muncul ketika simulasi selesai (dalam radius) â•â• */}
        <AnimatePresence>
          {arrivalSummary && (
            <motion.div
              key="arrival-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2200] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 22, stiffness: 280 }}
                className="w-full max-w-sm relative"
              >
                {/* Card */}
                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#071410] shadow-[0_20px_80px_rgba(34,197,94,0.35)]">
                  {/* Shimmer sweep */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-emerald-400/8 to-transparent animate-[shimmer_3s_infinite] -skew-x-12" />
                  </div>

                  {/* Top accent bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-700" />

                  <div className="p-6">
                    {/* Icon + pulse */}
                    <div className="flex justify-center mb-5">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400/60 animate-ping" />
                        <div
                          className="absolute inset-0 rounded-3xl border border-emerald-400/30 animate-ping"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-center text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase mb-1">
                      Navigasi Selesai
                    </p>
                    <h2 className="text-center text-2xl font-black text-white mb-1 leading-tight">
                      ANDA TELAH TIBA
                    </h2>
                    <p className="text-center text-sm text-emerald-300/70 mb-6">
                      di titik evakuasi aman
                    </p>

                    {/* Shelter name */}
                    <div className="mb-5 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/40">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider mb-0.5">
                            Lokasi Evakuasi
                          </p>
                          <p className="text-white font-bold text-sm leading-snug">
                            {arrivalSummary.shelter.name}
                          </p>
                          <p className="text-[11px] text-emerald-300/50 mt-0.5">
                            Kapasitas{" "}
                            {arrivalSummary.shelter.capacity.toLocaleString(
                              "id-ID",
                            )}{" "}
                            orang
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                          Jarak Tempuh
                        </p>
                        <p className="text-xl font-black text-white">
                          {arrivalSummary.distanceKm > 0
                            ? arrivalSummary.distanceKm.toFixed(2)
                            : "â€”"}
                          <span className="text-xs font-bold text-slate-400 ml-1">
                            km
                          </span>
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                          Waktu Estimasi
                        </p>
                        <p className="text-xl font-black text-white">
                          {arrivalSummary.walkingMin > 0
                            ? arrivalSummary.walkingMin
                            : "â€”"}
                          <span className="text-xs font-bold text-slate-400 ml-1">
                            min
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Radius info */}
                    <p className="text-center text-[10px] text-slate-500 mb-5 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      GPS berhenti otomatis Â· dalam radius{" "}
                      {shelters.find((s) => s.id === arrivedShelterId)
                        ?.radiusMeters ?? ARRIVAL_RADIUS_METERS}
                      m
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => {
                          setArrivalSummary(null);
                          setArrivedShelterId(null);
                          setActivePage("history");
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        Lihat Riwayat Evakuasi
                      </button>
                      <button
                        onClick={() => {
                          setArrivalSummary(null);
                          setArrivedShelterId(null);
                          setUserPosition(null);
                          setRoutes([]);
                        }}
                        className="w-full py-3 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-2xl font-bold text-sm tracking-wide transition-colors"
                      >
                        Kembali ke Peta
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFirstVisit && (
            <FirstVisitModal key="first-visit" onComplete={handleFirstVisit} />
          )}
          {showEditProfile && (
            <FirstVisitModal
              key="edit-profile"
              isEditing
              onComplete={handleEditProfile}
              onCancel={() => setShowEditProfile(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // â”€â”€ ADMIN layout (full tactical dashboard) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div
      className="w-full h-full bg-[#0b1120] text-slate-300 font-sans overflow-hidden flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* â•â•â• MOBILE HEADER â€” 2-row compact layout for all screen sizes â•â•â• */}
      <header
        className={`md:hidden shrink-0 z-50 relative transition-colors duration-500 backdrop-blur-md
        ${tsunamiAlert ? "bg-red-950/95 border-b border-red-900/50" : "bg-[#0a1020]/95 border-b border-slate-800/60"}`}
      >
        {/* Row 1: Brand + SIMULASI button */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tsunamiAlert ? "bg-red-500/20 border border-red-500/30" : "bg-indigo-500/20 border border-indigo-500/30"}`}
            >
              <Shield
                className={`w-4 h-4 ${tsunamiAlert ? "text-red-400" : "text-indigo-400"}`}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-black text-sm tracking-widest leading-none">
                AEGIS RESPONSE
              </h1>
              <p className="text-[9px] text-slate-600 font-mono mt-0.5 truncate">
                Sistem Evakuasi Â· {terminalId}
              </p>
            </div>
          </div>
          {/* SIMULASI button */}
          <button
            onClick={() =>
              tsunamiAlert
                ? deactivateTsunamiAlert()
                : setShowTsunamiConfirm(true)
            }
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all min-h-0
              ${tsunamiAlert ? "bg-red-500/30 text-red-200 border border-red-500/50" : "bg-red-600 text-white"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${tsunamiAlert ? "bg-red-400 animate-pulse" : "bg-red-300"}`}
            />
            {tsunamiAlert ? "STOP SIMULASI" : "SIMULASI"}
          </button>
        </div>

        {/* Row 2: Status chips */}
        <div className="flex items-center gap-2 px-3 pb-2 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border
            ${tsunamiAlert ? "bg-red-900/50 border-red-700/50 text-red-300" : "bg-emerald-900/30 border-emerald-700/30 text-emerald-400"}`}
          >
            <Radio
              className={`w-2.5 h-2.5 ${tsunamiAlert ? "animate-pulse" : ""}`}
            />
            <span>SENSOR AKTIF</span>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border
            ${gpsTracking ? "bg-indigo-900/50 border-indigo-700/50 text-indigo-300" : "bg-slate-800/50 border-slate-700/50 text-slate-500"}`}
          >
            <Satellite
              className={`w-2.5 h-2.5 ${gpsTracking ? "animate-pulse" : ""}`}
            />
            <span>{gpsTracking ? "GPS AKTIF" : "GPS OFFLINE"}</span>
          </div>
          {/* GPS accuracy badge */}
          {gpsAccuracy !== null && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border
              ${
                gpsAccuracy <= 20
                  ? "bg-emerald-900/30 border-emerald-700/30 text-emerald-400"
                  : gpsAccuracy <= 50
                    ? "bg-amber-900/30 border-amber-700/30 text-amber-400"
                    : "bg-red-900/30 border-red-700/30 text-red-400"
              }`}
            >
              <Crosshair className="w-2.5 h-2.5" />
              <span>Â±{Math.round(gpsAccuracy)}m</span>
            </div>
          )}
        </div>
      </header>

      {/* â•â•â• DESKTOP HEADER â•â•â• */}
      <header
        className={`hidden md:flex h-[60px] shrink-0 border-b items-center justify-between px-6 z-50 relative transition-colors duration-500
        ${tsunamiAlert ? "bg-red-950 border-red-900/50" : "bg-[#0a1020] border-slate-800/60"}`}
      >
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${tsunamiAlert ? "bg-red-500/20 border border-red-500/30" : "bg-indigo-500/20 border border-indigo-500/30"}`}
          >
            <Shield
              className={`w-4 h-4 ${tsunamiAlert ? "text-red-400" : "text-indigo-400"}`}
            />
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-widest leading-none">
              AEGIS RESPONSE
            </h1>
            <p className="text-[9px] text-slate-600 font-mono">
              TES SKRIPSI Â· Kota Palu
            </p>
          </div>
        </div>
        {/* Center: status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" title="Sensor Seismik">
            <div
              className={`p-1.5 rounded-lg ${tsunamiAlert ? "bg-red-500/20 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${tsunamiAlert ? "animate-pulse" : ""}`}
              />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider leading-none mb-0.5">
                Sensor
              </span>
              <span
                className={`text-[9px] font-bold uppercase leading-none ${tsunamiAlert ? "text-red-400" : "text-emerald-400"}`}
              >
                {tsunamiAlert ? "ALERT" : "Active"}
              </span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          <div className="flex items-center gap-2" title="GPS Satelit">
            <div
              className={`p-1.5 rounded-lg ${gpsTracking ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"}`}
            >
              <Satellite
                className={`w-3.5 h-3.5 ${gpsTracking ? "animate-pulse" : ""}`}
              />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-wider leading-none mb-0.5">
                Sat-Link
              </span>
              <span
                className={`text-[9px] font-bold uppercase leading-none ${gpsTracking ? "text-indigo-400" : "text-slate-500"}`}
              >
                {gpsTracking ? "Tracking" : "Standby"}
              </span>
            </div>
          </div>
          <div className="w-px h-5 bg-slate-800" />
          {/* Terminal ID chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-slate-400 font-bold">
              {terminalId}
            </span>
          </div>
        </div>
        {/* Right: actions + avatar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              tsunamiAlert
                ? deactivateTsunamiAlert()
                : setShowTsunamiConfirm(true)
            }
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all
              ${tsunamiAlert ? "bg-red-500/20 text-red-200 border border-red-500/50" : "bg-red-600 hover:bg-red-500 text-white border border-transparent"}`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${tsunamiAlert ? "animate-pulse text-red-400" : ""}`}
            />
            {tsunamiAlert ? "HENTIKAN SIMULASI" : "SIMULASI TSUNAMI"}
          </button>
          <div
            className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0"
            title="User Profile"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </header>

      {/* â•â•â• MAIN CONTENT â•â•â• */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Tsunami overlay */}
        <div
          className={`absolute inset-0 z-[400] pointer-events-none transition-opacity duration-1000 ${tsunamiAlert ? "bg-red-900/20" : "opacity-0"}`}
        />
        <div
          className={`absolute inset-0 z-[400] pointer-events-none border-4 transition-colors duration-500 ${tsunamiAlert ? "border-red-500/50 animate-[borderFlash_2s_infinite]" : "border-transparent"}`}
        />

        {/* â•â•â• DESKTOP LEFT SIDEBAR â•â•â• */}
        <AnimatePresence initial={false}>
          {showLeftSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-[#0b1120] border-r border-slate-800 flex flex-col z-40 relative hidden lg:flex shrink-0 overflow-hidden whitespace-nowrap"
            >
              <div className="w-[220px]">
                <div className="p-6 pb-2">
                  <h3 className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-1">
                    Navigation
                  </h3>
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">
                    System Active
                  </p>
                </div>
                <nav className="flex-1 mt-4">
                  {[
                    { page: "map" as ActivePage, Icon: MapIcon, label: "MAP" },
                    {
                      page: "settings" as ActivePage,
                      Icon: SlidersHorizontal,
                      label: "SETTINGS",
                    },
                  ].map(({ page, Icon, label }) => (
                    <button
                      key={page}
                      onClick={() => setActivePage(page)}
                      className={`w-full flex items-center gap-3 px-6 py-3 transition-colors relative
                        ${activePage === page ? "bg-[#1e293b]/50 border-r-2 border-indigo-500 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide">
                        {label}
                      </span>
                      {page === "history" && evacuationHistory.length > 0 && (
                        <span className="ml-auto mr-1 text-[9px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                          {evacuationHistory.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
                <div className="p-6 mt-auto">
                  <button
                    onClick={() => setShowAddShelter(true)}
                    className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 transition-colors mb-4"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">
                      TAMBAH SHELTER
                    </span>
                  </button>
                  <button
                    onClick={() => setShowShelters(true)}
                    className="flex items-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-wide">
                      SUPPORT / INFO
                    </span>
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* â•â•â• CENTER MAP â•â•â• */}
        <main className="flex-1 relative z-0 bg-[#0b1120]">
          {/* Admin: GPS badges dihapus - admin hanya memantau, tidak navigasi */}

          {/* BMKG OVERLAY */}
          {gempa && !isGempaDismissed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-sm w-[90%] pr-10">
              <button 
                onClick={handleDismissGempa}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">INFO GEMPA BMKG</h3>
                  <span className="text-[10px] font-bold text-slate-400">{gempa.Jam.split(' ')[0]}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate">Mag: {gempa.Magnitude} • Kedalaman: {gempa.Kedalaman}</p>
                <p className="text-[10px] text-slate-400 truncate">{gempa.Wilayah}</p>
                <p className={`text-[10px] font-bold mt-1 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {gempa.Potensi}
                </p>
              </div>
            </div>
          )}

          {/* Mobile floating LIHAT RUTE button */}
          <AnimatePresence>
            {routes.length > 0 && !showPanel && isMobile && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={() => {
                  panelUserClosedRef.current = false;
                  setShowPanel(true);
                }}
                className="md:hidden fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[1800] flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white shadow-[0_4px_24px_rgba(99,102,241,0.6)] border border-indigo-400/30 active:scale-95 transition-transform"
              >
                <ArrowRight className="w-4 h-4" />
                LIHAT RUTE EVAKUASI
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Desktop floating LIHAT RUTE button */}
          <AnimatePresence>
            {routes.length > 0 && !showPanel && !isMobile && (
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={() => {
                  panelUserClosedRef.current = false;
                  setShowPanel(true);
                }}
                className="hidden md:flex absolute bottom-6 right-6 z-[600] items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_24px_rgba(99,102,241,0.5)] border border-indigo-400/30 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                LIHAT RUTE EVAKUASI
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Admin: Desktop GPS controls dihapus - admin hanya memantau */}

            {/* Compass overlay */}
            <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => {
                setViewport(v => ({ ...v, bearing: 0 }));
                setAdminMapBearing(0);
              }}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 shadow-lg"
                style={{ transform: `rotate(${-adminMapBearing}deg)`, transition: 'transform 0.1s' }}
              >
                <div style={{width: 20, height: 20, borderRadius: '50%', border: '2px solid red', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>N</div>
              </button>
            </div>

          {/* Map â€” rotation enabled via leaflet-rotate (2-finger mobile, Shift+drag desktop) */}
          <Map
            ref={adminMapRef}
            viewport={viewport}
            onViewportChange={(v) => {
              setViewport(v);
              setAdminMapBearing(v.bearing);
            }}
          >
            {/* BMKG GEMPA TERKINI (Epicenter & Radius) */}
            {gempa && !isNaN(gempa.lat) && !isNaN(gempa.lng) && (
              <>
                <MapMarker longitude={gempa.lng} latitude={gempa.lat}>
                  <MarkerContent>
                    <div style={{
                      width: 40, height: 40, background: 'rgba(239, 68, 68, 0.2)', border: '2px solid #ef4444',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }}>
                      <div style={{width: 12, height: 12, background: '#ef4444', borderRadius: '50%'}}></div>
                    </div>
                  </MarkerContent>
                </MapMarker>
                
                {/* Simulated danger radius (e.g. 100km from epicenter if Tsunami potential) */}
                {gempa.Potensi.toLowerCase().includes('tsunami') && (
                  <MapGeoJSON
                    data={createCirclePolygon(gempa.lat, gempa.lng, 100) as any}
                    fillPaint={{ 'fill-color': '#ef4444', 'fill-opacity': 0.15 }}
                    linePaint={{ 'line-color': '#ef4444', 'line-width': 2 }}
                  />
                )}
              </>
            )}

            {/* Hazard zones */}
            {settings.showHazardZones &&
              hazardZones.map((zone, i) => (
                <MapGeoJSON 
                  key={`hazard-${i}`}
                  data={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'Polygon',
                      coordinates: [zone.coords.map(c => [c[1], c[0]])] // [lat, lng] to [lng, lat]
                    }
                  }}
                  fillPaint={{ 'fill-color': tsunamiAlert ? '#ff0000' : '#ef4444', 'fill-opacity': tsunamiAlert ? 0.35 : 0.15 }}
                  linePaint={{ 'line-color': tsunamiAlert ? '#ff0000' : '#ef4444', 'line-width': tsunamiAlert ? 3 : 1 }}
                />
              ))}

            {/* Temporary Marker for Add Shelter Mode */}
            {((showAddShelter || pickingLocationMode) && newShelter.lat && newShelter.lng) && !isNaN(parseFloat(newShelter.lat)) && (
              <MapMarker
                longitude={parseFloat(newShelter.lng)}
                latitude={parseFloat(newShelter.lat)}
                draggable={true}
                onDragEnd={(e) => {
                  setNewShelter(prev => ({ ...prev, lat: String(e.lat), lng: String(e.lng) }));
                  handleReverseGeocode(e.lat, e.lng);
                }}
              >
                <MarkerContent>
                  <div className="w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-bounce">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </MarkerContent>
              </MapMarker>
            )}

            {/* Shelters */}
            {shelters.map((shelter) => (
              <MapMarker
                key={shelter.id}
                longitude={shelter.lng}
                latitude={shelter.lat}
              >
                <MarkerContent>
                  <div style={{
                    width:30,height:30,background:'#334155',border:'2.5px solid #fff',borderRadius:'50%',
                    display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 12px rgba(0,0,0,0.5)',
                    fontSize:13,lineHeight:1
                  }}>🏠</div>
                </MarkerContent>
              </MapMarker>
            ))}

            {/* ── LOKASI USER AKTIF — hanya tampil saat simulasi ── */}
            {tsunamiAlert &&
              Object.values(activeUsers).map((u) => (
                <MapMarker
                  key={`user-${u.id}`}
                  longitude={u.lng}
                  latitude={u.lat}
                >
                  <MarkerContent>
                    <div style={{
                      background: u.isOffline ? '#64748b' : '#f59e0b', border: '2.5px solid #fff', borderRadius: '50%',
                      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 12px ${u.isOffline ? 'rgba(100,116,139,0.8)' : 'rgba(245,158,11,0.8)'}`, fontSize: 11, cursor: 'pointer',
                      opacity: u.isOffline ? 0.7 : 1
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!tsunamiAlert) { alert("Ping hanya bisa dilakukan saat mode darurat/simulasi aktif!"); return; }
                      if (confirm(`Kirim ping ke ${u.name}?`)) {
                        aegisApi.adminPing(terminalId, userName || "Admin", u.id, adminRole)
                          .then(() => alert(`Ping terkirim ke ${u.name}!`))
                          .catch(() => alert(`Gagal mengirim ping ke ${u.name}`));
                      }
                    }}>👤</div>
                  </MarkerContent>
                </MapMarker>
              ))}

            {!isAdminURL &&
              routes.map((route, i) => {
                const isSelected = i === selectedRoute;
                return (
                  <MapRoute
                    key={`road-${i}`}
                    coordinates={route.coordinates.map(c => [c[0], c[1]])}
                    color={routeColors[i]}
                    width={isSelected ? 3 : 2}
                    opacity={isSelected ? 0.45 : 0.2}
                    dashArray={isSelected ? undefined : [8, 6]}
                  />
                );
              })}
          </Map>

          {/* â•â•â• MOBILE BOTTOM SHEET â•â•â• */}
          <AnimatePresence>
            {showPanel && routes.length > 0 && isMobile && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed bottom-[60px] left-0 right-0 z-[500] max-h-[65vh] flex flex-col bg-slate-900 rounded-t-2xl border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.7)]"
              >
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>
                <div className="px-4 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">
                        Rute Evakuasi
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        {routes.length} rute â€¢{" "}
                        <span className="text-indigo-400 italic">
                          {settings.algorithm.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPanel(false);
                      panelUserClosedRef.current = true;
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-red-900/50 flex items-center justify-center text-slate-300 hover:text-white active:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 custom-scrollbar">
                  {routes.map((route, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRoute(i);
                        if (route.coordinates.length > 0) {
                          const ep =
                            route.coordinates[route.coordinates.length - 1];
                          setFlyToPos([ep[0], ep[1]]);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3
                        ${
                          selectedRoute === i
                            ? "bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                            : "bg-slate-800 border-slate-700 active:bg-slate-700 opacity-60"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${routeBadgeColors[i] ?? "bg-slate-600"} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white leading-snug truncate">
                          {route.shelterName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {route.totalDistance === Infinity
                              ? "N/A"
                              : `${route.totalDistance.toFixed(2)} km`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {route.totalDistance === Infinity
                              ? "N/A"
                              : `~${route.walkingTime} menit`}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 shrink-0 ${selectedRoute === i ? "text-indigo-400" : "text-slate-600"}`}
                      />
                    </button>
                  ))}
                  <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex gap-3">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Rute dihitung menggunakan{" "}
                      <span className="text-indigo-300 italic">
                        Algoritma{" "}
                        {settings.algorithm.charAt(0).toUpperCase() +
                          settings.algorithm.slice(1)}
                      </span>{" "}
                      berdasarkan jaringan jalan dan jarak{" "}
                      <span className="text-indigo-300 italic">Haversine</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPanel(false);
                      panelUserClosedRef.current = true;
                    }}
                    className="w-full py-3.5 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm font-bold tracking-wide transition-colors touch-manipulation"
                  >
                    TUTUP PANEL
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* â•â•â• DESKTOP RIGHT SIDEBAR (Routes) â•â•â• */}
        <AnimatePresence>
          {showPanel && routes.length > 0 && !isMobile && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full md:w-[320px] h-full absolute md:relative right-0 bg-[#0f172a] border-l border-slate-800 flex flex-col z-50 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Rute Evakuasi
                  </h2>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                  NEAREST SAFE ZONES
                </p>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 flex flex-col gap-3">
                {routes.map((route, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedRoute(i);
                      if (route.coordinates.length > 0) {
                        const ep =
                          route.coordinates[route.coordinates.length - 1];
                        setFlyToPos([ep[0], ep[1]]);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative group
                      ${
                        selectedRoute === i
                          ? "bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                          : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 opacity-60"
                      }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded
                        ${selectedRoute === i ? (i === 0 ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700/50 text-slate-300") : "text-slate-500"}`}
                      >
                        {i === 0 ? "FASTEST" : "ALTERNATIVE"}
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
                        {route.totalDistance === Infinity
                          ? "N/A"
                          : `${route.totalDistance.toFixed(2)} km`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {route.totalDistance === Infinity
                          ? "N/A"
                          : `~${route.walkingTime} min`}
                      </span>
                    </div>
                    {selectedRoute === i && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="w-full py-2 bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold">
                          Go to Point <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-slate-800 bg-[#0b1120]/50">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> PATHFINDING LOGIC
                </h4>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Distance Algo</span>
                    <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                      Haversine
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Route Optimization</span>
                    <span className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                      {settings.algorithm.charAt(0).toUpperCase() +
                        settings.algorithm.slice(1)}
                    </span>
                  </div>
                </div>
                {!gpsTracking && (
                  <button
                    onClick={() => {
                      setUserPosition(null);
                      setRoutes([]);
                      setShowPanel(false);
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

      {/* â•â•â• BOTTOM NAV â€” Role-based â•â•â• */}
      {userRole === "admin" ? (
        /* â”€â”€ ADMIN NAV: MAP, HISTORY, SENSORS, SETTINGS + logout â”€â”€ */
        <nav
          className={`md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around border-t z-[1900] transition-colors duration-500 backdrop-blur-md
          ${tsunamiAlert ? "bg-red-950/95 border-red-900/50" : "bg-[#0f172a]/95 border-slate-800/50"}`}
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "60px",
          }}
        >
          {[
            { page: "map" as ActivePage, Icon: MapIcon, label: "MAP" },
            { page: "sensors" as ActivePage, Icon: Radio, label: "SENSORS" },
            {
              page: "settings" as ActivePage,
              Icon: SlidersHorizontal,
              label: "SETTINGS",
            },
          ].map(({ page, Icon, label }) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${
                activePage === page
                  ? tsunamiAlert
                    ? "text-red-400"
                    : "text-indigo-400"
                  : "text-slate-600 active:text-slate-400"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {page === "history" && evacuationHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                    {evacuationHistory.length > 9
                      ? "9+"
                      : evacuationHistory.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-wider">
                {label}
              </span>
            </button>
          ))}
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-2 px-4 text-slate-700 active:text-red-400 transition-colors"
          >
            <Lock className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
          </button>
        </nav>
      ) : (
        /* â”€â”€ USER NAV: STATUS, NAVIGATE, FAMILY, GUIDES + logout â”€â”€ */
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around border-t z-[1900] backdrop-blur-md bg-[#0f172a]/95 border-slate-800/50"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "60px",
          }}
        >
          {[
            { page: "status" as ActivePage, Icon: Home, label: "STATUS" },
            {
              page: "navigate" as ActivePage,
              Icon: Navigation2,
              label: "NAVIGATE",
            },
            { page: "history" as ActivePage, Icon: History, label: "HISTORY" },
            { page: "family" as ActivePage, Icon: Users, label: "FAMILY" },
            { page: "guides" as ActivePage, Icon: BookOpen, label: "GUIDES" },
          ].map(({ page, Icon, label }) => {
            const isAlert = page === "navigate" && tsunamiAlert;
            const isActive = activePage === page;
            return (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`flex flex-col items-center gap-1 py-2 px-4 transition-colors ${isAlert ? "text-red-400" : isActive ? "text-emerald-400" : "text-slate-600 active:text-slate-400"}`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${isAlert ? "animate-pulse" : ""}`}
                  />
                  {isAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-ping block" />
                  )}
                  {page === "family" && hasFamilyPing && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse block shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-wider">
                  {label}
                </span>
              </button>
            );
          })}
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-2 px-4 text-slate-700 active:text-red-400 transition-colors"
          >
            <Lock className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
          </button>
        </nav>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* MODALS                                                    */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {/* Tsunami confirm */}
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
              <h2 className="text-2xl font-bold text-white mb-2">
                Simulasi Tsunami?
              </h2>
              <p className="text-sm text-slate-400 mb-8">
                Sistem akan membunyikan sirine peringatan dini dan menyiagakan
                rute evakuasi darurat.
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

      {/* Shelter list */}
      <AnimatePresence>
        {showShelters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" /> Daftar Shelter
                </h2>
                <button
                  onClick={() => setShowShelters(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Pilih lokasi untuk melihat titik evakuasi aman di peta.
              </p>
              <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
                {shelters.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">
                          {s.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFlyToPos([s.lat, s.lng]);
                        setShowShelters(false);
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

      {/* GPS Error */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed ${isMobile ? "top-20 left-4 right-4" : "top-20 right-4"} z-[2000]`}
          >
            <div className="pl-4 pr-2 py-3 rounded-xl bg-amber-600 border border-amber-500 shadow-xl flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              <span className="text-xs text-white font-bold flex-1">
                {gpsError}
              </span>
              <button
                onClick={() => {
                  setGpsError(null);
                  if (isMobile) setTimeout(() => startGpsTracking(), 500);
                }}
                className="ml-1 px-2 py-1 bg-amber-500/50 hover:bg-amber-500 rounded-lg text-white text-xs font-bold shrink-0 transition-colors"
              >
                {isMobile ? "COBA LAGI" : <X className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculating overlay */}
      {isCalculating && isMobile && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="px-6 py-4 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3 shadow-2xl">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white font-bold">
              Menghitung rute...
            </span>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <AnimatePresence>
        {activePage === "settings" && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[1800] flex flex-col"
            style={{ background: "#080e1a" }}
          >
            {/* AEGIS top bar */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 shrink-0"
              style={{ background: "#0a1020" }}
            >
              <button
                onClick={() => setActivePage("map")}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-xs font-bold tracking-wide">KEMBALI</span>
              </button>
              <span className="text-sm font-black text-white tracking-widest">
                SYSTEM CONFIG
              </span>
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {/* Title */}
            <div className="px-5 pt-5 pb-1 shrink-0">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                SYSTEM
                <br />
                CONFIGURATION
              </h2>
              <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                Operational Unit: {terminalId} | STATUS:{" "}
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-4 pt-4">
              {/* â”€â”€â”€ CORE PROCESSING â”€â”€â”€ */}
              <section
                className="rounded-2xl border border-slate-800/50 p-4"
                style={{ background: "#0c1525" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Core Processing
                  </h3>
                </div>

                {/* Routing Algorithm */}
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">
                  Routing Algorithm
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    {
                      id: "dijkstra" as const,
                      label: "DIJKSTRA",
                      sub: "Shortest Path First",
                    },
                    {
                      id: "haversine" as const,
                      label: "HAVERSINE",
                      sub: "Spherical Geometry",
                    },
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() =>
                        setSettings((s) => ({ ...s, algorithm: algo.id }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all
                        ${
                          settings.algorithm === algo.id
                            ? "bg-indigo-600/30 border-indigo-500/60 text-white"
                            : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
                        }`}
                    >
                      <p className="text-xs font-black tracking-wide">
                        {algo.label}
                      </p>
                      <p className="text-[10px] mt-0.5 opacity-60">
                        {algo.sub}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Sensor Sensitivity */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                    Sensor Sensitivity
                  </p>
                  <p className="text-xs font-black text-white">
                    {settings.sensorSensitivity}%
                  </p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sensorSensitivity}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      sensorSensitivity: +e.target.value,
                    }))
                  }
                  className="w-full accent-indigo-500 mb-1.5"
                />
                <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                  <span>Low Precision</span>
                  <span>Tactical Grid</span>
                  <span>High Fidelity</span>
                </div>
              </section>

              {/* â”€â”€â”€ DEVICE IDENTITY â”€â”€â”€ */}
              <section
                className="rounded-2xl border border-slate-800/50 p-4"
                style={{ background: "#0c1525" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Device Identity
                  </h3>
                </div>

                <div
                  className="rounded-xl p-4 mb-3 border border-slate-700/30"
                  style={{ background: "#070d1a" }}
                >
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">
                    Terminal ID
                  </p>
                  <p className="text-2xl font-black text-white font-mono tracking-widest">
                    {terminalId}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Encrypted Link Active
                    </span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> UPDATE CREDENTIALS
                </button>
              </section>

              {/* â”€â”€â”€ ALERT PROTOCOLS â”€â”€â”€ */}
              <section
                className="rounded-2xl border border-slate-800/50 p-4"
                style={{ background: "#0c1525" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Alert Protocols
                  </h3>
                </div>

                {[
                  {
                    key: "pushAlerts" as const,
                    label: "Push Alerts",
                    sub: "Real-time threat notifications",
                    Icon: Bell,
                  },
                  {
                    key: "soundAlert" as const,
                    label: "Emergency Sound",
                    sub: "Bypass silent mode for hazards",
                    Icon: Volume2,
                  },
                  {
                    key: "vibrationAlert" as const,
                    label: "Tactile Vibration",
                    sub: "Haptic feedback for proximity",
                    Icon: Vibrate,
                  },
                ].map((item, idx, arr) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <item.Icon className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm text-slate-200 font-semibold">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {item.sub}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSettings((s) => ({
                            ...s,
                            [item.key]: !s[item.key],
                          }));
                          if (item.key === "soundAlert")
                            setAlarmMuted((prev) => !prev);
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key] ? "bg-indigo-600" : "bg-slate-700"}`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[item.key] ? "left-6" : "left-0.5"}`}
                        />
                      </button>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="h-px bg-slate-800/60" />
                    )}
                  </div>
                ))}
              </section>

              {/* â”€â”€â”€ VISUAL INTERFACE â”€â”€â”€ */}
              <section
                className="rounded-2xl border border-slate-800/50 p-4"
                style={{ background: "#0c1525" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <MapIcon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Visual Interface
                  </h3>
                </div>

                {/* Cartography Theme */}
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">
                  Cartography Theme
                </p>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    {
                      id: "standard" as const,
                      label: "Standard",
                      previewBg: "linear-gradient(135deg,#1a3a6e,#2a5298)",
                      iconColor: "text-blue-300",
                      Icon: MapIcon,
                    },
                    {
                      id: "tactical-dark" as const,
                      label: "Tact. Dark",
                      previewBg: "linear-gradient(135deg,#0a0e1a,#111827)",
                      iconColor: "text-slate-300",
                      Icon: MapIcon,
                    },
                    {
                      id: "satellite-hud" as const,
                      label: "Satellite",
                      previewBg: "linear-gradient(135deg,#0e2210,#1a3a1a)",
                      iconColor: "text-emerald-400",
                      Icon: Satellite,
                    },
                  ].map((theme) => {
                    const isActive = settings.cartographyTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            cartographyTheme: theme.id,
                          }))
                        }
                        className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                          isActive
                            ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#0c1525] shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                            : "ring-1 ring-slate-700/50 hover:ring-slate-600"
                        }`}
                      >
                        {/* Preview box */}
                        <div
                          className="h-14 flex items-center justify-center relative"
                          style={{ background: theme.previewBg }}
                        >
                          <theme.Icon
                            className={`w-5 h-5 ${theme.iconColor} ${isActive ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" : "opacity-70"}`}
                          />
                          {/* Checkmark badge */}
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Label */}
                        <div
                          className={`py-1.5 text-center transition-colors ${
                            isActive ? "bg-indigo-600/30" : "bg-[#070c18]"
                          }`}
                        >
                          <p
                            className={`text-[8px] font-bold uppercase tracking-wide leading-tight px-1 ${
                              isActive ? "text-indigo-200" : "text-slate-500"
                            }`}
                          >
                            {theme.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Safe Zone Radius */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                    Safe Zone Radius
                  </p>
                  <p className="text-xs font-black text-indigo-300">
                    {settings.safeZoneRadius.toFixed(1)} KM
                  </p>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={settings.safeZoneRadius}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      safeZoneRadius: +e.target.value,
                    }))
                  }
                  className="w-full accent-indigo-500 mb-2"
                />
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Defines the proximity alert threshold for designated
                  evacuation shelters and secure perimeter points.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`w-4 h-4 ${settings.showHazardZones ? "text-red-400" : "text-slate-600"}`}
                    />
                    <div>
                      <p className="text-sm text-slate-200 font-semibold">
                        Tampilkan Zona Bahaya
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Overlay area berisiko tinggi pada peta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        showHazardZones: !s.showHazardZones,
                      }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.showHazardZones ? "bg-indigo-600" : "bg-slate-700"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.showHazardZones ? "left-6" : "left-0.5"}`}
                    />
                  </button>
                </div>
              </section>

              {/* Info Sistem */}
              <section
                className="rounded-2xl border border-slate-800/50 p-4"
                style={{ background: "#0c1525" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
                    Info Sistem
                  </h3>
                </div>
                <div className="space-y-2">
                  {[
                    ["Versi Aplikasi", "v1.0.0 (Skripsi)"],
                    ["Platform", "React 18 + Vite"],
                    ["Routing Engine", "Leaflet + OSM"],
                    ["Jarak Hitung", "Haversine Formula"],
                    [
                      "Algoritma Aktif",
                      settings.algorithm === "haversine"
                        ? "Haversine"
                        : "Dijkstra",
                    ],
                    ["Terminal ID", terminalId],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs text-slate-300 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reset */}
              <button
                onClick={() => {
                  if (confirm("Reset semua pengaturan ke default?"))
                    setSettings(DEFAULT_SETTINGS);
                }}
                className="w-full py-3 border border-slate-700/40 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-800/30 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Default
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â•â•â• ADMIN-ONLY OVERLAY PAGES â•â•â• */}
      {/* Sensors: admin tab goes here */}
      <AnimatePresence>
        {activePage === "sensors" && (
          <SensorsPage key="sensors" onBack={() => setActivePage("map")} />
        )}
      </AnimatePresence>

      {/* ─── ADMIN PING MODAL ─── */}
      <AnimatePresence>
        {adminPing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/50">
                  <Shield className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-white mb-1 tracking-wide">
                  PANGGILAN ADMIN
                </h2>
                <p className="text-sm font-bold text-indigo-300 mb-4">
                  {adminPing.role}
                </p>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  <b className="text-white">{adminPing.fromName}</b> memanggil
                  Anda. Segera konfirmasi status Anda!
                </p>
                <button
                  onClick={() => {
                    aegisApi.pingReply(
                      terminalId,
                      userName || "Pengguna",
                      adminPing.fromId,
                    );
                    setAdminPing(null);
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest shadow-[0_4px_20px_rgba(99,102,241,0.5)] active:scale-95 transition-all"
                >
                  SAYA AMAN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── LOGIN GATE ─── */}
      <AnimatePresence>
        {isAdminURL && !userRole && (
          <LoginPage key="login" onLogin={handleLogin} />
        )}
      </AnimatePresence>

      {/* ─── INSTRUCTION BANNER (PICKING MODE) ─── */}
      <AnimatePresence>
        {pickingLocationMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 text-sm border border-indigo-400"
          >
            <MapPin className="w-5 h-5 animate-pulse" />
            Klik titik di peta untuk menaruh pin shelter
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADD SHELTER MODAL ─── */}
      <AnimatePresence>
        {showAddShelter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl relative"
            >
              <h2 className="text-lg font-black text-white mb-4">Tambah Shelter Manual</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Nama Shelter (Otomatis/Manual)" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm" value={newShelter.name} onChange={e => setNewShelter({...newShelter, name: e.target.value})} />
                <button
                  onClick={() => {
                    setPickingLocationMode(true);
                    setShowAddShelter(false);
                    setShowLeftSidebar(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-colors text-sm font-semibold"
                >
                  <MapPin className="w-4 h-4" /> Pilih di Peta
                </button>
                <div className="flex gap-3">
                  <input type="number" placeholder="Latitude" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm" value={newShelter.lat} onChange={e => setNewShelter({...newShelter, lat: e.target.value})} />
                  <input type="number" placeholder="Longitude" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm" value={newShelter.lng} onChange={e => setNewShelter({...newShelter, lng: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <input type="number" placeholder="Kapasitas" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm" value={newShelter.capacity} onChange={e => setNewShelter({...newShelter, capacity: e.target.value})} />
                  <input type="number" placeholder="Radius Aman (m)" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm" value={newShelter.radius} onChange={e => setNewShelter({...newShelter, radius: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowAddShelter(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700">Batal</button>
                <button 
                  disabled={isSavingShelter}
                  onClick={async () => {
                    if(!newShelter.name || !newShelter.lat || !newShelter.lng) return alert('Data tidak lengkap');
                    
                    setIsSavingShelter(true);
                    const shelterPayload = {
                      id: 'C'+Date.now(),
                      name: newShelter.name,
                      lat: parseFloat(newShelter.lat),
                      lng: parseFloat(newShelter.lng),
                      capacity: parseInt(newShelter.capacity) || 0,
                      radiusMeters: parseInt(newShelter.radius) || 50
                    };
                    
                    const { ok } = await aegisApi.addCustomShelter(shelterPayload);
                    setIsSavingShelter(false);

                    if (ok) {
                      addCustomShelter(shelterPayload as any);
                      setShowAddShelter(false);
                      setNewShelter({ name: '', lat: '', lng: '', capacity: '', radius: '50' });
                    } else {
                      alert('Gagal menyimpan shelter ke server. Silakan coba lagi.');
                    }
                  }} 
                  className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingShelter ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
