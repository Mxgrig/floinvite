/**
 * LoopingVideo Component
 * Displays a video that loops continuously
 * Used as background on login page
 * Supports fallback to solid color if video unavailable
 */

import { useEffect, useRef } from 'react';

interface LoopingVideoProps {
  source: string;
  fallbackColor?: string;
  muted?: boolean;
  autoplay?: boolean;
}

export function LoopingVideo({
  source,
  fallbackColor = '#f0f0f0',
  muted = true,
  autoplay = true
}: LoopingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video loops continuously
    const handleEnded = () => {
      // Reset to beginning when video ends
      video.currentTime = 0;
      video.play().catch(err => {
        console.warn('Video autoplay prevented:', err);
      });
    };

    // Handle loop completion
    video.addEventListener('ended', handleEnded);

    // Attempt autoplay with error handling
    if (autoplay) {
      video.play().catch(err => {
        console.warn('Autoplay failed (may be blocked by browser):', err);
      });
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [autoplay]);

  return (
    <video
      ref={videoRef}
      className="looping-video"
      muted={muted}
      autoPlay={autoplay}
      playsInline
      style={{
        fallback: fallbackColor
      }}
    >
      <source src={source} type="video/mp4" />
      {/* Fallback for browsers that don't support video */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: fallbackColor,
          zIndex: -1
        }}
      />
    </video>
  );
}
