// ═══════════════════════════════════════════════════════════════
// GUIDES PAGE — A.T.L.A.S Tactical Emergency Directives & First Aid Manual
// Comprehensive 6 Disaster Directives + First Aid Protocols
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import {
  ChevronDown, ChevronUp, ArrowRight, ChevronLeft,
  Waves, Activity, Droplets, Wind, Flame, ShieldAlert,
  Heart, AlertTriangle, CheckCircle2, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '../../lib/i18n'

interface DirectiveItem {
  id: string
  code: string
  title: string
  subtitle: string
  icon: any
  color: string
  borderColor: string
  badge: string
  goldenRule: string
  steps: { num: string; label: string; desc: string }[]
  precautions: string[]
}

const DISASTER_DIRECTIVES: DirectiveItem[] = [
  {
    id: 'tsunami',
    code: 'DIRECTIVE 01 // TSUNAMI HAZARD',
    title: 'Tsunami & Gelombang Laut Raksasa',
    subtitle: 'Golden Rule Evakuasi Mandiri Pesisir Pantai',
    icon: Waves,
    color: '#FF1744',
    borderColor: 'border-nerv-red',
    badge: 'DEFCON 1',
    goldenRule: 'SEGERA MENJAUH DARI GARIS PANTAI // BERGERAK MENUJU ELEVASI TINGGI (MINIMAL ≥ 20 METER ATAU SHELTER VERTIKAL TES).',
    steps: [
      { num: '01', label: 'KENALI TANDA ALAM', desc: 'Air laut surut drastis secara tiba-tiba, tercium bau belerang kuat, atau terdengar suara gemuruh dentuman dari arah laut lepas.' },
      { num: '02', label: 'EVAKUASI JALAN KAKI', desc: 'Evakuasi wajib berjalan atau berlari kaki. Jangan menggunakan mobil/motor yang pasti memicu kemacetan total di persimpangan jalan.' },
      { num: '03', label: 'BERTAHAN DI KETINGGIAN', desc: 'Tetap berada di titik elevasi aman (TES) minimal 2 jam setelah gelombang pertama, karena gelombang susulan biasanya jauh lebih destruktif.' }
    ],
    precautions: [
      'Jangan menunggu sirene atau pengumuman jika gempa dirasakan kuat > 20 detik.',
      'Jauhi muara dan bantaran sungai karena tsunami menerobos masuk ke daratan melalui lorong sungai.',
      'Jangan pernah kembali ke pantai untuk menonton gelombang atau memungut ikan yang terdampar.'
    ]
  },
  {
    id: 'earthquake',
    code: 'DIRECTIVE 02 // SEISMIC IMPACT',
    title: 'Gempa Bumi Tektonik & Reruntuhan',
    subtitle: 'Protokol Perlindungan Diri Terhadap Guncangan Hebat',
    icon: Activity,
    color: '#FF5722',
    borderColor: 'border-nerv-orange',
    badge: 'SEISMIC ALPHA',
    goldenRule: 'JATUHKAN TUBUH (DROP), LINDUNGI KEPALA (COVER), BERTAHAN KUAT (HOLD ON) DI BAWAH STRUKTUR KOKOH HINGGA GUNCANGAN REDA.',
    steps: [
      { num: '01', label: 'DROP // MERENDAH', desc: 'Jatuhkan tubuh dan bertumpu pada tangan serta lutut sebelum percepatan seismik menjatuhkan Anda secara paksa.' },
      { num: '02', label: 'COVER // LINDUNGI', desc: 'Lindungi kepala, tengkuk, dan leher di bawah kolong meja kokoh atau tutupi dengan tas/bantal jika berada di tempat tidur.' },
      { num: '03', label: 'HOLD ON // BERTAHAN', desc: 'Pegang erat kaki meja penopang dan bersiap bergerak bersama meja hingga guncangan seismik sepenuhnya terhenti.' }
    ],
    precautions: [
      'Jika di dalam gedung bertingkat, DILARANG KERAS menggunakan lift/elevator. Gunakan tangga darurat setelah guncangan berhenti.',
      'Jauhi jendela kaca, cermin, lemari gantung, dan dinding bata yang rentan roboh keluar.',
      'Jika berada di luar ruangan, segera cari tanah lapang terbuka, jauhi tiang listrik, baliho, dan lereng curam rawan likuefaksi/longsor.'
    ]
  },
  {
    id: 'flood',
    code: 'DIRECTIVE 03 // INUNDATION HAZARD',
    title: 'Banjir Genangan & Luapan Air',
    subtitle: 'Protokol Mitigasi Luapan Sungai dan Drainase Kota',
    icon: Droplets,
    color: '#00E5FF',
    borderColor: 'border-nerv-cyan',
    badge: 'HYDRO LEVEL-3',
    goldenRule: 'PUTUSKAN SUMBER ENERGI LISTRIK & GAS UTAMA // AMANKAN LOGISTIK DAN DOKUMEN KE LANTAI ATAS ATAU PUSAT EVAKUASI.',
    steps: [
      { num: '01', label: 'PEMUTUSAN DAYA TOTAL', desc: 'Segera matikan MCB meteran listrik rumah dan lepas regulator tabung gas sebelum air merendam stopkontak.' },
      { num: '02', label: 'DOKUMEN & LOGISTIK', desc: 'Bungkus berkas identitas, obat esensial, dan senter dalam kantong plastik kedap air, letakkan di posisi tertinggi.' },
      { num: '03', label: 'JALUR EVAKUASI AMAN', desc: 'Berpindahlah ke posko penampungan resmi sebelum genangan air melampaui batas lutut atau menutup akses jalan.' }
    ],
    precautions: [
      'Dilarang berjalan atau berkendara menembus arus air banjir (arus setinggi 15 cm sudah mampu merobohkan orang dewasa).',
      'Waspadai sengatan arus bocor listrik dan ancaman hewan berbisa (ular/kalajengking) yang mencari tempat kering.',
      'Jangan biarkan anak-anak bermain atau berenang di air genangan banjir yang terkontaminasi limbah biologis.'
    ]
  },
  {
    id: 'flashflood',
    code: 'DIRECTIVE 04 // FLASH FLOOD SURGE',
    title: 'Banjir Bandang & Arus Deras Gunung',
    subtitle: 'Protokol Evakuasi Kecepatan Tinggi Aliran Lumpur & Material',
    icon: Waves,
    color: '#FF9100',
    borderColor: 'border-amber-500',
    badge: 'FLASH IMPACT',
    goldenRule: 'EVAKUASI TEGAK LURUS MENJAUHI ALUR LEMBAH // NAIK KE TEBING TINGGI SEGERA KETIKA AIR SUNGAI MENDADAK KERUH ATAU GEMURUH.',
    steps: [
      { num: '01', label: 'DETEKSI ANOMALI HULU', desc: 'Air sungai mendadak berubah warna menjadi cokelat pekat bercampur ranting kayu atau penurunan debit secara ganjil adalah tanda tanggul hulu jebol.' },
      { num: '02', label: 'LARI TEGAK LURUS', desc: 'Evakuasi bukan searah aliran sungai, melainkan tegak lurus mendaki lereng tebing atau punggung bukit yang kokoh.' },
      { num: '03', label: 'JAUHI JEMBATAN', desc: 'Jangan melintasi atau berada di atas jembatan sungai, karena jembatan rentan hancur terhantam gelondongan kayu dan batu raksasa.' }
    ],
    precautions: [
      'Banjir bandang bergerak dengan kecepatan sangat tinggi (> 30 km/jam) membawa daya hancur luar biasa.',
      'Jika mendengar suara gemuruh berat menyerupai kereta api dari arah pegunungan, langsung lari ke tempat tinggi tanpa mengambil barang.',
      'Jangan pernah berlindung di tepi tebing tanah gembur yang rawan longsor tersapu arus air.'
    ]
  },
  {
    id: 'cyclone',
    code: 'DIRECTIVE 05 // CYCLONIC STORM',
    title: 'Angin Topan, Puting Beliung & Badai',
    subtitle: 'Protokol Perlindungan Terhadap Turbulensi Atmosfer Ekstrem',
    icon: Wind,
    color: '#E040FB',
    borderColor: 'border-fuchsia-500',
    badge: 'VORTEX CRITICAL',
    goldenRule: 'BERLINDUNG DI RUANGAN PALING TENGAH GEDUNG // JAUHI SELURUH JENDELA, ATAP SENG, DAN PINTU KACA.',
    steps: [
      { num: '01', label: 'KUNCI CELAH UDARA', desc: 'Tutup rapat seluruh ventilasi, jendela, dan pintu. Perkuat pengait agar tekanan angin pusaran tidak menerbangkan struktur atap.' },
      { num: '02', label: 'INNER SANCTUARY', desc: 'Posisikan diri di ruangan terdalam tanpa jendela (seperti kamar mandi, lorong tengah, atau di bawah tangga beton).' },
      { num: '03', label: 'PERLINDUNGAN KEPALA', desc: 'Meringkuk di lantai dan tutupi kepala serta leher dengan kasur, selimut tebal, atau helm untuk menahan serpihan proyektil puing.' }
    ],
    precautions: [
      'Dilarang berlindung di bawah pohon besar, tiang reklame, kabel listrik tegangan tinggi, atau jembatan penyeberangan.',
      'Jika terjebak di ruang terbuka saat pusaran angin mendekat, segera tiarap di saluran parit dangkal dan lindungi kepala.',
      'Cabut seluruh peralatan elektronik dari colokan untuk mengantisipasi induksi petir dan lonjakan daya kabel putus.'
    ]
  },
  {
    id: 'volcano',
    code: 'DIRECTIVE 06 // VOLCANIC ERUPTION',
    title: 'Gunung Meletus & Hujan Abu Vulkanik',
    subtitle: 'Protokol Penyelamatan Diri Erupsi & Awan Panas',
    icon: Flame,
    color: '#FF3D00',
    borderColor: 'border-red-600',
    badge: 'MAGMA HAZARD',
    goldenRule: 'PAKAI MASKER BASAH & KACAMATA GOGGLE // SEGERA TINGGALKAN RADIUS KAWASAN RAWAN BENCANA (KRB) MENUJU KORIDOR AMAN.',
    steps: [
      { num: '01', label: 'PROTEKSI PERNAPASAN', desc: 'Gunakan masker N95 atau kain basah untuk menutup hidung dan mulut dari partikel silika tajam abu vulkanik.' },
      { num: '02', label: 'LINDUNGI PENGLIHATAN', desc: 'Pakai kacamata tertutup (goggle) dan pakaian lengan panjang. Lepaskan lensa kontak segera untuk mencegah goresan kornea.' },
      { num: '03', label: 'JAUHI LEMBAH LAHAR', desc: 'Jauhi lembah sungai yang berhulu di puncak gunung untuk menghindari sapuan awan panas (wedhus gembel) dan banjir lahar dingin.' }
    ],
    precautions: [
      'Bersihkan tumpukan abu vulkanik dari atap rumah secara berkala agar struktur atap tidak ambruk akibat beban berat abu basah.',
      'Tutup seluruh penampungan air bersih dan makanan agar tidak terkontaminasi abu asam dan logam berat.',
      'Patuhi batas radius bahaya (KRB) yang ditetapkan otoritas PVMBG/ESDM, jangan pernah melintasi garis batas larangan.'
    ]
  }
]

const FIRST_AID_PROTOCOLS = [
  {
    id: 'cpr',
    directive: 'MED-01 // CARDIAC ARREST',
    title: 'Resusitasi Jantung Paru (CPR / RJP)',
    icon: '🫀',
    steps: [
      { label: 'CEK RESPON & NADI', desc: 'Tepuk bahu korban dengan tegas, periksa pergerakan dada dan denyut nadi karotis leher selama maksimal 10 detik.' },
      { label: 'KOMPRESI DADA CEPAT', desc: 'Letakkan tumit tangan di tengah tulang dada, tekan sedalam 5-6 cm dengan ritme 100-120 kali per menit (ritme lagu Stayin Alive).' },
      { label: 'MINIMALISIR INTERUPSI', desc: 'Lakukan kompresi terus-menerus tanpa henti hingga korban merespons atau tenaga medis paramedis tiba.' }
    ]
  },
  {
    id: 'bleeding',
    directive: 'MED-02 // ACUTE TRAUMA',
    title: 'Perdarahan Arteri & Vena Terbuka',
    icon: '🩸',
    steps: [
      { label: 'TEKAN LANGSUNG (DIRECT PRESSURE)', desc: 'Gunakan kasa steril atau kain bersih, tekan langsung titik robekan pembuluh darah dengan kedua telapak tangan sekuat tenaga.' },
      { label: 'PEMBALUTAN TEKAN', desc: 'Balut luka rapat-rapat dengan perban elastis. Jangan mencabut kain pertama yang sudah jenuh darah, tapi tambahkan lapisan di atasnya.' },
      { label: 'TOURNIQUET DARURAT', desc: 'Untuk perdarahan semprot anggota gerak yang mengancam nyawa, pasang torniket 5-7 cm di atas luka hingga perdarahan terhenti.' }
    ]
  },
  {
    id: 'fracture',
    directive: 'MED-03 // SKELETAL FRACTURE',
    title: 'Patah Tulang & Cedera Muskuloskeletal',
    icon: '🦴',
    steps: [
      { label: 'IMOBILISASI TOTAL', desc: 'Dilarang meluruskan atau memanipulasi posisi tulang yang bengkok secara paksa. Pertahankan posisi saat ditemukan.' },
      { label: 'PEMASANGAN BIDAI (SPLINT)', desc: 'Pasang bilah papan atau karton kaku melewati dua sendi (sendi di atas dan di bawah tulang yang patah), ikat dengan kain.' },
      { label: 'CEK PERFUSI UJUNG JARI', desc: 'Pastikan ikatan tidak terlalu ketat dengan mengecek sensasi rasa dan kehangatan jari-jari tangan/kaki korban.' }
    ]
  },
  {
    id: 'choking',
    directive: 'MED-04 // AIRWAY OBSTRUCTION',
    title: 'Sumbatan Saluran Napas (Heimlich Maneuver)',
    icon: '🗣️',
    steps: [
      { label: 'POSISI PENOLONG', desc: 'Berdiri di belakang korban sadar yang tersedak, lingkarkan kedua lengan Anda mengelilingi perut korban di atas pusar.' },
      { label: 'HENTAKAN SUB-DIAFRAGMA', desc: 'Genggam tangan erat-erat, berikan dorongan kuat dan cepat ke arah dalam dan ke atas untuk mendesak keluar benda asing.' }
    ]
  },
  {
    id: 'burns',
    directive: 'MED-05 // THERMAL INJURY',
    title: 'Luka Bakar Api & Termal',
    icon: '🔥',
    steps: [
      { label: 'IRIGASI AIR BERSUHU RUANG', desc: 'Alirkan air bersih mengalir selama minimal 20 menit pada area terpapar. DILARANG menggunakan air es/es batu.' },
      { label: 'TUTUP DENGAN KAIN STERIL', desc: 'Tutup longgar area luka dengan plastik wrap atau kain steril non-lengket untuk mencegah paparan udara terbuka.' }
    ]
  }
]

export default function GuidesPage({ onNavigateMap, onBack }: { onNavigateMap: () => void; onBack?: () => void }) {
  const { lang, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'disaster' | 'medical'>('disaster')
  const [expandedId, setExpandedId] = useState<string>('tsunami')

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[1800] flex flex-col overflow-y-auto custom-scrollbar bg-nerv-bg text-slate-200"
    >
      {/* A.T.L.A.S Header */}
      <div className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-3 border-b border-nerv-border bg-[#0B0F19] flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded bg-nerv-card border border-nerv-border flex items-center justify-center shrink-0 hover:border-nerv-orange transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-nerv-orange animate-ping" />
              <p className="text-[10px] font-mono font-bold tracking-widest text-nerv-orange uppercase">
                A.T.L.A.S // TACTICAL DIRECTIVES
              </p>
            </div>
            <h2 className="text-sm font-mono font-bold text-white truncate uppercase">
              {lang === 'id' ? 'BUKU PANDUAN 6 BENCANA & P3K' : '6 DISASTER DIRECTIVES & FIRST AID'}
            </h2>
          </div>
        </div>

        <div className="px-2 py-1 rounded bg-black/60 border border-nerv-border font-mono text-[9px] text-nerv-cyan shrink-0">
          OFFLINE CACHED
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-28 font-sans max-w-2xl mx-auto w-full">
        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/60 border border-nerv-border font-mono text-xs">
          <button
            onClick={() => setActiveTab('disaster')}
            className={`py-2 px-3 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'disaster'
                ? 'bg-nerv-orange text-black shadow-[0_0_12px_rgba(255,87,34,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? '6 PROTOKOL BENCANA' : '6 DISASTER DIRECTIVES'}</span>
          </button>

          <button
            onClick={() => setActiveTab('medical')}
            className={`py-2 px-3 rounded font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'medical'
                ? 'bg-nerv-cyan text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{lang === 'id' ? 'PANDUAN MEDIS P3K' : 'FIRST AID PROTOCOLS'}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1: 6 BENCANA BESAR (FULL TACTICAL DIRECTIVES)
           ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'disaster' && (
          <div className="space-y-3 font-mono">
            {DISASTER_DIRECTIVES.map((d) => {
              const isOpen = expandedId === d.id
              const IconComp = d.icon
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border overflow-hidden transition-all bg-[#0d121c] ${
                    isOpen ? `${d.borderColor} shadow-lg` : 'border-nerv-border/70 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? '' : d.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${d.color}15`, borderColor: `${d.color}40` }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: d.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: d.color }}>
                            {d.code}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-black/70 border border-slate-700 text-slate-300">
                            {d.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate">{d.title}</h3>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-nerv-border/60"
                      >
                        <div className="p-4 space-y-3 font-sans">
                          {/* Golden Rule Banner */}
                          <div
                            className="p-3 rounded border font-mono font-bold text-xs leading-relaxed"
                            style={{
                              backgroundColor: `${d.color}10`,
                              borderColor: `${d.color}50`,
                              color: d.color
                            }}
                          >
                            <span className="text-[9px] block text-slate-400 uppercase tracking-widest mb-0.5">
                              GOLDEN DIRECTIVE:
                            </span>
                            {d.goldenRule}
                          </div>

                          {/* Tactical 3 Steps */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                              LANGKAH PENYELAMATAN TAKTIS:
                            </span>
                            {d.steps.map((st) => (
                              <div
                                key={st.num}
                                className="flex items-start gap-3 p-2.5 rounded bg-black/50 border border-nerv-border/60"
                              >
                                <span className="w-6 h-6 rounded bg-[#172033] border border-nerv-border flex items-center justify-center shrink-0 font-mono text-xs font-bold text-nerv-cyan">
                                  {st.num}
                                </span>
                                <div>
                                  <p className="text-xs font-mono font-bold text-white uppercase">{st.label}</p>
                                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{st.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Precaution checklist */}
                          <div className="p-3 rounded bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                            <span className="text-[10px] font-mono text-nerv-yellow uppercase tracking-wider block font-bold mb-1">
                              LARANGAN KRITIS &amp; KEWASPADAAN:
                            </span>
                            {d.precautions.map((p, idx) => (
                              <p key={idx} className="flex items-start gap-2">
                                <span className="text-nerv-orange font-bold font-mono">▸</span>
                                <span>{p}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: PROTOKOL MEDIS PERTAMA (FIRST AID / P3K)
           ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'medical' && (
          <div className="space-y-3 font-mono">
            {FIRST_AID_PROTOCOLS.map((fa) => (
              <div key={fa.id} className="p-4 rounded-lg border border-nerv-border bg-nerv-card shadow-sm">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-nerv-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fa.icon}</span>
                    <div>
                      <span className="text-[8px] font-mono font-bold text-nerv-cyan uppercase tracking-widest block">
                        {fa.directive}
                      </span>
                      <h4 className="text-xs font-mono font-bold text-white uppercase">{fa.title}</h4>
                    </div>
                  </div>
                  <Heart className="w-4 h-4 text-nerv-cyan" />
                </div>

                <div className="space-y-2">
                  {fa.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded bg-black/40 border border-nerv-border/40">
                      <div className="w-5 h-5 rounded bg-[#131926] border border-nerv-border flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-nerv-cyan">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-nerv-cyan uppercase">{step.label}</p>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button: Open Evacuation Map */}
        <button
          onClick={onNavigateMap}
          className="w-full py-3.5 rounded-lg bg-nerv-orange hover:bg-orange-600 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,87,34,0.35)] transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          {lang === 'id' ? 'BUKA KOKPIT PETA RUTE EVAKUASI' : 'OPEN EVACUATION MAP COCKPIT'}
        </button>

        {/* Offline Cache Assurance */}
        <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-nerv-green animate-pulse" />
          <span>
            {lang === 'id' 
              ? 'OFFLINE LOCAL CACHE VERIFIED // SELURUH DOKUMEN AKTIF TANPA INTERNET'
              : 'OFFLINE LOCAL CACHE VERIFIED // ALL DIRECTIVES OFFLINE READY'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
