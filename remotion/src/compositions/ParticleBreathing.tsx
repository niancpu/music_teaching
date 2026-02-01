/**
 * Circular Audio Visualizer - Spectrum Ring
 * Features:
 * - Single ring with outward-extending spectrum bars (fixed positions, no rotation)
 * - Spectrum bars represent frequency data: low frequencies at top, wrapping around
 * - Like a traditional spectrum analyzer bent into a circle
 * - Clean interior with only center timer
 * - 4-color gradient (cyan -> blue -> purple -> pink)
 * - Neon glow effects
 * - Beat-responsive scaling
 */
import React, { useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
  spring,
  interpolate,
  interpolateColors,
} from "remotion";
import { AudioAnalysisData, VisualizationProps, COLOR_SCHEMES } from "../types/audio-data";
import { extractFrequencyBands, detectBeat } from "../utils/animation";

interface ParticleBreathingProps extends VisualizationProps {
  data: AudioAnalysisData;
}

// Custom gradient colors for this visualizer
const GRADIENT_COLORS = {
  cyan: "#00FFFF",
  blue: "#0080FF",
  purple: "#8000FF",
  pink: "#FF00FF",
  background: "#0a0a12",
};

// Smooth value using exponential moving average
function smoothValue(current: number, target: number, smoothing: number = 0.15): number {
  return current + (target - current) * smoothing;
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const ParticleBreathing: React.FC<ParticleBreathingProps> = ({
  data,
  audioSrc,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // Refs for smooth animation
  const prevAmplitudeRef = useRef(0);
  const beatPulseRef = useRef(0);
  const smoothedSpectrumRef = useRef<number[]>(new Array(128).fill(0));

  // Get current frame data
  const frameIndex = Math.min(frame, data.frames.length - 1);
  const frameData = data.frames[frameIndex];

  // Default values if no frame data
  const amplitude = frameData?.amplitude || 0;
  const spectrum = frameData?.spectrum || new Array(128).fill(0);

  // Extract frequency bands
  const bands = extractFrequencyBands(spectrum);

  // Beat detection
  const isBeat = detectBeat(amplitude, prevAmplitudeRef.current, 0.12, 0.3);
  if (isBeat) {
    beatPulseRef.current = 1;
  } else {
    beatPulseRef.current *= 0.85;
  }
  prevAmplitudeRef.current = amplitude;

  // Intro animation
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 45,
  });

  // Outro animation
  const outroStart = durationInFrames - 30;
  const outroProgress =
    frame >= outroStart
      ? spring({
          frame: frame - outroStart,
          fps,
          config: { damping: 200 },
          durationInFrames: 30,
        })
      : 0;

  // Combined scale and opacity
  const introScale = interpolate(introProgress, [0, 1], [0.5, 1]);
  const outroScale = interpolate(outroProgress, [0, 1], [1, 0.5]);
  const baseScale = introScale * outroScale;

  // Beat scale effect
  const beatScale = 1 + beatPulseRef.current * 0.04;
  const totalScale = baseScale * beatScale;

  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);
  const outroOpacity = interpolate(outroProgress, [0, 1], [1, 0]);
  const opacity = introOpacity * outroOpacity;

  // Center of canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Ring dimensions - single ring
  const ringRadius = Math.min(width, height) * 0.28;
  const maxBarLength = Math.min(width, height) * 0.18;

  // Progress calculation (0 to 1)
  const progress = frame / durationInFrames;
  const progressCircumference = 2 * Math.PI * ringRadius;
  const progressOffset = progressCircumference * (1 - progress);

  // Current time in seconds
  const currentTime = frame / fps;
  const timeDisplay = formatTime(currentTime);

  // Number of spectrum bars - more bars for finer frequency detail
  const numBars = 128;
  const barAngleStep = (2 * Math.PI) / numBars;
  const barGap = 0.3; // Small gap between bars (in degrees equivalent)

  // Smooth the spectrum data - direct mapping from spectrum array
  // Low frequencies start at top (12 o'clock), going clockwise to high frequencies
  const smoothedSpectrum = useMemo(() => {
    const smoothed: number[] = [];

    // Direct 1:1 mapping if spectrum has enough data, otherwise interpolate
    for (let i = 0; i < numBars; i++) {
      // Map bar index to spectrum index
      const spectrumIndex = Math.floor((i / numBars) * spectrum.length);
      const targetValue = spectrum[Math.min(spectrumIndex, spectrum.length - 1)] || 0;

      // Light smoothing for more responsive feel
      const prevValue = smoothedSpectrumRef.current[i] || 0;
      const smoothedValue = smoothValue(prevValue, targetValue, 0.35);
      smoothed.push(smoothedValue);
      smoothedSpectrumRef.current[i] = smoothedValue;
    }

    return smoothed;
  }, [spectrum, numBars]);

  // Generate spectrum bars - fixed positions, extending OUTWARD from the ring
  // Like a traditional spectrum analyzer bent into a circle
  const spectrumBars = useMemo(() => {
    const bars: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < numBars; i++) {
      // Fixed angle position - starts at top (12 o'clock), goes clockwise
      // Low frequencies at top, high frequencies wrap around back to top
      const angle = i * barAngleStep - Math.PI / 2;
      const spectrumValue = smoothedSpectrum[i];

      // Bar length based purely on spectrum value
      // Minimum length for visual continuity, max based on spectrum amplitude
      const minBarLength = 2;
      const barLength = minBarLength + spectrumValue * maxBarLength;

      // Start from ring radius, extend OUTWARD
      const x1 = centerX + Math.cos(angle) * ringRadius;
      const y1 = centerY + Math.sin(angle) * ringRadius;
      const x2 = centerX + Math.cos(angle) * (ringRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (ringRadius + barLength);

      // 4-color gradient based on frequency position (fixed, not rotating)
      // Low freq (cyan) -> mid-low (blue) -> mid-high (purple) -> high (pink)
      const normalizedPos = i / numBars;
      let barColor: string;
      if (normalizedPos < 0.25) {
        barColor = interpolateColors(normalizedPos * 4, [0, 1], [GRADIENT_COLORS.cyan, GRADIENT_COLORS.blue]);
      } else if (normalizedPos < 0.5) {
        barColor = interpolateColors((normalizedPos - 0.25) * 4, [0, 1], [GRADIENT_COLORS.blue, GRADIENT_COLORS.purple]);
      } else if (normalizedPos < 0.75) {
        barColor = interpolateColors((normalizedPos - 0.5) * 4, [0, 1], [GRADIENT_COLORS.purple, GRADIENT_COLORS.pink]);
      } else {
        barColor = interpolateColors((normalizedPos - 0.75) * 4, [0, 1], [GRADIENT_COLORS.pink, GRADIENT_COLORS.cyan]);
      }

      // Thinner bars for finer detail
      const barWidth = 2 + spectrumValue * 2;

      bars.push({
        x1,
        y1,
        x2,
        y2,
        color: barColor,
        width: barWidth,
        opacity: 0.7 + spectrumValue * 0.3,
      });
    }

    return bars;
  }, [smoothedSpectrum, numBars, barAngleStep, centerX, centerY, ringRadius, maxBarLength]);

  // Light burst rays removed - keeping clean spectrum visualization

  // Static gradient (no rotation) for the ring
  const gradientRotation = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: GRADIENT_COLORS.background }}>
      <Audio src={staticFile(audioSrc)} />

      {/* Background gradient overlay */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at center,
            rgba(0, 255, 255, ${0.02 + amplitude * 0.02}) 0%,
            rgba(128, 0, 255, ${0.015 + amplitude * 0.01}) 40%,
            rgba(10, 10, 18, 1) 100%)`,
        }}
      />

      <svg
        width={width}
        height={height}
        style={{
          transform: `scale(${totalScale})`,
          opacity,
          transformOrigin: "center center",
        }}
      >
        <defs>
          {/* Glow filter for neon effect */}
          <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for bars */}
          <filter id="barGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Light ray filter - kept for potential future use */}
          <filter id="rayGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Static 4-color gradient for ring (no rotation) */}
          <linearGradient
            id="ringGradient"
            gradientTransform={`rotate(${gradientRotation})`}
          >
            <stop offset="0%" stopColor={GRADIENT_COLORS.cyan} />
            <stop offset="33%" stopColor={GRADIENT_COLORS.blue} />
            <stop offset="66%" stopColor={GRADIENT_COLORS.purple} />
            <stop offset="100%" stopColor={GRADIENT_COLORS.pink} />
          </linearGradient>
        </defs>

        {/* Spectrum bars - fixed positions, extending outward from ring */}
        {spectrumBars.map((bar, i) => (
          <g key={`bar-${i}`}>
            {/* Glow layer */}
            <line
              x1={bar.x1}
              y1={bar.y1}
              x2={bar.x2}
              y2={bar.y2}
              stroke={bar.color}
              strokeWidth={bar.width + 4}
              strokeLinecap="round"
              opacity={bar.opacity * 0.2}
              filter="url(#barGlow)"
            />
            {/* Main bar */}
            <line
              x1={bar.x1}
              y1={bar.y1}
              x2={bar.x2}
              y2={bar.y2}
              stroke={bar.color}
              strokeWidth={bar.width}
              strokeLinecap="round"
              opacity={bar.opacity}
            />
          </g>
        ))}

        {/* Main ring - progress indicator */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ringRadius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={progressCircumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90, ${centerX}, ${centerY})`}
          filter="url(#neonGlow)"
          opacity={0.9}
        />

        {/* Ring background (unfilled portion) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={ringRadius}
          fill="none"
          stroke={GRADIENT_COLORS.purple}
          strokeWidth={2}
          opacity={0.15}
        />

        {/* Center timer display */}
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={GRADIENT_COLORS.cyan}
          fontSize={Math.min(width, height) * 0.08}
          fontFamily="'Courier New', monospace"
          fontWeight="bold"
          opacity={0.95}
          filter="url(#neonGlow)"
        >
          {timeDisplay}
        </text>

        {/* Beat pulse ring - subtle outer glow on beat */}
        {beatPulseRef.current > 0.5 && (
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius + maxBarLength * 0.8 + beatPulseRef.current * 20}
            fill="none"
            stroke={GRADIENT_COLORS.cyan}
            strokeWidth={1}
            opacity={beatPulseRef.current * 0.3}
            filter="url(#neonGlow)"
          />
        )}
      </svg>
    </AbsoluteFill>
  );
};
