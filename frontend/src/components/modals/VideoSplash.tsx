import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isAdmin?: boolean;
  onFinish: () => void;
}

export const VideoSplash: React.FC<Props> = ({ isAdmin = false, onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const finishCalledRef = useRef(false);

  const videoSrc = isAdmin ? '/splash-admin.mp4' : '/splash-public.mp4';
  const darkPoster =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%2307090E'/%3E%3C/svg%3E";

  const triggerFinish = () => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onFinish();
    }, 350);
  };

  useEffect(() => {
    // Hide native Capacitor splash as soon as component mounts
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => {
        SplashScreen.hide().catch(() => {});
      })
      .catch(() => {});

    // Safety timeout: max 5.5s in case video stalls or fails to load
    const timer = setTimeout(() => {
      triggerFinish();
    }, 5500);

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');
      video.setAttribute('playsinline', 'true');

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('[VideoSplash] Autoplay blocked, triggering fallback finish:', err);
            setTimeout(triggerFinish, 600);
          });
      }
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999999] bg-[#07090E] flex flex-col items-center justify-center transition-opacity duration-350 select-none overflow-hidden ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#07090E]">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={darkPoster}
          autoPlay
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          onPlaying={() => setIsPlaying(true)}
          onEnded={triggerFinish}
          onError={triggerFinish}
          className={`w-full h-full object-contain max-w-full max-h-full transition-opacity duration-300 pointer-events-none select-none bg-[#07090E] ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            outline: 'none',
            border: 'none',
            backgroundColor: '#07090E',
          }}
        />
      </div>
    </div>
  );
};
