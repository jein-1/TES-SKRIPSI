import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { THEME, FONT, FONT_SANS } from '../theme';
import { GridBackground, CornerBrackets, ScanLine, Kicker, Headline, Body, fadeIn, fadeOut } from '../components/Atoms';

export const KineticBold: React.FC<{
  words: string[];
  delay?: number;
  size?: number;
  accent?: string;
  align?: 'left' | 'center';
}> = ({ words, delay = 0, size = 92, accent = THEME.orange, align = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: align }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * 6, fps, config: { damping: 15, mass: 0.7 } });
        const isAccent = w.startsWith('*');
        const text = isAccent ? w.slice(1) : w;
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontSize: size,
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: -3,
              color: isAccent ? accent : '#fff',
              opacity: s,
              transform: `translateX(${(1 - s) * (align === 'center' ? 0 : -60)}px) translateY(${(1 - s) * 24}px)`,
              textShadow: isAccent ? `0 0 60px ${accent}66` : 'none',
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

export const FeatureScene: React.FC<{
  duration: number;
  kicker: string;
  kickerColor?: string;
  lines: string[];
  screen: React.ReactNode;
  accent?: string;
  bullets?: { icon: string; text: string }[];
  phoneTilt?: number;
}> = ({ duration, kicker, kickerColor = THEME.orange, lines, screen, accent = THEME.orange, bullets, phoneTilt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: frame - 12, fps, config: { damping: 18, mass: 0.9 } });
  const scroll = interpolate(frame, [0, duration], [0, -34], { easing: Easing.out(Easing.quad) });
  const push = interpolate(frame, [0, duration], [1, 1.035], { extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn(frame, 0, 14), fadeOut(frame, duration, 14));

  return (
    <AbsoluteFill style={{ background: THEME.bg, opacity }}>
      <GridBackground accent={accent} intensity={0.05} />

      <div style={{ position: 'absolute', top: 96, left: 66, right: 66, transform: `translateY(${scroll}px)` }}>
        <Kicker color={kickerColor} delay={4}>
          {kicker}
        </Kicker>
        <div style={{ marginTop: 26 }}>
          <Headline lines={lines} delay={10} size={76} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 372,
          transform: `translateX(-50%) perspective(1900px) rotateY(${phoneTilt}deg) scale(${(0.95 + s * 0.05) * push}) translateY(${(1 - s) * 26}px)`,
          opacity: s,
        }}
      >
        <div
          style={{
            width: 600,
            height: 1230,
            borderRadius: 56,
            padding: 13,
            background: 'linear-gradient(160deg, #1b2434 0%, #0a0f19 55%, #151d2b 100%)',
            boxShadow: `0 50px 130px rgba(0,0,0,0.9), 0 0 0 2px rgba(255,255,255,0.07), 0 0 110px ${accent}40`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 44,
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
                width: 128,
                height: 26,
                borderRadius: 20,
                background: '#000',
                zIndex: 50,
              }}
            />
            <div style={{ position: 'absolute', inset: 0, transform: 'scale(1)' }}>{screen}</div>
          </div>
        </div>
      </div>

      {bullets && (
        <div
          style={{
            position: 'absolute',
            left: 66,
            right: 66,
            bottom: 92,
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {bullets.map((b, i) => {
            const bs = spring({ frame: frame - 30 - i * 7, fps, config: { damping: 20 } });
            return (
              <div
                key={b.text}
                style={{
                  flex: 1,
                  border: `1px solid ${accent}44`,
                  background: `${accent}0e`,
                  padding: '14px 12px',
                  textAlign: 'center',
                  opacity: bs,
                  transform: `translateY(${(1 - bs) * 20}px)`,
                }}
              >
                <div style={{ fontSize: 20, color: accent, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: THEME.text, letterSpacing: 1 }}>
                  {b.text}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CornerBrackets color={accent} inset={34} size={54} />
    </AbsoluteFill>
  );
};

export const ZoomScreen: React.FC<{
  duration: number;
  kicker: string;
  kickerColor?: string;
  lines: string[];
  screen: React.ReactNode;
  accent?: string;
  caption?: string;
  scale?: number;
  offsetY?: number;
}> = ({ duration, kicker, kickerColor = THEME.orange, lines, screen, accent = THEME.orange, caption, scale = 1.62, offsetY = 60 }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, duration], [scale, scale + 0.1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const opacity = Math.min(fadeIn(frame, 0, 14), fadeOut(frame, duration, 14));

  return (
    <AbsoluteFill style={{ background: THEME.bg, opacity, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 560,
          height: 1150,
          transform: `translate(-50%, -50%) translateY(${offsetY}px) scale(${zoom})`,
          overflow: 'hidden',
          borderRadius: 20,
        }}
      >
        <div style={{ width: 560, height: 1150, position: 'relative' }}>{screen}</div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, ${THEME.bg}F2 0%, ${THEME.bg}66 26%, transparent 44%, transparent 62%, ${THEME.bg}E8 86%, ${THEME.bg} 100%)`,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, transparent 40%, ${THEME.bg}bb 100%)` }} />

      <div style={{ position: 'absolute', top: 110, left: 70, right: 70 }}>
        <Kicker color={kickerColor} delay={2}>
          {kicker}
        </Kicker>
        <div style={{ marginTop: 24 }}>
          <Headline lines={lines} delay={8} size={84} />
        </div>
      </div>

      {caption && (
        <div style={{ position: 'absolute', bottom: 130, left: 70, right: 70 }}>
          <Body delay={26} size={32} align="center" maxWidth={900} color={THEME.text}>
            {caption}
          </Body>
        </div>
      )}
      <CornerBrackets color={accent} inset={34} size={54} />
      <ScanLine />
    </AbsoluteFill>
  );
};
