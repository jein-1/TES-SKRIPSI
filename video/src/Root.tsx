import React from 'react';
import { Composition } from 'remotion';
import { AtlasPromo, TOTAL_FRAMES } from './AtlasPromo';
import { W, H, FPS } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AtlasPromo"
      component={AtlasPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
