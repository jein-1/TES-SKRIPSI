// ═══════════════════════════════════════════════════════════════
// MENU & SETTINGS PAGE — A.T.L.A.S TACTICAL ECOSYSTEM
// (Autonomous Threat Location & Alert System)
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Settings, Bell, Palette, Globe,
  Shield, Info, FileText, Check, Radio, Volume2, VolumeX,
  AlertTriangle, Flame, Waves, Wind, ExternalLink, Activity,
  Sliders, Eye, Type, Smartphone, CheckCircle, Navigation2, Compass, Clock,
  BookOpen, Search, ChevronDown, ChevronUp, Megaphone
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { NativeSettings } from '../../lib/nativeSettings'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useLanguage } from '../../lib/i18n'
import { GLOSSARY_TERMS, FEATURE_GUIDES, AUTHORITY_ROLES } from './GuidesPage'
import { getAdminBroadcasts, markBroadcastAsRead, markAllBroadcastsAsRead, type AdminBroadcast } from '../../lib/broadcastStorage'

export type MenuView =
  | 'hub'
  | 'app_guide'
  | 'appearance'
  | 'notifications'
  | 'local_notifications'
  | 'dnd_access'
  | 'test_notifications'
  | 'test_category'
  | 'live_updates'
  | 'license'
  | 'news'
  | 'changelog'
  | 'broadcasts'
  | 'authority'
  | 'remarks'
  | 'terms'
  | 'privacy'

export type TestCategoryType =
  | 'eew'
  | 'earthquake_info'
  | 'tsunami'
  | 'volcano'
  | 'weather'
  | 'heavy_rain'
  | 'civil'

export const LATEST_NEWS_VERSION = 'v1.0.0'
export const LATEST_WARTA_VERSION = LATEST_NEWS_VERSION

export interface EarthquakeNewsItem {
  id: string
  source: string
  location: string
  magnitude: string | number
  depth: string
  eventTime: string
  receivedAt: number
  potensi?: string
}

export function loadEarthquakeNews(): EarthquakeNewsItem[] {
  try {
    const raw = localStorage.getItem('atlas_earthquake_news_history')
    let items: EarthquakeNewsItem[] = raw ? JSON.parse(raw) : []
    // Bersihkan entri dummy masa lalu jika ada (hanya tampilkan data riil BMKG)
    const cleaned = items.filter(it => it.id !== 'eq-palu-01' && it.id !== 'eq-donggala-02')
    // Batas penyimpanan: 1 minggu (7 hari = 7 * 24 * 3600 * 1000 ms)
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const valid = cleaned.filter(it => it.receivedAt >= cutoff)
    if (valid.length !== items.length) {
      localStorage.setItem('atlas_earthquake_news_history', JSON.stringify(valid))
    }
    return valid
  } catch {
    return []
  }
}

interface Props {
  onBack: () => void
  onNavigateHistory?: () => void
  onCalibrateCompass?: () => void
  onNavigateLanding?: () => void
  userLocation?: string
}

export default function MenuPage({ onBack, onNavigateHistory, onCalibrateCompass, onNavigateLanding, userLocation = '' }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [view, setView] = useState<MenuView>(() => {
    try {
      const init = sessionStorage.getItem('atlas_menu_initial_view') as MenuView | null
      if (init) {
        sessionStorage.removeItem('atlas_menu_initial_view')
        return init
      }
    } catch {}
    return 'hub'
  })
  const [selectedCategory, setSelectedCategory] = useState<TestCategoryType>('eew')
  const [glossarySearch, setGlossarySearch] = useState('')
  const [expandedGlossary, setExpandedGlossary] = useState<string>('DEFCON (Defense Readiness Condition)')

  // Red Dot Indicator khusus untuk News Gempa Sistem
  const [hasUnreadNews, setHasUnreadNews] = useState(() => {
    try {
      return localStorage.getItem('atlas_has_unread_earthquake_news') === 'true'
    } catch {
      return false
    }
  })

  // Numbered Badge Indicator khusus untuk Log Pembaruan Sistem (Changelog)
  const [unreadLogCount, setUnreadLogCount] = useState(() => {
    try {
      const lastReadLogVer = localStorage.getItem('atlas_last_read_log_version')
      if (!lastReadLogVer) {
        localStorage.setItem('atlas_last_read_log_version', LATEST_NEWS_VERSION)
        return 0
      }
      if (lastReadLogVer === LATEST_NEWS_VERSION) return 0
      return 1
    } catch {
      return 0
    }
  })

  const handleOpenNews = () => {
    localStorage.setItem('atlas_last_read_news_ts', Date.now().toString())
    localStorage.removeItem('atlas_has_unread_earthquake_news')
    setHasUnreadNews(false)
    window.dispatchEvent(new CustomEvent('atlas_news_read'))
    setView('news')
  }

  const handleOpenChangelog = () => {
    localStorage.setItem('atlas_last_read_log_version', LATEST_NEWS_VERSION)
    setUnreadLogCount(0)
    window.dispatchEvent(new CustomEvent('atlas_changelog_read'))
    setView('changelog')
  }

  // Siaran Darurat Posko Komando
  const [broadcastList, setBroadcastList] = useState<AdminBroadcast[]>(() => {
    try {
      return getAdminBroadcasts()
    } catch {
      return []
    }
  })

  useEffect(() => {
    const handleBroadcastUpdate = () => {
      setBroadcastList(getAdminBroadcasts())
    }
    window.addEventListener('atlas_admin_broadcast_updated', handleBroadcastUpdate)
    return () => window.removeEventListener('atlas_admin_broadcast_updated', handleBroadcastUpdate)
  }, [])

  const unreadBroadcastsCount = broadcastList.filter(b => !b.read).length

  const handleOpenBroadcasts = () => {
    setView('broadcasts')
    markAllBroadcastsAsRead()
    setBroadcastList(getAdminBroadcasts())
  }

  useEffect(() => {
    if (view === 'broadcasts') {
      markAllBroadcastsAsRead()
      setBroadcastList(getAdminBroadcasts())
    }
  }, [view])
  
  // Settings States (stored in localStorage for persistence)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('atlas_theme_mode') as any) || 'dark'
  })
  const [contrast, setContrast] = useState<'standard' | 'high'>(() => {
    return (localStorage.getItem('atlas_contrast') as any) || 'standard'
  })
  const [colorVision, setColorVision] = useState<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'>(() => {
    return (localStorage.getItem('atlas_color_vision') as any) || 'normal'
  })
  const [fontSize, setFontSize] = useState<'device' | 'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('atlas_font_size') as any) || 'device'
  })
  const [fontThickness, setFontThickness] = useState<'device' | 'regular' | 'bold'>(() => {
    return (localStorage.getItem('atlas_font_thickness') as any) || 'device'
  })
  const [screenReaderMode, setScreenReaderMode] = useState<'default' | 'talkback'>(() => {
    return (localStorage.getItem('atlas_screen_reader_mode') as any) || 'default'
  })

  // Theme & Appearance Updaters (persists and modifies document.documentElement)
  const handleSelectTheme = (mode: 'dark' | 'light') => {
    setThemeMode(mode)
    localStorage.setItem('atlas_theme_mode', mode)
    if (mode === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
    // Broadcast event across application so parent and sibling views reactively synchronize
    window.dispatchEvent(new CustomEvent('atlas_theme_changed', { detail: mode }))
  }

  const handleSelectContrast = (c: 'standard' | 'high') => {
    setContrast(c)
    localStorage.setItem('atlas_contrast', c)
    if (c === 'high') {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }

  const cycleColorVision = () => {
    const list: ('normal' | 'protanopia' | 'deuteranopia' | 'tritanopia')[] = ['normal', 'protanopia', 'deuteranopia', 'tritanopia']
    const next = list[(list.indexOf(colorVision) + 1) % list.length]
    setColorVision(next)
    localStorage.setItem('atlas_color_vision', next)
    document.documentElement.classList.remove('color-protanopia', 'color-deuteranopia', 'color-tritanopia')
    if (next !== 'normal') document.documentElement.classList.add(`color-${next}`)
  }

  const cycleFontSize = () => {
    const list: ('device' | 'small' | 'medium' | 'large')[] = ['device', 'small', 'medium', 'large']
    const next = list[(list.indexOf(fontSize) + 1) % list.length]
    setFontSize(next)
    localStorage.setItem('atlas_font_size', next)
    document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
    if (next !== 'device') document.documentElement.classList.add(`font-size-${next}`)
  }

  const cycleFontThickness = () => {
    const list: ('device' | 'regular' | 'bold')[] = ['device', 'regular', 'bold']
    const next = list[(list.indexOf(fontThickness) + 1) % list.length]
    setFontThickness(next)
    localStorage.setItem('atlas_font_thickness', next)
    document.documentElement.classList.remove('font-weight-regular', 'font-weight-bold')
    if (next !== 'device') document.documentElement.classList.add(`font-weight-${next}`)
  }

  const handleSelectScreenReader = (mode: 'default' | 'talkback') => {
    setScreenReaderMode(mode)
    localStorage.setItem('atlas_screen_reader_mode', mode)
    if (mode === 'talkback') {
      document.documentElement.setAttribute('data-talkback', 'true')
    } else {
      document.documentElement.removeAttribute('data-talkback')
    }
  }

  // Notification States
  const [notifGeneral, setNotifGeneral] = useState(true)
  const [notifLocal, setNotifLocal] = useState(true)
  const [notifCritical, setNotifCritical] = useState(true)
  const [notifLive, setNotifLive] = useState(true)
  const [notifWeather, setNotifWeather] = useState(true)

  // Sentinel Background Service State
  const [sentinelActive, setSentinelActive] = useState<boolean>(() => {
    return localStorage.getItem('atlas_sentinel_active') !== 'false'
  })

  useEffect(() => {
    NativeSettings.isSentinelRunning()
      .then(res => setSentinelActive(res.running))
      .catch(() => {})
  }, [])

  const handleToggleSentinel = async (enable: boolean) => {
    setSentinelActive(enable)
    localStorage.setItem('atlas_sentinel_active', enable ? 'true' : 'false')
    if (enable) {
      await NativeSettings.startSentinel().catch(() => {})
    } else {
      await NativeSettings.stopSentinel().catch(() => {})
    }
  }

  // Test Notification Heads-up Banner Simulator State
  const [testBanner, setTestBanner] = useState<{
    title: string
    sub: string
    body: string
    isCritical?: boolean
  } | null>(null)
  const testBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Synthesized Audio Tone Generator for test alerts with atlas_siren.wav
  const playTestTone = (isCritical: boolean = false) => {
    try {
      if (isCritical) {
        const audio = new Audio('/atlas_siren.wav')
        audio.volume = 1.0
        audio.play().catch(() => playSynthesizedTone(true))
        return
      }
    } catch (_) {}
    playSynthesizedTone(isCritical)
  }

  const playSynthesizedTone = (isCritical: boolean = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = isCritical ? 'sawtooth' : 'sine'
      osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime)
      if (isCritical) {
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35)
      }

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isCritical ? 0.6 : 0.4))

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + (isCritical ? 0.65 : 0.45))
    } catch (_) {}
  }

  // Pending confirmation dialog state (as shown in reference)
  const [pendingTest, setPendingTest] = useState<{
    category: string
    typeLabel: string
    isCritical?: boolean
  } | null>(null)

  // Opens confirmation dialog
  const triggerTestAlert = (options: {
    category: string
    typeLabel: string
    isCritical?: boolean
  }) => {
    setPendingTest(options)
  }

  // Real execution triggered when user taps [TEST] in the modal
  const executeConfirmedTest = async (options: {
    category: string
    typeLabel: string
    isCritical?: boolean
  }) => {
    // Haptics vibration
    try {
      await Haptics.impact({ style: options.isCritical ? ImpactStyle.Heavy : ImpactStyle.Medium }).catch(() => {})
    } catch (_) {}
    if ('vibrate' in navigator) {
      navigator.vibrate(options.isCritical ? [250, 100, 250, 100, 300] : [150, 80, 150])
    }

    // Play tone (synthesized audio tone)
    playTestTone(options.isCritical)

    // Dynamic location fallback
    const locName = (userLocation && !userLocation.includes('Mendeteksi') && !userLocation.includes('Izin'))
      ? userLocation.split(' // ')[0]
      : (localStorage.getItem('atlas_user_city') || 'Kota Palu, Sulawesi Tengah')

    let title = `[Test] ${options.category}: ${locName}`
    let body = `This is a test notification. [New] ${options.typeLabel}`

    if (options.category.toLowerCase().includes('civil')) {
      title = `[Test] Civil Protection Information`
      body = `This is a test notification. Tactical emergency evacuation alert inside ${locName}.`
    } else if (options.category.toLowerCase().includes('earthquake')) {
      title = `[Test] Earthquake Warning: ${locName}`
      body = `This is a test notification. [New] Seismic intensity flash report.`
    } else if (options.category.toLowerCase().includes('tsunami')) {
      title = `[Test] Tsunami Warning: ${locName}`
      body = `This is a test notification. [New] ${options.typeLabel}. ${lang === 'id' ? 'Segera evakuasi ke shelter vertikal.' : 'Evacuate immediately to safe rally point.'}`
    }

    // Schedule real native Android notification to system drawer & notification history
    try {
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions()
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000) + 1,
            title,
            body,
            channelId: options.isCritical ? 'critical_alerts' : 'normal_alerts',
            sound: options.isCritical ? 'atlas_siren.wav' : undefined,
            smallIcon: 'ic_launcher_round',
            extra: {
              category: options.category,
              typeLabel: options.typeLabel,
              isTest: true
            }
          }
        ]
      })
    } catch (err) {
      console.warn('Real Android LocalNotification schedule notice:', err)
    }

    setTestBanner({
      title,
      sub: 'A.T.L.A.S • now',
      body,
      isCritical: options.isCritical,
    })

    if (testBannerTimerRef.current) clearTimeout(testBannerTimerRef.current)
    testBannerTimerRef.current = setTimeout(() => {
      setTestBanner(null)
    }, 5000)
  }

  // Sub-category names
  const categoryTitles: Record<TestCategoryType, string> = {
    eew: lang === 'id' ? 'Peringatan Dini Gempa Bumi' : 'Earthquake Early Warning',
    earthquake_info: lang === 'id' ? 'Informasi Gempa Terkini' : 'Earthquake Information',
    tsunami: lang === 'id' ? 'Peringatan Dini Tsunami' : 'Tsunami Warnings',
    volcano: lang === 'id' ? 'Peringatan Erupsi Gunung Api' : 'Volcanic Eruption Alerts',
    weather: lang === 'id' ? 'Peringatan Cuaca Ekstrem' : 'Weather Warnings',
    heavy_rain: lang === 'id' ? 'Peringatan Hujan Lebat & Banjir' : 'Heavy Rain Risk Alerts',
    civil: lang === 'id' ? 'Informasi Perlindungan Sipil' : 'Civil Protection Information',
  }

  return (
    <div className="fixed inset-0 z-[1800] flex flex-col bg-[#07090E] text-slate-200 overflow-hidden font-sans select-none">
      {/* ── Top Safe Area & Heads-Up Notification Banner Simulator ── */}
      <AnimatePresence>
        {testBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            drag="y"
            dragConstraints={{ top: -140, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.y < -25 || info.velocity.y < -200) {
                setTestBanner(null)
              }
            }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            onClick={() => setTestBanner(null)}
            className="fixed top-2 left-3 right-3 z-[3500] cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className={`rounded-2xl p-3.5 backdrop-blur-xl border shadow-2xl flex items-start gap-3 ${
              testBanner.isCritical
                ? 'bg-[#180a0a]/95 border-red-500/80 text-white shadow-[0_10px_35px_rgba(239,68,68,0.4)]'
                : 'bg-[#131722]/95 border-nerv-cyan/50 text-slate-100 shadow-[0_10px_35px_rgba(0,229,255,0.25)]'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                testBanner.isCritical ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              }`}>
                {testBanner.isCritical ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 font-sans">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[11px] font-bold tracking-tight text-white truncate">
                    {testBanner.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {testBanner.sub}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                  {testBanner.body}
                </p>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5 text-[9px] text-slate-400 font-mono">
                  <span className="text-nerv-cyan">▲ {lang === 'id' ? 'Geser ke atas untuk tutup' : 'Swipe up to dismiss'}</span>
                  <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-slate-300">Android System Intent</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Test Alert Confirmation Modal (Interactive DND Dialog) ── */}
      <AnimatePresence>
        {pendingTest && (
          <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 shadow-2xl space-y-3 font-sans"
            >
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                {pendingTest.isCritical ? 'Critical Alerts' : 'Test Notification'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pendingTest.isCritical
                  ? '"Ignore Do Not Disturb" is not enabled, so notifications will not sound in silent mode.'
                  : 'A test notification will be dispatched to your system notification drawer and history.'}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingTest(null)}
                  className="px-4 py-2 rounded text-xs font-mono font-bold text-slate-400 hover:text-white uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const test = pendingTest
                    setPendingTest(null)
                    if (test) executeConfirmedTest(test)
                  }}
                  className="px-4 py-2 rounded bg-nerv-cyan hover:bg-cyan-400 text-black text-xs font-mono font-bold uppercase transition-colors shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                >
                  Test
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b border-[#1A2333] bg-[#0B0F19] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'hub' ? (
            <button
              onClick={() => {
                if (view === 'test_category') setView('test_notifications')
                else if (view === 'test_notifications') setView('notifications')
                else if (view === 'local_notifications' || view === 'dnd_access') setView('notifications')
                else setView('hub')
              }}
              className="w-8 h-8 rounded bg-[#131722] border border-[#1A2333] flex items-center justify-center hover:border-nerv-orange transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          ) : (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded bg-[#131722] border border-[#1A2333] flex items-center justify-center hover:border-nerv-orange transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-nerv-cyan font-bold tracking-widest uppercase">
                A.T.L.A.S // COMMAND
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
              {view === 'hub' && (lang === 'id' ? 'MENU & PENGATURAN' : 'MENU & SETTINGS')}
              {view === 'app_guide' && (lang === 'id' ? 'BUKU PANDUAN APLIKASI & GLOSARIUM' : 'APP MANUAL & GLOSSARY')}
              {view === 'appearance' && (lang === 'id' ? 'TAMPILAN & AKSESIBILITAS' : 'APPEARANCE & DISPLAY')}
              {view === 'notifications' && (lang === 'id' ? 'NOTIFIKASI DARURAT' : 'EMERGENCY NOTIFICATIONS')}
              {view === 'local_notifications' && (lang === 'id' ? 'PENGATURAN NOTIFIKASI LOKAL' : 'LOCAL NOTIFICATION SETTINGS')}
              {view === 'dnd_access' && (lang === 'id' ? 'AKSES JANGAN GANGGU' : 'DO NOT DISTURB ACCESS')}
              {view === 'test_notifications' && (lang === 'id' ? 'UJI COBA NOTIFIKASI' : 'TEST NOTIFICATIONS')}
              {view === 'test_category' && categoryTitles[selectedCategory]}
              {view === 'live_updates' && (lang === 'id' ? 'PEMBARUAN LANGSUNG & PROTOKOL' : 'LIVE UPDATES & PRECAUTIONS')}
              {view === 'license' && (lang === 'id' ? 'INFORMASI LISENSI' : 'LICENSE INFORMATION')}
              {view === 'news' && (lang === 'id' ? 'RIWAYAT GEMPA' : 'EARTHQUAKE HISTORY')}
              {view === 'changelog' && (lang === 'id' ? 'LOG PEMBARUAN SISTEM' : 'SYSTEM RELEASE CHANGELOG')}
              {view === 'broadcasts' && (lang === 'id' ? 'SIARAN RESMI' : 'OFFICIAL DISPATCH BROADCASTS')}
              {view === 'authority' && (lang === 'id' ? 'OTORITAS' : 'AUTHORITY')}
              {view === 'remarks' && (lang === 'id' ? 'KETERANGAN SISTEM' : 'SYSTEM REMARKS')}
              {view === 'terms' && (lang === 'id' ? 'KETENTUAN LAYANAN' : 'TERMS OF SERVICE')}
              {view === 'privacy' && (lang === 'id' ? 'KEBIJAKAN PRIVASI' : 'PRIVACY POLICY')}
            </h1>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded bg-black/60 border border-[#1A2333] font-mono text-[10px] text-nerv-orange font-bold">
          {LATEST_NEWS_VERSION}
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
        {/* ══════════════════════════════════════════════════════════
            VIEW: HUB (Main Root Menu)
        ══════════════════════════════════════════════════════════ */}
        {view === 'hub' && (
          <div className="p-4 space-y-6">
            {/* Group 0: Language & Locale / Bahasa Sistem */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'BAHASA SISTEM' : 'SYSTEM LANGUAGE'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-nerv-cyan" />
                  <div>
                    <p className="text-xs font-bold text-white font-mono">
                      {lang === 'id' ? 'Bahasa Antarmuka' : 'Interface Language'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Pilih Bahasa Indonesia atau English' : 'Select Indonesian or English'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center bg-black/60 p-1 rounded-lg border border-[#1A2333]">
                  <button
                    onClick={() => setLanguage('id')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      lang === 'id'
                        ? 'bg-nerv-orange text-black shadow-[0_0_10px_rgba(255,87,34,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      lang === 'en'
                        ? 'bg-nerv-orange text-black shadow-[0_0_10px_rgba(255,87,34,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>

            {/* Group 1: Settings */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'PENGATURAN SISTEM' : 'SYSTEM SETTINGS'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <button
                  onClick={() => setView('appearance')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-nerv-cyan" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Tampilan & Aksesibilitas' : 'Appearance & Accessibility'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('notifications')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-nerv-orange" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Notifikasi Darurat & Uji Suara' : 'Emergency Notifications & Sirens'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('live_updates')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-nerv-green" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Pembaruan Langsung & Protokol' : 'Live Updates & Directives'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('app_guide')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-slate-200 block">
                        {lang === 'id' ? 'Buku Panduan Aplikasi' : 'App Manual & Guide'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Tata cara penggunaan fitur, panduan navigasi, dan arti istilah' : 'User guide, feature operations, and system terminology'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                {onNavigateHistory && (
                  <button
                    onClick={onNavigateHistory}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Navigation2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-slate-200">
                        {lang === 'id' ? 'Riwayat Jalur Evakuasi' : 'Evacuation Route History'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                )}

              </div>
            </div>

            {/* Group 2: About This App */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'TENTANG SISTEM' : 'ABOUT THIS APP'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Versi Sistem' : 'System Version'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-nerv-cyan">{LATEST_NEWS_VERSION.replace('v', '')}</span>
                </div>

                {/* 1. NEWS: Warta Gempa Masuk (Red Dot) */}
                <button
                  onClick={handleOpenNews}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-nerv-orange shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-slate-200 block">
                        {lang === 'id' ? 'Riwayat Gempa' : 'Earthquake History'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Catatan riwayat gempa bumi terkini' : 'Recorded earthquake history'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUnreadNews && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse ring-4 ring-red-500/20 shadow-[0_0_8px_rgba(239,68,68,1)]" />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>

                {/* 2. CHANGELOG: Log Pembaruan Sistem (Numbered Badge) */}
                <button
                  onClick={handleOpenChangelog}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-nerv-cyan shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-slate-200 block">
                        {lang === 'id' ? 'Log Pembaruan Sistem' : 'System Release Changelog'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Catatan versi rilis & fitur baru aplikasi' : 'Official release notes & system changelog'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadLogCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-nerv-cyan/20 border border-nerv-cyan/60 text-[10px] font-mono font-bold text-nerv-cyan animate-pulse">
                        {unreadLogCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>

                {/* 3. BROADCASTS: Siaran Darurat Posko Komando */}
                <button
                  onClick={handleOpenBroadcasts}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-slate-200 block">
                        {lang === 'id' ? 'Pesan Siaran Darurat' : 'Emergency Advisories'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Instruksi resmi penanganan darurat dari Posko Siaga' : 'Official emergency instructions & safety advisories'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadBroadcastsCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-[10px] font-mono font-bold text-amber-400 animate-pulse">
                        {unreadBroadcastsCount}
                      </span>
                    ) : broadcastList.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                        {broadcastList.length}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>

                {/* 4. OTORITAS: Struktur Otoritas & Peran Sistem */}
                <button
                  onClick={() => setView('authority')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 block">
                      {lang === 'id' ? 'Otoritas' : 'Authority'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                {/* 5. PORTAL PROMOSI RESMI (Apple Design Showcase) */}
                {onNavigateLanding && (
                  <button
                    onClick={onNavigateLanding}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <span className="text-xs font-medium text-slate-200 block">
                          {lang === 'id' ? 'Portal Promosi & Pengenalan Resmi' : 'Official Showcase Portal'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block">
                          {lang === 'id' ? 'Pengalaman interaktif, simulasi gempa, & pusat unduhan' : 'Interactive experience, earthquake simulator, & download hub'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                )}

                <button
                  onClick={() => setView('remarks')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Keterangan Sistem' : 'System Remarks'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('terms')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Ketentuan Layanan' : 'Terms of Service'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('privacy')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => setView('license')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Informasi Lisensi' : 'License Information'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Tactical Watermark Footer (Catatan Fitur Mendatang & Identitas Resmi) */}
            <div className="pt-8 pb-6 flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 flex items-center justify-center mb-3">
                <img
                  src="/atlas-logo-user.png"
                  alt="A.T.L.A.S //"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(255,87,34,0.5)]"
                />
              </div>
              <p className="font-mono text-[12px] font-black tracking-widest text-white uppercase">
                A.T.L.A.S //
              </p>
              <p className="font-mono text-[9px] text-nerv-orange font-bold tracking-widest uppercase mb-1">
                AUTONOMOUS THREAT LOCATION & ALERT SYSTEM
              </p>
              <p className="font-mono text-[8px] text-slate-400 tracking-wider uppercase px-4 leading-relaxed max-w-xs">
                {(() => {
                  const raw = (userLocation || localStorage.getItem('atlas_user_city') || 'KOTA PALU, SULAWESI TENGAH').trim();
                  const clean = raw.includes('Mendeteksi') || raw.includes('Izin') ? 'KOTA PALU, SULAWESI TENGAH' : raw.split(' // ')[0].toUpperCase();
                  return `Tactical Telemetry & Emergency Evacuation Network — ${clean} Telemetry Node`;
                })()}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: APP_GUIDE (Buku Panduan Aplikasi & Glosarium)
        ══════════════════════════════════════════════════════════ */}
        {view === 'app_guide' && (
          <div className="p-4 space-y-6">
            {/* 1. GLOSARIUM TAKTIS SISTEM */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#1A2333] pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nerv-cyan animate-pulse" />
                    <h3 className="text-xs font-bold text-nerv-cyan uppercase tracking-wider">
                      {lang === 'id' ? 'PANDUAN & ISTILAH SISTEM A.T.L.A.S' : 'SYSTEM GLOSSARY'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {lang === 'id' ? 'Penjelasan arti istilah, tingkat bahaya, dan kode panggilan sistem' : 'Detailed explanations of system terminology and status codes'}
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded bg-black/50 border border-slate-800 text-[9px] text-slate-400 font-bold">
                  {GLOSSARY_TERMS.length} ENTRI
                </div>
              </div>

              {/* Search filter for glossary */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Cari istilah (DEFCON, UNIT, ZRB, Sharelock)..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-nerv-cyan focus:outline-none"
                />
              </div>

              <div className="space-y-2.5">
                {GLOSSARY_TERMS.filter(g => 
                  g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || 
                  g.summary.toLowerCase().includes(glossarySearch.toLowerCase()) ||
                  g.detail.toLowerCase().includes(glossarySearch.toLowerCase())
                ).map((item) => {
                  const isExp = expandedGlossary === item.term;
                  return (
                    <div
                      key={item.term}
                      className={`rounded-xl border transition-all overflow-hidden bg-[#0a0f1d] ${
                        isExp ? 'border-nerv-cyan/70 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedGlossary(isExp ? '' : item.term)}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                              {item.code}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                            {item.term}
                          </h4>
                          <p className="text-[11px] font-sans text-slate-400 mt-1 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>
                        <div className="p-1 rounded bg-slate-800/60 text-slate-400 shrink-0 mt-1">
                          {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </button>

                      {isExp && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 font-sans text-xs space-y-2.5 bg-black/30">
                          <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">
                            {item.detail}
                          </div>
                          {item.examples && item.examples.length > 0 && (
                            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[10px] space-y-1">
                              <span className="text-nerv-cyan font-bold block mb-1">CONTOH PENERAPAN DI A.T.L.A.S:</span>
                              {item.examples.map((ex, idx) => (
                                <div key={idx} className="text-slate-300 flex items-center gap-1.5">
                                  <span className="text-nerv-orange">›</span>
                                  <span>{ex}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PANDUAN PENGGUNAAN FITUR (Langkah Demi Langkah) */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-[#1A2333] pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nerv-orange animate-pulse" />
                    <h3 className="text-xs font-bold text-nerv-orange uppercase tracking-wider">
                      {lang === 'id' ? 'PANDUAN OPERASIONAL CARA PENGGUNAAN FITUR' : 'SYSTEM OPERATIONAL WORKFLOW'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    {lang === 'id' ? 'Langkah kerja rinci setiap menu dari situasi normal hingga darurat' : 'Step-by-step instructions for all application interfaces'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {FEATURE_GUIDES.map((guide, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-800/80 bg-[#0d121c] space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-black font-mono shrink-0"
                          style={{ background: guide.color }}
                        >
                          {idx + 1}
                        </div>
                        <h4 className="text-xs font-mono font-bold text-white tracking-wide">
                          {guide.title}
                        </h4>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-black/60 border border-slate-800 font-mono text-[8px] text-slate-400 uppercase font-bold">
                        {guide.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {guide.desc}
                    </p>

                    <div className="space-y-2 pt-1">
                      {guide.steps.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-black/40 border border-slate-800/50"
                        >
                          <span
                            className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 text-black mt-0.5"
                            style={{ background: guide.color }}
                          >
                            {st.step}
                          </span>
                          <p className="text-[11px] font-sans text-slate-300 leading-snug">
                            {st.instruction}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: APPEARANCE (Tampilan & Aksesibilitas)
        ══════════════════════════════════════════════════════════ */}
        {view === 'appearance' && (
          <div className="p-4 space-y-6">
            {/* Display Theme Preference */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">
                {lang === 'id' ? 'PILIHAN TEMA TAMPILAN' : 'DISPLAY THEME PREFERENCE'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Tactical Dark Standard Card */}
                <div
                  onClick={() => {
                    handleSelectTheme('dark')
                    handleSelectContrast('standard')
                  }}
                  className={`cursor-pointer rounded-xl p-3 border transition-all ${
                    contrast === 'standard'
                      ? 'border-nerv-orange bg-[#0F1424] shadow-[0_0_15px_rgba(255,87,34,0.25)] ring-1 ring-nerv-orange/40'
                      : 'border-[#1A2333] bg-[#090D18] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[4/5] rounded-lg bg-[#07090E] border border-[#1A2333] p-2 flex flex-col justify-between mb-2 shadow-inner">
                    <div className="h-2 w-12 bg-nerv-orange/90 rounded" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-[#1A2333] rounded" />
                      <div className="h-1.5 w-3/4 bg-[#1A2333] rounded" />
                    </div>
                    <div className="h-3 w-8 bg-nerv-cyan/60 rounded self-end" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">
                      {lang === 'id' ? 'DARK (TEMA GELAP)' : 'DARK (TACTICAL)'}
                    </span>
                    {contrast === 'standard' && <Check className="w-3.5 h-3.5 text-nerv-orange" />}
                  </div>
                </div>

                {/* Daylight High-Contrast Card */}
                <div
                  onClick={() => {
                    handleSelectTheme('dark')
                    handleSelectContrast('high')
                  }}
                  className={`cursor-pointer rounded-xl p-3 border transition-all ${
                    contrast === 'high'
                      ? 'border-nerv-cyan bg-[#0F1424] shadow-[0_0_15px_rgba(0,229,255,0.25)] ring-1 ring-nerv-cyan/40'
                      : 'border-[#1A2333] bg-[#090D18] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[4/5] rounded-lg bg-[#07090E] border-2 border-nerv-cyan/80 p-2 flex flex-col justify-between mb-2 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                    <div className="h-2 w-12 bg-nerv-orange rounded font-bold" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-600 rounded" />
                      <div className="h-1.5 w-3/4 bg-slate-600 rounded" />
                    </div>
                    <div className="h-3 w-8 bg-nerv-cyan rounded self-end font-bold" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">
                      {lang === 'id' ? 'HIGH-CONTRAST' : 'HIGH-CONTRAST'}
                    </span>
                    {contrast === 'high' && <Check className="w-3.5 h-3.5 text-nerv-cyan" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility Themes (Gambar 4 Reference) */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'TEMA AKSESIBILITAS' : 'ACCESSIBILITY THEMES'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden shadow-sm">
                {/* Contrast */}
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">
                    {lang === 'id' ? 'Kontras' : 'Contrast'}
                  </span>
                  <div className="flex items-center gap-1 border border-[#1A2333] bg-black/60 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectContrast('standard')}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        contrast === 'standard'
                          ? 'bg-nerv-card text-white font-bold border border-white/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectContrast('high')}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        contrast === 'high'
                          ? 'bg-nerv-orange text-white font-bold shadow-[0_0_10px_rgba(255,87,34,0.4)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>

                {/* Colour vision */}
                <button
                  type="button"
                  onClick={cycleColorVision}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                >
                  <span className="text-xs font-medium text-slate-200">
                    {lang === 'id' ? 'Penglihatan Warna' : 'Colour Vision'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                    <span className="text-xs capitalize font-medium text-slate-300">
                      {colorVision === 'normal' ? 'Normal' : colorVision}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>

                {/* Font size */}
                <button
                  type="button"
                  onClick={cycleFontSize}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                >
                  <span className="text-xs font-medium text-slate-200">
                    {lang === 'id' ? 'Ukuran Font' : 'Font Size'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                    <span className="text-xs capitalize font-medium text-slate-300">
                      {fontSize === 'device' ? (lang === 'id' ? 'Pengaturan Perangkat' : 'Device Setting') : fontSize}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>

                {/* Font thickness */}
                <button
                  type="button"
                  onClick={cycleFontThickness}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                >
                  <span className="text-xs font-medium text-slate-200">
                    {lang === 'id' ? 'Ketebalan Font' : 'Font Thickness'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                    <span className="text-xs capitalize font-medium text-slate-300">
                      {fontThickness === 'device' ? (lang === 'id' ? 'Pengaturan Perangkat' : 'Device Setting') : fontThickness}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              </div>
            </div>

            {/* Screen Reader (TalkBack) Radio Section */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'PEMBACA LAYAR' : 'SCREEN READER'}
              </p>
              <div className="space-y-2.5">
                {/* Default Layout Option */}
                <div
                  onClick={() => handleSelectScreenReader('default')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    screenReaderMode === 'default'
                      ? 'border-nerv-orange/80 bg-[#0F1424] shadow-[0_0_15px_rgba(255,87,34,0.15)]'
                      : 'border-[#1A2333] bg-[#0D121F] hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      screenReaderMode === 'default'
                        ? 'border-nerv-orange bg-nerv-orange/20'
                        : 'border-slate-500 bg-transparent'
                    }`}>
                      {screenReaderMode === 'default' && (
                        <div className="w-2 h-2 rounded-full bg-nerv-orange" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white mb-0.5">
                      {lang === 'id' ? 'Standar' : 'Default'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {lang === 'id'
                        ? 'Tampilkan antarmuka dalam tata letak visual taktis standar.'
                        : 'Display in the default layout.'}
                    </p>
                  </div>
                </div>

                {/* TalkBack Screen Reader Compatible Option */}
                <div
                  onClick={() => handleSelectScreenReader('talkback')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    screenReaderMode === 'talkback'
                      ? 'border-nerv-cyan/80 bg-[#0F1424] shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                      : 'border-[#1A2333] bg-[#0D121F] hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      screenReaderMode === 'talkback'
                        ? 'border-nerv-cyan bg-nerv-cyan/20'
                        : 'border-slate-500 bg-transparent'
                    }`}>
                      {screenReaderMode === 'talkback' && (
                        <div className="w-2 h-2 rounded-full bg-nerv-cyan" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white mb-0.5">
                      {lang === 'id' ? 'Kompatibel Pembaca Layar' : 'Screen reader compatible'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {lang === 'id'
                        ? 'Sesuaikan tata letak untuk memudahkan pembaca layar (TalkBack) mendeteksi dan melafalkan elemen evakuasi.'
                        : 'Adjust the layout to make it easier for screen readers to read.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: NOTIFICATIONS (Pengaturan Notifikasi Darurat)
        ══════════════════════════════════════════════════════════ */}
        {view === 'notifications' && (
          <div className="p-4 space-y-6">
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'PENGATURAN NOTIFIKASI DARURAT' : 'EMERGENCY NOTIFICATION SETTINGS'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">
                      {lang === 'id' ? 'Notifikasi Umum' : 'General Notifications'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Aktifkan seluruh push alert kebencanaan' : 'Enable all disaster push notifications'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifGeneral}
                    onChange={(e) => setNotifGeneral(e.target.checked)}
                    className="w-4 h-4 accent-nerv-orange rounded cursor-pointer"
                  />
                </div>

                <div
                  onClick={() => setView('local_notifications')}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-white">
                      {lang === 'id' ? 'Notifikasi Lokasi Presisi' : 'Precise Location Notifications'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Peringatan otomatis sesuai zona radius pengguna' : 'Automatic alert based on user distance radius'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-nerv-cyan font-bold">{notifLocal ? 'ON' : 'OFF'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div
                  onClick={() => setView('dnd_access')}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-xs font-bold text-red-400 font-mono">
                        {lang === 'id' ? 'Peringatan Kritis' : 'Critical Alerts'}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Akses bypass mode Jangan Ganggu / hening' : 'Bypass Do Not Disturb / silent mode'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-red-400 font-bold">{notifCritical ? 'ON' : 'OFF'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">
                      {lang === 'id' ? 'Pembaruan Langsung' : 'Live Updates'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Hitungan mundur gelombang di lock screen' : 'Wave countdown on lock screen'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifLive}
                    onChange={(e) => setNotifLive(e.target.checked)}
                    className="w-4 h-4 accent-nerv-green rounded cursor-pointer"
                  />
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">
                      {lang === 'id' ? 'Informasi Cuaca Ekstrem' : 'Extreme Weather Information'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'id' ? 'Peringatan hujan lebat dan angin kencang BMKG' : 'BMKG heavy rain and strong wind warnings'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifWeather}
                    onChange={(e) => setNotifWeather(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Sentinel Background Service & Battery Optimization */}
            <div>
              <p className="text-[11px] font-mono font-bold text-nerv-cyan uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-nerv-cyan" />
                {lang === 'id' ? 'LAYANAN LATAR BELAKANG SENTINEL' : 'BACKGROUND SENTINEL SERVICE'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white font-mono">
                        {lang === 'id' ? 'Mode Sentinel 24/7' : '24/7 Sentinel Guard'}
                      </p>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold border ${
                        sentinelActive
                          ? 'bg-nerv-cyan/20 text-nerv-cyan border-nerv-cyan/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {sentinelActive ? (lang === 'id' ? 'AKTIF' : 'ACTIVE') : (lang === 'id' ? 'NONAKTIF' : 'INACTIVE')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {lang === 'id' 
                        ? 'Memantau sinyal simulasi & bencana di latar belakang dengan notifikasi status bar permanen agar sirine otomatis menyala saat aplikasi ditutup.'
                        : 'Monitors simulation and disaster triggers in the background with a persistent status bar notification even when app is closed.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sentinelActive}
                    onChange={(e) => handleToggleSentinel(e.target.checked)}
                    className="w-4 h-4 accent-nerv-cyan rounded cursor-pointer shrink-0"
                  />
                </div>

                <div
                  onClick={() => NativeSettings.openBatteryOptimization().catch(() => {})}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div className="pr-3">
                    <p className="text-xs font-medium text-white">
                      {lang === 'id' ? 'Nonaktifkan Penghemat Baterai' : 'Disable Battery Optimization'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      {lang === 'id'
                        ? 'Cegah OS Android mematikan Sentinel saat ponsel tidur atau layar padam'
                        : 'Prevent Android Doze mode from sleeping Sentinel service'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              </div>
            </div>

            {/* Test Notifications Hub Entry */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'SIMULATOR UJI COBA SUARA & NOTIFIKASI' : 'SIREN & NOTIFICATION SIMULATOR'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                <button
                  onClick={() => setView('test_notifications')}
                  className="w-full px-4 py-4 flex items-center justify-between bg-nerv-orange/10 hover:bg-nerv-orange/20 border border-nerv-orange/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-nerv-orange/20 border border-nerv-orange flex items-center justify-center shrink-0">
                      <Volume2 className="w-5 h-5 text-nerv-orange" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-mono uppercase">
                        {lang === 'id' ? 'Uji Coba Notifikasi & Sirine' : 'Test Notifications & Sirens'}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        {lang === 'id' ? 'Kenali bunyi sirine dan simulasi notifikasi banner berjenjang' : 'Listen to warning sirens and multi-tier banner alerts'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-nerv-orange" />
                </button>
              </div>
            </div>

            {/* Warning disclosure */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-[#1A2333] text-[11px] text-slate-400 leading-relaxed font-sans">
              <span className="text-nerv-orange font-bold font-mono">
                {lang === 'id' ? '⚠️ PERHATIAN KEBIJAKAN SUARA:' : '⚠️ SOUND POLICY NOTICE:'}
              </span>{' '}
              {lang === 'id'
                ? 'Peringatan Kritis diatur agar tetap membunyikan sirine pada volume penuh saat ancaman tsunami mendesak terdeteksi, meskipun ponsel Anda dalam kondisi mode hening (silent mode).'
                : 'Critical alerts are configured to play emergency sirens at full volume upon imminent tsunami threats, even when your device is in silent mode.'}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: LOCAL NOTIFICATION SETTINGS (Sub-Halaman Izin Lokasi)
        ══════════════════════════════════════════════════════════ */}
        {view === 'local_notifications' && (
          <div className="p-4 space-y-5">
            <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">
                    {lang === 'id' ? 'Notifikasi Lokasi Presisi' : 'Local Notifications'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'id' ? 'Peringatan berbasis lokasi berkala di latar belakang' : 'Periodic location-based background alerts'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifLocal}
                  onChange={(e) => setNotifLocal(e.target.checked)}
                  className="w-4 h-4 accent-nerv-cyan rounded cursor-pointer"
                />
              </div>

              <div
                onClick={() => NativeSettings.openAppDetails().catch(() => {})}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-white">
                    {lang === 'id' ? 'Izin Akses Lokasi' : 'Location Permissions'}
                  </p>
                  <p className="text-[10px] text-nerv-cyan font-mono">
                    {lang === 'id' ? 'Izinkan Sepanjang Waktu' : 'Always Allow'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Configure Guidance Card */}
            <div className="p-4 rounded-xl bg-[#111927] border border-[#1A2333] space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Untuk menerima notifikasi darurat berbasis lokasi presisi, atur izin lokasi aplikasi menjadi "Izinkan Sepanjang Waktu".'
                  : 'To receive local notifications, set your location permissions to "Always Allow".'}
              </p>
              <button
                onClick={() => NativeSettings.openAppDetails().catch(() => {})}
                className="px-5 py-2 rounded-full border border-nerv-cyan text-nerv-cyan hover:bg-nerv-cyan hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                {lang === 'id' ? '[ Buka Pengaturan ]' : '[ Configure ]'}
              </button>
            </div>

            {/* Local Notification Conditions */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                {lang === 'id' ? 'KETENTUAN NOTIFIKASI LOKASI' : 'LOCAL NOTIFICATION CONDITIONS'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Menghitung estimasi guncangan gempa dan waktu tiba gelombang tsunami berdasarkan lokasi posisi Anda saat gempa terjadi. Informasi lokasi diperbarui secara berkala di latar belakang untuk memastikan peringatan akurat di dalam zona bahaya.'
                  : 'Calculates estimated shaking and tsunami arrival based on your location at the time of the earthquake. Location information is updated periodically in the background to ensure you are alerted accurately inside danger zones.'}
              </p>
            </div>

            {/* Your Privacy */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                {lang === 'id' ? 'KEBIJAKAN PRIVASI KOORDINAT' : 'YOUR PRIVACY'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Saat menghitung apakah lokasi Anda berada di area terdampak bencana, koordinat posisi diproses secara lokal di perangkat Anda. Titik garis bujur dan lintang spesifik tidak pernah disebarkan tanpa enkripsi.'
                  : 'When calculating whether your location is in an alert area, location coordinates are converted into an area code on your device. Specific latitude and longitude coordinates are never stored on public servers without encryption.'}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: DO NOT DISTURB ACCESS (Sub-Halaman DND & Bypass)
        ══════════════════════════════════════════════════════════ */}
        {view === 'dnd_access' && (
          <div className="p-4 space-y-5">
            {/* Critical Alerts / DND Access */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <div
                onClick={() => NativeSettings.openDndAccess().catch(() => {})}
                className="flex items-center justify-between cursor-pointer border-b border-[#1A2333] pb-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-bold text-white font-mono uppercase">
                    {lang === 'id' ? 'Akses Jangan Ganggu' : 'Do Not Disturb Access'}: {notifCritical ? (lang === 'id' ? 'AKTIF' : 'ON') : (lang === 'id' ? 'NONAKTIF' : 'OFF')}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Agar ponsel dapat membunyikan sirine darurat ketika menerima peringatan kritis bencana, meskipun ponsel diatur ke mode hening atau Jangan Ganggu, aktifkan pengecualian mode hening.'
                  : 'To allow the phone to sound when receiving critical alerts, even when it is set to silent or Do Not Disturb mode, please set "Silent mode exception" to ON.'}
              </p>

              <button
                onClick={() => NativeSettings.openDndAccess().catch(() => {})}
                className="px-5 py-2 rounded-full border border-nerv-cyan text-nerv-cyan hover:bg-nerv-cyan hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                {lang === 'id' ? '[ Buka Pengaturan ]' : '[ Configure ]'}
              </button>
            </div>

            {/* About Critical Alerts */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                {lang === 'id' ? 'TENTANG PERINGATAN KRITIS' : 'ABOUT CRITICAL ALERTS'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Peringatan kritis dikirimkan kepada seluruh warga yang berada di area terdekat dengan episentrum atau ancaman bahaya bencana, terlepas dari apakah telah mengatur lokasi tetap atau bergerak.'
                  : 'Critical alerts will be sent to users who are in the area closest to the disaster, regardless of whether they have registered their location.'}
              </p>
              <p className="text-[11px] text-nerv-orange font-mono">
                {lang === 'id'
                  ? '※ Untuk menerima peringatan kritis, pastikan "Notifikasi Lokasi Presisi" dalam keadaan AKTIF.'
                  : '※ To receive critical alerts, you need to set "Local Notifications" to ON.'}
              </p>
            </div>

            {/* Do Not Disturb Bypass Channel */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <div
                onClick={() => NativeSettings.openChannelSettings({ channelId: 'critical_alerts' }).catch(() => {})}
                className="flex items-center justify-between cursor-pointer border-b border-[#1A2333] pb-2"
              >
                <p className="text-xs font-bold text-white font-mono uppercase">
                  {lang === 'id' ? 'Bypass Jangan Ganggu' : 'Do Not Disturb Bypass'}: {notifCritical ? (lang === 'id' ? 'AKTIF' : 'ON') : (lang === 'id' ? 'NONAKTIF' : 'OFF')}
                </p>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Jika Anda mengaktifkan pengecualian mode hening, peringatan kritis akan membunyikan nada sirine evakuasi pada volume darurat maksimal.'
                  : 'If you enable "Silent mode exception", critical alerts will play sound at maximum emergency volume.'}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: TEST NOTIFICATIONS (Daftar Kategori Uji Coba)
        ══════════════════════════════════════════════════════════ */}
        {view === 'test_notifications' && (
          <div className="p-4 space-y-4">
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2">
              {lang === 'id' ? 'PILIH KATEGORI UJI COBA PERINGATAN' : 'SELECT ALERT TEST CATEGORY'}
            </p>

            <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
              {[
                {
                  id: 'eew' as TestCategoryType,
                  label: lang === 'id' ? 'Peringatan Dini Gempa Bumi' : 'Earthquake Early Warning',
                  sub: lang === 'id' ? 'Sistem Peringatan Dini Seismik BMKG' : 'BMKG Early Seismic Warning Alert',
                },
                {
                  id: 'earthquake_info' as TestCategoryType,
                  label: lang === 'id' ? 'Informasi Gempa Terkini' : 'Earthquake Information',
                  sub: lang === 'id' ? 'Laporan Cepat Seismik & Episentrum' : 'Quick Seismic & Epicenter Report',
                },
                {
                  id: 'tsunami' as TestCategoryType,
                  label: lang === 'id' ? 'Peringatan Dini Tsunami' : 'Tsunami Warnings',
                  sub: lang === 'id' ? 'Sirine Ancaman Tsunami Wilayah Pesisir' : 'Coastal Tsunami Threat Warning Sirens',
                },
                {
                  id: 'volcano' as TestCategoryType,
                  label: lang === 'id' ? 'Peringatan Erupsi Gunung Api' : 'Volcanic Eruption Alerts',
                  sub: lang === 'id' ? 'Aktivitas Vulkanik & Sebaran Abu' : 'Volcanic Activity & Ash Dispersion',
                },
                {
                  id: 'weather' as TestCategoryType,
                  label: lang === 'id' ? 'Peringatan Cuaca Ekstrem' : 'Weather Warnings',
                  sub: lang === 'id' ? 'Peringatan Darurat Cuaca BMKG' : 'Emergency Severe Weather Alerts',
                },
                {
                  id: 'heavy_rain' as TestCategoryType,
                  label: lang === 'id' ? 'Peringatan Hujan Lebat & Banjir' : 'Heavy Rain Risk Alerts',
                  sub: lang === 'id' ? 'Risiko Hujan Lebat & Banjir Bandang' : 'Severe Rain & Flash Flood Threats',
                },
                {
                  id: 'civil' as TestCategoryType,
                  label: lang === 'id' ? 'Informasi Perlindungan Sipil' : 'Civil Protection Information',
                  sub: lang === 'id' ? 'Protokol Perlindungan Sipil & Evakuasi' : 'Civil Protection & Evacuation Protocols',
                },
              ].map(({ id, label, sub }) => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedCategory(id)
                    setView('test_category')
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-bold text-white font-mono">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-black/60 border border-[#1A2333] text-[10px] text-slate-400 leading-relaxed font-sans">
              {lang === 'id'
                ? 'Tekan salah satu kategori di atas untuk menguji nada sirine simulasi peringatan dini dan memeriksa tampilan banner notifikasi yang muncul di ponsel Anda.'
                : 'Tap any category above to test emergency sirens and inspect banner alerts on your device.'}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: TEST CATEGORY (Sub-Menu Rinci dengan Tombol Suara)
        ══════════════════════════════════════════════════════════ */}
        {view === 'test_category' && (
          <div className="p-4 space-y-6">
            {/* 1. EEW Category */}
            {selectedCategory === 'eew' && (
              <div className="space-y-4">
                {/* Location Warning Card */}
                <div className="p-4 rounded-xl bg-[#111927] border border-[#1A2333] space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You won't receive Earthquake Early Warning notifications because your location is not set to "Always Allow".
                  </p>
                  <button
                    onClick={() => {
                      NativeSettings.openAppDetails().catch(() => {})
                    }}
                    className="px-5 py-2 rounded-full border border-nerv-cyan text-nerv-cyan hover:bg-nerv-cyan hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                  >
                    [ Configure ]
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Earthquake Early Warning (Alert)
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Early Warning', typeLabel: 'Critical Alert', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Critical Alerts (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Early Warning', typeLabel: 'Normal Notification', isCritical: false })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Outside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Earthquake Early Warning (Forecast)
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Early Warning', typeLabel: 'Forecast Int. 3 or higher', isCritical: false })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Inside an area with expected Int. 3 or higher)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Early Warning', typeLabel: 'Forecast Outside Area', isCritical: false })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Silent Notifications (Outside an area with expected Int. 3 or higher)</span>
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Earthquake Info */}
            {selectedCategory === 'earthquake_info' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Seismic Intensity Flash Report
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Seismic Intensity Flash', typeLabel: 'Inside area with Int. 3+' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Inside an area with Int. 3 or higher)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Seismic Intensity Flash', typeLabel: 'Silent update' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Silent Notifications (Other than the above)</span>
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Epicenter Flash Report
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Epicenter Flash Report', typeLabel: 'Inside area with Int. 3+' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Inside an area with Int. 3 or higher)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Epicenter Flash Report', typeLabel: 'Silent update' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Silent Notifications (Other than the above)</span>
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Earthquake Information
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Information', typeLabel: 'Received EEW warning' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Inside an area with Int. 3 or higher, or if you received EEW)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Earthquake Information', typeLabel: 'Silent update' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Silent Notifications (Other than the above)</span>
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tsunami Warnings */}
            {selectedCategory === 'tsunami' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Tsunami Warning / Major Warning
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Tsunami Warning', typeLabel: 'Major Warning', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-red-300 font-bold">Critical Alerts (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Tsunami Warning', typeLabel: 'Registered Location Alert' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (If registered location is inside alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Tsunami Advisory
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Tsunami Advisory', typeLabel: 'Advisory Level' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Volcanic Eruption Alerts */}
            {selectedCategory === 'volcano' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Volcanic Eruption Bulletin
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Volcanic Eruption Bulletin', typeLabel: 'Inside alert area', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Critical Alerts (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Volcanic Eruption Bulletin', typeLabel: 'Registered Location Alert' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (If registered location is inside alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Volcanic Eruption Alert
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Volcanic Eruption Alert', typeLabel: 'Evacuation Area Alert', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Critical Alerts (If you are in an area subject to evacuation)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Volcanic Eruption Alert', typeLabel: 'Normal Advisory' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Other than the above)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Ashfall Forecast
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Ashfall Forecast', typeLabel: 'Ashfall Warning' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Weather Warnings */}
            {selectedCategory === 'weather' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Emergency Warning
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Weather Warning', typeLabel: 'Emergency Warning', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-red-300 font-bold">Critical Alerts (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Weather Warning', typeLabel: 'Registered Location Alert' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (If registered location is inside alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Urgent Warning
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Weather Warning', typeLabel: 'Urgent Warning' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Warning
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Weather Warning', typeLabel: 'General Advisory' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Heavy Rain Risk Alerts */}
            {selectedCategory === 'heavy_rain' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Heavy Rain Risk Alert
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Heavy Rain Risk Alert', typeLabel: 'Inside the alert area' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Civil Protection Information */}
            {selectedCategory === 'civil' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider px-2 mb-2">
                    Test Civil Protection Information
                  </p>
                  <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                    <div
                      onClick={() => triggerTestAlert({ category: 'Civil Protection Information', typeLabel: 'Critical Alert', isCritical: true })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-red-300 font-bold">Critical Alerts (Inside the alert area)</span>
                      <Volume2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div
                      onClick={() => triggerTestAlert({ category: 'Civil Protection Information', typeLabel: 'Registered Location Alert' })}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-slate-200">Normal Notifications (If registered location is inside alert area)</span>
                      <Volume2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: LIVE UPDATES & 7-POINT PRECAUTIONS
        ══════════════════════════════════════════════════════════ */}
        {view === 'live_updates' && (
          <div className="p-4 space-y-6">
            <div className="p-4 rounded-xl bg-[#0D121F] border border-nerv-cyan/40">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-nerv-cyan" />
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  Pembaruan Langsung Layar Kunci (Live Updates)
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Saat gempa terdeteksi, A.T.L.A.S menampilkan hitungan mundur gelombang seismik dan perkiraan intensitas guncangan (MMI) secara dinamis tanpa perlu membuka kunci layar.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-mono font-bold text-nerv-orange uppercase tracking-widest px-2 mb-2">
                7 POIN PROTOKOL KEHATI-HATIAN OPERASIONAL (PRECAUTIONS)
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    num: '01',
                    title: 'Sifat Estimasi Cepat Sensor',
                    desc: 'Peringatan dini diterbitkan otomatis berdasarkan data beberapa detik pertama. Magnitudo dan intensitas dapat diperbarui seiring diterimanya data sensor BMKG berikutnya.'
                  },
                  {
                    num: '02',
                    title: 'Prioritas Perlindungan Diri',
                    desc: 'Guncangan kuat dapat tiba sebelum hitungan mundur mencapai angka 0. Lakukan tindakan keselamatan (Drop, Cover, Hold On) seketika tanpa menunggu hitungan selesai.'
                  },
                  {
                    num: '03',
                    title: 'Kemungkinan Pembatalan Peringatan',
                    desc: 'Peringatan dini dapat dibatalkan jika sensor stasiun mendeteksi adanya interferensi sinyal atau anomali non-seismik.'
                  },
                  {
                    num: '04',
                    title: 'Izin Lokasi Latar Belakang (Always Allow)',
                    desc: 'Untuk mengkalkulasi jarak relatif dan estimasi intensitas di posisi Anda secara akurat, izin lokasi sistem harus disetel ke "Izinkan Sepanjang Waktu".'
                  },
                  {
                    num: '05',
                    title: 'Konektivitas Sinyal & Cache Telemetri',
                    desc: 'Pembaruan data membutuhkan internet seluler/WiFi. Jika jaringan terputus akibat bencana, sistem secara otomatis mengandalkan data peta cache offline lokal.'
                  },
                  {
                    num: '06',
                    title: 'Kebijakan Penghemat Daya Android',
                    desc: 'Mode hemat daya ekstrem pada vendor perangkat tertentu dapat menonaktifkan pembaruan latar belakang. Disarankan mengecualikan A.T.L.A.S dari pembatasan baterai.'
                  },
                  {
                    num: '07',
                    title: 'Sinergi Informasi Resmi Pemerintah',
                    desc: 'A.T.L.A.S menyempurnakan sistem peringatan dini mandiri. Masyarakat tetap diimbau mematuhi arahan resmi sirine publik BPBD Kota Palu dan BNPB.'
                  }
                ].map(({ num, title, desc }) => (
                  <div key={num} className="p-3.5 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-nerv-cyan font-bold">#{num}</span>
                      <h4 className="text-xs font-bold text-white">{title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: NEWS (WARTA GEMPA TELEMETRI SISTEM)
        ══════════════════════════════════════════════════════════ */}
        {view === 'news' && (() => {
          const earthquakeList = loadEarthquakeNews()
          return (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  {lang === 'id' ? 'RIWAYAT GEMPA' : 'EARTHQUAKE HISTORY'}
                </p>
              </div>

              {earthquakeList.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0D121F] border border-[#1A2333] text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">
                    {lang === 'id' ? 'Belum ada riwayat gempa dalam 7 hari terakhir' : 'No earthquake records in the last 7 days'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earthquakeList.map((item) => {
                    const expireAt = item.receivedAt + (7 * 24 * 60 * 60 * 1000)
                    const diffMs = Math.max(0, expireAt - Date.now())
                    const daysLeft = Math.floor(diffMs / (24 * 3600 * 1000))
                    const hoursLeft = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000))
                    const minsLeft = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000))
                    const countdownText = daysLeft > 0 
                      ? (lang === 'id' ? `${daysLeft}h ${hoursLeft}j ${minsLeft}m` : `${daysLeft}d ${hoursLeft}h ${minsLeft}m`)
                      : (lang === 'id' ? `${hoursLeft}j ${minsLeft}m` : `${hoursLeft}h ${minsLeft}m`)
                    const formattedReceived = new Date(item.receivedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) + ' WITA'

                    return (
                      <div key={item.id} className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] relative">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Broadcast Header, Location, Time, Potensi */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Radio className="w-3.5 h-3.5 text-nerv-orange shrink-0 animate-pulse" />
                              <span className="font-mono text-[10px] font-bold text-nerv-orange tracking-wider uppercase truncate">
                                SIARAN SEISMIK LANGSUNG • BMKG // PUSAT GEMPA
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white leading-snug">
                              {item.location}
                            </h4>

                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-nerv-cyan shrink-0" />
                              <span>{item.eventTime}</span>
                            </div>

                            {item.potensi && (
                              <p className="text-[11px] font-sans font-medium text-amber-400/90 leading-relaxed pt-0.5">
                                {item.potensi}
                              </p>
                            )}
                          </div>

                          {/* Right: MAG & Depth Badge */}
                          <div className="shrink-0 flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#07090E] border border-red-500/30 min-w-[74px] shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                              MAG
                            </span>
                            <span className="text-2xl font-mono font-black text-nerv-orange my-0.5">
                              {item.magnitude}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              {item.depth}
                            </span>
                          </div>
                        </div>

                        {/* Footer info: Kedaluwarsa */}
                        <div className="mt-3 pt-2 border-t border-[#1A2333] flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>DATA RESMI BMKG TEWS</span>
                          </span>
                          <span className="text-nerv-cyan font-bold">
                            {lang === 'id' ? `Kedaluwarsa: ${countdownText}` : `Expires: ${countdownText}`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* ══════════════════════════════════════════════════════════
            VIEW: BROADCASTS (SIARAN RESMI)
        ══════════════════════════════════════════════════════════ */}
        {view === 'broadcasts' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {lang === 'id' ? 'PESAN SIARAN RESMI' : 'OFFICIAL DISPATCHES'}
              </p>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEFCON DISPATCH
              </span>
            </div>

            {broadcastList.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0D121F] border border-[#1A2333] text-center space-y-2">
                <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  {lang === 'id' ? 'Belum ada pesan siaran resmi aktif saat ini' : 'No active official dispatches at this time'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  {lang === 'id' ? 'Instruksi resmi penanggulangan akan disiarkan langsung ke seluruh unit saat siaga' : 'Official emergency instructions will be broadcasted to all units in real-time'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcastList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border bg-black/60 space-y-2.5 ${
                      item.level === 'CRITICAL'
                        ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : item.level === 'WARNING'
                        ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          item.level === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : item.level === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {item.level === 'CRITICAL' ? 'DEFCON 1 · KRITIS' : item.level === 'WARNING' ? 'DEFCON 2 · PERINGATAN' : 'INFORMASI'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-white/10">
                          {item.region || 'SEMUA WILAYAH'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono text-slate-400 mb-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>DARI:</span>
                        {/ARCHITECT/i.test(item.sender || '') || /ARCHITECT/i.test(item.role || '') ? (
                          <span className="text-amber-400 font-mono font-black tracking-wider bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            {item.sender || 'ARCHITECT'}
                          </span>
                        ) : (
                          <span className="text-white font-bold">{item.sender}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        {item.title}
                      </h3>
                    </div>

                    <div className="p-3 rounded-lg bg-[#07090e] border border-white/10 text-xs text-slate-200 leading-relaxed font-sans break-words">
                      {item.message}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/10">
                      <span className="text-[9px] font-mono text-slate-500">
                        STATUS: {item.read ? 'TERBACA' : 'BELUM DIBACA'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          markBroadcastAsRead(item.id)
                          setBroadcastList(getAdminBroadcasts())
                        }}
                        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> {lang === 'id' ? 'SAYA MEMATUHI' : 'ACKNOWLEDGE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: CHANGELOG (LOG PEMBARUAN SISTEM)
        ══════════════════════════════════════════════════════════ */}
        {view === 'changelog' && (
          <div className="p-4 space-y-4">
            <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2">
              {lang === 'id' ? 'LOG PEMBARUAN SISTEM' : 'SYSTEM RELEASE LOGS'}
            </p>

            <div className="space-y-3">
              {[
                {
                  "version": "v1.0.0",
                  "timestamp": {
                    "id": "2026.10.30 (Jumat) 08:00 AM WITA",
                    "en": "2026.10.30 (Fri) 08:00 AM WITA"
                  },
                  "title": {
                    "id": "Peluncuran Perdana Resmi A.T.L.A.S // (Sistem Pertahanan Sipil Mandiri)",
                    "en": "Official Inaugural Release of A.T.L.A.S // (Autonomous Civil Defense System)"
                  },
                  "details": {
                    "id": [
                      "Penyelarasan & Penstabilan Mesin Lokasi Satelit (Sharelock Presisi Tinggi): Pelacakan posisi warga berstandar taktis dengan pembaruan seketika (0 milidetik jeda) untuk memastikan ketepatan koordinat perlindungan saat darurat.",
                      "Pembukaan Akses Jalur Penyelamatan Mandiri & Penghindaran Zona Bahaya (ZRB): Jalur evakuasi mandiri dapat dipelajari sewaktu-waktu dan secara otomatis memandu masyarakat menjauhi garis pantai serta kawasan rawan terdampak.",
                      "Ketahanan Siaran Darurat Otoritas & Mekanisme Luar Jaringan: Petunjuk keselamatan resmi dari Posko Komando tersinkronisasi persisten selama 7 hari dan tetap dapat diakses dengan aman tanpa bergantung kestabilan jaringan internet.",
                      "Penyelarasan Bahasa Antarmuka & Validasi Identitas Sipil: Antarmuka yang bersih dan mudah dipahami seluruh kalangan masyarakat dengan dukungan pendaftaran nama kependudukan resmi serta pengujian nada sirine bahaya."
                    ],
                    "en": [
                      "High-Precision Satellite Positioning Alignment (Tactical Sharelock Grade): Real-time location tracking with zero stale cache to guarantee pinpoint coordinate precision during emergency operations.",
                      "Autonomous Evacuation Corridor Access & Hazard-Zone Avoidance: Citizen self-rescue routes accessible anytime, autonomously routing people away from shorelines and hazardous impact zones.",
                      "Command Advisory Resilience & Autonomous Offline Data Storage: Official safety directives from the Command Center persist across 7 days and remain fully readable without cellular connection.",
                      "Civil Interface Language Alignment & Verified Registry Onboarding: Clean, accessible interface with verified civil registry name validation and loud dual-tone emergency siren testing."
                    ]
                  }
                }
              ].map(({ version, timestamp, title, details }) => {
                const itemTimestamp = typeof timestamp === 'string' ? timestamp : (timestamp[lang] || timestamp.id)
                const itemTitle = typeof title === 'string' ? title : (title[lang] || title.id)
                const itemDetails = Array.isArray(details) ? details : (details[lang] || details.id || [])

                return (
                  <div key={version} className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#1A2333] pb-2">
                      <span className="px-2 py-0.5 rounded bg-nerv-orange/10 border border-nerv-orange/40 font-mono text-xs font-bold text-nerv-orange">
                        {version}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {itemTimestamp}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {itemTitle}
                    </h4>
                    <ul className="space-y-1.5 pt-1">
                      {itemDetails.map((d: string, i: number) => (
                        <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                          <span className="text-nerv-cyan font-mono font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: AUTHORITY (Struktur Kode & Peran Otoritas Resmi)
        ══════════════════════════════════════════════════════════ */}
        {view === 'authority' && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#0D121F] border border-amber-500/30 space-y-2 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                  {lang === 'id' ? 'HIERARKI OTORITAS & IDENTITAS SISTEM' : 'OFFICIAL SYSTEM AUTHORITY HIERARCHY'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {lang === 'id'
                  ? 'Struktur hierarki komando penanggulangan darurat bencana dan hak akses terminal terdaftar pada ekosistem A.T.L.A.S.'
                  : 'Emergency command chain of command and registered terminal credentials within the A.T.L.A.S ecosystem.'}
              </p>
            </div>

            <div className="space-y-3">
              {AUTHORITY_ROLES.map((role) => (
                <div
                  key={role.code}
                  className="rounded-xl bg-[#0D121F] border border-[#1A2333] p-4 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-mono font-black border ${role.bgBadge} ${role.borderBadge} ${role.textBadge}`}
                        >
                          {role.code}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          {role.title}
                        </h4>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">
                        {role.rank}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {role.desc}
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1 font-sans">
                    <div className="text-[11px] bg-black/40 border border-[#1A2333] p-2.5 rounded-lg space-y-1">
                      <span className="text-slate-500 font-mono font-bold uppercase text-[9px] block tracking-wider">
                        {lang === 'id' ? 'WILAYAH YURISDIKSI' : 'JURISDICTION'}
                      </span>
                      <span className="text-slate-200 block font-medium">
                        {role.jurisdiction}
                      </span>
                    </div>
                    <div className="text-[11px] bg-black/40 border border-[#1A2333] p-2.5 rounded-lg space-y-1">
                      <span className="text-slate-500 font-mono font-bold uppercase text-[9px] block tracking-wider">
                        {lang === 'id' ? 'WEWENANG & MANDAT' : 'AUTHORITY & MANDATE'}
                      </span>
                      <span className="text-slate-200 block font-medium">
                        {role.authority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: REMARKS (Keterangan Sistem & Prinsip Evakuasi)
        ══════════════════════════════════════════════════════════ */}
        {view === 'remarks' && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <h3 className="text-xs font-bold text-nerv-orange font-mono uppercase">
                TUJUAN PENGEMBANGAN SISTEM
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem **A.T.L.A.S** (*Autonomous Threat Location & Alert System*) dikembangkan secara profesional untuk menyediakan telemetri peringatan dini dan navigasi evakuasi darurat multi-bahaya (khususnya gempabumi tektonik dan tsunami) di wilayah Kota Palu dan pesisir Teluk Palu, guna membantu masyarakat mengambil keputusan evakuasi mandiri secara cepat, terarah, dan presisi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <h3 className="text-xs font-bold text-nerv-cyan font-mono uppercase">
                PRINSIP KESELAMATAN & EVAKUASI MANDIRI
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem A.T.L.A.S menyediakan analisis jalur evakuasi tercepat dan status zona bahaya seketika (*real-time*). Keputusan evakuasi dan tindakan penyelamatan diri merupakan tanggung jawab utama setiap individu. Pengguna diimbau untuk segera bergerak menuju dataran tinggi atau shelter vertikal terdekat begitu merasakan guncangan gempa kuat tanpa menunggu konfirmasi sirine publik.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <h3 className="text-xs font-bold text-nerv-green font-mono uppercase">
                SINKRONISASI DATA LEMBAGA OTORITAS
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem ini menyelaraskan pemodelan geospasial dengan standar BMKG (Badan Meteorologi, Klimatologi, dan Geofisika), BNPB, dan BPBD Kota Palu demi keandalan telemetri kebencanaan.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: TERMS OF SERVICE & PRIVACY POLICY
        ══════════════════════════════════════════════════════════ */}
        {(view === 'terms' || view === 'privacy') && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <h3 className="text-xs font-bold text-white font-mono uppercase">
                {view === 'terms' ? 'KETENTUAN LAYANAN TELEMETRI' : 'KEBIJAKAN PRIVASI & DATA ENKRIPSI'}
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed space-y-2.5 font-sans">
                <p>
                  1. **Kebijakan Perangkat Resmi**: 1 Perangkat Fisik = 1 Registrasi Identitas Resmi Permanen. Validasi NIK dilakukan secara unik untuk mencegah duplikasi terminal di posko evakuasi.
                </p>
                <p>
                  2. **Privasi Koordinat GPS**: Koordinat posisi Anda hanya diperbarui untuk kalkulasi rute evakuasi terdekat dan dibagikan secara aman kepada anggota grup unit yang terhubung melalui kode QR.
                </p>
                <p>
                  3. **Ketahanan Jaringan**: Pada kondisi bencana ketika jaringan seluler lumpuh, telemetri A.T.L.A.S beralih ke cache data lokal sehingga rute shelter tetap dapat diakses di peta.
                </p>
                <p>
                  4. **Kepatuhan Protokol**: Data evakuasi tidak diperjualbelikan atau digunakan untuk keperluan komersial, melainkan murni untuk penyelamatan jiwa masyarakat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW: LICENSE INFORMATION
        ══════════════════════════════════════════════════════════ */}
        {view === 'license' && (
          <div className="p-4 space-y-5">
            {/* LISENSI KEPEMILIKAN TERTUTUP (PROPRIETARY LICENSE) */}
            <div className="p-4 rounded-xl bg-red-950/25 border border-red-500/50 space-y-3">
              <div className="flex items-center gap-2 border-b border-red-500/30 pb-2">
                <Shield className="w-4 h-4 text-red-400 shrink-0" />
                <h3 className="text-xs font-mono font-bold text-red-400 tracking-wider uppercase">
                  {lang === 'id' ? 'LISENSI HAK CIPTA & KEPEMILIKAN TERTUTUP' : 'PROPRIETARY & CONFIDENTIAL LICENSE'}
                </h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
                <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/25 space-y-1">
                  <p className="font-bold text-red-300 font-mono text-[11px] uppercase tracking-wide">
                    {lang === 'id' 
                      ? 'PERANGKAT LUNAK INI BUKAN OPEN SOURCE (STRICTLY NOT OPEN SOURCE)' 
                      : 'THIS SOFTWARE IS STRICTLY NOT OPEN SOURCE'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    COPYRIGHT © 2026 A.T.L.A.S — ALL RIGHTS RESERVED.
                  </p>
                </div>

                <p className="text-[11px] text-slate-300">
                  {lang === 'id'
                    ? 'Seluruh kode sumber, arsitektur sistem, algoritma penentuan posisi telemetri, modul rute evakuasi, desain antarmuka taktis A.T.L.A.S (UI/UX), skema basis data, dan dokumentasi A.T.L.A.S (Autonomous Threat Location & Alert System) adalah hak cipta eksklusif dan kepemilikan tertutup.'
                    : 'All source code, system architecture, telemetry evacuation algorithms, tactical A.T.L.A.S UI/UX design, database schemas, and documentation of A.T.L.A.S are strictly proprietary and confidential.'}
                </p>

                <div className="p-3 rounded-lg bg-[#07090E] border border-[#1A2333] space-y-2 font-mono text-[10px]">
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lang === 'id' ? 'KETENTUAN & LARANGAN HUKUM MUTLAK:' : 'STRICT LEGAL PROHIBITIONS:'}</span>
                  </div>
                  <div className="text-slate-300 space-y-1.5 pl-2 leading-relaxed">
                    <p>
                      <strong className="text-white">1. {lang === 'id' ? 'Larangan Meniru & Menyalin:' : 'No Duplication:'}</strong>{' '}
                      {lang === 'id' 
                        ? 'Dilarang keras menyalin, menjiplak, atau menggandakan sebagian maupun seluruh kode dan aset proyek.' 
                        : 'Duplicating, copying, or replicating any code or assets in whole or part is strictly forbidden.'}
                    </p>
                    <p>
                      <strong className="text-white">2. {lang === 'id' ? 'Larangan Kloning & Modifikasi:' : 'No Cloning & Derivative Works:'}</strong>{' '}
                      {lang === 'id' 
                        ? 'Dilarang keras melakukan kloning repositori publik, forking, memodifikasi, atau membuat karya turunan.' 
                        : 'Cloning, forking, modifying, or creating derivative works based on this project is strictly forbidden.'}
                    </p>
                    <p>
                      <strong className="text-white">3. {lang === 'id' ? 'Larangan Rekayasa Balik:' : 'No Reverse Engineering:'}</strong>{' '}
                      {lang === 'id' 
                        ? 'Dilarang keras membongkar biner (APK/Bundle), mendekompilasi, atau mereverse-engineer sistem ini.' 
                        : 'Decompiling, disassembling, or reverse-engineering application binaries is strictly prohibited.'}
                    </p>
                    <p>
                      <strong className="text-white">4. {lang === 'id' ? 'Larangan Redistribusi & Komersialisasi:' : 'No Redistribution:'}</strong>{' '}
                      {lang === 'id' 
                        ? 'Dilarang keras menjual, menyewakan, membagikan ulang, atau mengomersialkan tanpa izin tertulis sah.' 
                        : 'Redistributing, selling, sublicensing, or commercializing is strictly prohibited without written consent.'}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic font-mono pt-1">
                  {lang === 'id'
                    ? 'Pelanggaran terhadap lisensi ini akan ditindak tegas melalui proses hukum pidana dan perdata berdasarkan Undang-Undang Hak Cipta Republik Indonesia serta konvensi perlindungan kekayaan intelektual internasional.'
                    : 'Violations are subject to legal prosecution under Indonesian intellectual property laws and international copyright treaties.'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                ATRIBUSI DATA GEOSPASIAL & OTORITAS
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden text-xs text-slate-300">
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</p>
                  <p className="text-[11px] text-slate-400">Parameter gempa bumi real-time, magnitudo, kedalaman, dan InaTEWS tsunami warning.</p>
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">OpenStreetMap & OSRM Engine</p>
                  <p className="text-[11px] text-slate-400">Data jaringan jalan dan komputasi rute jalan kaki evakuasi (Open Database License - ODbL).</p>
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">BPBD Kota Palu & BNPB</p>
                  <p className="text-[11px] text-slate-400">Deliniasi Zona Rawan Bencana (ZRB) Teluk Palu dan verifikasi titik kumpul aman / shelter vertikal.</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                LISENSI TIPOGRAFI & FONT
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden text-xs text-slate-300">
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">JetBrains Mono</p>
                  <p className="text-[11px] text-slate-400">Font Monospaced Taktis — SIL Open Font License 1.1 (JetBrains s.r.o.)</p>
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">Inter UI</p>
                  <p className="text-[11px] text-slate-400">Font Antarmuka Pengguna — SIL Open Font License 1.1 (Rasmus Andersson)</p>
                </div>
                <div className="p-3.5">
                  <p className="font-bold text-white mb-0.5">DSEG Font Family</p>
                  <p className="text-[11px] text-slate-400">Font Digital 7-Segment Taktis — SIL Open Font License 1.1 (keshikan)</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                PERANGKAT LUNAK SUMBER TERBUKA (OSS)
              </p>
              <div className="p-3.5 rounded-xl bg-[#0D121F] border border-[#1A2333] text-[11px] text-slate-400 leading-relaxed font-mono">
                React (MIT) • MapLibre GL (BSD 3-Clause) • Capacitor Android (MIT) • Supabase Client (MIT) • Lucide Icons (ISC) • TailwindCSS (MIT) • Framer Motion (MIT) • jsQR (Apache 2.0) • Turf.js (MIT).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
