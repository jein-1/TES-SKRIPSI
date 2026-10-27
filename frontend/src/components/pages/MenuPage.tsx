// ═══════════════════════════════════════════════════════════════
// MENU & SETTINGS PAGE — A.T.L.A.S TACTICAL ECOSYSTEM
// (Autonomous Threat Location & Alert System)
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Settings, Bell, Palette, Globe,
  Shield, Info, FileText, Check, Radio, Volume2, VolumeX,
  AlertTriangle, Flame, Waves, Wind, ExternalLink, Activity,
  Sliders, Eye, Type, Smartphone, CheckCircle, Navigation2, Compass, Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { NativeSettings } from '../../lib/nativeSettings'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useLanguage } from '../../lib/i18n'

export type MenuView =
  | 'hub'
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

export const LATEST_NEWS_VERSION = 'v1.0.5'
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
    // Batas penyimpanan: 60 jam (2.5 hari = 60 * 3600 * 1000 ms)
    const cutoff = Date.now() - (60 * 60 * 1000 * 60)
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

  // Synthesized Audio Tone Generator for test alerts
  const playTestTone = (isCritical: boolean = false) => {
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
              {view === 'remarks' && (lang === 'id' ? 'KETERANGAN SISTEM' : 'SYSTEM REMARKS')}
              {view === 'terms' && (lang === 'id' ? 'KETENTUAN LAYANAN' : 'TERMS OF SERVICE')}
              {view === 'privacy' && (lang === 'id' ? 'KEBIJAKAN PRIVASI' : 'PRIVACY POLICY')}
            </h1>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded bg-black/60 border border-[#1A2333] font-mono text-[10px] text-nerv-orange font-bold">
          v1.0.5
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
                        {lang === 'id' ? 'Riwayat pesan gempa masuk (otomatis kedaluwarsa 60 jam)' : 'Live seismic telemetry alerts (auto-purged 60h)'}
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
                <span className="text-[10px] font-mono text-nerv-cyan font-bold bg-nerv-cyan/10 px-2 py-0.5 rounded border border-nerv-cyan/30">
                  {lang === 'id' ? 'BATAS 60 JAM' : '60H LIFETIME'}
                </span>
              </div>

              {earthquakeList.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0D121F] border border-[#1A2333] text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">
                    {lang === 'id' ? 'Belum ada warta gempa baru dalam 60 jam terakhir' : 'No seismic telemetry events recorded in the last 60 hours'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earthquakeList.map((item) => {
                    const expireAt = item.receivedAt + (60 * 60 * 1000 * 60)
                    const diffMs = Math.max(0, expireAt - Date.now())
                    const hoursLeft = Math.floor(diffMs / (3600 * 1000))
                    const minsLeft = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000))
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
                            {lang === 'id' ? `Kedaluwarsa: ${hoursLeft}j ${minsLeft}m` : `Expires: ${hoursLeft}h ${minsLeft}m`}
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
                  version: 'v1.0.5',
                  timestamp: {
                    id: '2026.10.27 (Selasa) 01:40 WITA',
                    en: '2026.10.27 (Tue) 01:40 WITA'
                  },
                  title: {
                    id: 'Penyempurnaan Unit Keluarga, NIK Lengkap, Pemisahan News & Presisi Sharelock',
                    en: 'Family Unit Enhancements, Full NIK, News Split & Sharelock Precision'
                  },
                  details: {
                    id: [
                      'Akurasi Pelacakan GPS Presisi Tinggi (Sharelock Grade): Pembaruan sistem penentuan posisi dengan arsitektur Dual-Layer Watcher (Hardware Native + Web Geolocation) secara paralel tanpa cache stale (maximumAge: 0), dilengkapi filter bobot Kalman adaptif untuk stabilitas koordinat sekelas fitur share-location WhatsApp / Google Maps.',
                      'Kustomisasi Peran Unit Anggota Keluarga: Penambahan verifikasi kode 6-digit dan kustomisasi peran unit (3-20 karakter alfanumerik) menggantikan label personal unit standar.',
                      'Tampilan NIK Lengkap 16-Digit: NIK anggota unit kini ditampilkan lengkap pada kartu identitas keluarga dan QR Code untuk verifikasi akurat di posko.',
                      'Kartu Identitas Unit Pengguna: Kartu identitas perangkat pengguna kini disematkan secara terkemuka di bagian atas daftar unit keluarga.',
                      'Pemisahan Warta Gempa (News) & Log Pembaruan: Warta gempa masuk tercatat lengkap dalam kartu historis berbatas kedaluwarsa 60 jam (2,5 hari) dengan estimasi waktu mundur, terpisah dari log pembaruan rilis sistem.',
                      'Respon Seketika Tombol Bantuan Darurat: Tombol memerlukan bantuan pada notifikasi darurat kini langsung merespon seketika tanpa jeda pemindaian GPS.',
                      'Sinkronisasi Telemetri Global Darurat: Integrasi pop-up darurat taktis dan pembaruan koordinat langsung di seluruh menu antarmuka.'
                    ],
                    en: [
                      'High-Precision Sharelock GPS Tracking: Updated positioning engine with parallel Dual-Layer Watcher (Hardware Native + Web Geolocation) with zero stale-cache latency (maximumAge: 0), paired with an adaptive Kalman filter for pin-drop accuracy comparable to Google Maps / WhatsApp share-location.',
                      'Family Unit Role Customization: Added 6-digit security code verification and custom unit role naming (3-20 alphanumeric characters) replacing generic unit tags.',
                      'Full 16-Digit NIK Display: Full 16-digit national identity numbers are now displayed on member unit cards and QR passes for accurate verification.',
                      'User Unit Identity Card: The current user unit identity card is now prominently pinned to the top of the family unit list.',
                      'Earthquake News & Release Changelog Separation: Incoming earthquake alerts are now recorded on dedicated news cards with a 60-hour auto-purge and estimated countdown, separated from system release logs.',
                      'Instant Emergency Assistance Response: The emergency assistance button in alerts now responds instantly without sensor acquisition delays.',
                      'Global Emergency Telemetry Synchronization: Integrated tactical emergency popup and realtime coordinate synchronization across all interface views.'
                    ]
                  }
                },
                {
                  version: 'v1.0.3',
                  timestamp: {
                    id: '2026.10.26 (Senin) 17:50 WITA',
                    en: '2026.10.26 (Mon) 17:50 WITA'
                  },
                  title: {
                    id: 'Optimalisasi Tata Letak Bahasa & Layanan Latar Belakang Sentinel',
                    en: 'Language Interface Optimization & Sentinel Background Service'
                  },
                  details: {
                    id: [
                      'Penyelarasan Pengaturan Bahasa Terpusat: Tombol pemilihan bahasa kini difokuskan secara eksklusif di dalam Menu Pengaturan Sistem, menyederhanakan header status dan panel profil agar antarmuka lebih bersih dan taktis.',
                      'Dukungan Bahasa Awal Registrasi: Tombol pergantian bahasa tetap dipertahankan pada tahap awal pendaftaran untuk kenyamanan pengguna baru.',
                      'Integrasi Mode Sentinel Latar Belakang 24/7: Penambahan layanan latar belakang permanen (Android Foreground Service) agar sirine dan peringatan simulasi bencana otomatis aktif seketika meskipun aplikasi ditutup.'
                    ],
                    en: [
                      'Centralized Language Interface Optimization: Language configuration is now streamlined exclusively into the System Menu, keeping the main telemetry header and profile terminal clean and uncluttered.',
                      'Onboarding Multilingual Support: Language switcher retained during initial identity registration steps for new user onboarding.',
                      '24/7 Sentinel Background Service Integration: Added a persistent native Android Foreground Service ensuring emergency sirens and simulation alerts trigger immediately even when the app is closed.'
                    ]
                  }
                },
                {
                  version: 'v1.0.2',
                  timestamp: {
                    id: '2026.10.26 (Senin) 16:30 WITA',
                    en: '2026.10.26 (Mon) 16:30 WITA'
                  },
                  title: {
                    id: 'Kalibrasi Sensor Kompas 3D & Pengaturan Bahasa Sistem',
                    en: '3D Compass Sensor Calibration & System Language Settings'
                  },
                  details: {
                    id: [
                      'Penyempurnaan Kalibrasi Sensor Angka 8 (Figure-8 Gesture): Rekonstruksi deteksi gerak 4 arah di udara secara presisi dengan getaran respon dan nada konfirmasi, serta pencegahan kalibrasi selesai prematur saat ponsel dalam posisi diam atau miring.',
                      'Pengaturan Bahasa Antarmuka: Penambahan opsi pergantian bahasa langsung antara Bahasa Indonesia dan English di dalam menu pengaturan sistem.',
                      'Indikator Pembaruan News: Indikator titik merah notifikasi otomatis aktif ketika terdapat informasi pembaruan sistem dan hilang setelah menu News dibuka.'
                    ],
                    en: [
                      'Enhanced Figure-8 Compass Calibration: Precision 4-way spatial motion detection with interactive haptic and audio chime confirmation, preventing premature completion when the device is resting or tilted.',
                      'System Interface Language Settings: Added direct toggle between Indonesian and English interface languages in System Settings.',
                      'News Update Indicator: Dynamic red notification dot alerts users of new system updates and automatically clears once the News section is reviewed.'
                    ]
                  }
                },
                {
                  version: 'v1.0.1',
                  timestamp: {
                    id: '2026.10.26 (Senin) 12:00 WITA',
                    en: '2026.10.26 (Mon) 12:00 WITA'
                  },
                  title: {
                    id: 'Peningkatan Notifikasi Darurat, Aksesibilitas & Dwibahasa',
                    en: 'Emergency Notification Enhancements, Accessibility & Bilingual Support'
                  },
                  details: {
                    id: [
                      'Penyempurnaan notifikasi darurat: Panel peringatan dapat ditutup cepat dengan cara digeser ke atas (swipe-up).',
                      'Kalibrasi kompas otomatis: Panduan kompas kini hanya muncul sekali saat pertama kali aplikasi dipasang.',
                      'Pengaturan tampilan lengkap: Pilihan tema terang/gelap, kontras tinggi, bantuan penglihatan warna, dan ramah pembaca layar (TalkBack).',
                      'Dukungan dwibahasa: Aplikasi kini dapat digunakan sepenuhnya dalam Bahasa Indonesia dan Bahasa Inggris.',
                      'Penyempurnaan izin Jangan Ganggu: Aplikasi dapat berbunyi saat situasi darurat bencana meskipun ponsel dalam mode hening.'
                    ],
                    en: [
                      'Emergency notification refinement: Alert panels can now be quickly dismissed with an intuitive swipe-up gesture.',
                      'Automated compass calibration: Compass orientation guide now prompts only once on initial installation.',
                      'Comprehensive display settings: Light/Dark theme options, high contrast mode, color vision assistance, and screen reader (TalkBack) compatibility.',
                      'Bilingual support: Complete interface usability in both Indonesian and English.',
                      'Do Not Disturb override refinement: Alerts can audibly sound during severe disaster emergencies even if the device is set to silent mode.'
                    ]
                  }
                },
                {
                  version: 'v1.0.0',
                  timestamp: {
                    id: '2026.10.26 (Senin) 09:00 WITA',
                    en: '2026.10.26 (Mon) 09:00 WITA'
                  },
                  title: {
                    id: 'Peluncuran Rilis Stabil A.T.L.A.S Multi-Threat Telemetry',
                    en: 'Official Release of A.T.L.A.S Multi-Threat Telemetry'
                  },
                  details: {
                    id: [
                      'Registrasi identitas resmi berbasis NIK 16-digit yang aman dan terlindungi.',
                      'Penerapan benteng enkripsi kode dan perlindungan anti-tamper tingkat tinggi.',
                      'Akses langsung ke Pusat Pengaturan Sistem HP untuk perizinan lokasi latar belakang.',
                      'Integrasi pengujian sirine kebencanaan nyata ke laci notifikasi dan riwayat sistem ponsel.',
                      'Pembaruan protokol respons sinyal darurat unit: Pilihan SAYA AMAN ✓ dan BUTUH BANTUAN DARURAT.',
                      'Status personel saat ping dikirim otomatis berubah ke WAITING // MENUNGGU RESPON.',
                      'Pemulihan sesi cerdas: Pendaftaran ulang dengan NIK yang sama setelah reset aplikasi otomatis dipulihkan jika nama cocok.',
                      'Tautan undangan grup unit keluarga langsung membuka aplikasi secara otomatis.',
                      'Penyesuaian tata letak layar penuh agar nyaman dan tidak terpotong di semua tipe layar ponsel.'
                    ],
                    en: [
                      'Official secure identity registration verified against protected 16-digit ID.',
                      'High-grade runtime code obfuscation and tamper-resistance defense architecture.',
                      'Direct access link to Android System Settings for background location permissions.',
                      'Live disaster siren testing pipeline integrated with system notification tray and logging.',
                      'Emergency response unit protocol: Instant toggle between I AM SAFE ✓ and NEED EMERGENCY HELP.',
                      'Telemetry ping status automatically transitions to WAITING FOR RESPONSE upon dispatch.',
                      'Smart session recovery: Re-registration with the same ID automatically restores existing session if identity matches.',
                      'Family and unit invitation deep links automatically launch and join groups within the app.',
                      'Adaptive full-screen viewport layout preventing cutoffs across edge-to-edge displays.'
                    ]
                  }
                },
                {
                  version: 'v0.9.8',
                  timestamp: {
                    id: '2026.10.20 (Selasa) 14:30 WITA',
                    en: '2026.10.20 (Tue) 14:30 WITA'
                  },
                  title: {
                    id: 'Peningkatan Algoritma Rute Evakuasi & Deliniasi Zona Bahaya Palu',
                    en: 'Evacuation Route Optimization & Palu Hazard Zone Mapping'
                  },
                  details: {
                    id: [
                      'Peningkatan akurasi panduan rute evakuasi tercepat menuju dataran tinggi dan shelter vertikal.',
                      'Penambahan visualisasi layer peta batas Zona Rawan Bencana (ZRB 4 s.d. ZRB 1) Teluk Palu.',
                      'Pencegahan tabrakan status bar Android dengan safe-area inset padding adaptif.'
                    ],
                    en: [
                      'Higher accuracy routing to nearest elevated safe zones and vertical evacuation shelters.',
                      'Visualized Disaster-Prone Zone layers (ZRB 4 to ZRB 1) across the Palu Bay coastal area.',
                      'Dynamic Android status bar inset padding to eliminate interface clipping.'
                    ]
                  }
                },
                {
                  version: 'v0.9.7',
                  timestamp: {
                    id: '2026.10.05 (Senin) 11:00 WITA',
                    en: '2026.10.05 (Mon) 11:00 WITA'
                  },
                  title: {
                    id: 'Peningkatan Stabilitas Pemantauan Lokasi & Efisiensi Baterai',
                    en: 'Location Tracking Stability & Power Consumption Optimization'
                  },
                  details: {
                    id: [
                      'Peningkatan kestabilan pemantauan sinyal GPS di latar belakang.',
                      'Optimasi efisiensi konsumsi daya baterai saat mode pemantauan darurat aktif.',
                      'Sinkronisasi status offline untuk mempertahankan rute evakuasi saat sinyal terputus.'
                    ],
                    en: [
                      'Enhanced background GPS telemetry stability and satellite acquisition speed.',
                      'Optimized battery power consumption during continuous emergency monitoring mode.',
                      'Offline cache synchronization preserving evacuation routing when connectivity drops.'
                    ]
                  }
                },
                {
                  version: 'v0.9.6',
                  timestamp: {
                    id: '2026.09.28 (Minggu) 16:45 WITA',
                    en: '2026.09.28 (Sun) 16:45 WITA'
                  },
                  title: {
                    id: 'Penyempurnaan Visualisasi Radius Bahaya Gempa & Kompas',
                    en: 'Earthquake Hazard Radius Visualization & Compass Alignment'
                  },
                  details: {
                    id: [
                      'Peningkatan visualisasi radius peringatan guncangan gempa bumi pada peta interaktif.',
                      'Perbaikan animasi arah jarum kompas darurat saat perangkat digerakkan.',
                      'Penyelarasan skala intensitas MMI dengan guncangan yang dirasakan di darat.'
                    ],
                    en: [
                      'Interactive map visualization of estimated earthquake shaking radii.',
                      'Smooth orientation damping for emergency compass needle during rapid movement.',
                      'MMI intensity scale calibration aligned with ground-motion estimation models.'
                    ]
                  }
                },
                {
                  version: 'v0.9.5',
                  timestamp: {
                    id: '2026.09.15 (Selasa) 10:15 WITA',
                    en: '2026.09.15 (Tue) 10:15 WITA'
                  },
                  title: {
                    id: 'Integrasi Feed Informasi Gempa Bumi & Peringatan Dini BMKG',
                    en: 'BMKG Real-time Earthquake Data & Early Warning Feed Integration'
                  },
                  details: {
                    id: [
                      'Integrasi data informasi gempa bumi terkini secara langsung dari BMKG (Magnitudo, Kedalaman, Episentrum).',
                      'Perhitungan otomatis perkiraan dampak guncangan gempa di lokasi pengguna.',
                      'Protokol siaga tsunami otomatis untuk pesisir Teluk Palu.'
                    ],
                    en: [
                      'Real-time telemetry integration with BMKG earthquake feeds (Magnitude, Depth, Epicenter).',
                      'Automated local ground shaking intensity estimation at the user device coordinates.',
                      'Automated tsunami warning alert protocol for the Palu Bay coastline.'
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
