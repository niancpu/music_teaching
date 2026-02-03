/**
 * Circular Waveform Visualization - Ultra Enhanced Version
 * Features:
 * - Aurora/Northern lights background effect
 * - Floating particles orbiting the rings
 * - Electric arc effects between rings
 * - Pulse wave ripple effects
 * - Rotating outer decorative patterns
 * - Multi-ring system (bass/mid/treble)
 * - Dynamic glow colors based on amplitude
 */
import React, { useMemo } from "react";
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
import { extractFrequencyBands, generateSmoothPath } from "../utils/animation";

// Generate aurora wave points
function generateAuroraPath(
  width: number,
  height: number,
  frame: number,
  amplitude: number,
  yOffset: number,
  speed: number
): string {
  const points: [number, number][] = [];
  const numPoints = 20;

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * width;
    const wave1 = Math.sin((i / numPoints) * Math.PI * 2 + frame * speed) * 30;
    const wave2 = Math.sin((i / numPoints) * Math.PI * 3 + frame * speed * 1.3) * 20;
    const wave3 = Math.sin((i / numPoints) * Math.PI * 5 + frame * speed * 0.7) * 15;
    const y = yOffset + wave1 + wave2 + wave3 + amplitude * 40;
    points.push([x, y]);
  }

  // Close the path at bottom
  points.push([width, height]);
  points.push([0, height]);

  return points.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ') + ' Z';
}

// Generate floating particles
interface FloatingParticle {
  angle: number;
  radius: number;
  size: number;
  speed: number;
  phase: number;
  opacity: number;
}

function generateFloatingParticles(count: number, seed: number): FloatingParticle[] {
  const particles: FloatingParticle[] = [];
  const random = (i: number): number => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    particles.push({
      angle: random(i) * Math.PI * 2,
      radius: 0.5 + random(i + 100) * 0.8,
      size: 2 + random(i + 200) * 4,
      speed: 0.005 + random(i + 300) * 0.015,
      phase: random(i + 400) * Math.PI * 2,
      opacity: 0.3 + random(i + 500) * 0.7,
    });
  }
  return particles;
}

interface CircularWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

// Pre-generate particles (memoized outside component)
const PARTICLE_COUNT = 60;
const PARTICLE_SEED = 42;

export const CircularWaveform: React.FC<CircularWaveformProps> = ({
  data,
  audioSrc,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;

  // Pre-generate floating particles
  const floatingParticles = useMemo(() => generateFloatingParticles(PARTICLE_COUNT, PARTICLE_SEED), []);

  // Get current frame data
  const frameIndex = Math.min(frame, data.frames.length - 1);
  const frameData = data.frames[frameIndex];

  // Intro animation (first 45 frames with bounce)
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 45,
  });

  // Outro animation (last 30 frames)
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

  // Combined scale and opacity with elastic effect
  const introScale = interpolate(introProgress, [0, 1], [0, 1]);
  const outroScale = interpolate(outroProgress, [0, 1], [1, 0]);
  const scale = introScale * outroScale;

  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);
  const outroOpacity = interpolate(outroProgress, [0, 1], [1, 0]);
  const opacity = introOpacity * outroOpacity;

  // Intro rotation effect with spiral
  const introRotation = interpolate(introProgress, [0, 1], [360, 0]);

  if (!frameData) {
    return (
      <AbsoluteFill style={{ backgroundColor: colors.background }}>
        <Audio src={staticFile(audioSrc)} />
      </AbsoluteFill>
    );
  }

  const { amplitude, spectrum } = frameData;

  // Extract frequency bands
  const bands = extractFrequencyBands(spectrum);

  // Center of the canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Ring parameters
  const baseRadius = Math.min(width, height) * 0.15;
  const maxExtension = Math.min(width, height) * 0.22;

  // Dynamic glow color based on amplitude
  const glowColor = interpolateColors(
    amplitude,
    [0, 0.5, 1],
    [colors.primary, colors.secondary, colors.accent]
  );

  // Glow intensity based on amplitude
  const glowIntensity = 10 + amplitude * 30;

  // Slow rotation for visual interest
  const baseRotation = (frame * 0.4) % 360;

  // Aurora paths
  const auroraPath1 = generateAuroraPath(width, height, frame, amplitude, height * 0.15, 0.03);
  const auroraPath2 = generateAuroraPath(width, height, frame, amplitude, height * 0.25, 0.025);
  const auroraPath3 = generateAuroraPath(width, height, frame, amplitude, height * 0.35, 0.02);

  // Calculate floating particle positions
  const particlePositions = useMemo(() => {
    return floatingParticles.map((p) => {
      const currentAngle = p.angle + frame * p.speed;
      const radiusMultiplier = baseRadius * (1.8 + p.radius * 1.5);
      const wobble = Math.sin(frame * 0.05 + p.phase) * 15;
      const breathe = amplitude * 30;

      return {
        x: centerX + Math.cos(currentAngle) * (radiusMultiplier + wobble + breathe),
        y: centerY + Math.sin(currentAngle) * (radiusMultiplier + wobble + breathe),
        size: p.size * (1 + amplitude * 0.5),
        opacity: p.opacity * (0.5 + amplitude * 0.5),
      };
    });
  }, [floatingParticles, frame, amplitude, baseRadius, centerX, centerY]);

  // Pulse wave ripples
  const pulseWaves = useMemo(() => {
    const waves: Array<{ radius: number; opacity: number }> = [];
    const numWaves = 4;
    for (let i = 0; i < numWaves; i++) {
      const waveProgress = ((frame * 0.02 + i * 0.25) % 1);
      const waveRadius = baseRadius * 2 + waveProgress * Math.min(width, height) * 0.35;
      const waveOpacity = (1 - waveProgress) * 0.3 * (0.5 + amplitude * 0.5);
      waves.push({ radius: waveRadius, opacity: waveOpacity });
    }
    return waves;
  }, [frame, amplitude, baseRadius, width, height]);

  // Generate ring data for bass, mid, and treble with enhanced effects
  const rings = useMemo(() => {
    const ringConfigs = [
      { band: bands.bass, radiusMultiplier: 1.0, color: colors.primary, strokeWidth: 5, opacity: 0.95 },
      { band: bands.mid, radiusMultiplier: 1.5, color: colors.secondary, strokeWidth: 4, opacity: 0.8 },
      { band: bands.treble, radiusMultiplier: 2.0, color: colors.accent, strokeWidth: 3, opacity: 0.6 },
    ];

    return ringConfigs.map((config, ringIndex) => {
      const numPoints = 72;
      const angleStep = (2 * Math.PI) / numPoints;
      const ringRadius = baseRadius * config.radiusMultiplier;
      const points: [number, number][] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const spectrumIndex = Math.floor((i / numPoints) * spectrum.length);
        const spectrumValue = spectrum[spectrumIndex] || 0;

        // Enhanced radius variation with wave effect
        const waveEffect = Math.sin(angle * 3 + frame * 0.05) * 5 * amplitude;
        const bandInfluence = config.band * 0.6;
        const radius =
          ringRadius +
          spectrumValue * maxExtension * (0.5 + amplitude * 0.5 + bandInfluence) +
          waveEffect;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push([x, y]);
      }

      // Generate smooth bezier path
      const pathData = generateSmoothPath(points, 0.4, true);

      return {
        pathData,
        color: config.color,
        strokeWidth: config.strokeWidth,
        opacity: config.opacity,
        ringIndex,
        ringRadius,
      };
    });
  }, [spectrum, amplitude, bands, centerX, centerY, baseRadius, maxExtension, colors, frame]);

  // Electric arc points between rings
  const electricArcs = useMemo(() => {
    if (amplitude < 0.4) return [];

    const arcs: Array<{ path: string; opacity: number }> = [];
    const numArcs = Math.floor(amplitude * 8);

    for (let i = 0; i < numArcs; i++) {
      const angle = (i / numArcs) * Math.PI * 2 + frame * 0.02;
      const innerR = baseRadius * 1.0;
      const outerR = baseRadius * 2.0;

      // Jagged lightning path
      const points: [number, number][] = [];
      const segments = 6;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const r = innerR + (outerR - innerR) * t;
        const jitter = j > 0 && j < segments ? (Math.sin(frame * 0.3 + i * 10 + j * 5) * 15) : 0;
        const a = angle + jitter * 0.02;
        points.push([
          centerX + Math.cos(a) * r + jitter,
          centerY + Math.sin(a) * r + jitter * 0.5,
        ]);
      }

      const path = points.map((p, idx) => (idx === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ');
      arcs.push({ path, opacity: (amplitude - 0.4) * 1.5 });
    }

    return arcs;
  }, [amplitude, frame, baseRadius, centerX, centerY]);

  // Pulsing center dot size with enhanced effect
  const centerDotRadius = 10 + amplitude * 30 + bands.subBass * 20;

  // Inner decorative rings with rotation
  const decorativeRings = [0.25, 0.45, 0.65].map((mult, i) => ({
    radius: baseRadius * mult,
    opacity: 0.2 + amplitude * 0.15,
    strokeWidth: 1.5,
    key: i,
    rotation: frame * (0.5 + i * 0.3) * (i % 2 === 0 ? 1 : -1),
  }));

  // Outer rotating pattern
  const outerPatternRotation = -frame * 0.15;
  const outerPatternRadius = Math.min(width, height) * 0.44;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg
        width={width}
        height={height}
        style={{
          transform: `scale(${scale}) rotate(${introRotation}deg)`,
          opacity,
          transformOrigin: "center center",
        }}
      >
        <defs>
          {/* Dynamic glow filter */}
          <filter id="circularGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense glow for electric arcs */}
          <filter id="electricGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Aurora gradient */}
          <linearGradient id="auroraGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auroraGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </linearGradient>

          {/* Gradient for filled area */}
          <radialGradient id="fillGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.05" />
          </radialGradient>

          {/* Stroke gradient */}
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
        </defs>

        {/* Aurora background effect */}
        <g opacity={0.6 + amplitude * 0.3}>
          <path d={auroraPath1} fill="url(#auroraGradient1)" />
          <path d={auroraPath2} fill="url(#auroraGradient2)" />
          <path d={auroraPath3} fill="url(#auroraGradient3)" />
        </g>

        {/* Pulse wave ripples */}
        {pulseWaves.map((wave, i) => (
          <circle
            key={`pulse-${i}`}
            cx={centerX}
            cy={centerY}
            r={wave.radius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            opacity={wave.opacity}
          />
        ))}

        {/* Outer rotating decorative pattern */}
        <g transform={`rotate(${outerPatternRotation}, ${centerX}, ${centerY})`}>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * (outerPatternRadius - 20);
            const y1 = centerY + Math.sin(angle) * (outerPatternRadius - 20);
            const x2 = centerX + Math.cos(angle) * (outerPatternRadius + 10);
            const y2 = centerY + Math.sin(angle) * (outerPatternRadius + 10);
            return (
              <line
                key={`outer-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={colors.accent}
                strokeWidth={2}
                opacity={0.2 + amplitude * 0.2}
              />
            );
          })}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerPatternRadius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={1}
            opacity={0.15}
            strokeDasharray="5 15"
          />
        </g>

        {/* Floating particles */}
        {particlePositions.map((p, i) => (
          <circle
            key={`particle-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.secondary : colors.primary}
            opacity={p.opacity}
            filter="url(#circularGlow)"
          />
        ))}

        {/* Rotating group for inner elements */}
        <g transform={`rotate(${baseRotation}, ${centerX}, ${centerY})`}>
          {/* Decorative inner rings with individual rotation */}
          {decorativeRings.map((ring) => (
            <g key={ring.key} transform={`rotate(${ring.rotation}, ${centerX}, ${centerY})`}>
              <circle
                cx={centerX}
                cy={centerY}
                r={ring.radius}
                fill="none"
                stroke={colors.accent}
                strokeWidth={ring.strokeWidth}
                opacity={ring.opacity}
                strokeDasharray="4 8"
              />
            </g>
          ))}
        </g>

        {/* Electric arcs between rings */}
        {electricArcs.map((arc, i) => (
          <path
            key={`arc-${i}`}
            d={arc.path}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            opacity={arc.opacity}
            filter="url(#electricGlow)"
          />
        ))}

        {/* Multi-ring waveforms (bass, mid, treble) */}
        {rings.map((ring) => (
          <g key={ring.ringIndex}>
            {/* Glow layer */}
            <path
              d={ring.pathData}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.strokeWidth + 8}
              opacity={ring.opacity * 0.25}
              filter="url(#circularGlow)"
            />
            {/* Main stroke */}
            <path
              d={ring.pathData}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              opacity={ring.opacity}
            />
            {/* Inner fill for bass ring only */}
            {ring.ringIndex === 0 && (
              <path d={ring.pathData} fill="url(#fillGradient)" opacity={0.35} />
            )}
          </g>
        ))}

        {/* Pulsing center glow - multiple layers */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerDotRadius * 3}
          fill={colors.primary}
          opacity={0.1 + amplitude * 0.1}
          filter="url(#circularGlow)"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={centerDotRadius * 2}
          fill={glowColor}
          opacity={0.2 + amplitude * 0.2}
          filter="url(#circularGlow)"
        />

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerDotRadius}
          fill={glowColor}
          opacity={0.95}
        />

        {/* Inner highlight with pulse */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerDotRadius * 0.5}
          fill="#ffffff"
          opacity={0.6 + amplitude * 0.3}
        />

        {/* Bright center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerDotRadius * 0.2}
          fill="#ffffff"
          opacity={0.9}
        />

        {/* Beat pulse ring - enhanced */}
        {amplitude > 0.5 && (
          <>
            <circle
              cx={centerX}
              cy={centerY}
              r={baseRadius * 2.5 + amplitude * 60}
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              opacity={(amplitude - 0.5) * 1.5}
              filter="url(#electricGlow)"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={baseRadius * 2.8 + amplitude * 80}
              fill="none"
              stroke={colors.secondary}
              strokeWidth={2}
              opacity={(amplitude - 0.5) * 1.0}
            />
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};
