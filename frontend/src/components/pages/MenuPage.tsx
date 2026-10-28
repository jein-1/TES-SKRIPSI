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
import { GLOSSARY_TERMS, FEATURE_GUIDES } from './GuidesPage'
import { getAdminBroadcasts, markBroadcastAsRead, type AdminBroadcast } from '../../lib/broadcastStorage'

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

export const LATEST_NEWS_VERSION = 'v1.1.0'
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
  userLocation?: string
}

export default function MenuPage({ onBack, onNavigateHistory, onCalibrateCompass, userLocation = '' }: Props) {
  const { lang, setLanguage, t } = useLanguage()
  const [view, setView] = useState<MenuView>('hub')
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
  }
  
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
    eew: 'Earthquake Early Warning',
    earthquake_info: 'Earthquake Information',
    tsunami: 'Tsunami Warnings',
    volcano: 'Volcanic Eruption Alerts',
    weather: 'Weather Warnings',
    heavy_rain: 'Heavy Rain Risk Alerts',
    civil: 'Civil Protection Information',
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
              {view === 'appearance' && (lang === 'id' ? 'TAMPILAN // APPEARANCE' : 'APPEARANCE & DISPLAY')}
              {view === 'notifications' && (lang === 'id' ? 'NOTIFIKASI // NOTIFICATIONS' : 'EMERGENCY NOTIFICATIONS')}
              {view === 'local_notifications' && (lang === 'id' ? 'PENGATURAN NOTIFIKASI LOKAL' : 'LOCAL NOTIFICATION SETTINGS')}
              {view === 'dnd_access' && (lang === 'id' ? 'AKSES JANGAN GANGGU' : 'DO NOT DISTURB ACCESS')}
              {view === 'test_notifications' && (lang === 'id' ? 'UJI COBA NOTIFIKASI' : 'TEST NOTIFICATIONS')}
              {view === 'test_category' && categoryTitles[selectedCategory]}
              {view === 'live_updates' && (lang === 'id' ? 'PEMBARUAN LANGSUNG & PROTOKOL' : 'LIVE UPDATES & PRECAUTIONS')}
              {view === 'license' && (lang === 'id' ? 'INFORMASI LISENSI // HAK CIPTA' : 'LICENSE INFORMATION // COPYRIGHT')}
              {view === 'news' && (lang === 'id' ? 'NEWS GEMPA SISTEM' : 'EARTHQUAKE TELEMETRY NEWS')}
              {view === 'changelog' && (lang === 'id' ? 'LOG PEMBARUAN SISTEM' : 'SYSTEM RELEASE CHANGELOG')}
              {view === 'broadcasts' && (lang === 'id' ? 'SIARAN DARURAT POSKO KOMANDO' : 'COMMAND DISPATCH BROADCASTS')}
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
                {lang === 'id' ? 'BAHASA SISTEM // SYSTEM LANGUAGE' : 'SYSTEM LANGUAGE'}
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
                {lang === 'id' ? 'PENGATURAN SISTEM // SETTINGS' : 'SYSTEM SETTINGS'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <button
                  onClick={() => setView('appearance')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-nerv-cyan" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Tampilan & Aksesibilitas (Appearance)' : 'Appearance & Accessibility'}
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
                      {lang === 'id' ? 'Notifikasi Darurat & Uji Suara (Notifications)' : 'Emergency Notifications & Sirens'}
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
                      {lang === 'id' ? 'Pembaruan Langsung & Protokol (Live Updates)' : 'Live Updates & Directives'}
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
                        {lang === 'id' ? 'Buku Panduan Aplikasi & Glosarium' : 'App Manual & Tactical Glossary'}
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
                        {lang === 'id' ? 'Arsip Telemetri Evakuasi (Archive)' : 'Evacuation Telemetry Archive'}
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
                {lang === 'id' ? 'TENTANG SISTEM // ABOUT THIS APP' : 'ABOUT THIS APP'}
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Versi Sistem (Version)' : 'System Version'}
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
                        {lang === 'id' ? 'News Gempa Sistem' : 'System Earthquake Feed (News)'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Riwayat warta telemetri gempa masuk' : 'Live seismic telemetry news archive'}
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
                        {lang === 'id' ? 'Pesan Siaran Komando' : 'Command Post Broadcasts'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {lang === 'id' ? 'Instruksi resmi penanganan darurat dari Posko Komando' : 'Official emergency instructions & tactical advisories'}
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

                <button
                  onClick={() => setView('remarks')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      {lang === 'id' ? 'Keterangan Sistem (Remarks)' : 'System Architecture Remarks'}
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
                      {lang === 'id' ? 'Ketentuan Layanan (Terms of Service)' : 'Terms of Service'}
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
                      {lang === 'id' ? 'Kebijakan Privasi (Privacy Policy)' : 'Privacy Policy'}
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
                      {lang === 'id' ? 'Informasi Lisensi (License Information)' : 'License Information'}
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
                      {lang === 'id' ? 'GLOSARIUM ISTILAH SISTEM A.T.L.A.S' : 'TACTICAL SYSTEM GLOSSARY'}
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
                      {lang === 'id' ? 'DARK (TAKTIKAL)' : 'DARK (TACTICAL)'}
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
                    {lang === 'id' ? 'Kontras (Contrast)' : 'Contrast'}
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
                    {lang === 'id' ? 'Penglihatan warna (Colour vision)' : 'Colour vision'}
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
                    {lang === 'id' ? 'Ukuran font (Font size)' : 'Font size'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                    <span className="text-xs capitalize font-medium text-slate-300">
                      {fontSize === 'device' ? (lang === 'id' ? 'Pengaturan perangkat' : 'Device setting') : fontSize}
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
                    {lang === 'id' ? 'Ketebalan font (Font thickness)' : 'Font thickness'}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                    <span className="text-xs capitalize font-medium text-slate-300">
                      {fontThickness === 'device' ? (lang === 'id' ? 'Pengaturan perangkat' : 'Device setting') : fontThickness}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              </div>
            </div>

            {/* Screen Reader (TalkBack) Radio Section (Gambar 4 Reference) */}
            <div>
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
                {lang === 'id' ? 'PEMBACA LAYAR (TALKBACK)' : 'SCREEN READER (TALKBACK)'}
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
                      {lang === 'id' ? 'Standar (Default)' : 'Default'}
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
                PENGATURAN NOTIFIKASI DARURAT
              </p>
              <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Notifikasi Umum (Notifications)</p>
                    <p className="text-[10px] text-slate-400">Aktifkan seluruh push alert kebencanaan</p>
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
                    <p className="text-xs font-medium text-white">Notifikasi Lokasi Presisi (Local Notifications)</p>
                    <p className="text-[10px] text-slate-400">Peringatan otomatis sesuai zona radius pengguna</p>
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
                      <p className="text-xs font-bold text-red-400 font-mono">Peringatan Kritis (Critical Alerts)</p>
                    </div>
                    <p className="text-[10px] text-slate-400">Akses bypass mode Jangan Ganggu (DND) / hening</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-red-400 font-bold">{notifCritical ? 'ON' : 'OFF'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Pembaruan Langsung (Live Updates)</p>
                    <p className="text-[10px] text-slate-400">Hitungan mundur gelombang di lock screen</p>
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
                    <p className="text-xs font-medium text-white">Informasi Cuaca Ekstrem (Weather Info)</p>
                    <p className="text-[10px] text-slate-400">Peringatan hujan lebat dan angin kencang BMKG</p>
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
                {lang === 'id' ? 'LAYANAN LATAR BELAKANG // SENTINEL SERVICE' : 'BACKGROUND SENTINEL SERVICE'}
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
                      {lang === 'id' ? 'Nonaktifkan Penghemat Baterai (Unrestricted)' : 'Disable Battery Optimization (Unrestricted)'}
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
                SIMULATOR UJI COBA SUARA & NOTIFIKASI
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
                        Uji Coba Notifikasi & Sirine (Test Notifications)
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Kenali bunyi sirine dan simulasi notifikasi banner berjenjang
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-nerv-orange" />
                </button>
              </div>
            </div>

            {/* Warning disclosure */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-[#1A2333] text-[11px] text-slate-400 leading-relaxed font-sans">
              <span className="text-nerv-orange font-bold font-mono">⚠️ PERHATIAN KEBIJAKAN SUARA:</span> Peringatan Kritis (Critical Alerts) diatur agar tetap membunyikan sirine pada volume penuh saat ancaman tsunami mendesak terdeteksi, meskipun ponsel Anda dalam kondisi mode hening (*silent mode*).
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
                  <p className="text-xs font-medium text-white">Local Notifications</p>
                  <p className="text-[10px] text-slate-400">Peringatan berbasis lokasi berkala di latar belakang</p>
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
                  <p className="text-xs font-medium text-white">Location Permissions</p>
                  <p className="text-[10px] text-nerv-cyan font-mono">Always Allow</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Configure Guidance Card */}
            <div className="p-4 rounded-xl bg-[#111927] border border-[#1A2333] space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                To receive local notifications, set your location permissions to "Always Allow".
              </p>
              <button
                onClick={() => NativeSettings.openAppDetails().catch(() => {})}
                className="px-5 py-2 rounded-full border border-nerv-cyan text-nerv-cyan hover:bg-nerv-cyan hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                [ Configure ]
              </button>
            </div>

            {/* Local Notification Conditions */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                Local Notification Conditions
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates estimated shaking and tsunami arrival based on your location at the time of the earthquake.
                Location information is updated periodically in the background to ensure you are alerted accurately inside danger zones.
              </p>
            </div>

            {/* Your Privacy */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                Your Privacy
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                When calculating whether your location is in an alert area, location coordinates are converted into an area code on your device.
                Specific latitude and longitude coordinates are never stored on public servers without encryption.
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
                    Do Not Disturb Access: {notifCritical ? 'ON' : 'OFF'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                To allow the phone to sound when receiving critical alerts, even when it is set to silent or Do Not Disturb mode, please set "Silent mode exception" to ON.
              </p>

              <button
                onClick={() => NativeSettings.openDndAccess().catch(() => {})}
                className="px-5 py-2 rounded-full border border-nerv-cyan text-nerv-cyan hover:bg-nerv-cyan hover:text-black font-mono font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                [ Configure ]
              </button>
            </div>

            {/* About Critical Alerts */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-2">
              <p className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                About Critical Alerts
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Critical alerts will be sent to users who are in the area closest to the disaster, regardless of whether they have registered their location.
                Users who have registered but are not in the target area will receive a regular notification.
              </p>
              <p className="text-[11px] text-nerv-orange font-mono">
                ※ To receive critical alerts, you need to set "Local Notifications" to ON.
              </p>
            </div>

            {/* Do Not Disturb Bypass Channel */}
            <div className="p-4 rounded-xl bg-[#0D121F] border border-[#1A2333] space-y-3">
              <div
                onClick={() => NativeSettings.openChannelSettings({ channelId: 'critical_alerts' }).catch(() => {})}
                className="flex items-center justify-between cursor-pointer border-b border-[#1A2333] pb-2"
              >
                <p className="text-xs font-bold text-white font-mono uppercase">
                  Do Not Disturb Bypass: {notifCritical ? 'ON' : 'OFF'}
                </p>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                If you enable "Silent mode exception", critical alerts will play sound at maximum emergency volume.
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
              PILIH KATEGORI UJI COBA PERINGATAN
            </p>

            <div className="bg-[#0D121F] border border-[#1A2333] rounded-xl divide-y divide-[#1A2333] overflow-hidden">
              {[
                { id: 'eew' as TestCategoryType, label: 'Earthquake Early Warning', sub: 'Peringatan Dini Gempa Bumi BMKG' },
                { id: 'earthquake_info' as TestCategoryType, label: 'Earthquake Information', sub: 'Laporan Cepat Seismik & Episentrum' },
                { id: 'tsunami' as TestCategoryType, label: 'Tsunami Warnings', sub: lang === 'id' ? 'Sirine Ancaman Tsunami Wilayah Pesisir' : 'Coastal Tsunami Threat Warning Sirens' },
                { id: 'volcano' as TestCategoryType, label: 'Volcanic Eruption Alerts', sub: 'Peringatan Erupsi Gunung Api & Abu' },
                { id: 'weather' as TestCategoryType, label: 'Weather Warnings', sub: 'Peringatan Darurat Cuaca Ekstrem' },
                { id: 'heavy_rain' as TestCategoryType, label: 'Heavy Rain Risk Alerts', sub: 'Risiko Hujan Lebat & Banjir Bandang' },
                { id: 'civil' as TestCategoryType, label: 'Civil Protection Information', sub: 'Informasi Perlindungan Sipil & Evakuasi' },
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
              Tekan salah satu kategori di atas untuk menguji bunyi nada simulasi peringatan dini dan memeriksa tampilan banner notifikasi yang muncul di ponsel Anda.
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
                  {lang === 'id' ? 'NEWS GEMPA SISTEM' : 'SYSTEM SEISMIC TELEMETRY NEWS'}
                </p>
              </div>

              {earthquakeList.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0D121F] border border-[#1A2333] text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">
                    {lang === 'id' ? 'Belum ada warta gempa baru dalam 7 hari terakhir' : 'No seismic telemetry events recorded in the last 7 days'}
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
            VIEW: BROADCASTS (SIARAN DARURAT POSKO KOMANDO)
        ══════════════════════════════════════════════════════════ */}
        {view === 'broadcasts' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {lang === 'id' ? 'PESAN SIARAN RESMI KOMANDO' : 'OFFICIAL COMMAND DISPATCHES'}
              </p>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEFCON DISPATCH
              </span>
            </div>

            {broadcastList.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0D121F] border border-[#1A2333] text-center space-y-2">
                <Megaphone className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  {lang === 'id' ? 'Belum ada pesan siaran darurat aktif dari Posko Komando' : 'No active emergency dispatches from Command Post'}
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  {lang === 'id' ? 'Instruksi resmi komando akan disiarkan langsung ke seluruh unit saat siaga' : 'Official command instructions will be broadcasted to all units in real-time'}
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
                      <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                        DARI: <span className="text-white font-bold">{item.sender}</span>
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
                    "version": "v1.1.0",
                    "timestamp": {
                              "id": "2026.10.29 (Kamis) 02:15 PM WITA",
                              "en": "2026.10.29 (Thu) 02:15 PM WITA"
                    },
                    "title": {
                              "id": "Pusat Siaran Komando Darurat & Informasi Maklumat Keselamatan Warga",
                              "en": "Emergency Command Broadcast Center & Civil Safety Advisories"
                    },
                    "details": {
                              "id": [
                                        "Pusat Siaran Darurat Posko Komando: Penambahan menu khusus Pesan Siaran Komando di antarmuka warga, memungkinkan masyarakat menerima instruksi keselamatan resmi, arahan evakuasi darurat, dan maklumat situasi bencana langsung dari posko komando secara seketika.",
                                        "Peringatan Darurat Bertingkat & Penanda Siaga: Setiap maklumat siaran dilengkapi lencana tingkat bahaya (Info Siaga, Peringatan Waspada, Evakuasi Segera) dengan penghitung jumlah pesan baru agar warga langsung mengetahui instruksi yang paling mendesak."
                              ],
                              "en": [
                                        "Command Emergency Broadcast Center: Added dedicated Command Broadcasts menu for citizens, enabling immediate reception of official safety instructions, evacuation directives, and critical alerts directly from command posts.",
                                        "Graduated Emergency Badges & Threat Indicators: Broadcast advisories are categorized with clear urgency levels (Advisory, Warning, Immediate Evacuation) alongside unread counters for quick comprehension."
                              ]
                    }
          },
          {
                    "version": "v1.0.9",
                    "timestamp": {
                              "id": "2026.10.28 (Rabu) 08:30 AM WITA",
                              "en": "2026.10.28 (Wed) 08:30 AM WITA"
                    },
                    "title": {
                              "id": "Penyimpanan Telemetri Luar Jaringan (Offline Queue) & Penyempurnaan Alarm Bahaya",
                              "en": "Offline Telemetry Storage Queue & Emergency Siren Sound Refinement"
                    },
                    "details": {
                              "id": [
                                        "Mekanisme Telemetri Luar Jaringan (Offline Queue): Sistem otomatis menyimpan data telemetri dan status keselamatan pengguna saat jaringan internet terputus di tengah bencana, lalu langsung mengirimkannya secara kilat begitu sinyal seluler kembali terhubung.",
                                        "Penyempurnaan Suara Sirine Bahaya A.T.L.A.S: Mengganti nada bawaan alarm ponsel dengan nada sirine peringatan dini A.T.L.A.S yang lebih lantang, tegas, dan khas agar warga langsung mengenali tanda bahaya bencana.",
                                        "Keterangan Panduan SMS SOS Terbaca Utuh: Merapikan tata letak tulisan panduan pada jendela SMS Darurat sehingga seluruh petunjuk keselamatan terbaca lengkap dan jelas di semua ukuran layar ponsel.",
                                        "Pembaruan Masa Simpan Riwayat Warta Gempa: Riwayat berita gempa kini tersimpan rapi selama 1 minggu (7 hari) lengkap dengan penghitung waktu mundur otomatis pada tiap kartu berita."
                              ],
                              "en": [
                                        "Offline Telemetry Storage Mechanism (Offline Queue): Automatically buffers user telemetry and safety reports during network loss, transmitting them immediately once cellular connectivity resumes.",
                                        "A.T.L.A.S Distinct Emergency Siren Sound: Replaced standard device alarm tones with loud, clear, dual-tone disaster wailing sirens for instant recognition.",
                                        "Complete SMS SOS Guide Text Readability: Optimized text formatting in the emergency SMS window, ensuring all safety instructions are displayed without cutoffs across all phone displays.",
                                        "Seismic News Retention Extension: Earthquake reports are now maintained for 1 week (7 days) with dynamic countdown badges on each news card."
                              ]
                    }
          },
          {
                    "version": "v1.0.8",
                    "timestamp": {
                              "id": "2026.10.27 (Selasa) 11:45 PM WITA",
                              "en": "2026.10.27 (Tue) 11:45 PM WITA"
                    },
                    "title": {
                              "id": "Perapian Tata Letak Navigasi Taktis & Penyeragaman Identitas Unit",
                              "en": "Tactical Navigation HUD Optimization & Unit Nomenclature Alignment"
                    },
                    "details": {
                              "id": [
                                        "Perapian Layar Navigasi Darurat: Tombol pembatalan rute dipindahkan langsung ke dalam kartu shelter terpilih dan memperbaiki pemilihan rute otomatis agar layar navigasi tetap tenang dan tidak memaksakan rute sebelum shelter ditentukan pengguna.",
                                        "Penyeragaman Nama Unit & Hierarki Komando: Menyeragamkan seluruh sebutan perangkat menjadi Unit di lapangan, menegaskan hierarki identitas (COMMAND-01 untuk Posko Komando Utama, COMMAND-XX untuk Posko Lapangan, serta Warga Mandiri), disertai pembedaan nada sinyal bahaya.",
                                        "Penautan Anggota Keluarga Timbal-Balik & Dukungan WNA: Mempermudah penautan keluarga via kode QR 6-digit secara otomatis dua arah, registrasi paspor resmi untuk warga negara asing, serta pengiriman cepat status keselamatan SAYA AMAN ✓."
                              ],
                              "en": [
                                        "Tactical Navigation Screen Optimization: Moved route cancellation directly into the active shelter card and prevented premature auto-routing until a shelter is selected.",
                                        "Unit Nomenclature Standardization & Command Hierarchy: Transitioned all device labels to Unit in the field, formalized authority identification (COMMAND-01 for Primary Control, COMMAND-XX for Regional Posts, and Citizens), paired with distinct tactical alert tones.",
                                        "Reciprocal Family Unit Pairing Protocol & Foreign Citizen Support: Two-way family pairing with 6-digit verification code, official passport registration for foreign nationals, and instant transmission of I AM SAFE ✓ safety status."
                              ]
                    }
          },
          {
                    "version": "v1.0.7",
                    "timestamp": {
                              "id": "2026.10.25 (Minggu) 04:20 PM WITA",
                              "en": "2026.10.25 (Sun) 04:20 PM WITA"
                    },
                    "title": {
                              "id": "Penyelarasan Lokasi Satelit Presisi & Akses Rute Evakuasi Bebas Bahaya",
                              "en": "High-Precision Satellite Positioning & Hazard-Free Evacuation Access"
                    },
                    "details": {
                              "id": [
                                        "Penyelarasan & Penstabilan Mesin Lokasi Satelit (Sharelock Tactical Grade): Menghilangkan lonjakan titik koordinat yang melompat-lompat dan meningkatkan akurasi posisi pengguna hingga setara standar pelacakan taktis militer yang sangat presisi.",
                                        "Pembukaan Jalur Evakuasi Mandiri pada Mode Siaga: Pengguna dapat melihat dan mempelajari rute penyelamatan menuju seluruh shelter aman kapan saja dalam kondisi normal untuk latihan kesiapsiagaan mandiri.",
                                        "Pembaruan Rute Evakuasi Menghindari Zona Bahaya (ZRB): Jalur penyelamatan otomatis mengarahkan warga menyusuri jalan raya yang aman dan menjauhi area pantai serta zona rawan bencana."
                              ],
                              "en": [
                                        "GPS Telemetry Recalibration (Sharelock Tactical Grade): Real-time drift filtering to eliminate coordinate jumps and elevate location accuracy to high-precision tactical standards.",
                                        "Standby Evacuation Route Access in Normal Mode: Users can now view and practice evacuation routes to safe shelters in normal conditions without waiting for an active disaster alert.",
                                        "Evacuation Routing Restructuring & Hazard-Zone Avoidance (ZRB): Safety routes guide citizens along safe road networks while strictly avoiding shorelines and high-risk hazard zones."
                              ]
                    }
          },
          {
                    "version": "v1.0.6",
                    "timestamp": {
                              "id": "2026.10.22 (Kamis) 08:35 AM WITA",
                              "en": "2026.10.22 (Thu) 08:35 AM WITA"
                    },
                    "title": {
                              "id": "Penguatan Jalur Evakuasi Multijalur & Verifikasi Shelter Aman",
                              "en": "Multi-Route Evacuation Reinforcement & Shelter Verification"
                    },
                    "details": {
                              "id": [
                                        "Kalkulasi Jalur Alternatif: Menyediakan pilihan rute penyelamatan cadangan jika jalur utama terhalang atau mengalami kemacetan saat bencana.",
                                        "Verifikasi Koordinat Shelter Resmi: Memastikan seluruh titik kumpul evakuasi di Kota Palu telah tervalidasi berada di daratan tinggi yang aman dari gelombang."
                              ],
                              "en": [
                                        "Alternative Route Calculation: Provides backup evacuation corridors in case primary roads are blocked or congested during emergencies.",
                                        "Official Safe Shelter Verification: Validated that all assembly zones in Palu are geocoded on certified safe elevations."
                              ]
                    }
          },
          {
                    "version": "v1.0.5",
                    "timestamp": {
                              "id": "2026.10.19 (Senin) 10:15 PM WITA",
                              "en": "2026.10.19 (Mon) 10:15 PM WITA"
                    },
                    "title": {
                              "id": "Optimasi Peta Responsif, Panel Riwayat & Pemisahan Warta Gempa",
                              "en": "Responsive Map Optimization, History Panel & Seismic News Separation"
                    },
                    "details": {
                              "id": [
                                        "Navigasi Peta Responsif: Pergerakan peta lebih halus dan otomatis menyesuaikan orientasi pengguna di lapangan.",
                                        "Pencatatan Riwayat Evakuasi: Menyimpan catatan simulasi dan jarak evakuasi yang pernah ditempuh pengguna.",
                                        "Pemisahan Warta Berita Gempa: Warta gempa memiliki kartu tersendiri dengan hitungan mundur waktu kedaluwarsa terpisah dari catatan pembaruan sistem."
                              ],
                              "en": [
                                        "Responsive Map Navigation: Smooth map panning that dynamically aligns with user orientation on the ground.",
                                        "Evacuation History Logging: Stores recorded simulation logs and travel distances completed by the user.",
                                        "Seismic News Stream Separation: Earthquake events are displayed in dedicated cards with countdown expiration separate from release logs."
                              ]
                    }
          },
          {
                    "version": "v1.0.3",
                    "timestamp": {
                              "id": "2026.10.14 (Rabu) 01:20 PM WITA",
                              "en": "2026.10.14 (Wed) 01:20 PM WITA"
                    },
                    "title": {
                              "id": "Pelacakan Unit Keluarga, Sinyal Darurat & Navigasi Cerdas",
                              "en": "Family Unit Tracking, Emergency Signals & Smart Navigation"
                    },
                    "details": {
                              "id": [
                                        "Pemantauan Keselamatan Keluarga: Memungkinkan anggota keluarga saling melihat posisi di peta secara real-time saat keadaan darurat.",
                                        "Tombol Sinyal Darurat (Emergency Ping): Membunyikan nada dan getaran khusus di ponsel keluarga untuk meminta perhatian atau bantuan cepat.",
                                        "Navigasi Cerdas Otomatis: Aplikasi langsung menentukan shelter terdekat yang paling aman berdasarkan posisi warga saat itu."
                              ],
                              "en": [
                                        "Family Safety Monitoring: Allows family members to track each other's live locations on the map during emergencies.",
                                        "Emergency Signal Ping: Triggers distinctive alert sounds and vibrations on family phones to request urgent attention.",
                                        "Automated Smart Navigation: The system instantly computes the safest and nearest assembly shelter from the user's location."
                              ]
                    }
          },
          {
                    "version": "v1.0.2",
                    "timestamp": {
                              "id": "2026.10.11 (Minggu) 09:10 AM WITA",
                              "en": "2026.10.11 (Sun) 09:10 AM WITA"
                    },
                    "title": {
                              "id": "Pilihan Bahasa Antarmuka & Tanda Berita Pembaruan",
                              "en": "Interface Language Selection & News Update Indicators"
                    },
                    "details": {
                              "id": [
                                        "Pilihan Bahasa Antarmuka: Menyediakan opsi pergantian bahasa instan antara Bahasa Indonesia dan Bahasa Inggris pada menu pengaturan aplikasi.",
                                        "Tanda Pengingat Berita Baru: Titik merah pemberitahuan otomatis muncul saat ada warta sistem terbaru dan langsung hilang setelah menu News dibuka."
                              ],
                              "en": [
                                        "Interface Language Selection: Direct toggle between Indonesian and English interface languages in System Settings.",
                                        "News Update Indicators: Dynamic red indicator dot alerts users of new announcements and clears once the News section is reviewed."
                              ]
                    }
          },
          {
                    "version": "v1.0.1",
                    "timestamp": {
                              "id": "2026.10.06 (Selasa) 08:45 PM WITA",
                              "en": "2026.10.06 (Tue) 08:45 PM WITA"
                    },
                    "title": {
                              "id": "Penyempurnaan Notifikasi Darurat & Kemudahan Tampilan",
                              "en": "Emergency Notification Refinement & Display Accessibility"
                    },
                    "details": {
                              "id": [
                                        "Notifikasi Tanggap Cepat: Panel peringatan bahaya kini dapat ditutup cepat dengan usapan jari ke atas jika situasi telah kondusif.",
                                        "Penyesuaian Tampilan Nyaman: Opsi tema gelap dan terang dengan kontras tajam yang nyaman di mata saat evakuasi malam hari.",
                                        "Penerobosan Mode Hening: Suara alarm darurat bencana tetap dapat berbunyi nyaring meskipun ponsel disetel dalam mode senyap."
                              ],
                              "en": [
                                        "Quick Dismiss Notifications: Emergency alert panels can be dismissed swiftly with a swipe-up gesture.",
                                        "Comfortable Display Themes: High-contrast Dark and Light themes for clear readability during night-time evacuations.",
                                        "Silent Mode Override: Crucial disaster alerts sound audibly even if the mobile device is set to silent mode."
                              ]
                    }
          },
          {
                    "version": "v1.0.0",
                    "timestamp": {
                              "id": "2026.10.02 (Jumat) 07:25 AM WITA",
                              "en": "2026.10.02 (Fri) 07:25 AM WITA"
                    },
                    "title": {
                              "id": "Peluncuran Sistem Pertahanan & Telemetri Mandiri A.T.L.A.S",
                              "en": "Launch of A.T.L.A.S Multi-Threat Telemetry System"
                    },
                    "details": {
                              "id": [
                                        "Pendaftaran Identitas Warga Resmi: Pencatatan nomor identitas kependudukan yang aman untuk memastikan keabsahan data bantuan evakuasi.",
                                        "Uji Coba Sirine Nyata: Fasilitas pengujian suara sirine bencana untuk memastikan ponsel warga siap berbunyi saat terjadi gempa dan tsunami.",
                                        "Status Keselamatan Cepat: Tombol pilihan instan SAYA AMAN ✓ dan BUTUH BANTUAN DARURAT untuk melapor ke keluarga dan posko."
                              ],
                              "en": [
                                        "Protected Citizen Identity Registration: Secure identification verifying users for authorized evacuation manifest coordination.",
                                        "Live Siren Testing Pipeline: Sound verification ensuring mobile devices ring clearly during simulated emergency drills.",
                                        "Rapid Safety Status: Instant toggle between I AM SAFE ✓ and NEED HELP for emergency reporting."
                              ]
                    }
          },
          {
                    "version": "v0.9.8",
                    "timestamp": {
                              "id": "2026.09.25 (Jumat) 11:15 PM WITA",
                              "en": "2026.09.25 (Fri) 11:15 PM WITA"
                    },
                    "title": {
                              "id": "Sinkronisasi Posisi Real-Time & Penghemat Daya Baterai",
                              "en": "Real-Time Location Synchronization & Battery Optimization"
                    },
                    "details": {
                              "id": [
                                        "Sinkronisasi Data Posisi Cepat: Memastikan perubahan koordinat lokasi terkirim cepat dengan konsumsi baterai yang sangat hemat.",
                                        "Pemulihan Sesi Mandiri: Masuk kembali secara otomatis dengan identitas yang sama tanpa perlu mendaftar ulang jika aplikasi dibersihkan."
                              ],
                              "en": [
                                        "Rapid Location Sync: Efficient coordinate telemetry transmission preserving device battery during field movement.",
                                        "Smart Session Recovery: Reopening the app automatically restores identity without requiring redundant registration."
                              ]
                    }
          },
          {
                    "version": "v0.9.7",
                    "timestamp": {
                              "id": "2026.09.21 (Senin) 02:40 PM WITA",
                              "en": "2026.09.21 (Mon) 02:40 PM WITA"
                    },
                    "title": {
                              "id": "Penyaringan Gangguan Sinyal Satelit & Peningkatan Akurasi",
                              "en": "Satellite Signal Noise Filtering & Accuracy Enhancement"
                    },
                    "details": {
                              "id": [
                                        "Peredaman Akurasi Melompat: Meredam gangguan sinyal satelit di sekitar gedung bertingkat agar titik posisi pengguna tidak melompat.",
                                        "Penguncian Titik Koordinat Nyata: Hanya memperbarui rute saat pengguna benar-benar berpindah posisi nyata di lapangan."
                              ],
                              "en": [
                                        "Noise Damping: Filters urban multipath satellite interference to keep user marker coordinates stable.",
                                        "True Movement Detection: Triggers route recomputation only upon genuine physical positional shifts."
                              ]
                    }
          },
          {
                    "version": "v0.9.6",
                    "timestamp": {
                              "id": "2026.09.16 (Rabu) 10:50 AM WITA",
                              "en": "2026.09.16 (Wed) 10:50 AM WITA"
                    },
                    "title": {
                              "id": "Visualisasi Panduan Jalur Evakuasi & Deteksi Kedatangan",
                              "en": "Evacuation Guidance Visualization & Safe Arrival Detection"
                    },
                    "details": {
                              "id": [
                                        "Garis Panduan Evakuasi Dinamis: Menampilkan garis bercahaya di jalan raya menuju shelter yang otomatis terpotong saat dilewati.",
                                        "Deteksi Tiba di Lokasi Aman: Memberikan konfirmasi getaran sukses dan ringkasan evakuasi ketika pengguna telah sampai di shelter tujuan."
                              ],
                              "en": [
                                        "Dynamic Path Guidance: Renders an active route guide along streets, dynamically advancing as users walk.",
                                        "Safe Arrival Confirmation: Vibrates and displays an arrival summary modal once reaching the safe shelter radius."
                              ]
                    }
          },
          {
                    "version": "v0.9.5",
                    "timestamp": {
                              "id": "2026.09.11 (Jumat) 05:15 PM WITA",
                              "en": "2026.09.11 (Fri) 05:15 PM WITA"
                    },
                    "title": {
                              "id": "Penghindaran Jalur Bahaya Pantai & Zona Rawan Bencana",
                              "en": "Shoreline Hazard Avoidance & Disaster Risk Zone Bypassing"
                    },
                    "details": {
                              "id": [
                                        "Penghindaran Zona Merah Bahaya: Rute penyelamatan otomatis menjauhkan warga dari garis pantai Teluk Palu dan area genangan air.",
                                        "Prioritas Jalur Menanjak: Menghitung jalur evakuasi yang secara bertahap membawa pengguna menuju dataran yang lebih tinggi."
                              ],
                              "en": [
                                        "Red Zone Hazard Avoidance: Routing actively directs pedestrians away from the Palu Bay coastline and potential surge zones.",
                                        "Elevated Path Prioritization: Prioritizes streets with positive incline leading toward high safe ground."
                              ]
                    }
          },
          {
                    "version": "v0.9.0",
                    "timestamp": {
                              "id": "2026.08.29 (Sabtu) 08:20 AM WITA",
                              "en": "2026.08.29 (Sat) 08:20 AM WITA"
                    },
                    "title": {
                              "id": "Pemetaan Jaringan Jalan Raya Resmi Kota Palu",
                              "en": "Official Road Network Graph Integration for Palu City"
                    },
                    "details": {
                              "id": [
                                        "Rute Berbasis Jalan Nyata: Navigasi evakuasi sepenuhnya mengikuti jalan raya resmi dan jembatan penyeberangan, bukan garis lurus melompati sungai.",
                                        "Penyimpanan Jaringan Jalan Offline: Peta jalan raya tersimpan di dalam ponsel sehingga rute tetap bisa dihitung tanpa koneksi internet."
                              ],
                              "en": [
                                        "True Street-Network Routing: Navigation strictly follows mapped roads and bridge crossings rather than straight lines across rivers.",
                                        "Offline Road Graph Storage: Street network data is embedded locally for instant route calculation without data connections."
                              ]
                    }
          },
          {
                    "version": "v0.8.0",
                    "timestamp": {
                              "id": "2026.07.24 (Jumat) 09:15 AM WITA",
                              "en": "2026.07.24 (Fri) 09:15 AM WITA"
                    },
                    "title": {
                              "id": "Perenderan Peta Cepat Tanpa Jeda & Rotasi 3D Halus",
                              "en": "Hardware-Accelerated Fluid Map Rendering & 3D Compass Rotation"
                    },
                    "details": {
                              "id": [
                                        "Peta Halus Tanpa Patah-Patah: Menggunakan akselerasi grafis perangkat keras sehingga geser dan perbesaran peta terasa sangat ringan dan lancar.",
                                        "Rotasi 3D Dinamis: Peta dapat diputar mengikuti arah hadap kompas pengguna di lapangan dengan mulus."
                              ],
                              "en": [
                                        "Hardware-Accelerated Rendering: Ultra-smooth map interactions, eliminating visual lag during pan and zoom gestures.",
                                        "Dynamic 3D Compass Rotation: Map rotates seamlessly in sync with the user's heading."
                              ]
                    }
          },
          {
                    "version": "v0.7.5",
                    "timestamp": {
                              "id": "2026.06.18 (Kamis) 03:40 PM WITA",
                              "en": "2026.06.18 (Thu) 03:40 PM WITA"
                    },
                    "title": {
                              "id": "Pemberdayaan Chipset Sensor Satelit & Kelancaran Pelacakan",
                              "en": "Direct Satellite Sensor Acquisition & Telemetry Optimization"
                    },
                    "details": {
                              "id": [
                                        "Penguncian Sinyal Satelit Langsung: Menghubungkan aplikasi langsung ke sensor satelit bawaan ponsel untuk mendapatkan koordinat pengguna yang akurat dan stabil.",
                                        "Optimalisasi Kinerja dan Baterai: Menstabilkan proses pemantauan posisi agar aplikasi tetap lancar, tidak mudah terputus, dan hemat konsumsi baterai."
                              ],
                              "en": [
                                        "Direct Satellite Sensor Interfacing: Interfacing directly with phone satellite sensors for stable and accurate positioning.",
                                        "Performance & Battery Optimization: Stabilized position monitoring listeners for smooth tracking and minimal battery draw."
                              ]
                    }
          },
          {
                    "version": "v0.6.0",
                    "timestamp": {
                              "id": "2026.04.22 (Rabu) 10:30 PM WITA",
                              "en": "2026.04.22 (Wed) 10:30 PM WITA"
                    },
                    "title": {
                              "id": "Sinkronisasi Telemetri Lintas Perangkat & Perbaikan Tampilan Peta",
                              "en": "Cross-Device Telemetry Synchronization & Map Viewport Stabilization"
                    },
                    "details": {
                              "id": [
                                        "Perbaikan Tampilan Layar Peta: Memastikan peta langsung terbuka penuh dan tidak berlayar abu-abu saat pertama kali dijalankan di ponsel.",
                                        "Penyaluran Status Darurat Seketika: Memastikan perubahan status keselamatan antar perangkat terkirim dan diterima secara langsung tanpa jeda."
                              ],
                              "en": [
                                        "Map Display Optimization: Resolves grey blank viewport glitches ensuring maps open full-screen instantly on mobile devices.",
                                        "Instant Emergency Status Broadcast: Real-time emergency state synchronization delivered across devices without delay."
                              ]
                    }
          },
          {
                    "version": "v0.4.0",
                    "timestamp": {
                              "id": "2026.02.16 (Senin) 08:15 AM WITA",
                              "en": "2026.02.16 (Mon) 08:15 AM WITA"
                    },
                    "title": {
                              "id": "Penentuan Titik Kumpul Aman & Verifikasi Lapangan",
                              "en": "Safe Assembly Shelter Calibration & Field Coordinates Logging"
                    },
                    "details": {
                              "id": [
                                        "Pemetaan Lokasi Pengungsian Aman: Memasukkan titik kumpul resmi seperti Lapangan Imanuel, Gelanggang Remaja, dan Kompas I ke dalam radar sistem.",
                                        "Penghitungan Estimasi Jarak: Menghitung perkiraan jarak tempuh dari posisi pengguna ke tempat evakuasi yang dituju."
                              ],
                              "en": [
                                        "Safe Shelter Geolocation Logging: Verified coordinates for official assembly grounds including Imanuel Field, Youth Arena, and Kompas I.",
                                        "Distance Estimation: Computes approximate travel distance from user position to chosen evacuation grounds."
                              ]
                    }
          },
          {
                    "version": "v0.2.0",
                    "timestamp": {
                              "id": "2025.11.26 (Rabu) 04:45 PM WITA",
                              "en": "2025.11.26 (Wed) 04:45 PM WITA"
                    },
                    "title": {
                              "id": "Uji Coba Rute Darat & Evaluasi Penghalang Muara Sungai",
                              "en": "Ground Routing Trials & Palu River Natural Barrier Audit"
                    },
                    "details": {
                              "id": [
                                        "Audit Rintangan Lapangan: Menemukan dan mengatasi kelemahan rute lurus yang membelah pemukiman dan muara Sungai Palu yang tidak bisa diseberangi tanpa jembatan.",
                                        "Uji Coba Sensor Lokasi: Menguji ketahanan sinyal penentu posisi di dalam maupun di luar ruangan."
                              ],
                              "en": [
                                        "Natural Obstacle Audit: Identified navigation barriers such as river estuaries and impassable areas that require bridge routing.",
                                        "Sensor Reliability Trials: Tested device location stability in both indoor and outdoor settings."
                              ]
                    }
          },
          {
                    "version": "v0.1.0",
                    "timestamp": {
                              "id": "2025.09.18 (Kamis) 09:20 AM WITA",
                              "en": "2025.09.18 (Thu) 09:20 AM WITA"
                    },
                    "title": {
                              "id": "Awal Riset Lapangan & Perancangan Sistem Evakuasi Pesisir Palu",
                              "en": "Field Research Inception & Palu Coastal Evacuation System Architecture"
                    },
                    "details": {
                              "id": [
                                        "Perancangan Sistem Penyelamatan Mandiri: Penyusunan cetak biru sistem navigasi penyelamatan diri warga pesisir Teluk Palu menghadapi ancaman tsunami.",
                                        "Pendataan Titik Kumpul Aman: Pengumpulan koordinat ruang terbuka hijau, lapangan, dan gedung evakuasi vertikal di sekitar pesisir."
                              ],
                              "en": [
                                        "Self-Evacuation System Architecture: Conceptual blueprint for real-time coastal tsunami evacuation navigation in Palu Bay.",
                                        "Safe Assembly Zone Mapping: Documenting elevated open fields, parks, and vertical evacuation buildings."
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
