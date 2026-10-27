import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from 'remotion';
import { THEME, FONT, FONT_SANS, W, H } from '../theme';

export const fadeIn = (frame: number, start = 0, dur = 20) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const fadeOut = (frame: number, total: number, dur = 18) =>
  interpolate(frame, [total - dur, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const SceneShell: React.FC<{
  duration: number;
  children: React.ReactNode;
  bg?: string;
}> = ({ duration, children, bg }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(fadeIn(frame, 0, 16), fadeOut(frame, duration, 16));
  return (
    <AbsoluteFill style={{ background: bg ?? THEME.bg, opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const GridBackground: React.FC<{ accent?: string; intensity?: number }> = ({
  accent = THEME.orange,
  intensity = 0.06,
}) => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.35) % 90;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${drift}px`,
          opacity: intensity * 6,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, ${accent}1a 0%, transparent 58%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 30%, ${THEME.bg} 88%)`,
        }}
      />
      <ScanLine />
    </AbsoluteFill>
  );
};

export const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const y = ((frame * 6) % (H + 300)) - 150;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        height: 140,
        background: `linear-gradient(to bottom, transparent, ${THEME.orange}0d, transparent)`,
        pointerEvents: 'none',
      }}
    />
  );
};

export const CornerBrackets: React.FC<{ color?: string; inset?: number; size?: number }> = ({
  color = THEME.orange,
  inset = 44,
  size = 70,
}) => {
  const common: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
    opacity: 0.55,
  };
  return (
    <>
      <div style={{ ...common, left: inset, top: inset, borderLeft: `2px solid`, borderTop: `2px solid` }} />
      <div style={{ ...common, right: inset, top: inset, borderRight: '2px solid', borderTop: '2px solid' }} />
      <div style={{ ...common, left: inset, bottom: inset, borderLeft: '2px solid', borderBottom: '2px solid' }} />
      <div style={{ ...common, right: inset, bottom: inset, borderRight: '2px solid', borderBottom: '2px solid' }} />
    </>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = THEME.orange,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 22px',
        border: `1.5px solid ${color}55`,
        background: `${color}14`,
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: 5,
        color,
        textTransform: 'uppercase',
        opacity: s,
        transform: `translateY(${(1 - s) * 20}px)`,
      }}
    >
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
      {children}
    </div>
  );
};

export const Headline: React.FC<{
  lines: string[];
  delay?: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center';
}> = ({ lines, delay = 0, size = 96, color = '#fff', align = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ textAlign: align, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - delay - i * 7, fps, config: { damping: 16, mass: 0.8 } });
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontSize: size,
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: -2,
              color,
              opacity: s,
              transform: `translateY(${(1 - s) * 46}px)`,
              textTransform: 'uppercase',
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const Body: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center';
  maxWidth?: number;
}> = ({ children, delay = 0, size = 34, color = THEME.dim, align = 'left', maxWidth = 820 }) => {
  const frame = useCurrentFrame();
  const o = fadeIn(frame, delay, 24);
  return (
    <div
      style={{
        fontFamily: FONT_SANS,
        fontSize: size,
        lineHeight: 1.5,
        color,
        opacity: o,
        transform: `translateY(${(1 - o) * 18}px)`,
        textAlign: align,
        maxWidth,
      }}
    >
      {children}
    </div>
  );
};

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  tilt?: number;
  glow?: string;
  style?: React.CSSProperties;
}> = ({ children, width = 560, height = 1150, tilt = 0, glow = THEME.orange, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, mass: 0.9 } });
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 54,
        padding: 14,
        background: 'linear-gradient(160deg, #1b2434 0%, #0a0f19 55%, #151d2b 100%)',
        boxShadow: `0 40px 120px rgba(0,0,0,0.85), 0 0 0 2px rgba(255,255,255,0.07), 0 0 90px ${glow}33`,
        transform: `perspective(1600px) rotateY(${tilt}deg) scale(${0.94 + s * 0.06}) translateY(${(1 - s) * 40}px)`,
        opacity: s,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 42,
          overflow: 'hidden',
          background: THEME.bg,
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 132,
            height: 26,
            borderRadius: 20,
            background: '#000',
            zIndex: 50,
          }}
        />
        {children}
      </div>
    </div>
  );
};

export const AppHeader: React.FC<{ location: string; node?: string; accent?: string }> = ({
  location,
  node = 'NODE-P417',
  accent = THEME.orange,
}) => (
  <div
    style={{
      padding: '46px 24px 16px',
      borderBottom: `1px solid ${THEME.border}`,
      background: '#0B0F19',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <img src={staticFile('atlas-logo-user.png')} style={{ width: 46, height: 46, objectFit: 'contain' }} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
          <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 900, letterSpacing: 4, color: accent }}>
            A.T.L.A.S //
          </span>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 4 }}>{location}</div>
      </div>
    </div>
    <div
      style={{
        padding: '6px 12px',
        border: `1px solid ${THEME.border}`,
        background: '#00000099',
        fontFamily: FONT,
        textAlign: 'right',
      }}
    >
      <div style={{ fontSize: 11, color: THEME.dimmer, letterSpacing: 2 }}>NODE</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: THEME.cyan }}>{node}</div>
    </div>
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  delay?: number;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, accent = THEME.border, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        padding: 20,
        border: `1px solid ${accent}`,
        background: THEME.panel,
        opacity: s,
        transform: `translateY(${(1 - s) * 26}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const BottomDock: React.FC<{ active: number; alertNav?: boolean }> = ({ active, alertNav }) => {
  const items = ['STATUS', 'NAVIGASI', 'UNIT', 'PANDUAN', 'MENU'];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 88,
        borderTop: `1px solid ${THEME.border}`,
        background: '#07090EF2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 8,
      }}
    >
      {items.map((label, i) => {
        const isActive = i === active;
        const isAlert = alertNav && i === 1;
        const color = isAlert ? THEME.red : isActive ? THEME.orange : THEME.dimmer;
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: isActive ? 22 : 14,
                height: isActive ? 22 : 14,
                borderRadius: 4,
                border: `2px solid ${color}`,
                background: isActive ? `${color}44` : 'transparent',
              }}
            />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1, color }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};
