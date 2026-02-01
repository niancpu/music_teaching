/**
 * IntroOverlay - Reusable intro animation component
 * Provides fade-in and scale-up entrance animation
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface IntroOverlayProps {
  /** Duration of intro animation in frames (default: 30) */
  durationInFrames?: number;
  /** Whether to show a background overlay during intro */
  showBackground?: boolean;
  /** Background color for the overlay */
  backgroundColor?: string;
  /** Children to animate */
  children: React.ReactNode;
}

/**
 * Wraps children with a spring-based intro animation
 * Provides scale and opacity animation from center
 */
export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  durationInFrames = 30,
  showBackground = false,
  backgroundColor = "#000000",
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation for smooth entrance
  const introProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
    durationInFrames,
  });

  // Scale from 0.8 to 1
  const scale = interpolate(introProgress, [0, 1], [0.8, 1]);

  // Opacity from 0 to 1
  const opacity = interpolate(introProgress, [0, 1], [0, 1]);

  // Background opacity fades out
  const bgOpacity = showBackground
    ? interpolate(frame, [0, durationInFrames], [1, 0], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <>
      {showBackground && bgOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor,
            opacity: bgOpacity,
            zIndex: 100,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {children}
      </AbsoluteFill>
    </>
  );
};

/**
 * Hook to get intro animation values for custom implementations
 */
export function useIntroAnimation(durationInFrames: number = 30) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
    durationInFrames,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const rotation = interpolate(progress, [0, 1], [-10, 0]);

  return {
    progress,
    scale,
    opacity,
    rotation,
    isComplete: frame >= durationInFrames,
  };
}
