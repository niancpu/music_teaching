/**
 * Radial Waveform Visualization - Ultra Enhanced Version
 * Features:
 * - Spiral galaxy effect with rotating star field
 * - Comet trails on spikes
 * - Energy wave pulses expanding outward
 * - Lightning effects between spikes on beat
 * - Multi-layer spike system (bass/mid/treble)
 * - Dramatic beat response with shockwave
 * - Nebula background effect
 * - Rotating outer ring with symbols
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

// Generate star field
interface Star {
  angle: number;
  distance: number;
  size: number;
  brightness: number;
  speed: number;
}

function generateStarField(count: number, seed: number): Star[] {
  const stars: Star[] = [];
  const random = (i: number): number => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      angle: random(i) * Math.PI * 2,
      distance: 0.3 + random(i + 100) * 0.7,
      size: 0.5 + random(i + 200) * 2,
      brightness: 0.3 + random(i + 300) * 0.7,
      speed: 0.001 + random(i + 400) * 0.003,
    });
  }
  return stars;
}

// Generate nebula clouds
function generateNebulaPath(
  centerX: number,
  centerY: number,
  radius: number,
  frame: number,
  seed: number
): string {
  const points: string[] = [];
  const numPoints = 12;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const wobble = Math.sin(angle * 3 + frame * 0.02 + seed) * radius * 0.2;
    const r = radius + wobble;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    points.push(i === 0 ? `M ${x},${y}` : `Q ${centerX + Math.cos(angle - 0.2) * r * 1.1},${centerY + Math.sin(angle - 0.2) * r * 1.1} ${x},${y}`);
  }

  return points.join(' ') + ' Z';
}

interface RadialWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

// Pre-generate star field
const STAR_COUNT = 150;
const STAR_SEED = 42;

export const RadialWaveform: React.FC<RadialWaveformProps> = ({
  data,
  audioSrc,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;

  // Pre-generate stars
  const starField = useMemo(() => generateStarField(STAR_COUNT, STAR_SEED), []);

  // Track previous amplitude for beat detection
  const prevAmplitudeRef = useRef(0);
  const beatPulseRef = useRef(0);
  const shockwaveRef = useRef(0);

  // Get current frame data
  const frameIndex = Math.min(frame, data.frames.length - 1);
  const frameData = data.frames[frameIndex];

  // Intro animation with dramatic spin
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 50,
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

  // Combined scale and opacity with bounce effect for intro
  const introScale = interpolate(introProgress, [0, 1], [0, 1]);
  const outroScale = interpolate(outroProgress, [0, 1], [1, 0]);
  const scale = introScale * outroScale;

  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);
  const outroOpacity = interpolate(outroProgress, [0, 1], [1, 0]);
  const opacity = introOpacity * outroOpacity;

  // Intro rotation burst - more dramatic
  const introRotation = interpolate(introProgress, [0, 1], [1080, 0]);

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

  // Beat detection with shockwave
  const isBeat = detectBeat(amplitude, prevAmplitudeRef.current, 0.12, 0.25);
  if (isBeat) {
    beatPulseRef.current = 1;
    shockwaveRef.current = 1;
  } else {
    beatPulseRef.current *= 0.88;
    shockwaveRef.current *= 0.95;
  }
  prevAmplitudeRef.current = amplitude;

  // Center of the canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Music-responsive rotation - enhanced
  const baseRotation = frame * 0.6;
  const amplitudeBoost = amplitude * 45;
  const rotation = baseRotation + amplitudeBoost + introRotation;

  // Star field rotation (slower, opposite direction)
  const starRotation = -frame * 0.1;

  // Calculate star positions
  const starPositions = useMemo(() => {
    const maxRadius = Math.min(width, height) * 0.48;
    return starField.map((star) => {
      const currentAngle = star.angle + frame * star.speed;
      const r = maxRadius * star.distance;
      return {
        x: centerX + Math.cos(currentAngle) * r,
        y: centerY + Math.sin(currentAngle) * r,
        size: star.size * (1 + amplitude * 0.3),
        opacity: star.brightness * (0.5 + amplitude * 0.5),
      };
    });
  }, [starField, frame, amplitude, width, height, centerX, centerY]);

  // Nebula clouds
  const nebulaClouds = useMemo(() => {
    const clouds: Array<{ path: string; color: string; opacity: number }> = [];
    const baseRadius = Math.min(width, height) * 0.35;

    clouds.push({
      path: generateNebulaPath(centerX, centerY, baseRadius * 0.8, frame, 0),
      color: colors.primary,
      opacity: 0.08 + amplitude * 0.05,
    });
    clouds.push({
      path: generateNebulaPath(centerX, centerY, baseRadius * 0.6, frame, 100),
      color: colors.secondary,
      opacity: 0.06 + amplitude * 0.04,
    });
    clouds.push({
      path: generateNebulaPath(centerX, centerY, baseRadius * 0.4, frame, 200),
      color: colors.accent,
      opacity: 0.05 + amplitude * 0.03,
    });

    return clouds;
  }, [frame, amplitude, width, height, centerX, centerY, colors]);

  // Spike layer configurations - enhanced
  const spikeLayers = useMemo(() => {
    const innerRadius = Math.min(width, height) * 0.07;
    const maxSpikeLength = Math.min(width, height) * 0.38;

    return [
      // Bass layer (inner, thick spikes)
      {
        name: "bass",
        numSpikes: 36,
        innerRadius: innerRadius,
        maxLength: maxSpikeLength * 0.55,
        baseWidth: 7,
        color: colors.primary,
        bandValue: bands.bass,
        rotationOffset: 0,
      },
      // Mid layer (medium spikes)
      {
        name: "mid",
        numSpikes: 54,
        innerRadius: innerRadius * 1.4,
        maxLength: maxSpikeLength * 0.75,
        baseWidth: 5,
        color: colors.secondary,
        bandValue: bands.mid,
        rotationOffset: 3,
      },
      // Treble layer (outer, thin spikes)
      {
        name: "treble",
        numSpikes: 72,
        innerRadius: innerRadius * 1.8,
        maxLength: maxSpikeLength,
        baseWidth: 3,
        color: colors.accent,
        bandValue: bands.treble,
        rotationOffset: 5,
      },
    ];
  }, [width, height, bands, colors]);

  // Generate spikes for each layer with comet trails
  const allSpikes = useMemo(() => {
    const spikes: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      strokeWidth: number;
      color: string;
      opacity: number;
      layer: string;
      particleX?: number;
      particleY?: number;
      particleSize?: number;
      trailPath?: string;
      trailOpacity?: number;
    }> = [];

    spikeLayers.forEach((layer) => {
      const angleStep = (2 * Math.PI) / layer.numSpikes;
      const spectrumStep = Math.floor(spectrum.length / layer.numSpikes);

      for (let i = 0; i < layer.numSpikes; i++) {
        const angle = i * angleStep - Math.PI / 2 + (layer.rotationOffset * Math.PI) / 180;
        const spectrumIndex = Math.min(i * spectrumStep, spectrum.length - 1);
        const spectrumValue = spectrum[spectrumIndex];

        // Spike length varies with spectrum and band - enhanced
        const bandInfluence = layer.bandValue * 0.5;
        const beatBoost = beatPulseRef.current * 0.2;
        const spikeLength =
          layer.innerRadius +
          spectrumValue * layer.maxLength * (0.6 + amplitude * 0.4 + bandInfluence + beatBoost);

        const x1 = centerX + Math.cos(angle) * layer.innerRadius;
        const y1 = centerY + Math.sin(angle) * layer.innerRadius;
        const x2 = centerX + Math.cos(angle) * spikeLength;
        const y2 = centerY + Math.sin(angle) * spikeLength;

        // Dynamic stroke width
        const strokeWidth = layer.baseWidth + spectrumValue * 4;

        // Opacity based on spectrum value
        const spikeOpacity = 0.5 + spectrumValue * 0.5;

        // Color interpolation based on spectrum position and value
        const colorProgress = (i / layer.numSpikes + spectrumValue) / 2;
        const spikeColor = interpolateColors(
          colorProgress,
          [0, 0.5, 1],
          [colors.primary, colors.secondary, colors.accent]
        );

        // Comet trail for high values
        let trailPath: string | undefined;
        let trailOpacity: number | undefined;
        if (spectrumValue > 0.4) {
          const trailAngle = angle - 0.15;
          const trailLength = spikeLength * 0.7;
          const tx1 = centerX + Math.cos(trailAngle) * layer.innerRadius;
          const ty1 = centerY + Math.sin(trailAngle) * layer.innerRadius;
          const tx2 = centerX + Math.cos(trailAngle) * trailLength;
          const ty2 = centerY + Math.sin(trailAngle) * trailLength;
          trailPath = `M ${tx1},${ty1} L ${tx2},${ty2}`;
          trailOpacity = (spectrumValue - 0.4) * 0.5;
        }

        // Particle at spike tip for high values
        const hasParticle = spectrumValue > 0.5;
        const particleX = hasParticle ? x2 + (Math.sin(frame * 0.2 + i) * 8) : undefined;
        const particleY = hasParticle ? y2 + (Math.cos(frame * 0.2 + i) * 8) : undefined;
        const particleSize = hasParticle ? 3 + spectrumValue * 5 : undefined;

        spikes.push({
          x1,
          y1,
          x2,
          y2,
          strokeWidth,
          color: spikeColor,
          opacity: spikeOpacity,
          layer: layer.name,
          particleX,
          particleY,
          particleSize,
          trailPath,
          trailOpacity,
        });
      }
    });

    return spikes;
  }, [spikeLayers, spectrum, amplitude, centerX, centerY, colors, frame]);

  // Lightning effects between spikes on beat
  const lightningEffects = useMemo(() => {
    if (beatPulseRef.current < 0.3) return [];

    const effects: Array<{ path: string; opacity: number }> = [];
    const numLightning = Math.floor(beatPulseRef.current * 6);
    const innerRadius = Math.min(width, height) * 0.07;

    for (let i = 0; i < numLightning; i++) {
      const startAngle = (i / numLightning) * Math.PI * 2 + frame * 0.05;
      const endAngle = startAngle + 0.3 + Math.random() * 0.3;

      const points: string[] = [];
      const segments = 5;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = startAngle + (endAngle - startAngle) * t;
        const r = innerRadius * (1.5 + t * 1.5);
        const jitter = j > 0 && j < segments ? (Math.sin(frame * 0.5 + i * 20 + j * 10) * 15) : 0;
        const x = centerX + Math.cos(angle) * r + jitter;
        const y = centerY + Math.sin(angle) * r + jitter * 0.5;
        points.push(j === 0 ? `M ${x},${y}` : `L ${x},${y}`);
      }

      effects.push({
        path: points.join(' '),
        opacity: beatPulseRef.current * 0.8,
      });
    }

    return effects;
  }, [frame, width, height, centerX, centerY]);

  // Center core parameters - enhanced
  const innerRadius = Math.min(width, height) * 0.07;
  const corePulse = beatPulseRef.current;
  const coreRadius = innerRadius * 0.7 + corePulse * 20 + amplitude * 15;

  // Shockwave rings
  const shockwaveRings = useMemo(() => {
    const rings: Array<{ radius: number; opacity: number; strokeWidth: number }> = [];
    if (shockwaveRef.current > 0.1) {
      const baseShockRadius = innerRadius * 2;
      const expansion = (1 - shockwaveRef.current) * Math.min(width, height) * 0.4;
      rings.push({
        radius: baseShockRadius + expansion,
        opacity: shockwaveRef.current * 0.6,
        strokeWidth: 4 * shockwaveRef.current,
      });
      rings.push({
        radius: baseShockRadius + expansion * 0.7,
        opacity: shockwaveRef.current * 0.4,
        strokeWidth: 3 * shockwaveRef.current,
      });
    }
    return rings;
  }, [innerRadius, width, height]);

  // Energy wave pulses - enhanced
  const pulseRings = useMemo(() => {
    const rings: Array<{ radius: number; opacity: number }> = [];
    const numRings = 5;
    for (let i = 0; i < numRings; i++) {
      const progress = ((frame * 0.015 + i * 0.2) % 1);
      const radius = innerRadius + progress * Math.min(width, height) * 0.4;
      const fadeOpacity = (1 - progress) * 0.25 * (0.5 + amplitude * 0.5);
      rings.push({ radius, opacity: fadeOpacity });
    }
    return rings;
  }, [frame, amplitude, innerRadius, width, height]);

  // Dynamic glow color
  const glowColor = interpolateColors(
    amplitude,
    [0, 0.5, 1],
    [colors.primary, colors.secondary, colors.accent]
  );

  // Outer rotating ring with symbols
  const outerRingRadius = Math.min(width, height) * 0.46;
  const outerRingRotation = -frame * 0.2;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg
        width={width}
        height={height}
        style={{
          transform: `scale(${scale})`,
          opacity,
          transformOrigin: "center center",
        }}
      >
        <defs>
          {/* Spike glow filter - enhanced */}
          <filter id="spikeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core glow filter - enhanced */}
          <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={12 + amplitude * 20} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Lightning glow */}
          <filter id="lightningGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for center */}
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
            <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.5" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>

          {/* Nebula gradient */}
          <radialGradient id="nebulaGradient">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Nebula background clouds */}
        {nebulaClouds.map((cloud, i) => (
          <path
            key={`nebula-${i}`}
            d={cloud.path}
            fill={cloud.color}
            opacity={cloud.opacity}
            filter="url(#coreGlow)"
          />
        ))}

        {/* Star field background */}
        <g transform={`rotate(${starRotation}, ${centerX}, ${centerY})`}>
          {starPositions.map((star, i) => (
            <circle
              key={`star-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.size}
              fill={i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.secondary : "#ffffff"}
              opacity={star.opacity}
            />
          ))}
        </g>

        {/* Energy wave pulse rings */}
        {pulseRings.map((ring, i) => (
          <circle
            key={`pulse-${i}`}
            cx={centerX}
            cy={centerY}
            r={ring.radius}
            fill="none"
            stroke={colors.secondary}
            strokeWidth={2}
            opacity={ring.opacity}
          />
        ))}

        {/* Shockwave rings */}
        {shockwaveRings.map((ring, i) => (
          <circle
            key={`shock-${i}`}
            cx={centerX}
            cy={centerY}
            r={ring.radius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={ring.strokeWidth}
            opacity={ring.opacity}
            filter="url(#spikeGlow)"
          />
        ))}

        {/* Outer rotating ring with symbols */}
        <g transform={`rotate(${outerRingRotation}, ${centerX}, ${centerY})`}>
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRingRadius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={1.5}
            opacity={0.2 + amplitude * 0.15}
            strokeDasharray="8 20"
          />
          {/* Decorative marks on outer ring */}
          {[...Array(16)].map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * (outerRingRadius - 8);
            const y1 = centerY + Math.sin(angle) * (outerRingRadius - 8);
            const x2 = centerX + Math.cos(angle) * (outerRingRadius + 8);
            const y2 = centerY + Math.sin(angle) * (outerRingRadius + 8);
            return (
              <line
                key={`mark-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={colors.accent}
                strokeWidth={i % 4 === 0 ? 3 : 1.5}
                opacity={0.3 + amplitude * 0.2}
              />
            );
          })}
        </g>

        {/* Rotating spike group */}
        <g transform={`rotate(${rotation}, ${centerX}, ${centerY})`}>
          {/* Comet trails (rendered first, behind spikes) */}
          {allSpikes.map((spike, i) =>
            spike.trailPath ? (
              <path
                key={`trail-${i}`}
                d={spike.trailPath}
                fill="none"
                stroke={spike.color}
                strokeWidth={spike.strokeWidth * 0.6}
                strokeLinecap="round"
                opacity={spike.trailOpacity}
                filter="url(#spikeGlow)"
              />
            ) : null
          )}

          {/* Spike glow layer (rendered behind main spikes) */}
          {allSpikes.map((spike, i) => (
            <line
              key={`glow-${i}`}
              x1={spike.x1}
              y1={spike.y1}
              x2={spike.x2}
              y2={spike.y2}
              stroke={spike.color}
              strokeWidth={spike.strokeWidth + 8}
              strokeLinecap="round"
              opacity={spike.opacity * 0.2}
              filter="url(#spikeGlow)"
            />
          ))}

          {/* Main spikes */}
          {allSpikes.map((spike, i) => (
            <g key={`spike-${i}`}>
              <line
                x1={spike.x1}
                y1={spike.y1}
                x2={spike.x2}
                y2={spike.y2}
                stroke={spike.color}
                strokeWidth={spike.strokeWidth}
                strokeLinecap="round"
                opacity={spike.opacity}
              />
              {/* Particle at tip */}
              {spike.particleX !== undefined && (
                <circle
                  cx={spike.particleX}
                  cy={spike.particleY}
                  r={spike.particleSize}
                  fill={colors.accent}
                  opacity={0.9}
                  filter="url(#spikeGlow)"
                />
              )}
            </g>
          ))}
        </g>

        {/* Lightning effects */}
        {lightningEffects.map((effect, i) => (
          <path
            key={`lightning-${i}`}
            d={effect.path}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2}
            opacity={effect.opacity}
            filter="url(#lightningGlow)"
          />
        ))}

        {/* Center glow (large, soft) - enhanced */}
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 3}
          fill="url(#centerGradient)"
          opacity={0.4 + amplitude * 0.35}
          filter="url(#coreGlow)"
        />

        {/* Center core layers - enhanced */}
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 2}
          fill={colors.primary}
          opacity={0.2}
          filter="url(#coreGlow)"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 1.5}
          fill={glowColor}
          opacity={0.35}
          filter="url(#coreGlow)"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius}
          fill={glowColor}
          opacity={0.75}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 0.65}
          fill={colors.accent}
          opacity={0.9}
        />
        {/* Inner highlight */}
        <circle
          cx={centerX}
          cy={centerY}
          r={coreRadius * 0.3}
          fill="#ffffff"
          opacity={0.7 + amplitude * 0.3}
        />

        {/* Beat flash ring - enhanced */}
        {corePulse > 0.2 && (
          <>
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius * 2.5 + corePulse * 100}
              fill="none"
              stroke={colors.accent}
              strokeWidth={4}
              opacity={corePulse * 0.9}
              filter="url(#spikeGlow)"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={innerRadius * 3 + corePulse * 120}
              fill="none"
              stroke={colors.secondary}
              strokeWidth={2}
              opacity={corePulse * 0.5}
            />
          </>
        )}

        {/* Inner decorative ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius * 0.5}
          fill="none"
          stroke={colors.accent}
          strokeWidth={1}
          opacity={0.3 + amplitude * 0.2}
          strokeDasharray="3 6"
          transform={`rotate(${frame * 2}, ${centerX}, ${centerY})`}
        />
      </svg>
    </AbsoluteFill>
  );
};
