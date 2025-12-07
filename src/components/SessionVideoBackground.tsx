/**
 * SessionVideoBackground Component
 * Displays a background video for authenticated/session pages
 * Used on dashboard, logbook, settings, etc.
 * Sits behind all page content
 */

import { LoopingVideo } from './LoopingVideo';

interface SessionVideoBackgroundProps {
  // Optional: can accept custom video source if needed
  source?: string;
}

export function SessionVideoBackground({ source = '/sessionlogin.mp4' }: SessionVideoBackgroundProps) {
  return (
    <div className="session-video-background-wrapper">
      <LoopingVideo source={source} fallbackColor="#ffffff" />
    </div>
  );
}
