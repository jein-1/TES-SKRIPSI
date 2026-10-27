import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate, staticFile } from 'remotion';
import { THEME, FONT, FONT_SANS } from '../theme';
import { AppHeader, BottomDock } from './Atoms';

const useIn = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 20 } });
};

const Row: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({
  children,
  delay,
  style,
}) => {
  const s = useIn(delay);
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * 22}px)`, ...style }}>{children}</div>
  );
};

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = THEME.dimmer }) => (
  <div style={{ fontFamily: FONT, fontSize: 13, letterSpacing: 2, color, fontWeight: 800, textTransform: 'uppercase' }}>
    {children}
  </div>
);

export const ScreenStatus: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.55 + Math.sin(frame / 8) * 0.45;
  return (
    <div style={{ position: 'absolute', inset: 0, background: THEME.bg }}>
      <AppHeader location="KOTA PALU · SULAWESI TENGAH" />

      <div style={{ padding: '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row delay={8}>
          <div style={{ border: `1px solid ${THEME.border}`, borderLeft: `5px solid ${THEME.orange}`, background: THEME.panel, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: THEME.orange, opacity: pulse }} />
              <Label color={THEME.orange}>LIVE SEISMIC FEED · BMKG</Label>
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>
              Gempa 5.2 SR · 38 km Barat Daya Palu
            </div>
            <div style={{ fontFamily: FONT, fontSize: 15, color: THEME.dim, marginTop: 8 }}>
              Kedalaman 10 km · 14:02 WITA
            </div>
          </div>
        </Row>

        <Row delay={18}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Label>DEFCON STATUS</Label>
              <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: THEME.green, marginTop: 4 }}>NORMAL</div>
            </div>
            <div style={{ border: `1px solid ${THEME.green}55`, background: `${THEME.green}14`, color: THEME.green, fontFamily: FONT, fontSize: 13, fontWeight: 800, padding: '8px 12px' }}>
              ALL SENSORS NOMINAL
            </div>
          </div>
        </Row>

        <Row delay={30}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 18, textAlign: 'center' }}>
            <Label>PERSONNEL REPORT · BEACON ACTIVE</Label>
            <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: '#fff', margin: '10px 0 4px' }}>
              LAPORKAN STATUS ANDA
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, color: THEME.dim, marginBottom: 16 }}>
              Konfirmasi keselamatan ke pusat komando
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 14,
                  background: THEME.orange,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 0 50px ${THEME.orange}77, 0 0 0 ${18 * pulse}px ${THEME.orange}18`,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    border: '3px solid #000',
                    color: '#000',
                    fontFamily: FONT,
                    fontSize: 24,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  !
                </div>
                <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 900, color: '#000', letterSpacing: 1 }}>
                  I AM SAFE
                </div>
              </div>
            </div>
          </div>
        </Row>

        <Row delay={42}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.cyan, fontFamily: FONT, fontSize: 18 }}>
              ◉
            </div>
            <div style={{ flex: 1 }}>
              <Label>UNIT KELUARGA</Label>
              <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 3 }}>
                4 personel · 4/4 aman
              </div>
            </div>
            <div style={{ color: THEME.dimmer, fontFamily: FONT }}>›</div>
          </div>
        </Row>

        <Row delay={52}>
          <div style={{ height: 230, border: `1px solid ${THEME.border}`, background: '#050A12', position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `linear-gradient(${THEME.cyan}14 1px, transparent 1px), linear-gradient(90deg, ${THEME.cyan}14 1px, transparent 1px)`,
                backgroundSize: '42px 42px',
              }}
            />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
              <div style={{ width: 22 + pulse * 30, height: 22 + pulse * 30, borderRadius: 999, background: `${THEME.orange}33`, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }} />
              <div style={{ width: 16, height: 16, borderRadius: 999, background: THEME.orange, border: '3px solid #fff', boxShadow: `0 0 20px ${THEME.orange}` }} />
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 12, fontFamily: FONT, fontSize: 11, color: THEME.orange, border: `1px solid ${THEME.orange}55`, background: '#000000aa', padding: '3px 8px' }}>
              LOKASI ANDA · GPS FIX
            </div>
          </div>
        </Row>

        <Row delay={62}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.orange, fontFamily: FONT, fontSize: 18 }}>
              ▤
            </div>
            <div style={{ flex: 1 }}>
              <Label>PROTOKOL TAKTIS</Label>
              <div style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 3 }}>
                Panduan Evakuasi Tsunami
              </div>
            </div>
            <div style={{ color: THEME.dimmer, fontFamily: FONT }}>›</div>
          </div>
        </Row>
      </div>
      <BottomDock active={0} />
    </div>
  );
};

export const ScreenNavigate: React.FC<{ alert?: boolean }> = ({ alert }) => {
  const frame = useCurrentFrame();
  const dash = -frame * 2.4;
  const pulse = 0.5 + Math.sin(frame / 7) * 0.5;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#050A12' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(#12203a 1px, transparent 1px), linear-gradient(90deg, #12203a 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
        }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 46, background: THEME.bg }} />

      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          border: `1px solid ${alert ? THEME.red : THEME.border}`,
          background: alert ? '#2A0A10' : '#0B0F19ee',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: 26, color: alert ? THEME.red : THEME.orange }}>⚠</div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 12, letterSpacing: 2, color: alert ? THEME.red : THEME.dim, fontWeight: 800 }}>
            {alert ? 'PERINGATAN DARURAT AKTIF' : 'RUTE EVAKUASI OPTIMAL'}
          </div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 800, color: '#fff' }}>
            {alert ? 'TSUNAMI // EVAKUASI SEKARANG' : 'Shelter TES · 1.2 km'}
          </div>
        </div>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 560 1150" style={{ position: 'absolute', inset: 0 }}>
        <path
          d="M120 880 C170 780 205 700 250 640 C300 570 340 520 400 430 C440 370 460 330 470 250"
          stroke={alert ? THEME.red : '#6366f1'}
          strokeWidth="10"
          fill="none"
          opacity="0.22"
        />
        <path
          d="M120 880 C170 780 205 700 250 640 C300 570 340 520 400 430 C440 370 460 330 470 250"
          stroke={alert ? THEME.red : '#818cf8'}
          strokeWidth="4"
          fill="none"
          strokeDasharray="16 10"
          strokeDashoffset={dash}
        />
        <circle cx="120" cy="880" r="16" fill={THEME.orange} stroke="#fff" strokeWidth="4" />
        <circle cx="470" cy="250" r="26" fill={THEME.green} opacity="0.2" />
        <circle cx="470" cy="250" r="12" fill={THEME.green} stroke="#fff" strokeWidth="3" />
      </svg>

      <div style={{ position: 'absolute', left: 30, top: 900, fontFamily: FONT, fontSize: 12, color: THEME.dim }}>
        ANDA
      </div>
      <div style={{ position: 'absolute', left: 372, top: 208, fontFamily: FONT, fontSize: 12, color: THEME.green }}>
        SHELTER
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 96,
          border: `1px solid ${THEME.border}`,
          background: '#0B0F19f2',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <Label color={THEME.orange}>TUJUAN EVAKUASI</Label>
            <div style={{ fontFamily: FONT_SANS, fontSize: 21, fontWeight: 800, color: '#fff' }}>Shelter TES Palu</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, color: THEME.green }}>1.2 KM</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: THEME.dim }}>≈ 15 menit jalan</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
          <div style={{ fontFamily: FONT, fontSize: 22, color: THEME.cyan }}>→</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, color: THEME.text }}>
            Belok kanan ke Jl. Pattimura <span style={{ color: THEME.dim }}>· 120 m</span>
          </div>
        </div>
      </div>
      <BottomDock active={1} alertNav={alert} />
    </div>
  );
};

export const ScreenRegister: React.FC = () => {
  const frame = useCurrentFrame();
  const cursor = Math.floor(frame / 9) % 2 === 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: THEME.bg, padding: '70px 26px' }}>
      <div style={{ fontFamily: FONT, fontSize: 13, letterSpacing: 3, color: THEME.orange, fontWeight: 800 }}>
        A.T.L.A.S // ONBOARDING PROTOCOL
      </div>
      <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginTop: 18 }}>
        REGISTRASI
        <br />
        PERSONEL
      </div>
      <div style={{ fontFamily: FONT_SANS, fontSize: 17, color: THEME.dim, marginTop: 14, lineHeight: 1.5 }}>
        1 perangkat = 1 identitas resmi permanen.
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 34 }}>
        {['WNI', 'WNA'].map((c, i) => (
          <div
            key={c}
            style={{
              flex: 1,
              padding: '14px 0',
              textAlign: 'center',
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 800,
              color: i === 0 ? '#000' : THEME.dim,
              background: i === 0 ? THEME.orange : THEME.panel,
              border: `1px solid ${i === 0 ? THEME.orange : THEME.border}`,
            }}
          >
            {c}
          </div>
        ))}
      </div>

      {[
        { label: 'NAMA LENGKAP', value: 'RAFI AHMAD', delay: 14 },
        { label: 'NIK', value: '7271 02 5504 0001', delay: 24 },
      ].map((f) => (
        <Row key={f.label} delay={f.delay} style={{ marginTop: 26 }}>
          <Label>{f.label}</Label>
          <div
            style={{
              marginTop: 8,
              border: `1px solid ${THEME.border}`,
              background: THEME.panel,
              padding: '16px 16px',
              fontFamily: FONT,
              fontSize: 20,
              color: '#fff',
              letterSpacing: 1,
            }}
          >
            {f.value}
            <span style={{ color: THEME.orange, opacity: cursor ? 1 : 0 }}>|</span>
          </div>
        </Row>
      ))}

      <Row delay={40} style={{ marginTop: 34 }}>
        <div
          style={{
            padding: '20px 0',
            textAlign: 'center',
            background: THEME.orange,
            color: '#000',
            fontFamily: FONT,
            fontSize: 19,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: `0 0 45px ${THEME.orange}55`,
          }}
        >
          KONFIRMASI IDENTITAS
        </div>
      </Row>

      <Row delay={52} style={{ marginTop: 26 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {['GPS AKTIF OTOMATIS', 'NIK TERVERIFIKASI'].map((b) => (
            <div key={b} style={{ flex: 1, border: `1px solid ${THEME.green}44`, background: `${THEME.green}10`, padding: '12px 10px', fontFamily: FONT, fontSize: 12, fontWeight: 800, color: THEME.green, textAlign: 'center' }}>
              ✓ {b}
            </div>
          ))}
        </div>
      </Row>

      <Row delay={62} style={{ marginTop: 30 }}>
        <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 18 }}>
          <Label color={THEME.cyan}>PERANGKAT TERDETEKSI</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontFamily: FONT, fontSize: 16, color: '#fff' }}>Android · Chrome</div>
            <div style={{ fontFamily: FONT, fontSize: 16, color: THEME.dim }}>192.168.1.24</div>
          </div>
          <div style={{ marginTop: 14, borderTop: `1px solid ${THEME.border}`, paddingTop: 14, fontFamily: FONT_SANS, fontSize: 14, color: THEME.dim, lineHeight: 1.5 }}>
            Identitas ini bersifat permanen dan hanya bisa dipakai pada perangkat ini.
          </div>
        </div>
      </Row>

      <Row delay={72} style={{ marginTop: 24 }}>
        <div style={{ color: THEME.dimmer, fontFamily: FONT, fontSize: 12, textAlign: 'center', letterSpacing: 2 }}>
          A.T.L.A.S // SECURE ENROLLMENT v1.0.3
        </div>
      </Row>
    </div>
  );
};

export const ScreenFamily: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + Math.sin(frame / 10) * 0.5;
  return (
    <div style={{ position: 'absolute', inset: 0, background: THEME.bg }}>
      <AppHeader location="UNIT KELUARGA · PALU" node="NODE-P417" />
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row delay={6}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 110, height: 110, background: '#fff', padding: 8 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `conic-gradient(#000 25%, #fff 0 50%, #000 0 75%, #fff 0)`,
                  backgroundSize: '22px 22px',
                  opacity: 0.85,
                }}
              />
            </div>
            <div>
              <Label color={THEME.cyan}>QR UNDANGAN UNIT</Label>
              <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 6, lineHeight: 1.35 }}>
                Pindai untuk tautkan
                <br />
                anggota keluarga
              </div>
            </div>
          </div>
        </Row>

        {[
          { name: 'SITI NURHALIZA', status: 'SECURE // AMAN', color: THEME.green, delay: 18 },
          { name: 'BUDI SANTOSO', status: 'SECURE // AMAN', color: THEME.green, delay: 26 },
          { name: 'DEWI LESTARI', status: 'MENUJU SHELTER', color: THEME.amber, delay: 34 },
        ].map((m) => (
          <Row key={m.name} delay={m.delay}>
            <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 24, border: `2px solid ${m.color}66`, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 17, fontWeight: 900, color: m.color }}>
                {m.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: m.color, marginTop: 4, letterSpacing: 1 }}>{m.status}</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: m.color, opacity: 0.4 + pulse * 0.6 }} />
            </div>
          </Row>
        ))}

        <Row delay={44}>
          <div style={{ border: `1px dashed ${THEME.cyan}55`, background: `${THEME.cyan}0d`, padding: 18, textAlign: 'center', fontFamily: FONT, fontSize: 15, fontWeight: 800, color: THEME.cyan, letterSpacing: 1 }}>
            + TAMBAH ANGGOTA VIA QR
          </div>
        </Row>
      </div>
      <BottomDock active={2} />
    </div>
  );
};

export const ScreenGuides: React.FC = () => {
  const frame = useCurrentFrame();
  const arrow = Math.sin(frame / 8) * 4;
  return (
    <div style={{ position: 'absolute', inset: 0, background: THEME.bg }}>
      <AppHeader location="PANDUAN TAKTIS · DIREKTIF" node="NODE-P417" />
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Row delay={6}>
          <div style={{ border: `1px solid ${THEME.red}66`, background: '#12070A', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Label color={THEME.red}>DIRECTIVE 01 · TSUNAMI HAZARD</Label>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 900, color: '#000', background: THEME.red, padding: '3px 8px' }}>DEFCON 1</div>
            </div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 25, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Tsunami & Gelombang Laut Raksasa
            </div>
            <div style={{ marginTop: 14, borderLeft: `3px solid ${THEME.red}`, paddingLeft: 12, fontFamily: FONT, fontSize: 14, lineHeight: 1.5, color: THEME.yellow, fontWeight: 700 }}>
              JAUHI GARIS PANTAI · ELEVASI ≥ 20 M
            </div>
          </div>
        </Row>

        {[
          { n: '01', t: 'KENALI TANDA ALAM', d: 'Air surut drastis, bau belerang, suara gemuruh' },
          { n: '02', t: 'EVAKUASI JALAN KAKI', d: 'Jangan pakai kendaraan — macet total' },
          { n: '03', t: 'BERTAHAN DI KETINGGIAN', d: 'Minimal 2 jam setelah gelombang pertama' },
        ].map((s, i) => (
          <Row key={s.n} delay={18 + i * 10}>
            <div style={{ display: 'flex', gap: 14, border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 16 }}>
              <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 900, color: THEME.orange, width: 42 }}>{s.n}</div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{s.t}</div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 14, color: THEME.dim, marginTop: 4, lineHeight: 1.4 }}>{s.d}</div>
              </div>
            </div>
          </Row>
        ))}

        <Row delay={52}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: THEME.cyan, transform: `translateY(${arrow}px)` }}>
              ▼ 4 DIREKTIF LAINNYA
            </div>
          </div>
        </Row>
      </div>
      <BottomDock active={3} />
    </div>
  );
};

export const ScreenMenu: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: THEME.bg }}>
    <AppHeader location="PUSAT KENDALI · MENU" node="NODE-P417" />
    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { icon: '◐', t: 'TAMPILAN', d: 'Kontras, buta warna, ukuran font', color: THEME.orange, delay: 6 },
        { icon: '▲', t: 'NOTIFIKASI', d: 'EEW, gempa, tsunami, cuaca ekstrem', color: THEME.cyan, delay: 14 },
        { icon: '●', t: 'RIWAYAT NAVIGASI', d: 'Log rute evakuasi real & simulasi', color: THEME.green, delay: 22 },
        { icon: '◎', t: 'KALIBRASI KOMPAS', d: 'Gerakan angka-8 berbasis sensor', color: THEME.amber, delay: 30 },
        { icon: '✦', t: 'WARTA A.T.L.A.S', d: 'Pembaruan sistem v1.0.3', color: THEME.red, delay: 38 },
        { icon: 'ⓘ', t: 'LISENSI & PRIVASI', d: 'Ketentuan layanan dan data', color: THEME.dim, delay: 46 },
      ].map((m) => (
        <Row key={m.t} delay={m.delay}>
          <div style={{ border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, border: `1px solid ${m.color}55`, background: `${m.color}12`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {m.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{m.t}</div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: THEME.dim, marginTop: 3 }}>{m.d}</div>
            </div>
            <div style={{ fontFamily: FONT, color: THEME.dimmer }}>›</div>
          </div>
        </Row>
      ))}
    </div>
    <BottomDock active={4} />
  </div>
);

export const ScreenAlertFull: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + Math.sin(frame / 6) * 0.5;
  return (
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, #3A0710 0%, ${THEME.bg} 78%)`, padding: '90px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: THEME.red, opacity: pulse }} />
        <div style={{ fontFamily: FONT, fontSize: 14, letterSpacing: 4, color: THEME.red, fontWeight: 900 }}>
          A.T.L.A.S // EMERGENCY BROADCAST
        </div>
      </div>

      <div style={{ fontFamily: FONT, fontSize: 82, fontWeight: 900, color: '#fff', lineHeight: 0.98, marginTop: 30 }}>
        PERINGATAN
        <br />
        <span style={{ color: THEME.red }}>TSUNAMI</span>
      </div>

      <div style={{ marginTop: 22, border: `2px solid ${THEME.red}`, background: `${THEME.red}12`, padding: 20 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, letterSpacing: 2, color: THEME.red, fontWeight: 900 }}>DEFCON 1 · SIRENE AKTIF</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 20, color: '#fff', marginTop: 10, lineHeight: 1.5 }}>
          Gempa 7.4 SR terdeteksi. Potensi tsunami. Segera evakuasi ke elevasi ≥ 20 m atau Shelter TES terdekat.
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {[
          ['JANGAN', 'menunggu sirene jika gempa terasa > 20 detik'],
          ['JANGAN', 'kembali ke pantai untuk menonton'],
          ['JANGAN', 'evakuasi dengan kendaraan'],
        ].map(([a, b], i) => (
          <Row key={b} delay={16 + i * 8} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 900, color: '#000', background: THEME.yellow, padding: '3px 8px', height: 24 }}>{a}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 15, color: THEME.dim, flex: 1 }}>{b}</div>
          </Row>
        ))}
      </div>

      <Row delay={46} style={{ marginTop: 18 }}>
        <div style={{ background: THEME.red, color: '#fff', padding: '22px 0', textAlign: 'center', fontFamily: FONT, fontSize: 20, fontWeight: 900, letterSpacing: 2, boxShadow: `0 0 ${30 + pulse * 40}px ${THEME.red}88` }}>
          LIHAT RUTE EVAKUASI →
        </div>
      </Row>

      <Row delay={58} style={{ marginTop: 18, display: 'flex', gap: 12 }}>
        {['GPS TRACKING ON', 'SIRENE + GETAR', 'NOTIF PUSH'].map((b) => (
          <div key={b} style={{ flex: 1, border: `1px solid ${THEME.border}`, background: THEME.panel, padding: '10px 6px', textAlign: 'center', fontFamily: FONT, fontSize: 11, fontWeight: 800, color: THEME.dim }}>
            {b}
          </div>
        ))}
      </Row>
    </div>
  );
};
