/**
 * OutroOverlay - Reusable outro animation component
 * Provides fade-out and scale-down exit animation
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface OutroOverlayProps {
  /** Duration of outro animation in frames (default: 30) */
  durationInFrames?: number;
  /** Whether to show a background overlay during outro */
  showBackground?: boolean;
  /** Background color for the overlay */
  backgroundColor?: string;
  /** Children to animate */
  children: React.ReactNode;
}

/**
 * Wraps children with a spring-based outro animation
 * Provides scale and opacity animation towards center
 */
export const OutroOverlay: React.FC<OutroOverlayProps> = ({
  durationInFrames = 30,
  showBackground = false,
  backgroundColor = "#000000",
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();

  const outroStart = totalDuration - durationInFrames;
  const isInOutro = frame >= outroStart;

  // Spring animation for smooth exit (starts at outro)
  const outroProgress = isInOutro
    ? spring({
        frame: frame - outroStart,
        fps,
        config: {
          damping: 200,
          stiffness: 100,
          mass: 1,
        },
        durationInFrames,
      })
    : 0;

  // Scale from 1 to 0.8
  const scale = interpolate(outroProgress, [0, 1], [1, 0.8]);

  // Opacity from 1 to 0
  const opacity = interpolate(outroProgress, [0, 1], [1, 0]);

  // Background opacity fades in
  const bgOpacity = showBackground
    ? interpolate(outroProgress, [0, 1], [0, 1])
    : 0;

  return (
    <>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
      {showBackground && bgOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor,
            opacity: bgOpacity,
            zIndex: 100,
          }}
        />
      )}
    </>
  );
};

/**
 * Hook to get outro animation values for custom implementations
 */
export function useOutroAnimation(durationInFrames: number = 30) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();

  const outroStart = totalDuration - durationInFrames;
  const isInOutro = frame >= outroStart;

  const progress = isInOutro
    ? spring({
        frame: frame - outroStart,
        fps,
        config: {
          damping: 200,
          stiffness: 100,
          mass: 1,
        },
        durationInFrames,
      })
    : 0;

  const scale = interpolate(progress, [0, 1], [1, 0.8]);
  const opacity = interpolate(progress, [0, 1], [1, 0]);
  const rotation = interpolate(progress, [0, 1], [0, 10]);

  return {
    progress,
    scale,
    opacity,
    rotation,
    isInOutro,
    outroStart,
  };
}

/**
 * Combined hook for both intro and outro animations
 */
export function useIntroOutroAnimation(
  introDuration: number = 30,
  outroDuration: number = 30
) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();

  // Intro animation
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: introDuration,
  });

  // Outro animation
  const outroStart = totalDuration - outroDuration;
  const isInOutro = frame >= outroStart;
  const outroProgress = isInOutro
    ? spring({
        frame: frame - outroStart,
        fps,
        config: { damping: 200 },
        durationInFrames: outroDuration,
      })
    : 0;

  // Combined scale: intro scales up, outro scales down
  const introScale = interpolate(introProgress, [0, 1], [0.8, 1]);
  const outroScale = interpolate(outroProgress, [0, 1], [1, 0.8]);
  const scale = introScale * outroScale;

  // Combined opacity
  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);
  const outroOpacity = interpolate(outroProgress, [0, 1], [1, 0]);
  const opacity = introOpacity * outroOpacity;

  return {
    scale,
    opacity,
    introProgress,
    outroProgress,
    isInOutro,
  };
}
