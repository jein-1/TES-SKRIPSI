import { useState, useCallback, useEffect, useRef, useMemo, Fragment } from "react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapRoute, MapGeoJSON, type MapRef, type MapViewport } from '@/components/ui/map'
import AlertModal, { type AlertModalState } from './components/AlertModal';
import { computeBackLine, buildZonePolygon, polygonCentroid, wouldSelfCross } from './lib/zoneOffset';
import polygonClipping from 'polygon-clipping';
// â”€â”€ Modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  shelters,
  hazardZones,
  findOptimalEvacuationRoutes,
  addCustomShelter,
  type RouteResult,
  loadRoadNetwork,
  calculateHaversine,
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
import type { HazardZone } from "./lib/evacuation/hazardZones";
import { ZRB_REFERENCE, type ZRBLevel } from "./lib/evacuation/zrbReference";
// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import LoginPage from "./components/pages/LoginPage";
import FirstVisitModal from "./components/modals/FirstVisitModal";
import ProfileModal from "./components/modals/ProfileModal";
import { VideoSplash } from "./components/modals/VideoSplash";
import type { UserRole } from "./types";
// â”€â”€ New Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import SensorsPage from "./components/pages/SensorsPage";
import StatusPage from "./components/pages/StatusPage";
import NavigatePage from "./components/pages/NavigatePage";
import FamilyPage from "./components/pages/FamilyPage";
import GuidesPage from "./components/pages/GuidesPage";
import MenuPage, { LATEST_NEWS_VERSION } from "./components/pages/MenuPage";
import { fetchLocationName, fetchIpLocation } from "./lib/geocode";
import { useLanguage } from "./lib/i18n";
import { useAegisSync, aegisApi } from "./lib/useAegisSync";
import { useBMKG, createCirclePolygon } from "./lib/useBMKG";
import {
  requestNotifPermission,
  sendTsunamiNotification,
} from "./lib/useTsunamiAlert";
import { useEmergencyNotification } from "./lib/useEmergencyNotification";
import { registerWebPush } from "./lib/usePushNotification";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { enqueueOfflineTelemetry, flushOfflineTelemetryQueue } from "./lib/offlineQueue";
import { getAdminBroadcasts, type AdminBroadcast } from "./lib/broadcastStorage";
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
  ShieldAlert,
  Home,
  Edit2,
  Target,
  Search,
  CreditCard,
  Waves,
  Droplets,
  Wind,
  Flame,
  Megaphone,
  Send,
} from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";

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
  const [userPosition, setUserPosition] = useState<[number, number] | null>(() => {
    try {
      const saved = localStorage.getItem('atlas_user_position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
      }
    } catch {}
    return null;
  });
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | undefined>(undefined);
  const [showPanel, setShowPanel] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null); // metres
  const [arrivedShelterId, setArrivedShelterId] = useState<string | null>(null);
  // Arrival modal: only shown ONCE per session to prevent re-appearing on page nav
  const arrivalShownRef = useRef(sessionStorage.getItem('aegisArrivalShown') === 'true');
  // Arrival modal state — stores snapshot at time of arrival

  const [arrivalSummary, setArrivalSummary] = useState<{
    shelter: (typeof shelters)[0];
    distanceKm: number;
    walkingMin: number;
  } | null>(null);

  const batteryLevelRef = useRef<number | null>(null);
  const gpsSmoothRef = useRef<{ lat: number; lng: number; acc: number; ts: number } | null>(null);

  // Pantau baterai untuk dynamic power-saving rate throttling
  useEffect(() => {
    const updateBat = async () => {
      try {
        const { Device } = await import("@capacitor/device");
        const info = await Device.getBatteryInfo();
        if (info && info.batteryLevel != null) {
          batteryLevelRef.current = Math.round(info.batteryLevel * 100);
        }
      } catch {}
    };
    updateBat();
    const interval = setInterval(updateBat, 60000);
    return () => clearInterval(interval);
  }, []);

  // Store-and-Forward Telemetry: auto flush antrean saat koneksi online kembali
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineTelemetryQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // ── GPS & Alert state ──────────────────────────────────────────
  const { lang, t } = useLanguage();
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userLocationName, setUserLocationName] = useState<string>("Mendeteksi lokasi...");

  // Instant IP Geolocation baseline — for displaying textual city name only (NEVER sets coordinates)
  useEffect(() => {
    let active = true;
    fetchIpLocation().then((loc) => {
      if (active && loc) {
        setUserLocationName((prev) => {
          if (prev && !prev.toLowerCase().includes("mendeteksi") && !prev.toLowerCase().includes("izin")) {
            return prev;
          }
          return loc.formatted;
        });
      }
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Reverse-geocode userPosition to real city/region name
  useEffect(() => {
    if (!userPosition) {
      setUserLocationName(gpsError ? "Izin Lokasi Diperlukan" : "Mendeteksi lokasi...");
      return;
    }
    let isCancelled = false;
    fetchLocationName(userPosition[0], userPosition[1]).then((locName) => {
      if (!isCancelled && locName) {
        setUserLocationName(locName);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [userPosition, gpsError]);
  const [tsunamiAlert, setTsunamiAlert] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("aegisSimulating") === "true" || localStorage.getItem("aegisRealTsunami") === "true";
    }
    return false;
  });

  const [isEvacuationCompleted, setIsEvacuationCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("atlas_evacuation_completed") === "true";
    }
    return false;
  });
  const isEvacuationCompletedRef = useRef(isEvacuationCompleted);
  useEffect(() => {
    isEvacuationCompletedRef.current = isEvacuationCompleted;
  }, [isEvacuationCompleted]);
  
  useEmergencyNotification(tsunamiAlert);
  
  const tsunamiAlertRef = useRef(tsunamiAlert);
  useEffect(() => {
    tsunamiAlertRef.current = tsunamiAlert;
  }, [tsunamiAlert]);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [showTsunamiConfirm, setShowTsunamiConfirm] = useState(false);
  const [selectedSimDisaster, setSelectedSimDisaster] = useState<'tsunami' | 'earthquake' | 'flood' | 'flashflood' | 'cyclone' | 'volcano'>('tsunami');
  const [activeDisasterType, setActiveDisasterType] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("atlasActiveDisasterType") || "tsunami";
    }
    return "tsunami";
  });
  const [showShelters, setShowShelters] = useState(false);
  const [showAddShelter, setShowAddShelter] = useState(false);
  const [newShelter, setNewShelter] = useState({ name: '', lat: '', lng: '', capacity: '', radius: '50' });
  const [pickingLocationMode, setPickingLocationMode] = useState(false);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [networkFailed, setNetworkFailed] = useState(false);
  const [isSavingShelter, setIsSavingShelter] = useState(false);
  
  // ── Hazard Zone interaction state ──────────────────────────────────────
  const [hazardZoneVersion, setHazardZoneVersion] = useState(0);
  const [drawingZoneMode, setDrawingZoneMode] = useState(false);
  const [drawingZoneCoords, setDrawingZoneCoords] = useState<[number, number][]>([]); // [lat, lng]
  // Ref mirror of drawingZoneCoords — for reading inside the map click handler
  // without stale-closure issues (handler is registered only when drawingZoneMode changes).
  const drawingZoneCoordsRef = useRef<[number, number][]>([]);
  // Guard: suppress the map's click event that fires right after a marker drag-end
  const markerJustDraggedRef = useRef(false);

  // Zone offset (back-line) state — Part C
  const [drawingZoneDepthKm, setDrawingZoneDepthKm] = useState(0.2); // default 200 m
  const [drawingZoneFlipSide, setDrawingZoneFlipSide] = useState(false);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<HazardZone | null>(null);
  const [drawingZoneBackCoords, setDrawingZoneBackCoords] = useState<[number, number][]>([]);
  const [manualBackOverrides, setManualBackOverrides] = useState<Record<number, [number, number]>>({}); // index -> manual position
  const [showAddHazardZone, setShowAddHazardZone] = useState(false);
  // Zone panel drag — managed by framer-motion useDragControls
  const zoneDragControls = useDragControls();
  const [newHazardZone, setNewHazardZone] = useState<{name: string; zrbLevel: ZRBLevel; description: string}>({ name: '', zrbLevel: 4, description: '' });
  const [isSavingHazardZone, setIsSavingHazardZone] = useState(false);
  // AlertModal state
  const [alertModal, setAlertModal] = useState<AlertModalState>(null);

  // ── Drawing Zone safety guards ──────────────────────────────────────────
  // Pending point waiting for jump-distance confirmation
  const [pendingZonePoint, setPendingZonePoint] = useState<[number, number] | null>(null);
  // Whether current front-line self-intersects
  const [zoneLineSelfCrossing, setZoneLineSelfCrossing] = useState(false);
  
  const [selectedHazardZoneId, setSelectedHazardZoneId] = useState<string | null>(null);
  const [showEditHazardZone, setShowEditHazardZone] = useState(false);
  const [editHazardZoneData, setEditHazardZoneData] = useState<{
    id: string; name: string; coords: [number, number][]; zrbLevel: ZRBLevel; description: string;
  } | null>(null);
  const [isSavingEditHazardZone, setIsSavingEditHazardZone] = useState(false);
  
  const [showDeleteHazardZoneConfirm, setShowDeleteHazardZoneConfirm] = useState(false);
  const [isDeletingHazardZone, setIsDeletingHazardZone] = useState(false);
  
  // ── Admin Ping State ─────────────────────────────────────────────────
  const [showAdminPingModal, setShowAdminPingModal] = useState<{ id: string; name: string } | null>(null);
  const [adminPingMessage, setAdminPingMessage] = useState("");
  const [pingReplies, setPingReplies] = useState<{ id: string; name: string; nik?: string; ts: number }[]>([]);
  const [pingSentToast, setPingSentToast] = useState<{ name: string; ts: number } | null>(null);
  
  // ── Admin Emergency Broadcast State ─────────────────────────────────
  const [showAdminBroadcastModal, setShowAdminBroadcastModal] = useState(false);
  const [adminBroadcastTitle, setAdminBroadcastTitle] = useState("");
  const [adminBroadcastMessage, setAdminBroadcastMessage] = useState("");
  const [adminBroadcastLevel, setAdminBroadcastLevel] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [adminBroadcastRegion, setAdminBroadcastRegion] = useState("SEMUA WILAYAH");
  const [adminBroadcastList, setAdminBroadcastList] = useState<AdminBroadcast[]>(() => {
    try { return getAdminBroadcasts(); } catch { return []; }
  });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  useEffect(() => {
    const handleBroadcastUpdate = () => {
      setAdminBroadcastList(getAdminBroadcasts());
    };
    window.addEventListener('atlas_admin_broadcast_updated', handleBroadcastUpdate);
    return () => window.removeEventListener('atlas_admin_broadcast_updated', handleBroadcastUpdate);
  }, []);
  
  // ── Shelter interaction state ──────────────────────────────────────────
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [showEditShelter, setShowEditShelter] = useState(false);
  const [editShelterData, setEditShelterData] = useState<{
    id: string; name: string; lat: string; lng: string;
    capacity: string; radius: string; address: string; customMessage: string;
  } | null>(null);
  const [isSavingEditShelter, setIsSavingEditShelter] = useState(false);
  const [editShelterError, setEditShelterError] = useState<string | null>(null);
  
  const [showDeleteShelterConfirm, setShowDeleteShelterConfirm] = useState(false);
  const [isDeletingShelter, setIsDeletingShelter] = useState(false);
  const [deleteShelterError, setDeleteShelterError] = useState<string | null>(null);
  
  const [shelterVersion, setShelterVersion] = useState(0);
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
        nik?: string;
        deviceModel: string;
        lat: number;
        lng: number;
        ts: number;
        battery?: number;
        isOffline?: boolean;
      }
    >
  >({});
  const [selectedUserInfo, setSelectedUserInfo] = useState<{
    id: string;
    name: string;
    nik?: string;
    deviceModel: string;
    lat: number;
    lng: number;
    battery?: number;
    isOffline?: boolean;
    ts: number;
  } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState("");

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

  useEffect(() => {
    if (drawingZoneMode && adminMapRef.current) {
      const map = adminMapRef.current;
      const handleClick = (e: any) => {
        // Suppress click that fires immediately after a marker drag-end
        if (markerJustDraggedRef.current) return;
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;
        const newPt: [number, number] = [lat, lng];

        // Guard 1: Jump-distance confirmation
        // Read current coords via ref to avoid stale closure issue.
        // We use a ref updated by the drawingZoneCoords state.
        const currentCoords = drawingZoneCoordsRef.current;
        if (currentCoords.length >= 1) {
          const last = currentCoords[currentCoords.length - 1];
          const distKm = calculateHaversine(last[0], last[1], newPt[0], newPt[1]);
          if (distKm > 1) {
            // Show confirmation — do NOT add the point yet
            setPendingZonePoint(newPt);
            setAlertModal({
              type: 'confirm',
              title: 'Titik Meloncat Jauh',
              message: `Titik ini ~${distKm.toFixed(1)} km dari titik terakhir \u2014 yakin ini masih bagian pantai yang sama?`,
              confirmLabel: 'Tambahkan',
              cancelLabel: 'Batal',
              onConfirm: () => {
                setDrawingZoneCoords(c => [...c, newPt]);
                setPendingZonePoint(null);
                setAlertModal(null);
              },
              onCancel: () => {
                setPendingZonePoint(null);
                setAlertModal(null);
              },
            });
            return; // Don't add the point yet
          }
        }
        setDrawingZoneCoords(prev => [...prev, newPt]);
      };
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [drawingZoneMode]);


  // Keep ref mirror in sync with state so the map click handler always reads fresh coords
  useEffect(() => {
    drawingZoneCoordsRef.current = drawingZoneCoords;
  }, [drawingZoneCoords]);

  // Auto-generate back-line whenever front coords, depth, or flip side changes
  useEffect(() => {
    const computed = computeBackLine(drawingZoneCoords, drawingZoneDepthKm, drawingZoneFlipSide);
    // Preserve manually-dragged positions; only auto-fill un-overridden indices
    const merged: [number, number][] = computed.map((pt, i) => manualBackOverrides[i] ?? pt);
    setDrawingZoneBackCoords(merged);
  }, [drawingZoneCoords, drawingZoneDepthKm, drawingZoneFlipSide, manualBackOverrides]);


  // Guard 3: Detect self-crossing whenever drawingZoneCoords changes
  useEffect(() => {
    if (!drawingZoneMode || drawingZoneCoords.length < 3) {
      setZoneLineSelfCrossing(false);
      return;
    }
    // Check if the last segment creates a self-intersection
    const lastPt = drawingZoneCoords[drawingZoneCoords.length - 1];
    const isCrossing = wouldSelfCross(drawingZoneCoords.slice(0, -1), lastPt);
    setZoneLineSelfCrossing(isCrossing);
  }, [drawingZoneCoords, drawingZoneMode]);

  // Sapu bersih semua layer/source "zone-preview-*" langsung dari style map yang aktif.
  // Jalan SETIAP kali drawingZoneMode berubah (baik mulai MAUPUN selesai/batal) supaya:
  //   - saat mode ON  → bersih dulu sebelum MapGeoJSON baru nambah layer
  //   - saat mode OFF → pastikan semua sisa layer terbuang walau cleanup sebelumnya gagal
  useEffect(() => {
    const map = adminMapRef.current;
    if (!map) return;

    const purgeZonePreviewLayers = () => {
      try {
        const style = map.getStyle();
        if (!style) return;
        const layerIds = (style.layers || [])
          .map(l => l.id)
          .filter(id => id.includes('zone-preview'));
        const sourceIds = Object.keys(style.sources || {})
          .filter(id => id.includes('zone-preview'));

        layerIds.forEach(id => {
          try { if (map.getLayer(id)) map.removeLayer(id); }
          catch (e) { console.warn('[ZonePreview] Gagal hapus layer', id, e); }
        });
        sourceIds.forEach(id => {
          try { if (map.getSource(id)) map.removeSource(id); }
          catch (e) { console.warn('[ZonePreview] Gagal hapus source', id, e); }
        });

        if (layerIds.length || sourceIds.length) {
          console.log('[ZonePreview] Sapu bersih layer hantu:', [...layerIds, ...sourceIds]);
        }
      } catch (e) {
        console.warn('[ZonePreview] purgeZonePreviewLayers gagal total:', e);
      }
    };

    purgeZonePreviewLayers();
  }, [drawingZoneMode]);

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
    message?: string;
  } | null>(null);
  const [hasFamilyPing, setHasFamilyPing] = useState(false);
  const [incomingFamilyPing, setIncomingFamilyPing] = useState<{
    fromId: string;
    fromName: string;
    nik?: string;
  } | null>(null);

  const [showVideoSplash, setShowVideoSplash] = useState<boolean>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("atlas_splash_done") === "true") {
      return false;
    }
    return true;
  });

  const handleSplashFinish = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("atlas_splash_done", "true");
    }
    setShowVideoSplash(false);
  }, []);

  const [userRole, setUserRole] = useState<AppUserRole>(() => {
    if (!isAdminURL) return "user"; // Regular URL → instant user mode
    return (sessionStorage.getItem("aegisRole") as AppUserRole) ?? null;
  });

  // User display name & NIK — stored in localStorage, set on first visit
  const [userName, setUserName] = useState<string>(() => {
    const ls = localStorage.getItem("atlasUserName") || localStorage.getItem("aegisUserName");
    if (ls) return ls;
    const m = document.cookie.match(/(?:^|; )(?:atlasUserName|aegisUserName)=([^;]*)/);
    if (m) {
      const n = decodeURIComponent(m[1]);
      localStorage.setItem("atlasUserName", n);
      localStorage.setItem("aegisUserName", n);
      return n;
    }
    return "";
  });
  const [userNik, setUserNik] = useState<string>(() => {
    const ls = localStorage.getItem("atlasUserNik") || localStorage.getItem("aegisUserNik");
    if (ls) return ls;
    const m = document.cookie.match(/(?:^|; )(?:atlasUserNik|aegisUserNik)=([^;]*)/);
    if (m) {
      const n = decodeURIComponent(m[1]);
      localStorage.setItem("atlasUserNik", n);
      localStorage.setItem("aegisUserNik", n);
      return n;
    }
    return "";
  });
  const [showFirstVisit, setShowFirstVisit] = useState(() => {
    const registered = localStorage.getItem("atlasRegistered") || localStorage.getItem("aegisRegistered");
    const hasName = !!(localStorage.getItem("atlasUserName") || localStorage.getItem("aegisUserName"));
    const hasNik = !!(localStorage.getItem("atlasUserNik") || localStorage.getItem("aegisUserNik"));
    return !isAdminURL && (!registered || !hasName || !hasNik);
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Case-insensitive flexible filter for Admin to search users by Name or NIK
  const adminFilteredUsers = useMemo(() => {
    const q = adminUserSearch.trim().toLowerCase();
    if (!q) return [];
    return Object.values(activeUsers).filter((u) => {
      const name = (u.name || "").toLowerCase();
      const nik = ((u as any).nik || "").toLowerCase();
      const id = (u.id || "").toLowerCase();
      return name.includes(q) || nik.includes(q) || id.includes(q);
    });
  }, [adminUserSearch, activeUsers]);

  // Privasi Lokasi User: Dalam kondisi normal, peta admin tidak menampilkan marker user secara bebas.
  // User hanya muncul jika dicari secara spesifik di kolom pencarian atau saat darurat/simulasi aktif.
  const usersToRenderOnMap = useMemo(() => {
    if (adminUserSearch.trim()) return adminFilteredUsers;
    if (tsunamiAlert) return Object.values(activeUsers);
    return [];
  }, [adminUserSearch, adminFilteredUsers, tsunamiAlert, activeUsers]);

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

  // Sinkronisasi Telemetri Gempa BMKG Real-Time ke News Gempa Sistem
  useEffect(() => {
    if (!gempa) return;
    try {
      const historyKey = 'atlas_earthquake_news_history';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const quakeId = `${gempa.DateTime || (gempa.Tanggal + '_' + gempa.Jam)}_${gempa.Magnitude}_${gempa.Wilayah}`;
      const cleaned = existing.filter((item: any) => item.id !== 'eq-palu-01' && item.id !== 'eq-donggala-02');
      if (!cleaned.some((item: any) => item.id === quakeId)) {
        const newItem = {
          id: quakeId,
          source: 'SIARAN SEISMIK LANGSUNG • BMKG // PUSAT GEMPA',
          location: gempa.Wilayah,
          magnitude: gempa.Magnitude,
          depth: gempa.Kedalaman,
          eventTime: `${gempa.Tanggal} • ${gempa.Jam}`,
          receivedAt: Date.now(),
          potensi: gempa.Potensi || gempa.Dirasakan || 'Tidak berpotensi tsunami'
        };
        const updated = [newItem, ...cleaned].slice(0, 30);
        localStorage.setItem(historyKey, JSON.stringify(updated));
        localStorage.setItem('atlas_has_unread_earthquake_news', 'true');
        window.dispatchEvent(new CustomEvent('atlas_earthquake_news_updated'));
      } else if (cleaned.length !== existing.length) {
        localStorage.setItem(historyKey, JSON.stringify(cleaned));
      }
    } catch {}
  }, [gempa]);

  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [dismissedGempaTime, setDismissedGempaTime] = useState<string | null>(null);

  const [hasMenuUnread, setHasMenuUnread] = useState(() => {
    try {
      return (
        localStorage.getItem("atlas_last_read_log_version") !== LATEST_NEWS_VERSION ||
        localStorage.getItem("atlas_has_unread_earthquake_news") === "true"
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkUnread = () => {
      try {
        setHasMenuUnread(
          localStorage.getItem("atlas_last_read_log_version") !== LATEST_NEWS_VERSION ||
          localStorage.getItem("atlas_has_unread_earthquake_news") === "true"
        );
      } catch {}
    };
    window.addEventListener("atlas_changelog_read", checkUnread);
    window.addEventListener("atlas_news_read", checkUnread);
    return () => {
      window.removeEventListener("atlas_changelog_read", checkUnread);
      window.removeEventListener("atlas_news_read", checkUnread);
    };
  }, []);

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

  // ── Persistent Unit ID (ARCHITECT 01 vs COMMAND-01 vs CITIZEN / FOREIGN CITIZEN) ──
  const [terminalId, setTerminalId] = useState<string>(() => {
    const isNode01 = localStorage.getItem("atlas_is_node_01") === "true";
    if (isNode01) {
      localStorage.setItem("atlasTerminalId", "ARCHITECT 01");
      localStorage.setItem("aegisTerminalId", "ARCHITECT 01");
      return "ARCHITECT 01";
    }

    const isWna = localStorage.getItem("atlas_is_wna") === "true";
    let s = localStorage.getItem("atlasTerminalId") || localStorage.getItem("aegisTerminalId");
    if (s) {
      if (s === "NODE-01" || s.includes("ARCHITECT")) {
        localStorage.setItem("atlasTerminalId", "ARCHITECT 01");
        localStorage.setItem("aegisTerminalId", "ARCHITECT 01");
        return "ARCHITECT 01";
      }
      if (s.startsWith("COMMAND")) return s;
      if (s === "FOREIGN CITIZEN" || isWna) {
        localStorage.setItem("atlasTerminalId", "FOREIGN CITIZEN");
        localStorage.setItem("aegisTerminalId", "FOREIGN CITIZEN");
        return "FOREIGN CITIZEN";
      }
      localStorage.setItem("atlasTerminalId", "CITIZEN");
      localStorage.setItem("aegisTerminalId", "CITIZEN");
      return "CITIZEN";
    }
    const fallbackId = isWna ? "FOREIGN CITIZEN" : "CITIZEN";
    localStorage.setItem("atlasTerminalId", fallbackId);
    localStorage.setItem("aegisTerminalId", fallbackId);
    return fallbackId;
  });

  useEffect(() => {
    // Apply saved appearance & accessibility settings (Always NERV Tactical Dark)
    const applySavedSettings = () => {
      try {
        const root = document.documentElement;
        root.classList.add('dark');
        root.classList.remove('light');
        localStorage.setItem('atlas_theme_mode', 'dark');

        const savedContrast = localStorage.getItem('atlas_contrast');
        if (savedContrast === 'high') {
          root.classList.add('high-contrast');
        } else {
          root.classList.remove('high-contrast');
        }

        const savedCv = localStorage.getItem('atlas_color_vision');
        root.classList.remove('color-protanopia', 'color-deuteranopia', 'color-tritanopia');
        if (savedCv && savedCv !== 'normal') {
          root.classList.add(`color-${savedCv}`);
        }

        const savedFs = localStorage.getItem('atlas_font_size');
        root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        if (savedFs && savedFs !== 'device') {
          root.classList.add(`font-size-${savedFs}`);
        }

        const savedFt = localStorage.getItem('atlas_font_thickness');
        root.classList.remove('font-weight-regular', 'font-weight-bold');
        if (savedFt && savedFt !== 'device') {
          root.classList.add(`font-weight-${savedFt}`);
        }

        const savedTb = localStorage.getItem('atlas_screen_reader_mode');
        if (savedTb === 'talkback') {
          root.setAttribute('data-talkback', 'true');
        } else {
          root.removeAttribute('data-talkback');
        }
      } catch (_) {}
    };

    applySavedSettings();

    const handleThemeEvent = () => {
      applySavedSettings();
    };
    window.addEventListener('atlas_theme_changed', handleThemeEvent);
    return () => {
      window.removeEventListener('atlas_theme_changed', handleThemeEvent);
    };
  }, []);

  const [hasUnreadNews, setHasUnreadNews] = useState(() => {
    return localStorage.getItem('atlas_has_unread_earthquake_news') === 'true';
  });

  useEffect(() => {
    const handleNewsRead = () => setHasUnreadNews(false);
    const handleNewsUpdate = () => {
      setHasUnreadNews(localStorage.getItem('atlas_has_unread_earthquake_news') === 'true');
    };
    window.addEventListener('atlas_news_read', handleNewsRead);
    window.addEventListener('atlas_earthquake_news_updated', handleNewsUpdate);
    return () => {
      window.removeEventListener('atlas_news_read', handleNewsRead);
      window.removeEventListener('atlas_earthquake_news_updated', handleNewsUpdate);
    };
  }, []);

  useEffect(() => {
    // Migrate any legacy terminal IDs across localStorage on startup
    try {
      ["aegisTerminalId", "aegisId", "atlasTerminalId", "atlasId"].forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) {
          let migrated = "CITIZEN";
          if (val === "NODE-01" || val.includes("ARCHITECT")) migrated = "ARCHITECT 01";
          else if (val.startsWith("COMMAND")) migrated = val;
          localStorage.setItem(key, migrated);
        }
      });
    } catch (_) {}

    import("@capacitor/core").then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        import("@capacitor/device").then(({ Device }) => {
          Device.getId().then(() => {
            const isNode01 = localStorage.getItem("atlas_is_node_01") === "true";
            if (isNode01) return;
            const current = localStorage.getItem("atlasTerminalId");
            if (current && (current.includes("ARCHITECT") || current.startsWith("COMMAND"))) return;
            const pubId = "CITIZEN";
            setTerminalId(pubId);
            localStorage.setItem("atlasTerminalId", pubId);
            localStorage.setItem("aegisTerminalId", pubId);
          });
        });
        import('./lib/nativeSettings').then(({ NativeSettings }) => {
          if (localStorage.getItem('atlas_sentinel_active') !== 'false') {
            NativeSettings.startSentinel().catch(() => {});
          }
        });
      }
    });
  }, []);

  // â”€â”€ History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [evacuationHistory, setEvacuationHistory] = useState<
    EvacuationRecord[]
  >(() => {
    try {
      const s = localStorage.getItem("evacuationHistory");
      if (s) {
        const parsed = JSON.parse(s);
        const migrated = parsed.map((r: any) => {
          const isReal = r.type === "real" && (r.eventName?.toLowerCase().includes("bmkg") || r.eventName?.toLowerCase().includes("tsunami warning"));
          return {
            ...r,
            type: isReal ? "real" : "simulation",
            timestamp: new Date(r.timestamp),
            eventName: r.eventName ?? r.routeName ?? "Simulasi Rute Evakuasi",
          };
        });
        try {
          localStorage.setItem("evacuationHistory", JSON.stringify(migrated));
        } catch (_) {}
        return migrated;
      }
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
  // Throttle route calculations
  const lastRouteCalcPosRef = useRef<[number, number] | null>(null);
  const lastRouteCalcTimeRef = useRef<number>(0);
  const lastRouteCalcResultsRef = useRef<RouteResult[]>([]);

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

  // ── Update Credentials Modal State ─────────────────────────────────────
  const [showUpdateCredentials, setShowUpdateCredentials] = useState(false);
  const [credTerminalId, setCredTerminalId] = useState(terminalId);
  const [credOperatorName, setCredOperatorName] = useState(userName || "Operator Admin");
  const [credNewPin, setCredNewPin] = useState("");
  const [credConfirmPin, setCredConfirmPin] = useState("");
  const [credSuccessMsg, setCredSuccessMsg] = useState("");
  const [credErrorMsg, setCredErrorMsg] = useState("");

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

  // First visit name and NIK completion
  const handleFirstVisit = (name: string, nik: string) => {
    localStorage.setItem("atlasUserName", name);
    localStorage.setItem("aegisUserName", name);
    localStorage.setItem("atlasUserNik", nik);
    localStorage.setItem("aegisUserNik", nik);
    localStorage.setItem("atlasRegistered", "1");
    localStorage.setItem("aegisRegistered", "1");
    document.cookie = `atlasUserName=${encodeURIComponent(name)};max-age=${365 * 24 * 3600};path=/;SameSite=Lax`;
    document.cookie = `atlasUserNik=${encodeURIComponent(nik)};max-age=${365 * 24 * 3600};path=/;SameSite=Lax`;
    setUserName(name);
    setUserNik(nik);
    setShowFirstVisit(false);

    // Langsung klaim NIK & identitas terminal ke database Supabase
    aegisApi.broadcastLocation(
      terminalId,
      name,
      (window as any).__DEVICE_MODEL__ || "Terminal A.T.L.A.S",
      -0.8917,
      119.8577,
      100,
      nik
    ).catch(() => {});

    setTimeout(() => startGpsTracking(), 800);
  };

  // Persist a fresh GPS fix so the next launch can restore it briefly (never a stale one)
  const persistPosition = useCallback((pos: [number, number]) => {
    try {
      localStorage.setItem('atlas_user_position', JSON.stringify(pos));
      localStorage.setItem('atlas_user_position_ts', String(Date.now()));
    } catch {}
  }, []);

  // Manual location update (calibrated via map click or drag)
  const handleManualLocationUpdate = useCallback((newPos: [number, number]) => {
    setUserPosition(newPos);
    setFlyToPos(newPos);
    persistPosition(newPos);
    localStorage.setItem('atlas_manual_pinned_ts', String(Date.now()));
    fetchLocationName(newPos[0], newPos[1]).then((name) => {
      if (name) setUserLocationName(name);
    });
    const routeResults = findOptimalEvacuationRoutes(
      newPos[0],
      newPos[1],
      99,
      settings.algorithm as 'dijkstra' | 'haversine',
    );
    lastRouteCalcResultsRef.current = routeResults;
    setRoutes(routeResults);
    if (tsunamiAlert) setSelectedRoute(0);
    setIsCalculating(false);
  }, [settings.algorithm, persistPosition]);

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
        type === "real"
          ? `BMKG Peringatan Dini: Tsunami Sektor ${sector}`
          : `Simulasi Rute Evakuasi: Sektor ${sector}`;
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
    if (!isEvacuationCompletedRef.current && (typeof window === 'undefined' || sessionStorage.getItem('atlas_evacuation_completed') !== 'true')) {
      arrivedFiredRef.current = false;
      setArrivedShelterId(null);
      setArrivalSummary(null);
    }
    setGpsTracking(true);
    setGpsError(null);
    setIsCalculating(true);

    // 1. Instant IP geolocation fallback untuk teks nama kota saja (TIDAK PERNAH mengubah koordinat)
    fetchIpLocation().then((loc) => {
      if (loc && !hasFirstGPSFixRef.current) {
        setUserLocationName((prev) => {
          if (prev && !prev.toLowerCase().includes("mendeteksi") && !prev.toLowerCase().includes("izin")) {
            return prev;
          }
          return loc.formatted;
        });
      }
    }).catch(() => {});

    // 2. Fast initial position fix via Fused Location (Native Google Play Services & Web Geolocation)
    const isNativePlatform = typeof window !== "undefined" && Capacitor.isNativePlatform();
    const hasManualPin = typeof window !== "undefined" && localStorage.getItem('atlas_manual_pinned') === 'true';

    if (!hasManualPin) {
      if (isNativePlatform) {
        // Jalur 1 (Seluler Cepat): Jangan tunggu satelit, tangkap sinyal BTS operator dalam < 2 detik
        Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 })
          .then((pos) => {
            if (localStorage.getItem('atlas_manual_pinned') === 'true') return;
            const acc = pos.coords.accuracy || 100;
            if (acc > 500) return;
            if (hasFirstGPSFixRef.current) return;
            hasFirstGPSFixRef.current = true;
            const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setGpsAccuracy(acc);
            setUserPosition(newPos);
            persistPosition(newPos);
            setFlyToPos(newPos);
            fetchLocationName(newPos[0], newPos[1]).then((name) => {
              if (name) setUserLocationName(name);
            });
            const routeResults = findOptimalEvacuationRoutes(
              newPos[0],
              newPos[1],
              99,
              settings.algorithm as 'dijkstra' | 'haversine',
            );
            lastRouteCalcResultsRef.current = routeResults;
            setRoutes(routeResults);
            if (tsunamiAlert) setSelectedRoute(0);
            setIsCalculating(false);
          })
          .catch(() => {});

        // Jalur 2 (Satelit Presisi GNSS): Ambil sinyal presisi tinggi jika tersedia
        Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
          .then((pos) => {
            if (localStorage.getItem('atlas_manual_pinned') === 'true') return;
            const acc = pos.coords.accuracy || 15;
            if (acc > 300) return;
            hasFirstGPSFixRef.current = true;
            const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setGpsAccuracy(acc);
            setUserPosition(newPos);
            persistPosition(newPos);
            setFlyToPos(newPos);
            fetchLocationName(newPos[0], newPos[1]).then((name) => {
              if (name) setUserLocationName(name);
            });
            const routeResults = findOptimalEvacuationRoutes(
              newPos[0],
              newPos[1],
              99,
              settings.algorithm as 'dijkstra' | 'haversine',
            );
            lastRouteCalcResultsRef.current = routeResults;
            setRoutes(routeResults);
            if (tsunamiAlert) setSelectedRoute(0);
            setIsCalculating(false);
          })
          .catch((err) => {
            console.warn("Native fast GPS acquisition failed:", err);
          });
      } else if (typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (localStorage.getItem('atlas_manual_pinned') === 'true') return;
            const acc = pos.coords.accuracy || 15;
            if (acc > 500) return;
            hasFirstGPSFixRef.current = true;
            const newPos: [number, number] = [
              pos.coords.latitude,
              pos.coords.longitude,
            ];
            setGpsAccuracy(acc);
            setUserPosition(newPos);
            persistPosition(newPos);
            setFlyToPos(newPos);
            fetchLocationName(newPos[0], newPos[1]).then((name) => {
              if (name) setUserLocationName(name);
            });
            const routeResults = findOptimalEvacuationRoutes(
              newPos[0],
              newPos[1],
              99,
              settings.algorithm as 'dijkstra' | 'haversine',
            );
            lastRouteCalcResultsRef.current = routeResults;
            setRoutes(routeResults);
            if (tsunamiAlert) setSelectedRoute(0);
            setIsCalculating(false);
          },
          (err) => {
            console.warn("Browser GPS acquisition failed:", err);
            if (err.code === 1) {
              setGpsError("Izin lokasi ditolak oleh browser.");
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
      }
    }

    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
          // Android: minta pembaruan cepat sekelas share-location
          interval: 2000,
          minimumUpdateInterval: 1000,
        },
        (pos, err) => {
          if (err) {
            console.warn("GPS Error:", err);
            return;
          }
          if (!pos || !pos.coords) return;

          const rawAcc = pos.coords.accuracy || 50;

          // Pin manual hanya menahan GPS sementara.
          // Setelah 2 menit atau jika akurasi presisi (<= 35m) masuk, lepaskan otomatis
          if (typeof window !== "undefined" && localStorage.getItem('atlas_manual_pinned') === 'true') {
            const pinnedAt = Number(localStorage.getItem('atlas_manual_pinned_ts') || 0);
            const pinAge = Date.now() - pinnedAt;
            const shouldRelease = rawAcc <= 35 && (pinnedAt === 0 || pinAge > 120000);
            if (!shouldRelease) return;
            localStorage.removeItem('atlas_manual_pinned');
            localStorage.removeItem('atlas_manual_pinned_ts');
          }

          // Tolak bacaan ekstrem yang tidak masuk akal (> 500m)
          if (rawAcc > 500) return;

          const rawLat = pos.coords.latitude;
          const rawLng = pos.coords.longitude;
          const fixNow = Date.now();
          const prev = gpsSmoothRef.current;

          // Deteksi anomali multipath: kecepatan tidak wajar untuk evakuasi (> 45 m/s)
          if (prev) {
            const dtSec = Math.max((fixNow - prev.ts) / 1000, 0.5);
            const distM = calculateHaversine(prev.lat, prev.lng, rawLat, rawLng) * 1000;
            const speedMs = distM / dtSec;
            if (speedMs > 45 && rawAcc > 25) return;
            // Jangan biarkan fix seluler kasar menimpa fix presisi satelit yang masih segar (< 30s)
            if (prev.acc <= 25 && rawAcc > 80 && fixNow - prev.ts < 30000) return;
          }

          // Kalman Adaptive Smoothing
          let lat = rawLat;
          let lng = rawLng;
          let acc = rawAcc;
          if (prev && rawAcc >= 20) {
            const accRatio = prev.acc / Math.max(rawAcc, 1);
            const weight = Math.min(1, Math.max(0.25, 1 / (1 + accRatio * 0.5)));
            const elapsed = Math.min(10, (fixNow - prev.ts) / 1000);
            const k = Math.min(1, weight + elapsed * 0.1);
            const movedM = calculateHaversine(prev.lat, prev.lng, rawLat, rawLng) * 1000;
            if (movedM < 15) {
              lat = prev.lat + (rawLat - prev.lat) * k;
              lng = prev.lng + (rawLng - prev.lng) * k;
              acc = prev.acc + (rawAcc - prev.acc) * k;
            }
          }
          gpsSmoothRef.current = { lat, lng, acc, ts: fixNow };

          setGpsAccuracy(acc);
          const newPos: [number, number] = [lat, lng];

          setUserPosition(newPos);
          persistPosition(newPos);
          fetchLocationName(newPos[0], newPos[1]).then((name) => {
            if (name) setUserLocationName(name);
          });

          if (!hasFirstGPSFixRef.current) {
            hasFirstGPSFixRef.current = true;
            setFlyToPos(newPos);
          }

          
          // ── THROTTLE ROUTE CALCULATION (Dynamic Geofencing & Battery Optimization) ──
          const now = Date.now();
          const timeDiff = now - lastRouteCalcTimeRef.current;
          let movedDist = 0;
          if (lastRouteCalcPosRef.current) {
            movedDist = calculateHaversine(
              lastRouteCalcPosRef.current[0], lastRouteCalcPosRef.current[1],
              newPos[0], newPos[1]
            ) * 1000; // convert km to meters
          }

          const isLowBattery = batteryLevelRef.current !== null && batteryLevelRef.current <= 20;
          const isEvacSafe = isEvacuationCompletedRef.current || (typeof window !== "undefined" && sessionStorage.getItem('atlas_evacuation_completed') === 'true');
          const isSafeInShelter = arrivedShelterId !== null || isEvacSafe;
          // Zona Bahaya (Tsunami Alert aktif & belum sampai shelter): respon cepat 8m / 3s
          // Zona Aman (Shelter / Sudah Evakuasi) atau Baterai Rendah (<= 20%): mode hemat daya 25m / 15s
          // Standar: 12m / 4s
          const requiredDist = (isSafeInShelter || isLowBattery) ? 25 : (tsunamiAlertRef.current && !isEvacSafe ? 8 : 12);
          const requiredTime = (isSafeInShelter || isLowBattery) ? 15000 : (tsunamiAlertRef.current && !isEvacSafe ? 3000 : 4000);

          if (!lastRouteCalcPosRef.current || movedDist > requiredDist || timeDiff >= requiredTime) {
            lastRouteCalcPosRef.current = newPos;
            lastRouteCalcTimeRef.current = now;
            
            const routeResults = findOptimalEvacuationRoutes(
              newPos[0],
              newPos[1],
              99,
              settings.algorithm as 'dijkstra' | 'haversine',
            );
            lastRouteCalcResultsRef.current = routeResults;
            
            setRoutes(routeResults);
            if (tsunamiAlertRef.current && !isEvacSafe) setSelectedRoute(0);
            setIsCalculating(false);
            // Only open panel if user hasn't manually closed it and not already evacuated
            if (!panelUserClosedRef.current && !isEvacSafe) {
              setShowPanel(true);
            }
            const isRealAlert = typeof window !== "undefined" && localStorage.getItem("aegisRealTsunami") === "true";
            saveHistoryRecord(
              routeResults,
              isRealAlert ? "real" : "simulation",
              newPos,
            );
          } else {
            setIsCalculating(false);
          }

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
                        userNik,
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
                        userNik,
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
                    userNik,
                  )
                  .catch(() => {});
              });
          }

          // ── Arrival detection: check if within shelter radius with dynamic GPS tolerance ──
          // Hanya dievaluasi jika belum terpicu dan sesi belum dikunci sebagai aman
          if (!arrivedFiredRef.current && !isEvacuationCompletedRef.current && (typeof window === 'undefined' || sessionStorage.getItem('atlas_evacuation_completed') !== 'true')) {
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
              // Dynamic GPS accuracy buffer tolerance:
              // Base radius configured by Admin: sh.radiusMeters ?? ARRIVAL_RADIUS_METERS
              // Dynamic GPS jitter tolerance: min(accuracy || 20, 25)
              const baseRadius = sh.radiusMeters ?? ARRIVAL_RADIUS_METERS;
              const gpsTolerance = Math.min(pos.coords.accuracy || 20, 25);
              const effectiveRadius = Math.max(baseRadius, 30) + gpsTolerance;
              return dist <= effectiveRadius;
            });
            if (arrived) {
              arrivedFiredRef.current = true;
              isEvacuationCompletedRef.current = true;
              setIsEvacuationCompleted(true);
              // Kunci status evakuasi selesai agar saat keluar shelter tidak memicu sirine lagi
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('atlas_evacuation_completed', 'true');
                sessionStorage.removeItem('aegisSimulating');
                localStorage.removeItem('aegisRealTsunami');
              }
              // Hentikan sirine darurat secara tuntas
              alarmRef.current.stop();
              setTsunamiAlert(false);
              setShowPanel(false);
              // Haptic feedback (arrived!)
              if ("vibrate" in navigator)
                navigator.vibrate([200, 100, 200, 100, 400]);
              // Tampilkan modal kedatangan HANYA sekali per sesi
              if (!arrivalShownRef.current) {
                arrivalShownRef.current = true;
                sessionStorage.setItem('aegisArrivalShown', 'true');
                setArrivedShelterId(arrived.id);
                
                const bestRoute = lastRouteCalcResultsRef.current[0];
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
          }
        },
      );
      gpsWatchRef.current = watchId;
    } catch (e) {
      setIsCalculating(false);
      setGpsError("Gagal mengaktifkan sensor lokasi GPS.");
      setGpsTracking(false);
    }
  }, [saveHistoryRecord, tsunamiAlert, settings.algorithm]);

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

  // Auto-start GPS on load for all clients
  useEffect(() => {
    if (settings.autoStartGPS && !gpsAutoStartedRef.current) {
      gpsAutoStartedRef.current = true;
      const t = setTimeout(() => startGpsTracking(), 600);
      return () => clearTimeout(t);
    }
  }, [settings.autoStartGPS, startGpsTracking]);

  // â”€â”€ Tsunami â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activateTsunamiAlert = useCallback((disasterType: string = 'tsunami') => {
    setActiveDisasterType(disasterType);
    setIsEvacuationCompleted(false);
    isEvacuationCompletedRef.current = false;
    setTsunamiAlert(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aegisSimulating", "true");
      sessionStorage.setItem("atlasActiveDisasterType", disasterType);
      sessionStorage.removeItem("atlas_evacuation_completed");
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
    setIsEvacuationCompleted(false);
    isEvacuationCompletedRef.current = false;
    setActiveDisasterType('tsunami');
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("aegisSimulating");
      sessionStorage.removeItem("atlasActiveDisasterType");
      sessionStorage.removeItem("atlas_evacuation_completed");
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
        const routeResults = findOptimalEvacuationRoutes(lat, lng, 99, settings.algorithm as 'dijkstra' | 'haversine');
        setRoutes(routeResults);
        if (tsunamiAlert) setSelectedRoute(0);
        setShowPanel(true);
        setIsCalculating(false);
        const isRealAlert = typeof window !== "undefined" && localStorage.getItem("aegisRealTsunami") === "true";
        saveHistoryRecord(routeResults, isRealAlert ? "real" : "simulation", [lat, lng]);
      }, 300);
    },
    [gpsTracking, saveHistoryRecord, settings.algorithm],
  );

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mapTileUrl = tsunamiAlert
    ? TILE_NORMAL // Force bright/normal map during emergency for better visibility
    : settings.cartographyTheme === "satellite-hud"
      ? TILE_SATELLITE
      : settings.cartographyTheme === "tactical-dark"
        ? TILE_DARK
        : TILE_NORMAL;

  const standardMapStyle = useMemo(() => ({
    version: 8 as const,
    sources: {
      "google-maps": {
        type: "raster" as const,
        tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
        tileSize: 256,
        attribution: "© Google Maps",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "google-maps-layer",
        type: "raster" as const,
        source: "google-maps",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  }), []);

  const tacticalDarkMapStyle = useMemo(() => ({
    version: 8 as const,
    sources: {
      "esri-dark-base": {
        type: "raster" as const,
        tiles: [
          "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri, HERE, Garmin, © OpenStreetMap",
        maxzoom: 16,
      },
      "esri-dark-reference": {
        type: "raster" as const,
        tiles: [
          "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri",
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: "esri-dark-base-layer",
        type: "raster" as const,
        source: "esri-dark-base",
        minzoom: 0,
        maxzoom: 22,
      },
      {
        id: "esri-dark-reference-layer",
        type: "raster" as const,
        source: "esri-dark-reference",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  }), []);

  const satelliteMapStyle = useMemo(() => ({
    version: 8 as const,
    sources: {
      "google-satellite": {
        type: "raster" as const,
        tiles: ["https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"],
        tileSize: 256,
        attribution: "© Google Maps Satellite",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "google-satellite-layer",
        type: "raster" as const,
        source: "google-satellite",
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  }), []);

  const activeMapStyles = useMemo(() => {
    const chosen =
      settings.cartographyTheme === "satellite-hud"
        ? satelliteMapStyle
        : settings.cartographyTheme === "tactical-dark"
          ? tacticalDarkMapStyle
          : standardMapStyle;
    return { light: chosen, dark: chosen };
  }, [settings.cartographyTheme, standardMapStyle, tacticalDarkMapStyle, satelliteMapStyle]);

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
        // Jika pengguna sudah berhasil evakuasi ke shelter di sesi ini, jangan bunyikan sirine lagi!
        if (isEvacuationCompletedRef.current || (typeof window !== "undefined" && sessionStorage.getItem('atlas_evacuation_completed') === 'true')) {
          return;
        }
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
        // ALWAYS restart GPS when tsunami activates so location is broadcast immediately
        gpsAutoStartedRef.current = true;
        arrivedFiredRef.current = false; // reset arrival so detection runs fresh
        arrivalShownRef.current = false; // reset so arrival modal can show this session
        sessionStorage.removeItem('aegisArrivalShown');
        setTimeout(() => startGpsTracking(), 300);
        sendTsunamiNotification(true);
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("aegisRealTsunami");
          sessionStorage.removeItem("atlas_evacuation_completed");
        }
        setIsEvacuationCompleted(false);
        isEvacuationCompletedRef.current = false;
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
          // Admin ping — show popup (even if tsunami just activated, state may lag slightly)
          if (!isAdminURL) {
            setAdminPing({
              fromName: ev.fromName,
              role: ev.role,
              fromId: ev.fromId,
              message: ev.message,
            });
          }
        } else {
          setHasFamilyPing(true);
          setIncomingFamilyPing({
            fromId: ev.fromId,
            fromName: ev.fromName || 'Unit Anggota',
            nik: ev.nik,
          });
          try {
            localStorage.setItem('atlas_pending_family_ping', JSON.stringify({
              fromId: ev.fromId,
              fromName: ev.fromName || 'Unit Anggota',
              nik: ev.nik,
              ts: Date.now()
            }));
          } catch {}
        }
      }
    }
    if (event.type === "PING_REPLY") {
      const ev = event as any;
      if (isAdminURL && ev.toId === terminalId) {
        // Instead of native alert, add to toast queue
        setPingReplies(prev => {
          const newReplies = [...prev, { id: ev.fromId, name: ev.fromName, nik: ev.nik, ts: Date.now() }];
          // Auto remove after 5s
          setTimeout(() => {
            setPingReplies(current => current.filter(r => r.ts !== newReplies[newReplies.length - 1].ts));
          }, 5000);
          return newReplies;
        });
      }
    }
    // Track lokasi user aktif untuk peta admin dan cache unit keluarga
    if (event.type === "LOCATION_UPDATE") {
      const ev = event as any;
      if (ev.id && ev.lat && ev.lng) {
        // Simpan ke cache lokal unit keluarga agar PC dan HP langsung bisa melihat lokasi
        try {
          const locs = JSON.parse(localStorage.getItem('aegisMemberLocs') ?? '{}');
          locs[ev.id] = { lat: ev.lat, lng: ev.lng, ts: Date.now() };
          localStorage.setItem('aegisMemberLocs', JSON.stringify(locs));
        } catch {}

        const updatedUser = {
          id: ev.id,
          name: ev.name || ev.id,
          nik: ev.nik || "",
          deviceModel: ev.deviceModel || "Unknown Device",
          lat: ev.lat,
          lng: ev.lng,
          battery: ev.battery,
          ts: Date.now(),
          isOffline: false,
        };
        setActiveUsers((prev) => ({ ...prev, [ev.id]: updatedUser }));
        // Update modal real-time jika sedang menampilkan user yang sama
        setSelectedUserInfo((prev) => prev?.id === ev.id ? { ...updatedUser } : prev);
      }
    }
    // Shelter ditambahkan oleh admin (dari device lain) — sync tanpa refresh
    if (event.type === "SHELTER_ADDED" && event.shelter) {
      addCustomShelter(event.shelter as any);
      setShelterVersion((v) => v + 1);
    }
    // Shelter diperbarui oleh admin (dari device lain) — sync tanpa refresh
    if (event.type === "SHELTER_UPDATED" && event.shelter) {
      const updated = event.shelter as any;
      const idx = shelters.findIndex((s) => s.id === updated.id);
      if (idx !== -1) {
        shelters[idx] = {
          ...shelters[idx],
          name: updated.name ?? shelters[idx].name,
          capacity: updated.capacity ?? shelters[idx].capacity,
          radiusMeters: updated.radiusMeters ?? shelters[idx].radiusMeters,
          address: updated.address ?? shelters[idx].address,
          customMessage: updated.customMessage !== undefined ? updated.customMessage : shelters[idx].customMessage,
        };
      }
      setShelterVersion((v) => v + 1);
    }
    // Shelter dihapus oleh admin — sync tanpa refresh
    if (event.type === "SHELTER_DELETED" && event.id) {
      const idx = shelters.findIndex((s) => s.id === event.id);
      if (idx !== -1) {
        shelters.splice(idx, 1);
        setShelterVersion((v) => v + 1);
        // If the deleted shelter is currently selected, unselect it
        if (selectedShelterId === event.id) {
          setSelectedShelterId(null);
        }
      }
    }
    // ── Hazard Zone Sync ──
    if (event.type === "HAZARD_ZONE_ADDED" && event.hazardZone) {
      if (!hazardZones.find(z => z.id === event.hazardZone!.id)) {
        hazardZones.push(event.hazardZone);
        setHazardZoneVersion(v => v + 1);
      }
    }
    if (event.type === "HAZARD_ZONE_UPDATED" && event.hazardZone) {
      const idx = hazardZones.findIndex(z => z.id === event.hazardZone!.id);
      if (idx !== -1) {
        hazardZones[idx] = event.hazardZone;
        setHazardZoneVersion(v => v + 1);
      }
    }
    if (event.type === "HAZARD_ZONE_DELETED" && event.id) {
      const idx = hazardZones.findIndex(z => z.id === event.id);
      if (idx !== -1) {
        hazardZones.splice(idx, 1);
        setHazardZoneVersion(v => v + 1);
        if (selectedHazardZoneId === event.id) {
          setSelectedHazardZoneId(null);
        }
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
          const timeSinceLastUpdate = now - next[id].ts;
          if (timeSinceLastUpdate > 600000) {
            // Delete if > 10 minutes
            delete next[id];
            changed = true;
          } else if (!next[id].isOffline && timeSinceLastUpdate > 60000) {
            // Mark offline if > 1 minute
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

    // Sembunyikan splash screen bawaan Capacitor begitu React termuat
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      SplashScreen.hide().catch(() => {});
    }).catch(() => {});

    // Konfigurasi Status Bar agar tidak menimpa header (overlaysWebView: false)
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
          StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
          StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
          StatusBar.setBackgroundColor({ color: '#07090E' }).catch(() => {});
        }).catch(() => {});
      }
    }).catch(() => {});

    // Inisialisasi izin & pelacakan secara tertib agar tidak memicu race condition pada dialog Android
    if (!isAdminURL) {
      setTimeout(() => {
        startGpsTracking();
      }, 700);
    }

    // Izin notifikasi darurat dijalankan setelah inisialisasi awal
    setTimeout(() => {
      requestNotifPermission();
      registerWebPush().catch(() => {});
    }, 2500);
    // 4b. Load custom shelters dari Supabase & Road Network
    loadRoadNetwork().then(success => setNetworkFailed(!success));
    aegisApi.fetchCustomShelters().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        shelters.length = 0;
        data.forEach(s => addCustomShelter(s as any));
        setShelterVersion(v => v + 1);
      }
      const curPos = userPosition || (typeof window !== "undefined" && localStorage.getItem('atlas_user_position') ? JSON.parse(localStorage.getItem('atlas_user_position')!) : null);
      if (curPos) {
        const routeResults = findOptimalEvacuationRoutes(
          curPos[0],
          curPos[1],
          99,
          settings.algorithm as 'dijkstra' | 'haversine',
        );
        lastRouteCalcResultsRef.current = routeResults;
        setRoutes(routeResults);
      }
    });
    aegisApi.fetchHazardZones().then(data => {
      hazardZones.length = 0;
      hazardZones.push(...data);
      setHazardZoneVersion(v => v + 1);
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
          if (sessionStorage.getItem('atlas_evacuation_completed') === 'true') {
            return;
          }
          if (typeof window !== "undefined") localStorage.setItem("aegisRealTsunami", "true");
          setTsunamiAlert(true);
          setActivePage("navigate");
        } else {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("atlas_evacuation_completed");
            if (localStorage.getItem("aegisRealTsunami") === "true") {
              localStorage.removeItem("aegisRealTsunami");
              setTsunamiAlert(false);
              if (!isAdminURL) setActivePage("status");
            }
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
    // 6. Listener status app & Deep Link URL Open (Capacitor & Web)
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appStateChange', () => {});
      CapApp.addListener('appUrlOpen', (event) => {
        if (!event?.url) return;
        try {
          const parsed = new URL(event.url);
          const joinFamily = parsed.searchParams.get('joinFamily');
          const code = parsed.searchParams.get('code') || parsed.searchParams.get('verifyCode');
          const inviteName = parsed.searchParams.get('inviteName');
          if (joinFamily) {
            localStorage.setItem('atlas_pending_join_family', joinFamily);
            if (code) localStorage.setItem('atlas_pending_join_code', code);
            if (inviteName) localStorage.setItem('atlas_pending_join_name', inviteName);
            setActivePage('family');
            window.dispatchEvent(new CustomEvent('atlas_deep_link_join', {
              detail: { joinFamily, code, inviteName }
            }));
          }
        } catch (_) {}
      });
    }).catch(() => {});

    // Web URL query param check
    if (typeof window !== 'undefined' && window.location.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const joinFamily = params.get('joinFamily');
        const code = params.get('code') || params.get('verifyCode');
        const inviteName = params.get('inviteName');
        if (joinFamily) {
          localStorage.setItem('atlas_pending_join_family', joinFamily);
          if (code) localStorage.setItem('atlas_pending_join_code', code);
          if (inviteName) localStorage.setItem('atlas_pending_join_name', inviteName);
          setActivePage('family');
          window.dispatchEvent(new CustomEvent('atlas_deep_link_join', {
            detail: { joinFamily, code, inviteName }
          }));
        }
      } catch (_) {}
    }
  }, []);

  // â”€â”€ PUBLIC USER layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Pages use fixed inset-0 z-[1800]; nav uses fixed z-[1900]
  if (userRole === "user") {
    return (
      <>
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
              userLocation={userLocationName}
              userName={userName}
              onRequestGps={!gpsTracking ? startGpsTracking : undefined}
              gpsTracking={gpsTracking}
              tsunamiAlert={tsunamiAlert}
              onOpenProfile={() => setShowProfileModal(true)}
              userPosition={userPosition}
              terminalId={terminalId}
              gempa={gempa}
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
              onCancelRoute={() => setSelectedRoute(undefined)}
              onSelectRoute={(idx) => setSelectedRoute(idx)}
              adminPing={adminPing}
              onAdminPingDismiss={() => {
                if (adminPing?.fromId) {
                  aegisApi.pingReply(terminalId, userName || "Pengguna", adminPing.fromId, userNik).catch(() => {});
                }
                setAdminPing(null);
              }}
              onStartGps={!gpsTracking ? startGpsTracking : undefined}
              onUpdateUserPosition={handleManualLocationUpdate}
              settings={{ algorithm: settings.algorithm }}
              isEvacuationCompleted={isEvacuationCompleted}
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
          {activePage === "menu" && (
            <MenuPage
              key="menu"
              onBack={() => setActivePage("status")}
              onNavigateHistory={() => setActivePage("history")}
              onCalibrateCompass={() => {
                // Calibration modal removed — navigates directly to tactical map
                setActivePage("navigate");
              }}
              userLocation={userLocationName}
            />
          )}
        </AnimatePresence>
        {/* HISTORY PAGE â€” "TACTICAL ARCHIVE"                        */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <AnimatePresence>
          {activePage === "history" && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[1800] flex flex-col bg-nerv-bg text-slate-200"
            >
              {/* A.T.L.A.S top bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-nerv-border bg-[#0B0F19] shrink-0">
                <button
                  onClick={() => setActivePage("status")}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors font-mono text-xs"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                  <span>KEMBALI</span>
                </button>
                <div className="text-center font-mono">
                  <span className="text-[10px] text-nerv-orange font-bold tracking-widest block uppercase">
                    A.T.L.A.S // ARCHIVE
                  </span>
                  <span className="text-xs font-bold text-white tracking-wider">
                    EVACUATION TELEMETRY LOGS
                  </span>
                </div>
                <div className="w-8 h-8 rounded bg-black/60 border border-nerv-border flex items-center justify-center font-mono text-xs text-nerv-cyan">
                  #03
                </div>
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
                        <p className="text-xl font-mono font-bold text-slate-500">
                          0 m
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-nerv-orange/20 border border-nerv-orange/40 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-nerv-orange" />
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
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1.5 font-mono">
                            <span className="text-slate-500">
                              Performance KPI
                            </span>
                            <span style={{ color }}>{label}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-nerv-border">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                            <span>0m</span>
                            <span className="text-slate-400">
                              Target &le; {target}m
                            </span>
                            <span>{target}m+</span>
                          </div>
                          {/* Trend bars */}
                          {evacuationHistory.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-nerv-border/60">
                              <p className="text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-bold">
                                Sesi Terakhir ({Math.min(evacuationHistory.length, 6)})
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
                                          opacity: 0.8,
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
                    <p className="text-[10px] text-slate-500 font-mono">
                      Jalankan simulasi untuk melihat statistik performa.
                    </p>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="px-5 pb-3 flex gap-2 shrink-0 overflow-x-auto font-mono">
                {[
                  { id: "all" as HistoryFilter, label: "ALL LOGS" },
                  { id: "real" as HistoryFilter, label: "REAL ALERTS" },
                  {
                    id: "simulation" as HistoryFilter,
                    label: "SIMULATION",
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHistoryFilter(tab.id)}
                    className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap transition-all border ${
                      historyFilter === tab.id
                        ? "bg-nerv-orange text-black border-nerv-orange shadow-[0_0_10px_rgba(255,87,34,0.35)]"
                        : "bg-black/60 text-slate-400 border-nerv-border hover:border-slate-500"
                    }`}
                  >
                    [{tab.label}]
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
                              <p className="text-xs font-black text-white font-mono">
                                {record.walkingTime != null
                                  ? `${record.walkingTime}m`
                                  : "-"}
                              </p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                                TIME
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white font-mono">
                                {record.distance != null
                                  ? `${record.distance.toFixed(1)}km`
                                  : "-"}
                              </p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
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

        {/* USER BOTTOM NAV — A.T.L.A.S Tactical Dock */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-[1900] flex items-center justify-around px-2 border-t backdrop-blur-xl bg-[#07090E]/95 border-nerv-border shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "64px",
          }}
        >
          {[
            { page: "status" as ActivePage, Icon: Home, label: lang === 'id' ? 'STATUS' : 'STATUS', code: "01" },
            {
              page: "navigate" as ActivePage,
              Icon: Navigation2,
              label: lang === 'id' ? 'NAVIGASI' : 'NAVIGATE',
              code: "02"
            },
            { page: "family" as ActivePage, Icon: Users, label: lang === 'id' ? 'UNIT' : 'UNITS', code: "03" },
            { page: "guides" as ActivePage, Icon: ShieldAlert, label: lang === 'id' ? 'PROTOKOL' : 'PROTOCOLS', code: "04" },
            { page: "menu" as ActivePage, Icon: Menu, label: lang === 'id' ? 'MENU' : 'MENU', code: "05" },
          ].map(({ page, Icon, label, code }) => {
            const isAlert = page === "navigate" && tsunamiAlert;
            const isFamilyAlert = page === "family" && hasFamilyPing;
            const isMenuUpdate = page === "menu" && hasMenuUnread;
            const isActive = activePage === page;
            return (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all group ${
                  isAlert
                    ? "text-nerv-red"
                    : isActive
                      ? "text-nerv-orange font-bold"
                      : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nervActiveNav"
                    className="absolute top-0 inset-x-2 h-0.5 bg-nerv-orange shadow-[0_0_8px_rgba(255,87,34,0.8)]"
                  />
                )}
                <div className="relative mb-0.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isAlert ? "animate-pulse text-nerv-red" : ""
                    }`}
                  />
                  {isAlert && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-nerv-red animate-ping block" />
                  )}
                  {isFamilyAlert && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-nerv-red block border-2 border-black" />
                  )}
                  {isMenuUpdate && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#07090E] animate-pulse block shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase leading-none">
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
          {/* Profile / Node Identity Settings */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all group text-slate-500 hover:text-slate-300"
            title="Pengaturan Identitas & Terminal"
          >
            <div className="relative mb-0.5">
              <Shield className="w-4 h-4 transition-transform group-hover:scale-110 text-nerv-cyan" />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase leading-none">
                {lang === 'id' ? 'PROFIL' : 'PROFILE'}
              </span>
            </div>
          </button>
          {/* Logout only shown when accessed via admin URL */}
          {isAdminURL && (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-2 px-4 text-slate-700 active:text-red-400 transition-colors"
            >
              <Lock className="w-5 h-5" />
              <span className="text-[9px] font-bold tracking-wider">
                KELUAR
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
                    <div className="mb-4 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/40">
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

                    {/* Pesan Khusus Shelter — hanya tampil jika ada isinya */}
                    {arrivalSummary.shelter.customMessage && (
                      <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/50 border border-amber-700/40">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-wider mb-1">Pesan dari Petugas Shelter</p>
                            <p className="text-xs text-amber-100/80 leading-relaxed">{arrivalSummary.shelter.customMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}

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
        </AnimatePresence>

        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userName={userName}
          userNik={userNik}
          terminalId={terminalId}
        />
      </div>
      {showVideoSplash && (
        <VideoSplash isAdmin={isAdminURL} onFinish={handleSplashFinish} />
      )}
      <AlertModal state={alertModal} onClose={() => setAlertModal(null)} />
      </>
    );
  }

  // â”€â”€ ADMIN layout (full tactical dashboard) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      <div
        className="w-full h-full bg-[#0b1120] text-slate-300 font-sans overflow-hidden flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* â•â•â• MOBILE HEADER â€” 2-row compact layout for all screen sizes â•â•â• */}
      <header
        className={`md:hidden shrink-0 z-50 relative transition-colors duration-500 backdrop-blur-md w-full overflow-hidden
        ${tsunamiAlert ? "bg-red-950/95 border-b border-red-900/50" : "bg-[#0a1020]/95 border-b border-slate-800/60"}`}
      >
        {/* Row 1: Brand + Menu #1 SIARAN + SIMULASI buttons */}
        <div className="flex items-center justify-between gap-1.5 px-2.5 pt-2 pb-1 w-full">
          {/* Brand */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tsunamiAlert ? "bg-red-500/20 border border-red-500/30" : "bg-indigo-500/20 border border-indigo-500/30"}`}
            >
              <Shield
                className={`w-3.5 h-3.5 ${tsunamiAlert ? "text-red-400" : "text-indigo-400"}`}
              />
            </div>
            <div className="min-w-0 flex items-center gap-1">
              <h1 className="text-white font-black text-xs sm:text-sm tracking-wider leading-none font-mono shrink-0">
                A.T.L.A.S
              </h1>
              <span className="text-[8px] text-nerv-orange font-mono font-bold px-1 py-0.2 rounded bg-nerv-orange/10 border border-nerv-orange/30 shrink-0">
                KOMANDO
              </span>
            </div>
          </div>

          {/* Action buttons (Menu #1 SIARAN + SIMULASI) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* MENU NO. 1: SIARAN KOMANDO */}
            <button
              onClick={() => setShowAdminBroadcastModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] shrink-0 active:scale-95 transition-all shadow-xs"
              title="Konsol Siaran Darurat Komando (Menu #1)"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="tracking-wide">SIARAN</span>
              {adminBroadcastList.length > 0 ? (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center shrink-0">
                  {adminBroadcastList.length}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              )}
            </button>

            {/* SIMULASI button */}
            <button
              onClick={() =>
                tsunamiAlert || isEvacuationCompleted
                  ? deactivateTsunamiAlert()
                  : setShowTsunamiConfirm(true)
              }
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] active:scale-95 transition-all min-h-0
                ${tsunamiAlert ? "bg-red-500/30 text-red-200 border border-red-500/50" : isEvacuationCompleted ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/50" : "bg-red-600 hover:bg-red-500 text-white"}`}
              title="Simulasi Respon Tanggap Bencana"
            >
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${tsunamiAlert ? "bg-red-400 animate-pulse" : isEvacuationCompleted ? "bg-emerald-400" : "bg-red-300"}`}
              />
              <span>{tsunamiAlert ? "STOP" : isEvacuationCompleted ? "RESET" : "SIMULASI"}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Location subtitle + Status chips */}
        <div className="flex items-center justify-between gap-1 px-2.5 pb-1.5 text-[9px] font-mono border-t border-slate-800/40 pt-1 w-full">
          <div className="text-nerv-orange truncate min-w-0 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-nerv-orange/80 shrink-0" />
            <span className="truncate">
              POSKO KOMANDO · {userLocationName ? userLocationName.split(' // ')[0] : 'PALU SELATAN'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0
              ${tsunamiAlert ? "bg-red-900/50 border-red-700/50 text-red-300" : "bg-emerald-900/30 border-emerald-700/30 text-emerald-400"}`}
            >
              <Radio className={`w-2 h-2 ${tsunamiAlert ? "animate-pulse" : ""}`} />
              <span>SENSOR</span>
            </div>
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0
              ${gpsTracking ? "bg-indigo-900/50 border-indigo-700/50 text-indigo-300" : "bg-slate-800/50 border-slate-700/50 text-slate-500"}`}
            >
              <Satellite className={`w-2 h-2 ${gpsTracking ? "animate-pulse" : ""}`} />
              <span>{gpsTracking ? "GPS" : "OFF"}</span>
            </div>
            {gpsAccuracy !== null && (
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0
                ${
                  gpsAccuracy <= 20
                    ? "bg-emerald-900/30 border-emerald-700/30 text-emerald-400"
                    : gpsAccuracy <= 50
                      ? "bg-amber-900/30 border-amber-700/30 text-amber-400"
                      : "bg-red-900/30 border-red-700/30 text-red-400"
                }`}
              >
                <Crosshair className="w-2 h-2" />
                <span>±{Math.round(gpsAccuracy)}m</span>
              </div>
            )}
          </div>
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
            <div className="flex items-center gap-2">
              <h1 className="text-white font-black text-sm tracking-widest leading-none font-mono">
                A.T.L.A.S
              </h1>
              <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                (Autonomous Threat Location & Alert System)
              </span>
            </div>
            <p className="text-[9px] text-nerv-orange font-mono mt-0.5">
              AUTONOMOUS THREAT LOCATION & ALERT SYSTEM · {userLocationName ? userLocationName.split(' // ')[0] : 'REGIONAL NODE'}
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
            onClick={() => setShowAdminBroadcastModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all shadow-sm"
            title="Buka Konsol Siaran Darurat Komando"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>SIARAN KOMANDO</span>
            {adminBroadcastList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-mono font-bold flex items-center justify-center">
                {adminBroadcastList.length}
              </span>
            )}
          </button>
          <button
            onClick={() =>
              tsunamiAlert || isEvacuationCompleted
                ? deactivateTsunamiAlert()
                : setShowTsunamiConfirm(true)
            }
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all
              ${tsunamiAlert ? "bg-red-500/20 text-red-200 border border-red-500/50" : isEvacuationCompleted ? "bg-emerald-900/40 text-emerald-300 border border-emerald-500/50" : "bg-red-600 hover:bg-red-500 text-white border border-transparent"}`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${tsunamiAlert ? "animate-pulse text-red-400" : isEvacuationCompleted ? "text-emerald-400" : ""}`}
            />
            {tsunamiAlert ? "HENTIKAN SIMULASI" : isEvacuationCompleted ? "RESET SIMULASI" : "SIMULASI TSUNAMI"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all shrink-0"
            title="Logout"
          >
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider">LOGOUT</span>
          </button>
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
            <>
              {/* Mobile Sidebar Backdrop */}
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLeftSidebar(false)}
                className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs lg:hidden"
              />

              <motion.aside
                key="sidebar-panel"
                initial={{ x: -240, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -240, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                className="fixed top-0 bottom-0 left-0 z-[1200] lg:static lg:z-40 bg-[#0b1120] border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto whitespace-nowrap shadow-2xl lg:shadow-none w-[240px] lg:w-[220px]"
              >
                <div className="w-full flex-1 flex flex-col">
                  <div className="p-5 pb-2 flex items-start justify-between">
                    <div>
                      <h3 className="text-[10px] font-bold text-nerv-orange tracking-widest uppercase mb-1">
                        A.T.L.A.S
                      </h3>
                      <p className="text-[9px] text-slate-400 font-mono tracking-tight leading-tight whitespace-normal">
                        Autonomous Threat Location & Alert System
                      </p>
                    </div>
                    <button
                      onClick={() => setShowLeftSidebar(false)}
                      className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white lg:hidden ml-2 transition-colors"
                      title="Tutup Menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* MENU NO. 1: KONSOL SIARAN KOMANDO */}
                  <div className="px-3 pt-3 pb-2">
                    <button
                      onClick={() => {
                        setShowAdminBroadcastModal(true);
                        if (window.innerWidth < 1024) setShowLeftSidebar(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all shadow-sm text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs tracking-wide text-amber-200">
                            SIARAN KOMANDO
                          </span>
                          {adminBroadcastList.length > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-mono font-bold flex items-center justify-center">
                              {adminBroadcastList.length}
                            </span>
                          ) : (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded px-1 font-mono font-bold">
                              SIAP
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-amber-400/70 font-mono truncate">
                          Konsol Siaran Darurat Resmi
                        </p>
                      </div>
                    </button>
                  </div>

                  <nav className="flex-1 mt-1">
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
                        onClick={() => {
                          setActivePage(page);
                          if (window.innerWidth < 1024) setShowLeftSidebar(false);
                        }}
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
                      onClick={() => {
                        setShowAddShelter(true);
                        if (window.innerWidth < 1024) setShowLeftSidebar(false);
                      }}
                      className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 transition-colors mb-4"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide">
                        TAMBAH SHELTER
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setDrawingZoneMode(true);
                        setDrawingZoneCoords([]);
                        setManualBackOverrides({});
                        setDrawingZoneDepthKm(0.2);
                        setDrawingZoneFlipSide(false);
                        if (window.innerWidth < 1024) setShowLeftSidebar(false);
                      }}
                      className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors mb-4"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-semibold text-sm tracking-wide">
                        ZONA BAHAYA
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setShowShelters(true);
                        if (window.innerWidth < 1024) setShowLeftSidebar(false);
                      }}
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
            </>
          )}
        </AnimatePresence>

        {/* â•â•â• CENTER MAP â•â•â• */}
        <main className="flex-1 relative z-0 bg-[#0b1120]">
          {/* Admin: GPS badges dihapus - admin hanya memantau, tidak navigasi */}

          {/* Admin A.T.L.A.S Tactical Search Bar */}
          {isAdminURL && (
            <div className="absolute top-3 left-3 right-3 sm:right-auto sm:left-4 sm:top-4 z-[900] sm:w-80 pointer-events-auto">
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-nerv-border shadow-[0_4px_25px_rgba(0,0,0,0.6)] focus-within:border-nerv-orange transition-all">
                  <Search className="w-4 h-4 text-nerv-orange shrink-0" />
                  <input
                    type="text"
                    value={adminUserSearch}
                    onChange={(e) => setAdminUserSearch(e.target.value)}
                    placeholder="CARI NAMA / NIK KTP..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none"
                  />
                  {adminUserSearch && (
                    <button
                      onClick={() => setAdminUserSearch("")}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Hasil Pencarian */}
                <AnimatePresence>
                  {adminUserSearch.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-nerv-card/95 backdrop-blur-xl border border-nerv-border rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-nerv-border/60 font-mono"
                    >
                      <div className="px-3 py-1.5 bg-black/60 text-[9px] font-bold text-nerv-cyan uppercase tracking-widest flex items-center justify-between">
                        <span>HASIL PENCARIAN</span>
                        <span>{adminFilteredUsers.length} DITEMUKAN</span>
                      </div>

                      {adminFilteredUsers.length === 0 ? (
                        <div className="p-3 text-center text-[10px] text-slate-400 font-sans">
                          Tidak ditemukan personel dengan nama atau NIK tersebut.
                        </div>
                      ) : (
                        adminFilteredUsers.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setViewport((v) => ({ ...v, center: [u.lng, u.lat], zoom: 17 }));
                              setSelectedUserInfo({ ...u });
                              setAdminUserSearch("");
                            }}
                            className="p-2.5 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isOffline ? 'bg-slate-500' : 'bg-nerv-green animate-pulse'}`} />
                                <span className="text-xs font-bold text-white truncate">{u.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-nerv-cyan mt-0.5">
                                <CreditCard className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{u.nik ? `NIK: ${u.nik}` : 'NIK: BELUM TERDAFTAR'}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] text-slate-400 block">{u.battery !== undefined ? `${u.battery}%` : 'N/A'}</span>
                              <span className="text-[8px] text-nerv-orange uppercase font-bold">FOKUS ➔</span>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* BMKG OVERLAY */}
          {gempa && !isGempaDismissed && (
            <div className="absolute top-[62px] sm:top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[600] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl sm:w-[90%] sm:max-w-sm">
              <button
                onClick={handleDismissGempa}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-10"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">INFO GEMPA BMKG</h3>
                    <span className="text-[10px] font-bold text-slate-400 ml-2 shrink-0">{gempa.Jam.split(' ')[0]}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Mag: {gempa.Magnitude} • Kedalaman: {gempa.Kedalaman}</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5 break-words">{gempa.Wilayah}</p>
                  <p className={`text-[10px] font-bold mt-1 ${gempa.Potensi.toLowerCase().includes('tsunami') ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {gempa.Potensi}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drawing Zone Overlay — draggable */}
          <AnimatePresence>
            {drawingZoneMode && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                drag
                dragControls={zoneDragControls}
                dragListener={false}
                dragMomentum={false}
                dragElastic={0}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-red-500/50 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 w-[320px]"
              >
                {/* Drag handle — title row */}
                <div
                  className="flex items-center gap-2 select-none"
                  onPointerDown={(e) => zoneDragControls.start(e)}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                >
                  <MapPin className="w-4 h-4 text-red-400 animate-bounce" />
                  <span className="text-sm font-bold text-white">Mode Gambar Zona</span>
                  {/* Grab hint dots */}
                  <span className="ml-auto text-slate-600 text-xs tracking-widest select-none" title="Geser panel">⠿</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center">Klik tepi laut untuk menambah titik. Klik-kanan titik untuk hapus.</p>

                {/* Guard 3: Self-crossing warning */}
                {zoneLineSelfCrossing && (
                  <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/40">
                    <span className="text-yellow-400 text-xs leading-none mt-0.5">⚠️</span>
                    <p className="text-[10px] text-yellow-300 font-semibold leading-snug">
                      Garis pantai menyilang diri sendiri — cek titik yang baru ditambah
                    </p>
                  </div>
                )}

                {/* Depth slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold">Kedalaman ke Darat</span>
                    <span className="text-[10px] text-amber-400 font-black">{Math.round(drawingZoneDepthKm * 1000)} m</span>
                  </div>
                  <input
                    type="range" min={50} max={1000} step={10}
                    value={Math.round(drawingZoneDepthKm * 1000)}
                    onChange={e => setDrawingZoneDepthKm(Number(e.target.value) / 1000)}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                {/* Flip side button */}
                <button
                  onClick={() => {
                    setDrawingZoneFlipSide(f => !f);
                    // Clear manual overrides — they point to the wrong side after flip
                    setManualBackOverrides({});
                  }}
                  className="py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-colors"
                >
                  {drawingZoneFlipSide ? '↩ Balik ke Sisi Semula' : '↪ Balik Sisi (ke Laut?)'}
                </button>

                {/* Guard 2: Undo last point button */}
                <button
                  id="zone-undo-last-point"
                  onClick={() => setDrawingZoneCoords(prev => prev.slice(0, -1))}
                  disabled={drawingZoneCoords.length === 0}
                  className="py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/50 text-slate-300 text-[10px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  ↩ Undo Titik Terakhir
                </button>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setDrawingZoneMode(false);
                      setDrawingZoneCoords([]);
                      setDrawingZoneBackCoords([]);
                      setManualBackOverrides({});
                      setDrawingZoneDepthKm(0.2);
                      setDrawingZoneFlipSide(false);
                      setZoneLineSelfCrossing(false);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (drawingZoneCoords.length < 2) return;
                      setDrawingZoneMode(false);
                      setShowAddHazardZone(true);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      drawingZoneCoords.length >= 2 ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-900/50 text-red-300/50 cursor-not-allowed"
                    }`}
                  >
                    Selesai ({drawingZoneCoords.length})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                className="flex md:hidden fixed bottom-[68px] left-1/2 -translate-x-1/2 z-[1800] items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white shadow-[0_4px_24px_rgba(99,102,241,0.6)] border border-indigo-400/30 active:scale-95 transition-transform"
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

            <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => {
                setViewport(v => ({ ...v, bearing: 0 }));
                setAdminMapBearing(0);
              }}
                title="Reset Arah Peta ke Utara"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/90 border border-slate-700/60 shadow-lg hover:bg-slate-800 transition-colors"
                style={{ transform: `rotate(${-adminMapBearing}deg)`, transition: 'transform 0.2s' }}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>
                  <polygon points="12,3 14,12 12,10 10,12" fill="#ef4444"/>
                  <polygon points="12,21 14,12 12,14 10,12" fill="#94a3b8"/>
                  <circle cx="12" cy="12" r="2" fill="#fff"/>
                </svg>
              </button>
            </div>

          {/* Map â€” rotation enabled via leaflet-rotate (2-finger mobile, Shift+drag desktop) */}
          <Map
            ref={adminMapRef}
            viewport={viewport}
            styles={activeMapStyles}
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

            {/* Drawing Zone Live Rendering — active only while drawing.
                Fill: SATU ring polygon (depan + belakang dibalik), lalu self-union via
                polygon-clipping untuk otomatis membersihkan self-intersection jadi
                bagian-bagian valid — jauh lebih simpel & lebih tahan banting daripada
                pendekatan "banyak quad kecil" yang rawan menumpuk gelap di tikungan tajam.
                Outline: dua LineString terpisah (depan & belakang). */}
            {drawingZoneMode && (() => {
              const safeLen = Math.min(drawingZoneCoords.length, drawingZoneBackCoords.length);
              if (safeLen < 2) return null;
              const front = drawingZoneCoords.slice(0, safeLen);
              const back  = drawingZoneBackCoords.slice(0, safeLen);
              const color = ZRB_REFERENCE[newHazardZone.zrbLevel].color;

              // Render fill sebagai FeatureCollection dari quad-strips kecil.
              // Menggunakan FeatureCollection dengan Feature terpisah (bukan MultiPolygon)
              // mencegah MapLibre melakukan XOR pada area yang overlap (yang menyebabkan lubang abu-abu).
              const quadFeatures: any[] = [];
              for (let i = 0; i < safeLen - 1; i++) {
                const f0: [number,number] = [front[i][1], front[i][0]];
                const f1: [number,number] = [front[i+1][1], front[i+1][0]];
                const b0: [number,number] = [back[i][1], back[i][0]];
                const b1: [number,number] = [back[i+1][1], back[i+1][0]];
                let quadRing = [f0, b0, b1, f1, f0];
                
                // Pastikan CCW untuk mencegah earcut menghasilkan triangle raksasa/rusak
                let area = 0;
                for (let k = 0; k < quadRing.length - 1; k++) {
                  area += quadRing[k][0] * quadRing[k+1][1] - quadRing[k+1][0] * quadRing[k][1];
                }
                if (area < 0) {
                  quadRing = quadRing.slice(0, -1).reverse();
                  quadRing.push([...quadRing[0]] as [number,number]);
                }

                quadFeatures.push({
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [quadRing]
                  }
                });
              }

              return (
                <>
                  <MapGeoJSON
                    key="zone-preview-fill"
                    id="zone-preview-fill"
                    data={{ type: 'FeatureCollection', features: quadFeatures } as any}
                    fillPaint={{ 'fill-color': color, 'fill-opacity': 0.45 }}
                  />
                  <MapGeoJSON
                    key="zone-preview-front-line"
                    id="zone-preview-front-line"
                    data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: front.map(c => [c[1], c[0]]) } } as any}
                    linePaint={{ 'line-color': zoneLineSelfCrossing ? '#f97316' : color, 'line-width': zoneLineSelfCrossing ? 3 : 2.5, 'line-opacity': 0.95 }}
                  />
                  <MapGeoJSON
                    key="zone-preview-back-line"
                    id="zone-preview-back-line"
                    data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: back.map(c => [c[1], c[0]]) } } as any}
                    linePaint={{ 'line-color': color, 'line-width': 1.5, 'line-dasharray': [5, 4], 'line-opacity': 0.8 }}
                  />
                </>
              );
            })()}

            
            {/* Render markers for drawing zone coords — draggable, hoverable, deletable */}
            {drawingZoneCoords.map((coord, i) => (
              <MapMarker
                key={`draw-${i}`}
                latitude={coord[0]}
                longitude={coord[1]}
                draggable={true}
                onDragEnd={({ lat, lng }) => {
                  // Set guard so the map's click handler doesn't add a new point
                  markerJustDraggedRef.current = true;
                  setTimeout(() => { markerJustDraggedRef.current = false; }, 150);
                  setDrawingZoneCoords(prev => {
                    const next = [...prev];
                    next[i] = [lat, lng];
                    return next;
                  });
                }}
              >
                <MarkerContent>
                  <div
                    className="draw-zone-dot rounded-full border-2 border-white transition-all duration-100"
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: ZRB_REFERENCE[newHazardZone.zrbLevel].color,
                      cursor: 'grab',
                      boxShadow: `0 0 6px ${ZRB_REFERENCE[newHazardZone.zrbLevel].color}88`,
                      transform: 'translate(-7px, -7px)',
                    }}
                    title={`Titik ${i + 1} — klik-kanan untuk hapus`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDrawingZoneCoords(prev => prev.filter((_, idx) => idx !== i));
                      // Reindex manual back overrides: shift indices > i down by 1
                      setManualBackOverrides(prev => {
                        const next: Record<number, [number, number]> = {};
                        for (const k in prev) {
                          const ki = Number(k);
                          if (ki < i) next[ki] = prev[ki];
                          else if (ki > i) next[ki - 1] = prev[ki];
                          // ki === i is dropped
                        }
                        return next;
                      });
                    }}
                    onTouchStart={(() => {
                      let timer: ReturnType<typeof setTimeout> | null = null;
                      return (e: React.TouchEvent) => {
                        e.stopPropagation();
                        timer = setTimeout(() => {
                          setDrawingZoneCoords(prev => prev.filter((_, idx) => idx !== i));
                          setManualBackOverrides(prev => {
                            const next: Record<number, [number, number]> = {};
                            for (const k in prev) {
                              const ki = Number(k);
                              if (ki < i) next[ki] = prev[ki];
                              else if (ki > i) next[ki - 1] = prev[ki];
                            }
                            return next;
                          });
                          timer = null;
                        }, 500);
                        (e.currentTarget as HTMLElement).addEventListener(
                          'touchend',
                          () => { if (timer !== null) clearTimeout(timer); },
                          { once: true },
                        );
                        (e.currentTarget as HTMLElement).addEventListener(
                          'touchmove',
                          () => { if (timer !== null) clearTimeout(timer); },
                          { once: true },
                        );
                      };
                    })()}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.width = '18px';
                      (e.currentTarget as HTMLElement).style.height = '18px';
                      (e.currentTarget as HTMLElement).style.transform = 'translate(-9px, -9px)';
                      (e.currentTarget as HTMLElement).style.cursor = 'grab';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.width = '14px';
                      (e.currentTarget as HTMLElement).style.height = '14px';
                      (e.currentTarget as HTMLElement).style.transform = 'translate(-7px, -7px)';
                    }}
                    onMouseDown={e => {
                      (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
                    }}
                    onMouseUp={e => {
                      (e.currentTarget as HTMLElement).style.cursor = 'grab';
                    }}
                  />
                </MarkerContent>
              </MapMarker>
            ))}

            {/* Back-line markers — draggable, distinct style (yellow border) */}
            {drawingZoneMode && drawingZoneBackCoords.map((coord, i) => (
              <MapMarker
                key={`draw-back-${i}`}
                latitude={coord[0]}
                longitude={coord[1]}
                draggable={true}
                onDragEnd={({ lat, lng }) => {
                  markerJustDraggedRef.current = true;
                  setTimeout(() => { markerJustDraggedRef.current = false; }, 150);
                  setManualBackOverrides(prev => ({ ...prev, [i]: [lat, lng] }));
                }}
              >
                <MarkerContent>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: '#1e293b',
                      border: '2px solid #facc15',
                      borderRadius: '50%',
                      cursor: 'grab',
                      transform: 'translate(-6px, -6px)',
                      boxShadow: '0 0 5px rgba(250,204,21,0.5)',
                    }}
                    title={`Titik belakang ${i + 1} — klik-kanan untuk reset ke posisi otomatis`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setManualBackOverrides(prev => { const next = {...prev}; delete next[i]; return next; });
                    }}
                    onTouchStart={(() => {
                      let timer: ReturnType<typeof setTimeout> | null = null;
                      return (e: React.TouchEvent) => {
                        e.stopPropagation();
                        timer = setTimeout(() => {
                          setManualBackOverrides(prev => { const next = {...prev}; delete next[i]; return next; });
                          timer = null;
                        }, 500);
                        (e.currentTarget as HTMLElement).addEventListener('touchend', () => { if (timer !== null) clearTimeout(timer); }, { once: true });
                        (e.currentTarget as HTMLElement).addEventListener('touchmove', () => { if (timer !== null) clearTimeout(timer); }, { once: true });
                      };
                    })()}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.width = '16px';
                      (e.currentTarget as HTMLElement).style.height = '16px';
                      (e.currentTarget as HTMLElement).style.transform = 'translate(-8px, -8px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.width = '12px';
                      (e.currentTarget as HTMLElement).style.height = '12px';
                      (e.currentTarget as HTMLElement).style.transform = 'translate(-6px, -6px)';
                    }}
                    onMouseDown={e => { (e.currentTarget as HTMLElement).style.cursor = 'grabbing'; }}
                    onMouseUp={e => { (e.currentTarget as HTMLElement).style.cursor = 'grab'; }}
                  />
                </MarkerContent>
              </MapMarker>
            ))}

            {/* Hazard zones */}
            {settings.showHazardZones &&
              hazardZones.map((zone, i) => {
                const isSelected = selectedHazardZoneId === zone.id;
                const color = ZRB_REFERENCE[zone.zrbLevel]?.color || '#ef4444';
                return (
                  <Fragment key={`hazard-group-${i}-${hazardZoneVersion}`}>
                    {/* Fill layer */}
                    <MapGeoJSON 
                      key={`hazard-fill-${i}-${hazardZoneVersion}`}
                      data={{
                        type: 'FeatureCollection',
                        features: (() => {
                          const pts = zone.coords.map(c => [c[1], c[0]]);
                          const isClosed = pts.length > 3 && pts[0][0] === pts[pts.length-1][0] && pts[0][1] === pts[pts.length-1][1];
                          
                          if (isClosed) {
                            // Jika Polygon biasa (tertutup), render sebagai satu Polygon
                            let ring = [...pts];
                            let area2 = 0;
                            for (let i = 0; i < ring.length - 1; i++) {
                              area2 += ring[i][0] * ring[i+1][1] - ring[i+1][0] * ring[i][1];
                            }
                            if (area2 < 0) ring = ring.slice(0, -1).reverse().concat([[...ring[ring.length-1]]]);
                            return [{
                              type: 'Feature', properties: { id: zone.id },
                              geometry: { type: 'Polygon', coordinates: [ring] }
                            }];
                          } else {
                            // Jika digambar pakai tool (front + back_reversed), render sebagai kumpulan quad
                            // untuk menghindari lubang abu-abu akibat earcut error atau XOR.
                            const nF = Math.floor(pts.length / 2);
                            const front = pts.slice(0, nF);
                            const back = [...pts.slice(nF)].reverse();
                            const quadFeatures: any[] = [];
                            for (let j = 0; j < Math.min(front.length, back.length) - 1; j++) {
                              const f0 = front[j], f1 = front[j+1], b0 = back[j], b1 = back[j+1];
                              let quadRing = [f0, b0, b1, f1, f0];
                              
                              let area = 0;
                              for (let k = 0; k < quadRing.length - 1; k++) {
                                area += quadRing[k][0] * quadRing[k+1][1] - quadRing[k+1][0] * quadRing[k][1];
                              }
                              if (area < 0) {
                                quadRing = quadRing.slice(0, -1).reverse();
                                quadRing.push([...quadRing[0]]);
                              }

                              quadFeatures.push({
                                type: 'Feature', properties: { id: zone.id },
                                geometry: { type: 'Polygon', coordinates: [quadRing] }
                              });
                            }
                            return quadFeatures;
                          }
                        })()
                      } as any}
                      fillPaint={{ 'fill-color': tsunamiAlert ? '#ff0000' : color, 'fill-opacity': tsunamiAlert ? 0.5 : (isSelected ? 0.6 : 0.45) }}
                      fillHoverPaint={{ 'fill-opacity': 0.3 }}
                      interactive={!drawingZoneMode}
                      onClick={() => {
                        if (!drawingZoneMode) {
                          setSelectedHazardZoneId(isSelected ? null : zone.id);
                          setSelectedZoneInfo(zone);
                        }
                      }}
                    />
                    {/* Outline — satu garis penuh mengelilingi zona */}
                    <MapGeoJSON
                      key={`hazard-outline-${i}-${hazardZoneVersion}`}
                      data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: (() => {
                        const pts = zone.coords.map(c => [c[1], c[0]]);
                        // tutup garis supaya outline tertutup sempurna
                        if (pts.length > 0 && (pts[0][0] !== pts[pts.length-1][0] || pts[0][1] !== pts[pts.length-1][1])) {
                          pts.push([...pts[0]]);
                        }
                        return pts;
                      })() } } as any}
                      linePaint={{ 'line-color': tsunamiAlert ? '#ff0000' : color, 'line-width': tsunamiAlert ? 3 : (isSelected ? 3 : 2.5), 'line-opacity': 1 }}
                    />
                    <MapMarker latitude={polygonCentroid(zone.coords)[0]} longitude={polygonCentroid(zone.coords)[1]}>
                      <MarkerContent>
                        <div style={{ pointerEvents: 'none' }} className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-sm">
                          {zone.name}
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  </Fragment>
                );
              })}


            {/* Temporary Marker for Add Shelter Mode */}
            {((showAddShelter || pickingLocationMode) && newShelter.lat && newShelter.lng) && !isNaN(parseFloat(newShelter.lat)) && (
              <>
                <MapGeoJSON
                  data={createCirclePolygon(parseFloat(newShelter.lat), parseFloat(newShelter.lng), (parseFloat(newShelter.radius) || 50) / 1000) as any}
                  fillPaint={{ 'fill-color': '#6366f1', 'fill-opacity': 0.2 }}
                  linePaint={{ 'line-color': '#6366f1', 'line-width': 2 }}
                />
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
              </>
            )}

            {/* Selected Shelter Radius */}
            {(selectedShelterId || (showEditShelter && editShelterData)) && (() => {
              let lat: number, lng: number, radius: number;
              if (showEditShelter && editShelterData) {
                lat = parseFloat(editShelterData.lat);
                lng = parseFloat(editShelterData.lng);
                radius = parseFloat(editShelterData.radius) || 50;
              } else {
                const s = shelters.find(s => s.id === selectedShelterId);
                if (!s) return null;
                lat = s.lat;
                lng = s.lng;
                radius = s.radiusMeters ?? 50;
              }
              if (!isNaN(lat) && !isNaN(lng)) {
                return (
                  <Fragment key={`shelter-overlay-${selectedShelterId || 'edit'}`}>
                    {/* Safe Zone Proximity Threshold Perimeter (settings.safeZoneRadius) */}
                    <MapGeoJSON
                      id={`safe-zone-perimeter-${selectedShelterId || 'edit'}`}
                      data={createCirclePolygon(lat, lng, settings.safeZoneRadius) as any}
                      fillPaint={{ 'fill-color': '#10b981', 'fill-opacity': 0.05 }}
                      linePaint={{ 'line-color': '#10b981', 'line-width': 1.5, 'line-dasharray': [4, 4] }}
                    />
                    {/* Exact Shelter Arrival Zone (radiusMeters) */}
                    <MapGeoJSON
                      id={`shelter-arrival-zone-${selectedShelterId || 'edit'}`}
                      data={createCirclePolygon(lat, lng, radius / 1000) as any}
                      fillPaint={{ 'fill-color': '#6366f1', 'fill-opacity': 0.18 }}
                      linePaint={{ 'line-color': '#6366f1', 'line-width': 2, 'line-dasharray': [2, 2] }}
                    />
                  </Fragment>
                );
              }
              return null;
            })()}

            {/* Shelters */}
            {shelters.map((shelter) => {
              const isSelected = selectedShelterId === shelter.id;
              return (
                <MapMarker
                  key={`${shelter.id}-${shelterVersion}`}
                  longitude={shelter.lng}
                  latitude={shelter.lat}
                  onClick={() => {
                    setSelectedShelterId(shelter.id);
                    setViewport((v) => ({ ...v, center: [shelter.lng, shelter.lat], zoom: 17 }));
                    adminMapRef.current?.flyTo({ center: [shelter.lng, shelter.lat], zoom: 17, duration: 1200, essential: true });
                  }}
                >
                  <MarkerContent>
                    <div style={{
                      width: 34, height: 34,
                      background: isSelected ? '#6366f1' : '#334155',
                      border: `2.5px solid ${isSelected ? '#a5b4fc' : '#fff'}`,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isSelected
                        ? '0 0 18px rgba(99,102,241,0.8), 0 0 6px rgba(0,0,0,0.5)'
                        : '0 0 12px rgba(0,0,0,0.5)',
                      fontSize: 14, lineHeight: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>🏠</div>
                  </MarkerContent>

                  {/* TOOLTIP on hover */}
                  <MarkerTooltip>
                    <p className="font-bold text-xs leading-snug">{shelter.name}</p>
                    {shelter.address && (
                      <p className="text-[10px] opacity-70 mt-0.5 leading-snug">{shelter.address}</p>
                    )}
                  </MarkerTooltip>
                </MapMarker>
              );
            })}

            {/* -- LOKASI USER AKTIF (Hanya Ditampilkan Saat Darurat Aktif / Simulasi / Dicari Resmi) -- */}
            {usersToRenderOnMap.map((u) => (
              <MapMarker
                key={`user-${u.id}`}
                longitude={u.lng}
                latitude={u.lat}
              >
                <MarkerContent>
                  <div
                    onClick={(e) => { e.stopPropagation(); setSelectedUserInfo({ ...u }); }}
                    style={{ position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                  >
                    {/* Avatar circle — compact, no animation */}
                    <div style={{
                      background: u.isOffline ? '#475569' : '#f59e0b',
                      border: `2px solid ${u.isOffline ? '#64748b' : '#fffbeb'}`,
                      borderRadius: '50%',
                      width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 1px 6px ${u.isOffline ? 'rgba(0,0,0,0.4)' : 'rgba(245,158,11,0.5)'}`,
                      fontSize: 11,
                      opacity: u.isOffline ? 0.65 : 1,
                    }}>👤</div>
                    {/* Name tag */}
                    <div style={{
                      background: u.isOffline ? 'rgba(71,85,105,0.92)' : 'rgba(245,158,11,0.92)',
                      color: u.isOffline ? '#cbd5e1' : '#000',
                      fontSize: 8, fontWeight: 800,
                      padding: '1px 4px', borderRadius: 4,
                      maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.5,
                    }}>{u.name}{u.battery !== undefined ? ` · ${u.battery}%` : ''}</div>
                  </div>
                </MarkerContent>
              </MapMarker>
            ))}

            {!isAdminURL &&
              routes.map((route, i) => {
                const isSelected = i === selectedRoute;
                return (
                  <MapRoute
                    key={`road-${i}`}
                    coordinates={route.coordinates.map(c => [c[1], c[0]])}
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
                  {routes.map((route, i) => {
                    const targetShelter = shelters.find(
                      (s) => s.id === route.shelterId || s.name.toLowerCase().trim() === route.shelterName.toLowerCase().trim()
                    );
                    const handleMobileFocus = () => {
                      setSelectedRoute(i);
                      if (targetShelter) {
                        setViewport((v) => ({ ...v, center: [targetShelter.lng, targetShelter.lat], zoom: 17 }));
                        setSelectedShelterId(targetShelter.id);
                        adminMapRef.current?.flyTo({ center: [targetShelter.lng, targetShelter.lat], zoom: 17, duration: 1200, essential: true });
                        setShowPanel(false);
                      } else if (route.coordinates.length > 0) {
                        const ep = route.coordinates[route.coordinates.length - 1];
                        setViewport((v) => ({ ...v, center: [ep[0], ep[1]], zoom: 17 }));
                        adminMapRef.current?.flyTo({ center: [ep[0], ep[1]], zoom: 17, duration: 1200, essential: true });
                        setShowPanel(false);
                      }
                    };
                    return (
                      <button
                        key={i}
                        onClick={handleMobileFocus}
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
                    );
                  })}
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


        {/* == ADMIN USER DEVICE INFO MODAL == */}
        <AnimatePresence>
          {selectedUserInfo && (() => {
            const liveUser = activeUsers[selectedUserInfo.id] ?? selectedUserInfo;
            const ageMs = Date.now() - liveUser.ts;
            const ageSec = Math.round(ageMs / 1000);
            const ageLabel = ageSec < 60 ? `${ageSec}d lalu` : `${Math.round(ageSec/60)} mnt lalu`;
            const bat = liveUser.battery;
            const batColor = bat === undefined ? '#64748b' : bat > 50 ? '#22c55e' : bat > 20 ? '#f59e0b' : '#ef4444';
            const batPct = bat ?? 0;
            return (
              <motion.div
                key="user-info-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => { setSelectedUserInfo(null); setIsPinging(false); }}
              >
                <motion.div
                  initial={{ y: 120, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 120, opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm mx-auto bg-[#0d1929] border border-amber-500/30 rounded-t-3xl md:rounded-3xl md:mb-8 shadow-[0_-20px_60px_rgba(245,158,11,0.25)] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${liveUser.isOffline ? 'bg-slate-700' : 'bg-amber-500/20 border border-amber-500/40'}`}>👤</div>
                      <div>
                        <h3 className="text-white font-black text-base leading-tight">{liveUser.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${liveUser.isOffline ? 'bg-slate-500' : 'bg-amber-400 animate-pulse'}`} />
                          <span className={`text-[10px] font-bold ${liveUser.isOffline ? 'text-slate-500' : 'text-amber-400'}`}>{liveUser.isOffline ? 'OFFLINE' : 'ONLINE'} · {ageLabel}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedUserInfo(null); setIsPinging(false); }}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {/* NIK KTP Display Block */}
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[9px] text-nerv-cyan uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5 font-mono">
                        <CreditCard className="w-3 h-3 text-nerv-cyan" /> NIK KTP (IDENTITAS RESMI)
                      </p>
                      <p className="text-sm font-black text-nerv-cyan font-mono tracking-wider">
                        {liveUser.nik || 'BELUM TERDAFTAR'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5"><Cpu className="w-3 h-3" /> PERANGKAT</p>
                      <p className="text-sm font-bold text-white">{liveUser.deviceModel || 'Unknown Device'}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">ID: {liveUser.id}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">🔋 STATUS BATERAI</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: `${batPct}%`, background: batColor, transition: 'width 0.5s ease' }} className="h-full rounded-full" />
                        </div>
                        <span className="text-sm font-black shrink-0" style={{ color: batColor }}>{bat !== undefined ? `${bat}%` : 'N/A'}</span>
                      </div>
                      {bat !== undefined && bat <= 20 && <p className="text-[10px] text-red-400 font-bold mt-1.5 animate-pulse">⚠️ Baterai kritis!</p>}
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> LOKASI GPS (REAL-TIME)</p>
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        <div><p className="text-[9px] text-slate-600 font-bold">LAT</p><p className="text-xs font-mono text-slate-300">{liveUser.lat.toFixed(6)}</p></div>
                        <div><p className="text-[9px] text-slate-600 font-bold">LNG</p><p className="text-xs font-mono text-slate-300">{liveUser.lng.toFixed(6)}</p></div>
                      </div>
                      <button onClick={() => { setViewport(v => ({ ...v, center: [liveUser.lng, liveUser.lat], zoom: 17 })); setSelectedUserInfo(null); }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold transition-colors">📍 Fokus ke lokasi ini</button>
                    </div>
                    <button
                      onClick={() => {
                        if (!tsunamiAlert) return;
                        setShowAdminPingModal({ id: liveUser.id, name: liveUser.name });
                        setAdminPingMessage("");
                      }}
                      disabled={!tsunamiAlert}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${tsunamiAlert ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_4px_20px_rgba(245,158,11,0.4)] active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                      <Radio className="w-4 h-4" />
                      {tsunamiAlert ? `KIRIM PING KE ${liveUser.name.toUpperCase()}` : 'PING (Hanya saat Simulasi)'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>        {/* â•â•â• DESKTOP RIGHT SIDEBAR (Routes) â•â•â• */}
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
                {routes.map((route, i) => {
                  const targetShelter = shelters.find(
                    (s) => s.id === route.shelterId || s.name.toLowerCase().trim() === route.shelterName.toLowerCase().trim()
                  );
                  const handleFocusShelter = (e?: React.MouseEvent) => {
                    if (e) e.stopPropagation();
                    setSelectedRoute(i);
                    if (targetShelter) {
                      setViewport((v) => ({ ...v, center: [targetShelter.lng, targetShelter.lat], zoom: 17 }));
                      setSelectedShelterId(targetShelter.id);
                      adminMapRef.current?.flyTo({ center: [targetShelter.lng, targetShelter.lat], zoom: 17, duration: 1200, essential: true });
                    } else if (route.coordinates.length > 0) {
                      const ep = route.coordinates[route.coordinates.length - 1];
                      setViewport((v) => ({ ...v, center: [ep[0], ep[1]], zoom: 17 }));
                      adminMapRef.current?.flyTo({ center: [ep[0], ep[1]], zoom: 17, duration: 1200, essential: true });
                    }
                  };
                  return (
                    <div
                      key={i}
                      onClick={() => handleFocusShelter()}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer
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
                          <button
                            type="button"
                            onClick={(e) => handleFocusShelter(e)}
                            className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 active:scale-98 transition-all text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer"
                          >
                            Go to Point <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Multi-Disaster Simulation Modal */}
      <AnimatePresence>
        {showTsunamiConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101c] border border-nerv-border p-6 rounded-2xl shadow-2xl max-w-lg w-full text-left overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-nerv-border mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-nerv-red animate-ping" />
                  <div>
                    <span className="text-[9px] font-bold text-nerv-red tracking-widest uppercase block">
                      A.T.L.A.S // COMMAND SIMULATION
                    </span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      SIMULASI 6 ANCAMAN BENCANA NASIONAL
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowTsunamiConfirm(false)}
                  className="w-7 h-7 rounded bg-black/60 border border-nerv-border flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-300 font-sans mb-3.5 leading-relaxed">
                Pilih skenario bencana darurat untuk menguji respons sirine, kesiapsiagaan titik kumpul aman (TES), dan algoritma rute evakuasi mandiri:
              </p>

              {/* 6 Disaster Options */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { id: 'tsunami', name: 'Tsunami Laut', badge: 'DEFCON 1', icon: Waves, color: '#FF1744', desc: 'Evakuasi ke Tempat Tinggi (≥20m) / Shelter TES' },
                  { id: 'earthquake', name: 'Gempa Bumi', badge: 'SEISMIC', icon: Activity, color: '#FF5722', desc: 'Evakuasi ke Lapangan Terbuka Bebas Reruntuhan' },
                  { id: 'flood', name: 'Banjir Genangan', badge: 'HYDRO', icon: Droplets, color: '#00E5FF', desc: 'Evakuasi ke Lantai Atas / Posko Pengungsian Air' },
                  { id: 'flashflood', name: 'Banjir Bandang', badge: 'FLASH SURGE', icon: Waves, color: '#FF9100', desc: 'Evakuasi Tegak Lurus Menjauhi Aliran Sungai' },
                  { id: 'cyclone', name: 'Angin Topan', badge: 'VORTEX', icon: Wind, color: '#E040FB', desc: 'Berlindung di Ruang Tengah Gedung Beton' },
                  { id: 'volcano', name: 'Gunung Meletus', badge: 'MAGMA', icon: Flame, color: '#FF3D00', desc: 'Keluar Radius KRB & Kenakan Masker Basah' },
                ].map((dis) => {
                  const isSelected = selectedSimDisaster === dis.id;
                  const IconComp = dis.icon;
                  return (
                    <button
                      key={dis.id}
                      type="button"
                      onClick={() => setSelectedSimDisaster(dis.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-nerv-orange bg-nerv-orange/15 shadow-[0_0_12px_rgba(255,87,34,0.3)] ring-1 ring-nerv-orange'
                          : 'border-slate-800 bg-black/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <IconComp className="w-3.5 h-3.5" style={{ color: dis.color }} />
                          <span className="text-[11px] font-bold text-white uppercase">{dis.name}</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/80 border border-slate-700 text-slate-300">
                          {dis.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-sans leading-tight">
                        {dis.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-nerv-border">
                <button
                  type="button"
                  onClick={() => setShowTsunamiConfirm(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  BATALKAN
                </button>
                <button
                  type="button"
                  onClick={() => activateTsunamiAlert(selectedSimDisaster)}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>MULAI SIMULASI</span>
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
                        setViewport(v => ({ ...v, center: [s.lng, s.lat], zoom: 17 }));
                        setSelectedShelterId(s.id);
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
              <p className="text-[11px] text-nerv-orange font-mono mt-1 font-bold">
                A.T.L.A.S (Autonomous Threat Location & Alert System)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Operational Unit: {terminalId} | STATUS:{" "}
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-4 pt-4">
              {/* ─── DEVICE IDENTITY ─── */}
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

                <button
                  type="button"
                  onClick={() => {
                    setCredTerminalId(terminalId);
                    setCredOperatorName(userName || "Operator Admin");
                    setCredNewPin("");
                    setCredConfirmPin("");
                    setCredSuccessMsg("");
                    setCredErrorMsg("");
                    setShowUpdateCredentials(true);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
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
                    ["Versi Aplikasi", "v1.0.1 (A.T.L.A.S Enterprise)"],
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
                      userNik,
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

      {/* ─── GLOBAL FAMILY PING MODAL (when on other pages) ─── */}
      <AnimatePresence>
        {incomingFamilyPing && activePage !== "family" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-xs bg-[#0F1424] border-2 border-nerv-orange rounded-xl p-5 shadow-[0_0_40px_rgba(255,87,34,0.4)] relative overflow-hidden font-mono text-center"
            >
              <div className="absolute inset-0 bg-nerv-orange/5 animate-pulse pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 bg-nerv-orange/20 rounded-full flex items-center justify-center mb-3 border border-nerv-orange">
                  <Radio className="w-7 h-7 text-nerv-orange animate-ping" />
                </div>
                <p className="text-[10px] text-nerv-orange font-bold uppercase tracking-widest mb-1">
                  TACTICAL EMERGENCY PING
                </p>
                <h2 className="text-base font-bold text-white mb-2">PANGGILAN DARI UNIT</h2>
                <p className="text-xs text-slate-300 mb-2 font-sans leading-relaxed">
                  <b className="text-white font-mono">{incomingFamilyPing.fromName}</b> mengirimkan sinyal darurat ke perangkat Anda.
                </p>
                {incomingFamilyPing.nik && (
                  <p className="text-[9px] text-nerv-cyan font-mono mb-4">
                    NIK: {incomingFamilyPing.nik}
                  </p>
                )}
                <div className="w-full space-y-2.5">
                  <button
                    onClick={() => {
                      aegisApi.pingReply(terminalId, userName || "Pengguna", incomingFamilyPing.fromId, userNik);
                      setIncomingFamilyPing(null);
                      setHasFamilyPing(false);
                      localStorage.removeItem("atlas_pending_family_ping");
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>KONFIRMASI: SAYA AMAN ✓</span>
                  </button>
                  <button
                    onClick={() => {
                      const targetId = incomingFamilyPing.fromId;
                      setIncomingFamilyPing(null);
                      setHasFamilyPing(false);
                      localStorage.removeItem("atlas_pending_family_ping");
                      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
                      aegisApi.pingHelp(terminalId, userName || "Pengguna", targetId, userPosition?.[0], userPosition?.[1], userNik);
                    }}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>⚠️ MEMERLUKAN BANTUAN DARURAT</span>
                  </button>
                </div>
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

      {/* ─── ERROR BANNER (NETWORK FAILED) ─── */}
      <AnimatePresence>
        {networkFailed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 text-sm border border-red-400"
          >
            <span>⚠️ ERROR: Gagal memuat data graf evakuasi jalan (roadNetwork.data.json). Rute jatuh ke fallback garis lurus. Cek console.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── INSTRUCTION BANNER (PICKING MODE) ─── */}
      <AnimatePresence>
        {pickingLocationMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[3000] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 text-sm border border-indigo-400"
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
            className="fixed inset-0 z-[3000] flex items-center justify-end p-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0.9, x: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl relative pointer-events-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-lg font-black text-white">Tambah Shelter Manual</h2>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nama Shelter (Otomatis/Manual)" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors" value={newShelter.name} onChange={e => setNewShelter({...newShelter, name: e.target.value})} />
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
                  <input type="number" placeholder="Latitude" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors" value={newShelter.lat} onChange={e => setNewShelter({...newShelter, lat: e.target.value})} />
                  <input type="number" placeholder="Longitude" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors" value={newShelter.lng} onChange={e => setNewShelter({...newShelter, lng: e.target.value})} />
                </div>
                <div className="flex gap-3">
                  <input type="number" placeholder="Kapasitas" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors" value={newShelter.capacity} onChange={e => setNewShelter({...newShelter, capacity: e.target.value})} />
                  <input type="number" placeholder="Radius Aman (m)" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors" value={newShelter.radius} onChange={e => setNewShelter({...newShelter, radius: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowAddShelter(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Batal</button>
                <button
                  disabled={isSavingShelter}
                  onClick={async () => {
                    if(!newShelter.name || !newShelter.lat || !newShelter.lng) return setAlertModal({ title: 'Data Tidak Lengkap', message: 'Nama, latitude, dan longitude shelter harus diisi.', variant: 'error' });

                    setIsSavingShelter(true);

                    // Reverse geocode to get address
                    let address = '';
                    try {
                      const isLocalhost = window.location.origin.includes('localhost');
                      const API_URL = isLocalhost ? (import.meta.env.VITE_API_URL || 'https://tsunami-dimss.vercel.app') : '';
                      const geo = await fetch(`${API_URL}/api/geocode/reverse?lat=${newShelter.lat}&lng=${newShelter.lng}`);
                      if (geo.ok) {
                        const gd = await geo.json();
                        address = [gd.road, gd.suburb].filter(Boolean).join(', ');
                      }
                    } catch {}

                    const shelterPayload = {
                      id: 'C' + Date.now(),
                      name: newShelter.name,
                      lat: parseFloat(newShelter.lat),
                      lng: parseFloat(newShelter.lng),
                      capacity: parseInt(newShelter.capacity) || 0,
                      radiusMeters: parseInt(newShelter.radius) || 50,
                      address: address || undefined,
                    };

                    const res = await aegisApi.addCustomShelter(shelterPayload);
                    setIsSavingShelter(false);

                    if (res.ok) {
                      addCustomShelter(shelterPayload as any);
                      setShelterVersion(v => v + 1);
                      setShowAddShelter(false);
                      setNewShelter({ name: '', lat: '', lng: '', capacity: '', radius: '50' });
                    } else {
                      setAlertModal({ title: 'Gagal Menyimpan Shelter', message: res.error ?? 'Sesi login Anda mungkin telah berakhir (Token Expired). Silakan Logout dan Login kembali.', variant: 'error' });
                    }
                  }}
                  className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingShelter ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADD HAZARD ZONE MODAL ─── */}
      <AnimatePresence>
        {showAddHazardZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-black text-white">Simpan Zona Bahaya</h2>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nama Zona" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-red-500 outline-none transition-colors" value={newHazardZone.name} onChange={e => setNewHazardZone({...newHazardZone, name: e.target.value})} />
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold px-1">Tingkat ZRB</label>
                  <div className="grid grid-cols-1 gap-2">
                    {([4, 3, 2, 1] as ZRBLevel[]).map((level) => {
                      const ref = ZRB_REFERENCE[level];
                      const isSelected = newHazardZone.zrbLevel === level;
                      return (
                        <div
                          key={level}
                          onClick={() => setNewHazardZone({ ...newHazardZone, zrbLevel: level })}
                          className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-slate-800 border-slate-500' : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/60'}`}
                        >
                          <div className="w-4 h-4 rounded-full shrink-0 border border-slate-900" style={{ backgroundColor: ref.color }} />
                          <div className="text-xs font-bold text-white leading-tight">
                            {ref.label} — {ref.tipologi}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <textarea placeholder="Deskripsi Opsional" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-red-500 outline-none transition-colors resize-none" rows={3} value={newHazardZone.description} onChange={e => setNewHazardZone({...newHazardZone, description: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => {
                  setShowAddHazardZone(false);
                  setDrawingZoneCoords([]);
                  setDrawingZoneBackCoords([]);
                  setManualBackOverrides({});
                  setDrawingZoneDepthKm(0.2);
                  setDrawingZoneFlipSide(false);
                }} className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Batal</button>
                <button
                  disabled={isSavingHazardZone}
                  onClick={async () => {
                    if(!newHazardZone.name) return setAlertModal({ title: 'Nama Wajib Diisi', message: 'Nama zona bahaya tidak boleh kosong.', variant: 'error' });
                    setIsSavingHazardZone(true);
                    
                    const payload: HazardZone = {
                      id: 'HZ' + Date.now(),
                      name: newHazardZone.name,
                      coords: buildZonePolygon(drawingZoneCoords, drawingZoneBackCoords),
                      zrbLevel: newHazardZone.zrbLevel,
                      description: newHazardZone.description || undefined
                    };

                    const { ok, error } = await aegisApi.addHazardZone(payload);
                    setIsSavingHazardZone(false);

                    if (ok) {
                      hazardZones.push(payload);
                      setHazardZoneVersion(v => v + 1);
                      setShowAddHazardZone(false);
                      setDrawingZoneCoords([]);
                      setDrawingZoneBackCoords([]);
                      setManualBackOverrides({});
                      setDrawingZoneDepthKm(0.2);
                      setDrawingZoneFlipSide(false);
                      setNewHazardZone({ name: '', zrbLevel: 4, description: '' });
                    } else {
                      setAlertModal({ title: 'Gagal Menyimpan Zona', message: error ?? 'Gagal menyimpan zona bahaya ke server. Cek console untuk detail.', variant: 'error' });
                    }
                  }}
                  className="flex-1 py-3 text-white font-bold text-sm bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingHazardZone ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HAZARD ZONE DETAIL PANEL ─── */}
      <AnimatePresence>
        {selectedHazardZoneId && !showEditHazardZone && !drawingZoneMode && (() => {
          const z = hazardZones.find(x => x.id === selectedHazardZoneId);
          if (!z) return null;
          const ref = ZRB_REFERENCE[z.zrbLevel];
          return (
            <motion.div
              key={`hazard-detail-${z.id}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-[72px] md:bottom-6 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 md:right-6 z-[600] w-[92vw] max-w-sm"
            >
              <div className="bg-[#0d1929]/95 backdrop-blur-md border border-slate-700/30 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: ref.color }} />
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-3">
                      <h3 className="text-sm font-black text-white leading-tight">{z.name}</h3>
                      <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: ref.color + '20', color: ref.color, border: `1px solid ${ref.color}40` }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ref.color }} />
                        {ref.label} — {ref.tipologi}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedHazardZoneId(null)}
                      className="w-7 h-7 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors shrink-0 border border-slate-700/50 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-3 text-slate-300 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-400 mb-1">Kriteria:</h4>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {ref.kriteria.map((k, i) => <li key={i}>{k}</li>)}
                      </ul>
                    </div>
                    {ref.catatanUmum && (
                      <div className="text-[11px] italic text-slate-400">
                        Catatan: {ref.catatanUmum}
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-slate-800/60">
                      <h4 className="font-bold text-slate-400 mb-1">ARAHAN SPASIAL (KETENTUAN PEMANFAATAN RUANG):</h4>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                        {ref.arahanSpasial.map((a, i) => <li key={i}>{a}</li>)}
                      </ol>
                    </div>

                    {z.description && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <h4 className="font-bold text-slate-400 mb-1">Catatan Tambahan (Admin):</h4>
                        <p className="text-[11px]">{z.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {isAdminURL && userRole === "admin" && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/60">
                      <button
                        onClick={() => {
                          setEditHazardZoneData({
                            id: z.id,
                            name: z.name,
                            coords: z.coords,
                            zrbLevel: z.zrbLevel,
                            description: z.description || ''
                          });
                          setShowEditHazardZone(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-[11px] font-bold tracking-wide rounded-xl border border-slate-700/50 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> EDIT
                      </button>
                      <button
                        onClick={() => setShowDeleteHazardZoneConfirm(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold tracking-wide rounded-xl border border-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> HAPUS
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── EDIT HAZARD ZONE MODAL ─── */}
      <AnimatePresence>
        {showEditHazardZone && editHazardZoneData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Edit2 className="w-5 h-5 text-slate-300" />
                </div>
                <h2 className="text-lg font-black text-white">Edit Zona Bahaya</h2>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Nama Zona" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-red-500 outline-none transition-colors" value={editHazardZoneData.name} onChange={e => setEditHazardZoneData({...editHazardZoneData, name: e.target.value})} />
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold px-1">Tingkat ZRB</label>
                  <div className="grid grid-cols-1 gap-2">
                    {([4, 3, 2, 1] as ZRBLevel[]).map((level) => {
                      const ref = ZRB_REFERENCE[level];
                      const isSelected = editHazardZoneData.zrbLevel === level;
                      return (
                        <div
                          key={level}
                          onClick={() => setEditHazardZoneData({ ...editHazardZoneData, zrbLevel: level })}
                          className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-slate-800 border-slate-500' : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/60'}`}
                        >
                          <div className="w-4 h-4 rounded-full shrink-0 border border-slate-900" style={{ backgroundColor: ref.color }} />
                          <div className="text-xs font-bold text-white leading-tight">
                            {ref.label} — {ref.tipologi}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <textarea placeholder="Deskripsi Opsional" className="w-full bg-slate-800 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 focus:border-red-500 outline-none transition-colors resize-none" rows={3} value={editHazardZoneData.description} onChange={e => setEditHazardZoneData({...editHazardZoneData, description: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button onClick={() => setShowEditHazardZone(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Batal</button>
                <button
                  disabled={isSavingEditHazardZone}
                  onClick={async () => {
                    if(!editHazardZoneData.name) return setAlertModal({ title: 'Nama Wajib Diisi', message: 'Nama zona bahaya tidak boleh kosong.', variant: 'error' });
                    setIsSavingEditHazardZone(true);
                    
                    const payload = {
                      name: editHazardZoneData.name,
                      zrbLevel: editHazardZoneData.zrbLevel,
                      description: editHazardZoneData.description
                    };

                    const { ok, error } = await aegisApi.updateHazardZone(editHazardZoneData.id, payload);
                    setIsSavingEditHazardZone(false);

                    if (ok) {
                      const idx = hazardZones.findIndex(z => z.id === editHazardZoneData.id);
                      if(idx !== -1) {
                        hazardZones[idx] = { ...hazardZones[idx], ...payload } as any;
                      }
                      setHazardZoneVersion(v => v + 1);
                      setShowEditHazardZone(false);
                    } else {
                      setAlertModal({ title: 'Gagal Update Zona', message: error ?? 'Gagal mengupdate zona bahaya. Cek console untuk detail.', variant: 'error' });
                    }
                  }}
                  className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingEditHazardZone ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE HAZARD ZONE CONFIRM MODAL ─── */}
      <AnimatePresence>
        {showDeleteHazardZoneConfirm && selectedHazardZoneId && (() => {
          const z = hazardZones.find(x => x.id === selectedHazardZoneId);
          if (!z) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center"
              >
                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">Hapus Zona Bahaya?</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Zona <strong>{z.name}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteHazardZoneConfirm(false)} className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">Batal</button>
                  <button
                    disabled={isDeletingHazardZone}
                    onClick={async () => {
                      setIsDeletingHazardZone(true);
                      const { ok } = await aegisApi.deleteHazardZone(z.id);
                      setIsDeletingHazardZone(false);
                      if (ok) {
                        const idx = hazardZones.findIndex(x => x.id === z.id);
                        if(idx !== -1) hazardZones.splice(idx, 1);
                        setHazardZoneVersion(v => v + 1);
                        setShowDeleteHazardZoneConfirm(false);
                        setSelectedHazardZoneId(null);
                      } else {
                        setAlertModal({ title: 'Gagal Menghapus Zona', message: 'Gagal menghapus zona bahaya dari server.', variant: 'error' });
                      }
                    }}
                    className="flex-1 py-3 text-white font-bold text-sm bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeletingHazardZone ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── SHELTER DETAIL PANEL ─── */}
      <AnimatePresence>
        {selectedShelterId && !showEditShelter && (() => {
          const s = shelters.find(x => x.id === selectedShelterId);
          if (!s) return null;
          const isCustom = s.id.startsWith('C');
          return (
            <motion.div
              key={`shelter-detail-${s.id}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-[72px] md:bottom-6 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 md:right-6 z-[600] w-[92vw] max-w-sm max-h-[calc(100dvh-120px)] md:max-h-[85vh] flex flex-col"
            >
              <div className="bg-[#0d1929]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-[0_8px_40px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col max-h-full">
                {/* Top accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-indigo-700 shrink-0" />

                {/* Header */}
                <div className="flex items-start justify-between px-4 pt-4 pb-2 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">🏠</div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-0.5">
                        {isCustom ? 'SHELTER KUSTOM' : 'SHELTER RESMI'}
                      </p>
                      <h3 className="text-white font-black text-sm leading-tight truncate">{s.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedShelterId(null)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info grid */}
                <div className="px-4 pb-4 space-y-2.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  {/* Address */}
                  {s.address && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">ALAMAT</p>
                        <p className="text-xs text-slate-300 leading-snug">{s.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats row - Kapasitas (Radius & Koordinat diabaikan sesuai instruksi) */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">KAPASITAS DAYA TAMPUNG</p>
                      <p className="text-base font-black text-white">{s.capacity.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">orang</span></p>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                      ZONA AMAN
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewport(v => ({ ...v, center: [s.lng, s.lat], zoom: 17 }));
                          adminMapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 17, duration: 1200, essential: true });
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Target className="w-3.5 h-3.5" /> Fokus
                      </button>
                      {isCustom && (
                        <button
                          onClick={() => {
                            setEditShelterData({
                              id: s.id,
                              name: s.name,
                              lat: String(s.lat),
                              lng: String(s.lng),
                              capacity: String(s.capacity),
                              radius: String(s.radiusMeters ?? 50),
                              address: s.address ?? '',
                              customMessage: s.customMessage ?? '',
                            });
                            setEditShelterError(null);
                            setShowEditShelter(true);
                          }}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_2px_12px_rgba(99,102,241,0.4)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Shelter
                        </button>
                      )}
                    </div>
                    {isCustom && (
                      <button
                        onClick={() => setShowDeleteShelterConfirm(true)}
                        className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Shelter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── EDIT SHELTER MODAL ─── */}
      <AnimatePresence>
        {showEditShelter && editShelterData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3100] flex items-center justify-end p-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0.9, x: 20 }}
              className="w-full max-w-sm bg-[#0d1929] border border-indigo-500/30 rounded-2xl shadow-[0_20px_60px_rgba(99,102,241,0.3)] overflow-hidden max-h-[92vh] flex flex-col pointer-events-auto"
            >
              {/* Top accent */}
              <div className="h-0.5 w-full bg-gradient-to-r from-indigo-700 via-indigo-400 to-indigo-700 shrink-0" />

              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Edit2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white leading-tight">Edit Shelter</h2>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate max-w-[160px]">{editShelterData.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowEditShelter(false); setEditShelterData(null); setEditShelterError(null); }}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline error banner */}
                <AnimatePresence>
                  {editShelterError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/60 border border-red-700/50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 leading-snug flex-1">{editShelterError}</p>
                      <button onClick={() => setEditShelterError(null)} className="text-red-500 hover:text-red-300 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <div className="space-y-4">
                  {/* Nama */}
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Nama Shelter</label>
                    <input
                      type="text"
                      className="w-full bg-slate-800/80 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors"
                      value={editShelterData.name}
                      onChange={e => setEditShelterData({ ...editShelterData, name: e.target.value })}
                    />
                  </div>

                  {/* Kapasitas */}
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Kapasitas (orang)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-slate-800/80 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors"
                      value={editShelterData.capacity}
                      onChange={e => setEditShelterData({ ...editShelterData, capacity: e.target.value })}
                    />
                  </div>

                  {/* Radius GPS — slider + angka */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Radius Aman GPS Auto-Stop</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="10"
                          max="5000"
                          className="w-16 bg-slate-800 text-indigo-300 font-black text-xs text-right rounded-lg px-2 py-1 border border-slate-700 focus:border-indigo-500 outline-none"
                          value={editShelterData.radius}
                          onChange={e => setEditShelterData({ ...editShelterData, radius: e.target.value })}
                        />
                        <span className="text-[9px] text-slate-500 font-bold">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="5"
                      value={Math.min(parseInt(editShelterData.radius) || 50, 500)}
                      onChange={e => setEditShelterData({ ...editShelterData, radius: e.target.value })}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                      <span>10 m</span>
                      <span className="text-slate-500">Saat ini: {editShelterData.radius} m</span>
                      <span>500+ m</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                      Navigasi berhenti otomatis saat user memasuki radius ini. Sesuaikan dengan kondisi lapangan shelter.
                    </p>
                  </div>

                  {/* Alamat */}
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Alamat Singkat</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Chairil Anwar, Besusu Tengah"
                      className="w-full bg-slate-800/80 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors placeholder:text-slate-600"
                      value={editShelterData.address}
                      onChange={e => setEditShelterData({ ...editShelterData, address: e.target.value })}
                    />
                  </div>

                  {/* Pesan Khusus */}
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
                      Pesan Khusus Shelter
                      <span className="ml-1.5 text-slate-600 normal-case font-normal">(opsional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Contoh: Daftar ke petugas di pintu masuk. Bawa kartu identitas. Area evakuasi keluarga di Gedung B."
                      className="w-full bg-slate-800/80 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 focus:border-indigo-500 outline-none transition-colors placeholder:text-slate-600 resize-none leading-relaxed"
                      value={editShelterData.customMessage}
                      onChange={e => setEditShelterData({ ...editShelterData, customMessage: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      Pesan ini ditampilkan ke pengguna saat mereka tiba di shelter ini.
                    </p>
                  </div>

                  {/* Read-only coords */}
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Koordinat (read-only)</p>
                    <p className="text-xs font-mono text-slate-500">{parseFloat(editShelterData.lat).toFixed(6)}, {parseFloat(editShelterData.lng).toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* Actions — sticky bottom */}
              <div className="flex gap-3 p-5 pt-3 shrink-0 border-t border-slate-800/60">
                <button
                  onClick={() => { setShowEditShelter(false); setEditShelterData(null); setEditShelterError(null); }}
                  className="flex-1 py-3 text-slate-400 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  disabled={isSavingEditShelter}
                  onClick={async () => {
                    if (!editShelterData.name.trim()) {
                      setEditShelterError('Nama shelter tidak boleh kosong.');
                      return;
                    }
                    const radiusVal = parseInt(editShelterData.radius);
                    if (isNaN(radiusVal) || radiusVal < 10) {
                      setEditShelterError('Radius GPS minimal 10 meter.');
                      return;
                    }

                    setIsSavingEditShelter(true);
                    setEditShelterError(null);

                    const fields = {
                      name: editShelterData.name.trim(),
                      capacity: parseInt(editShelterData.capacity) || 0,
                      radiusMeters: radiusVal,
                      address: editShelterData.address.trim() || undefined,
                      customMessage: editShelterData.customMessage.trim() || undefined,
                    };

                    const { ok, status } = await aegisApi.updateCustomShelter(editShelterData.id, fields);
                    setIsSavingEditShelter(false);

                    if (ok) {
                      // Update in-memory shelter array immediately (no reload needed)
                      const idx = shelters.findIndex(x => x.id === editShelterData.id);
                      if (idx !== -1) {
                        shelters[idx] = {
                          ...shelters[idx],
                          name: fields.name,
                          capacity: fields.capacity,
                          radiusMeters: fields.radiusMeters,
                          address: fields.address,
                          customMessage: fields.customMessage,
                        };
                      }
                      setShelterVersion(v => v + 1);
                      setShowEditShelter(false);
                      setEditShelterData(null);
                      setEditShelterError(null);
                      // Re-select so detail panel shows updated data
                      setSelectedShelterId(editShelterData.id);
                    } else if (status === 401) {
                      setEditShelterError('Sesi login telah berakhir. Silakan Logout lalu Login kembali untuk melanjutkan.');
                    } else if (status === 500) {
                      setEditShelterError('Server error. Hubungi admin atau coba beberapa saat lagi.');
                    } else {
                      setEditShelterError('Gagal menyimpan perubahan. Periksa koneksi dan coba lagi.');
                    }
                  }}
                  className="flex-1 py-3 text-white font-bold text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_2px_12px_rgba(99,102,241,0.4)]"
                >
                  {isSavingEditShelter ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : 'Simpan Perubahan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE SHELTER CONFIRM MODAL ─── */}
      <AnimatePresence>
        {showDeleteShelterConfirm && selectedShelterId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-[0_10px_40px_rgba(220,38,38,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-400" />
              
              <div className="flex items-start gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight mb-1">Hapus Shelter?</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Tindakan ini permanen dan tidak dapat dibatalkan. Semua perangkat yang terhubung akan kehilangan data shelter ini seketika.
                  </p>
                </div>
              </div>

              {deleteShelterError && (
                <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-900 text-xs text-red-400 leading-relaxed text-center">
                  {deleteShelterError}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteShelterConfirm(false);
                    setDeleteShelterError(null);
                  }}
                  disabled={isDeletingShelter}
                  className="flex-1 py-2.5 text-slate-300 font-bold text-sm bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    setIsDeletingShelter(true);
                    setDeleteShelterError(null);
                    const { ok } = await aegisApi.deleteCustomShelter(selectedShelterId);
                    setIsDeletingShelter(false);
                    
                    if (ok) {
                      // Optimistic delete is handled by SHELTER_DELETED event
                      // but we close the modals here
                      setShowDeleteShelterConfirm(false);
                      setSelectedShelterId(null);
                    } else {
                      setDeleteShelterError("Gagal menghapus shelter. Periksa koneksi dan coba lagi.");
                    }
                  }}
                  disabled={isDeletingShelter}
                  className="flex-1 py-2.5 text-white font-bold text-sm bg-red-600 rounded-xl hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_2px_12px_rgba(220,38,38,0.4)]"
                >
                  {isDeletingShelter ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADMIN PING MODAL (Admin to User) ─── */}
      <AnimatePresence>
        {showAdminPingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs bg-[#0d1929] border border-amber-500/30 rounded-2xl shadow-[0_20px_60px_rgba(245,158,11,0.2)] overflow-hidden"
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white leading-tight">Kirim Ping Darurat</h2>
                    <p className="text-[10px] text-amber-300/70 uppercase tracking-widest font-bold mt-0.5">Ke: {showAdminPingModal.name}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Ping akan memunculkan peringatan layar penuh di perangkat pengguna untuk memastikan kondisi mereka aman.
                </p>

                <div className="mb-5">
                  <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
                    Pesan Tambahan <span className="normal-case font-normal">(opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Apakah Anda terjebak? Butuh bantuan medis?"
                    value={adminPingMessage}
                    onChange={e => setAdminPingMessage(e.target.value)}
                    className="w-full bg-slate-900/80 text-white rounded-xl px-3 py-2.5 text-xs border border-slate-700 focus:border-amber-500 outline-none transition-colors placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowAdminPingModal(null)}
                    className="flex-1 py-2.5 text-slate-400 font-bold text-xs bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      aegisApi.adminPing(terminalId, userName || 'Admin', showAdminPingModal.id, adminRole, adminPingMessage || undefined).catch(() => {});
                      setPingSentToast({ name: showAdminPingModal.name, ts: Date.now() });
                      setTimeout(() => setPingSentToast(null), 3000);
                      setShowAdminPingModal(null);
                    }}
                    className="flex-[2] py-2.5 text-black font-black text-xs tracking-wider bg-amber-500 hover:bg-amber-400 rounded-xl shadow-[0_2px_12px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    KIRIM PING
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADMIN EMERGENCY BROADCAST / DISPATCH MODAL ─── */}
      <AnimatePresence>
        {showAdminBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-[#0b101c] border border-amber-500/40 rounded-2xl shadow-[0_20px_70px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-nerv-orange to-red-600" />
              <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      KONSOL SIARAN DARURAT RESMI
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                        TACTICAL DISPATCH
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pancaran instruksi resmi komando ke seluruh unit aktif di lapangan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminBroadcastModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                {/* 1. Level / Urgency */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                    TINGKAT URGENSI SIARAN (DEFCON LEVEL):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'CRITICAL', label: 'KRITIS (DEFCON 1)', desc: 'Evakuasi Segera', color: 'border-red-500 bg-red-950/60 text-red-300' },
                      { id: 'WARNING', label: 'PERINGATAN (DEFCON 2)', desc: 'Potensi Bahaya', color: 'border-amber-500 bg-amber-950/60 text-amber-300' },
                      { id: 'INFO', label: 'INFORMASI (DEFCON 3)', desc: 'Panduan & Bantuan', color: 'border-cyan-500 bg-cyan-950/60 text-cyan-300' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setAdminBroadcastLevel(lvl.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          adminBroadcastLevel === lvl.id
                            ? `${lvl.color} ring-2 ring-white/20 shadow-lg`
                            : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{lvl.label}</span>
                        <span className="text-[9px] opacity-75 font-sans block">{lvl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Target Region */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      SASARAN WILAYAH TELEMETRI:
                    </label>
                    <span className="text-[9px] text-nerv-cyan font-mono">
                      Target: {adminBroadcastRegion}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'SEMUA WILAYAH',
                      'Kota Palu',
                      'Kab. Donggala',
                      'Kab. Sigi',
                      'Kab. Parigi Moutong',
                      'Pesisir Teluk Palu'
                    ].map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setAdminBroadcastRegion(reg)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                          adminBroadcastRegion === reg
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Broadcast Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                    JUDUL INSTRUKSI SIARAN:
                  </label>
                  <input
                    type="text"
                    value={adminBroadcastTitle}
                    onChange={(e) => setAdminBroadcastTitle(e.target.value)}
                    placeholder="Contoh: INSTRUKSI EVAKUASI PRIORITAS // HINDARI PESISIR"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[
                      'EVAKUASI SEGERA KE TEMPAT TINGGI',
                      'PENGALIHAN RUTE: HINDARI JEMBATAN UTAMA',
                      'POSKO BANTUAN MEDIS DIBUKA DI TES SMPN 1',
                      'SIMULASI RESPON DARURAT SEDANG BERLANGSUNG'
                    ].map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => setAdminBroadcastTitle(template)}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                      >
                        + {template}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Broadcast Message Body */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                    ISI PESAN INSTRUKSI TAKTIS LENGKAP:
                  </label>
                  <textarea
                    rows={3}
                    value={adminBroadcastMessage}
                    onChange={(e) => setAdminBroadcastMessage(e.target.value)}
                    placeholder="Tuliskan arahan taktis yang jelas untuk warga dan relawan. Misal: Terjadi kenaikan gelombang air laut di pesisir barat. Seluruh warga sektor pesisir segera bergerak menuju Shelter Gedung Balai Desa..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none placeholder:text-slate-600 resize-none leading-relaxed"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  disabled={!adminBroadcastTitle.trim() || !adminBroadcastMessage.trim() || isSendingBroadcast}
                  onClick={async () => {
                    if (!adminBroadcastTitle.trim() || !adminBroadcastMessage.trim()) return;
                    setIsSendingBroadcast(true);
                    try {
                      const newBroadcast: AdminBroadcast = {
                        id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        title: adminBroadcastTitle.trim(),
                        message: adminBroadcastMessage.trim(),
                        sender: userName || "COMMAND-01 (POSKO KOMANDO)",
                        role: adminRole || "COMMAND-01",
                        level: adminBroadcastLevel,
                        region: adminBroadcastRegion,
                        timestamp: Date.now(),
                        expiresAt: Date.now() + 48 * 3600 * 1000,
                      };
                      await aegisApi.sendAdminBroadcast(newBroadcast);
                      setAdminBroadcastTitle("");
                      setAdminBroadcastMessage("");
                      setAdminBroadcastList(getAdminBroadcasts());
                      setPingSentToast({ name: `Semua Unit (${adminBroadcastRegion})`, ts: Date.now() });
                      setTimeout(() => setPingSentToast(null), 3500);
                    } catch (e) {
                      console.error("Gagal menyiarkan pesan:", e);
                    } finally {
                      setIsSendingBroadcast(false);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-nerv-orange hover:from-amber-400 hover:to-nerv-orange text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isSendingBroadcast ? 'MEMANCARKAN KE SELURUH UNIT...' : 'PANCARKAN SIARAN DARURAT SEKARANG'}
                </button>

                {/* 5. Active Broadcasts List */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      SIARAN AKTIF DI PERANGKAT WARGA ({adminBroadcastList.length}):
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Otomatis kadaluwarsa 48 Jam
                    </span>
                  </div>

                  {adminBroadcastList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center">
                      <p className="text-xs text-slate-500 font-mono">
                        Tidak ada siaran aktif saat ini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminBroadcastList.map((bc) => (
                        <div
                          key={bc.id}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                bc.level === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                                bc.level === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}>
                                {bc.level}
                              </span>
                              <span className="text-[9px] text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                                {bc.region}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(bc.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">
                              {bc.title}
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 font-sans">
                              {bc.message}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await aegisApi.deleteAdminBroadcast(bc.id);
                              setAdminBroadcastList(getAdminBroadcasts());
                            }}
                            className="shrink-0 px-2 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 hover:bg-red-900/60 text-red-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="Tarik atau Hapus Siaran ini dari perangkat warga"
                          >
                            <Trash2 className="w-3 h-3" /> TARIK
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PING SENT TOAST (Admin side) ─── */}
      <AnimatePresence>
        {pingSentToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3300] bg-amber-500 text-black px-4 py-2.5 rounded-full shadow-[0_10px_40px_rgba(245,158,11,0.4)] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p className="text-xs font-black tracking-wide">Ping terkirim ke {pingSentToast.name}!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PING REPLIES TOAST CONTAINER (Admin side) ─── */}
      <div className="fixed bottom-6 right-6 z-[3300] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {pingReplies.map(reply => (
            <motion.div
              key={reply.ts}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-950/90 border border-emerald-500/40 text-white p-3 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center gap-3 w-64 pointer-events-auto backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest font-mono">KONFIRMASI PERSONEL AMAN</p>
                <p className="text-xs font-bold truncate">{reply.name}</p>
                {reply.nik && <p className="text-[9px] text-nerv-cyan font-mono truncate">NIK: {reply.nik}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>

    {/* ─── HAZARD ZONE INFO PANEL ─── */}
    <AnimatePresence>
      {selectedZoneInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-[2500] w-72 bg-[#0b1120] border border-slate-700/60 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
          <button
            onClick={() => setSelectedZoneInfo(null)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">INFO ZONA</span>
            {(() => {
              const zrb = ZRB_REFERENCE[selectedZoneInfo.zrbLevel];
              if (!zrb) return null;
              const badges: Record<number, string> = {
                1: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                3: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                4: 'bg-red-500/20 text-red-400 border-red-500/30',
              };
              return (
                <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badges[selectedZoneInfo.zrbLevel]}`}>
                  ZRB {selectedZoneInfo.zrbLevel}
                </div>
              );
            })()}
          </div>
          
          <h3 className="text-lg font-black text-white mb-2 leading-tight">
            {selectedZoneInfo.name}
          </h3>
          
          {selectedZoneInfo.description ? (
            <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {selectedZoneInfo.description}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">Tidak ada deskripsi tambahan.</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* ─── UPDATE CREDENTIALS MODAL (Admin Terminal) ─── */}
    <AnimatePresence>
      {showUpdateCredentials && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0a1120] border border-indigo-500/30 rounded-3xl p-6 shadow-[0_16px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {/* Top Tactical Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-nerv-cyan to-indigo-500" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">
                    UPDATE CREDENTIALS
                  </h3>
                  <p className="text-[10px] text-nerv-cyan font-mono uppercase font-bold tracking-wider">
                    Terminal Identity & Access Protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateCredentials(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCredErrorMsg("");
                setCredSuccessMsg("");

                const trimmedTerminalId = credTerminalId.trim().toUpperCase();
                const trimmedOpName = credOperatorName.trim();

                if (!trimmedTerminalId) {
                  setCredErrorMsg("Terminal ID tidak boleh kosong.");
                  return;
                }

                if (!trimmedOpName) {
                  setCredErrorMsg("Nama Operator / Akun tidak boleh kosong.");
                  return;
                }

                if (credNewPin || credConfirmPin) {
                  if (credNewPin !== credConfirmPin) {
                    setCredErrorMsg("Konfirmasi Password / PIN tidak cocok.");
                    return;
                  }
                  if (credNewPin.length < 4) {
                    setCredErrorMsg("Password / PIN minimal 4 karakter.");
                    return;
                  }
                  localStorage.setItem("atlas_admin_pin", credNewPin);
                  sessionStorage.setItem("aegisPin", credNewPin);
                }

                // Save terminal ID
                setTerminalId(trimmedTerminalId);
                localStorage.setItem("atlasTerminalId", trimmedTerminalId);
                localStorage.setItem("aegisTerminalId", trimmedTerminalId);

                // Save operator name
                setUserName(trimmedOpName);
                localStorage.setItem("atlasUserName", trimmedOpName);
                localStorage.setItem("aegisUserName", trimmedOpName);

                setCredSuccessMsg("Kredensial terminal berhasil disimpan dan disinkronkan.");
                setTimeout(() => {
                  setShowUpdateCredentials(false);
                }, 1200);
              }}
              className="space-y-4"
            >
              {/* Terminal ID field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    TERMINAL ID (PERANGKAT AKTIF)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `A.T.L.A.S-${Math.floor(Math.random() * 900 + 100)}`;
                      setCredTerminalId(newId);
                    }}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Acak Baru
                  </button>
                </div>
                <input
                  type="text"
                  value={credTerminalId}
                  onChange={(e) => setCredTerminalId(e.target.value.toUpperCase())}
                  placeholder="A.T.L.A.S-617"
                  className="w-full bg-[#070d1a] border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white font-bold tracking-widest outline-none transition-colors"
                />
              </div>

              {/* Operator Name field */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mb-1.5">
                  NAMA OPERATOR / CALL-SIGN
                </label>
                <input
                  type="text"
                  value={credOperatorName}
                  onChange={(e) => setCredOperatorName(e.target.value)}
                  placeholder="Komandan Operasi / Admin"
                  className="w-full bg-[#070d1a] border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold outline-none transition-colors"
                />
              </div>

              {/* PIN / Password fields */}
              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[10px] text-nerv-cyan font-bold uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-nerv-cyan" />
                  PERBARUI SANDI / PIN AKSES TERMINAL
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Sandi Baru (opsional)
                    </label>
                    <input
                      type="password"
                      value={credNewPin}
                      onChange={(e) => setCredNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-[#070d1a] border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Konfirmasi Sandi
                    </label>
                    <input
                      type="password"
                      value={credConfirmPin}
                      onChange={(e) => setCredConfirmPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-[#070d1a] border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {credErrorMsg && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{credErrorMsg}</span>
                </div>
              )}
              {credSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{credSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateCredentials(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {showVideoSplash && (
      <VideoSplash isAdmin={isAdminURL} onFinish={handleSplashFinish} />
    )}
    <AlertModal state={alertModal} onClose={() => setAlertModal(null)} />
    </>
  );
}

export default App;
