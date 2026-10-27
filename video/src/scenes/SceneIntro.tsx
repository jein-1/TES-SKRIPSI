import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, staticFile } from 'remotion';
import { THEME, FONT, FONT_SANS } from '../theme';
import { GridBackground, CornerBrackets, ScanLine } from '../components/Atoms';

export const SceneIntro: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame: frame - 8, fps, config: { damping: 14, mass: 0.9 } });
  const ring = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const titleIn = spring({ frame: frame - 26, fps, config: { damping: 18 } });
  const subIn = spring({ frame: frame - 40, fps, config: { damping: 20 } });
  const lineW = interpolate(frame, [30, 70], [0, 560], { extrapolateRight: 'clamp' });
  const pulse = 0.5 + Math.sin(frame / 9) * 0.5;

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <GridBackground />
      <CornerBrackets />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: '50%',
            border: `2px solid ${THEME.orange}`,
            opacity: 0.12 + pulse * 0.1,
            transform: `scale(${0.8 + ring * 0.2 + pulse * 0.03})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 470,
            height: 470,
            borderRadius: '50%',
            border: `1.5px dashed ${THEME.cyan}`,
            opacity: 0.15,
            transform: `rotate(${frame * 0.25}deg)`,
          }}
        />

        <div
          style={{
            opacity: logoIn,
            transform: `scale(${0.7 + logoIn * 0.3}) translateY(${(1 - logoIn) * 40}px)`,
            filter: `drop-shadow(0 0 70px ${THEME.orange}aa)`,
            marginBottom: 34,
          }}
        >
          <img src={staticFile('atlas-logo-user.png')} style={{ width: 330, height: 330, objectFit: 'contain' }} />
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 108,
            fontWeight: 900,
            letterSpacing: 12,
            color: '#fff',
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 30}px)`,
            textShadow: `0 0 46px ${THEME.orange}66`,
          }}
        >
          A.T.L.A.S
          <span style={{ color: THEME.orange, marginLeft: 16 }}>//</span>
        </div>

        <div
          style={{
            height: 3,
            width: lineW,
            background: `linear-gradient(90deg, transparent, ${THEME.orange}, transparent)`,
            margin: '26px 0 22px',
          }}
        />

        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 32,
            color: THEME.dim,
            letterSpacing: 1,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 20}px)`,
            width: 760,
            textAlign: 'center',
            lineHeight: 1.45,
          }}
        >
          Sistem Otonom Pemetaan Ancaman Bahaya
          <br />
          dan Peringatan Darurat
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 14,
            opacity: subIn,
            fontFamily: FONT,
            fontSize: 22,
            letterSpacing: 3,
            color: THEME.cyan,
          }}
        >
          <span style={{ padding: '8px 18px', border: `1px solid ${THEME.cyan}55`, background: `${THEME.cyan}12` }}>
            REAL-TIME
          </span>
          <span style={{ padding: '8px 18px', border: `1px solid ${THEME.green}55`, background: `${THEME.green}12`, color: THEME.green }}>
            OFFLINE-READY
          </span>
        </div>
      </AbsoluteFill>
      <ScanLine />
    </AbsoluteFill>
  );
};
