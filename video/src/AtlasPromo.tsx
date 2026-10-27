import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from 'remotion';
import { THEME, FONT, FONT_SANS } from './theme';
import { GridBackground, CornerBrackets, ScanLine, Kicker, Headline, Body, fadeIn, fadeOut } from './components/Atoms';
import { SceneIntro } from './scenes/SceneIntro';
import {
  ScreenStatus,
  ScreenNavigate,
  ScreenRegister,
  ScreenFamily,
  ScreenGuides,
  ScreenMenu,
  ScreenAlertFull,
} from './components/Screens';
import { FeatureScene, ZoomScreen, KineticBold } from './components/Showcase';

export const DURATIONS = {
  intro: 96,
  hook: 150,
  features: 165,
  register: 165,
  status: 180,
  navigate: 225,
  alert: 180,
  family: 165,
  guides: 150,
  menu: 150,
  outro: 165,
} as const;

export type SceneKey = keyof typeof DURATIONS;

export const ORDER: SceneKey[] = [
  'intro',
  'hook',
  'features',
  'register',
  'status',
  'navigate',
  'alert',
  'family',
  'guides',
  'menu',
  'outro',
];

export const STARTS: Record<SceneKey, number> = ORDER.reduce((acc, key) => {
  const prevKey = ORDER[ORDER.indexOf(key) - 1];
  acc[key] = prevKey ? acc[prevKey] + DURATIONS[prevKey] : 0;
  return acc;
}, {} as Record<SceneKey, number>);

export const TOTAL_FRAMES = ORDER.reduce((sum, key) => sum + DURATIONS[key], 0);

const HookScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(fadeIn(frame, 0, 16), fadeOut(frame, duration, 16));
  const rings = [0, 1, 2];

  return (
    <AbsoluteFill style={{ background: THEME.bg, opacity }}>
      <GridBackground accent={THEME.red} intensity={0.05} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        {rings.map((r) => {
          const p = ((frame + r * 32) % 96) / 96;
          return (
            <div
              key={r}
              style={{
                position: 'absolute',
                width: 300 + p * 900,
                height: 300 + p * 900,
                borderRadius: '50%',
                border: `2px solid ${THEME.red}`,
                opacity: (1 - p) * 0.25,
              }}
            />
          );
        })}

        <div style={{ position: 'absolute', top: 250 }}>
          <Kicker color={THEME.red} delay={2}>
            THE FIRST 20 MINUTES
          </Kicker>
        </div>

        <div style={{ marginTop: 60, padding: '0 76px' }}>
          <KineticBold
            words={['GEMPA', 'TERASA > 20', 'DETIK.', '*JANGAN', '*TUNGGU.']}
            delay={12}
            size={104}
            accent={THEME.orange}
            align="center"
          />
        </div>

        <div style={{ position: 'absolute', bottom: 300, left: 90, right: 90 }}>
          <Body delay={64} size={31} align="center" maxWidth={900}>
            Tsunami tidak memberi waktu untuk mencari informasi.
            <br />
            A.T.L.A.S memberi Anda{' '}
            <span style={{ color: THEME.orange, fontWeight: 700 }}>rute evakuasi</span> dalam hitungan detik.
          </Body>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 200,
            display: 'flex',
            gap: 14,
            fontFamily: FONT,
            fontSize: 15,
            letterSpacing: 3,
            color: THEME.dim,
            opacity: fadeIn(frame, 90, 20),
          }}
        >
          <span>BMKG</span>
          <span style={{ color: THEME.orange }}>·</span>
          <span>OSRM ROUTING</span>
          <span style={{ color: THEME.orange }}>·</span>
          <span>GPS REAL-TIME</span>
        </div>
      </AbsoluteFill>
      <CornerBrackets color={THEME.red} />
      <ScanLine />
    </AbsoluteFill>
  );
};

const FeaturesScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(fadeIn(frame, 0, 14), fadeOut(frame, duration, 14));

  const items = [
    { icon: '◉', t: 'PETA SHELTER', d: 'Rute evakuasi terdekat & teraman', color: THEME.orange },
    { icon: '◇', t: 'PERINGATAN DINI', d: 'Feed BMKG + notifikasi darurat', color: THEME.red },
    { icon: '▣', t: 'TURN-BY-TURN', d: 'Instruksi evakuasi per belokan', color: THEME.cyan },
    { icon: '⚑', t: 'UNIT KELUARGA', d: 'Pantau keselamatan anggota via QR', color: THEME.green },
    { icon: '☰', t: 'DIREKTIF BENCANA', d: '6 panduan mitigasi + P3K', color: THEME.amber },
    { icon: '◐', t: 'MODE AKSESIBEL', d: 'Kontras tinggi & buta warna', color: '#A78BFA' },
  ];

  return (
    <AbsoluteFill style={{ background: THEME.bg, opacity }}>
      <GridBackground intensity={0.06} />
      <div style={{ position: 'absolute', top: 150, left: 70, right: 70 }}>
        <Kicker delay={2}>ONE APP · SIX CRITICAL CAPABILITIES</Kicker>
        <div style={{ marginTop: 24 }}>
          <Headline lines={['SEMUA YANG', 'ANDA BUTUHKAN']} size={88} delay={8} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 620,
          left: 70,
          right: 70,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {items.map((it, i) => {
          const s = spring({ frame: frame - 24 - i * 6, fps, config: { damping: 18 } });
          return (
            <div
              key={it.t}
              style={{
                border: `1px solid ${THEME.border}`,
                background: THEME.panel,
                padding: 22,
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px) scale(${0.94 + s * 0.06})`,
              }}
            >
              <div style={{ fontSize: 26, color: it.color, marginBottom: 12 }}>{it.icon}</div>
              <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
                {it.t}
              </div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: THEME.dim, marginTop: 6, lineHeight: 1.4 }}>
                {it.d}
              </div>
            </div>
          );
        })}
      </div>
      <CornerBrackets />
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 6, fps, config: { damping: 14 } });
  const text = spring({ frame: frame - 24, fps, config: { damping: 18 } });
  const cta = spring({ frame: frame - 46, fps, config: { damping: 18 } });
  const shine = interpolate(frame, [0, duration], [-220, 1400], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GridBackground />
      <CornerBrackets />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            opacity: logo,
            transform: `scale(${0.82 + logo * 0.18})`,
            filter: `drop-shadow(0 0 60px ${THEME.orange}88)`,
          }}
        >
          <img src={staticFile('atlas-logo-user.png')} style={{ width: 250, height: 250, objectFit: 'contain' }} />
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 84,
            fontWeight: 900,
            letterSpacing: 10,
            color: '#fff',
            marginTop: 26,
            opacity: text,
            transform: `translateY(${(1 - text) * 24}px)`,
          }}
        >
          A.T.L.A.S<span style={{ color: THEME.orange }}> //</span>
        </div>

        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 27,
            color: THEME.dim,
            marginTop: 14,
            opacity: text,
            textAlign: 'center',
            width: 760,
            lineHeight: 1.45,
          }}
        >
          Siap sebelum bencana.
          <br />
          Lindungi diri, keluarga, dan komunitas Anda.
        </div>

        <div
          style={{
            marginTop: 46,
            position: 'relative',
            overflow: 'hidden',
            border: `1.5px solid ${THEME.orange}`,
            background: `${THEME.orange}14`,
            padding: '20px 46px',
            opacity: cta,
            transform: `translateY(${(1 - cta) * 20}px)`,
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 21, fontWeight: 900, letterSpacing: 3, color: THEME.orange }}>
            UNDUH SEKARANG
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 120,
              left: shine,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
              transform: 'skewX(-18deg)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 34,
            opacity: cta,
            fontFamily: FONT,
            fontSize: 14,
            letterSpacing: 2,
            color: THEME.dimmer,
          }}
        >
          <span>GOOGLE PLAY</span>
          <span style={{ color: THEME.orange }}>·</span>
          <span>FREE</span>
          <span style={{ color: THEME.orange }}>·</span>
          <span>ID.ATLAS.APP</span>
        </div>
      </AbsoluteFill>
      <ScanLine />
    </AbsoluteFill>
  );
};

export const AtlasPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <Sequence from={STARTS.intro} durationInFrames={DURATIONS.intro}>
        <SceneIntro duration={DURATIONS.intro} />
      </Sequence>

      <Sequence from={STARTS.hook} durationInFrames={DURATIONS.hook}>
        <HookScene duration={DURATIONS.hook} />
      </Sequence>

      <Sequence from={STARTS.features} durationInFrames={DURATIONS.features}>
        <FeaturesScene duration={DURATIONS.features} />
      </Sequence>

      <Sequence from={STARTS.register} durationInFrames={DURATIONS.register}>
        <FeatureScene
          duration={DURATIONS.register}
          kicker="STEP 01 · IDENTITAS RESMI"
          lines={['SATU PERANGKAT,', 'SATU IDENTITAS']}
          screen={<ScreenRegister />}
          accent={THEME.cyan}
          phoneTilt={-6}
          bullets={[
            { icon: '✓', text: 'NIK TERVERIFIKASI' },
            { icon: '◎', text: 'GPS AUTO-AKTIF' },
            { icon: '▣', text: 'DATA TERENKRIPSI' },
          ]}
        />
      </Sequence>

      <Sequence from={STARTS.status} durationInFrames={DURATIONS.status}>
        <FeatureScene
          duration={DURATIONS.status}
          kicker="DASHBOARD · STATUS SIAGA"
          lines={['SEMUA TERPANTAU', 'DALAM SATU LAYAR']}
          screen={<ScreenStatus />}
          accent={THEME.orange}
          phoneTilt={-5}
          bullets={[
            { icon: '◈', text: 'FEED BMKG LIVE' },
            { icon: '◉', text: 'DEFCON STATUS' },
            { icon: '⚑', text: 'I AM SAFE' },
          ]}
        />
      </Sequence>

      <Sequence from={STARTS.navigate} durationInFrames={DURATIONS.navigate}>
        <ZoomScreen
          duration={DURATIONS.navigate}
          kicker="FEATURE 02 · NAVIGASI"
          lines={['RUTE EVAKUASI', 'KE SHELTER TES']}
          screen={<ScreenNavigate />}
          accent="#818cf8"
          scale={1.52}
          offsetY={40}
          caption="Algoritma Dijkstra + Haversine memilih jalur tercepat menuju titik aman, lengkap dengan instruksi belokan."
        />
      </Sequence>

      <Sequence from={STARTS.alert} durationInFrames={DURATIONS.alert}>
        <ZoomScreen
          duration={DURATIONS.alert}
          kicker="FEATURE 03 · PERINGATAN DINI"
          kickerColor={THEME.red}
          lines={['SIRENE, GETAR,', 'INSTING BERGERAK']}
          screen={<ScreenAlertFull />}
          accent={THEME.red}
          scale={1.5}
          offsetY={30}
          caption="Ketika BMKG mengirim peringatan, aplikasi langsung membunyikan sirene, bergetar, dan membuka rute evakuasi."
        />
      </Sequence>

      <Sequence from={STARTS.family} durationInFrames={DURATIONS.family}>
        <FeatureScene
          duration={DURATIONS.family}
          kicker="FEATURE 04 · UNIT KELUARGA"
          kickerColor={THEME.green}
          lines={['JANGAN TINGGALKAN', 'KELUARGA TANPA KABAR']}
          screen={<ScreenFamily />}
          accent={THEME.green}
          phoneTilt={6}
          bullets={[
            { icon: '▣', text: 'QR PAIRING' },
            { icon: '◉', text: 'LOKASI LIVE' },
            { icon: '✓', text: 'STATUS AMAN' },
          ]}
        />
      </Sequence>

      <Sequence from={STARTS.guides} durationInFrames={DURATIONS.guides}>
        <FeatureScene
          duration={DURATIONS.guides}
          kicker="FEATURE 05 · DIREKTIF TAKTIS"
          kickerColor={THEME.amber}
          lines={['PROTOKOL', '6 BENCANA']}
          screen={<ScreenGuides />}
          accent={THEME.amber}
          phoneTilt={-6}
          bullets={[
            { icon: '◈', text: 'GOLDEN RULE' },
            { icon: '▣', text: 'LANGKAH 01-03' },
            { icon: '✚', text: 'P3K' },
          ]}
        />
      </Sequence>

      <Sequence from={STARTS.menu} durationInFrames={DURATIONS.menu}>
        <FeatureScene
          duration={DURATIONS.menu}
          kicker="FEATURE 06 · AKSESIBILITAS"
          kickerColor="#A78BFA"
          lines={['DIRANCANG UNTUK', 'SEMUA ORANG']}
          screen={<ScreenMenu />}
          accent="#A78BFA"
          phoneTilt={5}
          bullets={[
            { icon: '◐', text: 'KONTRAS & WARNA' },
            { icon: '◉', text: 'FONT ADAPTIF' },
            { icon: '✦', text: 'WARTA SISTEM' },
          ]}
        />
      </Sequence>

      <Sequence from={STARTS.outro} durationInFrames={DURATIONS.outro}>
        <OutroScene duration={DURATIONS.outro} />
      </Sequence>
    </AbsoluteFill>
  );
};
