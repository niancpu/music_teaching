/**
 * Bar Waveform Visualization - Ultra Enhanced Version
 * Features:
 * - Neon glow trails with motion blur effect
 * - Particle explosions on beat
 * - Scanning line effect
 * - Enhanced 3D depth with multiple layers
 * - Wave-shaped baseline
 * - Floating frequency indicators
 * - Mirror reflection with ripple distortion
 * - Dynamic color gradients per bar
 * - Energy field background
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

interface BarWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

// Store peak values for decay effect
interface PeakState {
  values: number[];
  decayRate: number;
}

// Beat explosion particle
interface BeatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

// Generate energy field background lines
function generateEnergyField(
  width: number,
  height: number,
  frame: number,
  amplitude: number
): Array<{ path: string; opacity: number }> {
  const lines: Array<{ path: string; opacity: number }> = [];
  const numLines = 8;

  for (let i = 0; i < numLines; i++) {
    const yBase = (height * 0.2) + (i / numLines) * (height * 0.5);
    const points: string[] = [];

    for (let x = 0; x <= width; x += 20) {
      const wave1 = Math.sin((x / width) * Math.PI * 4 + frame * 0.03 + i) * 15;
      const wave2 = Math.sin((x / width) * Math.PI * 2 + frame * 0.02) * 10 * amplitude;
      const y = yBase + wave1 + wave2;
      points.push(x === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }

    lines.push({
      path: points.join(' '),
      opacity: 0.05 + amplitude * 0.1,
    });
  }

  return lines;
}

export const BarWaveform: React.FC<BarWaveformProps> = ({
  data,
  audioSrc,
  colorScheme,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;

  // Peak tracking ref (persists across renders but resets each frame calculation)
  const peakRef = useRef<PeakState>({ values: [], decayRate: 0.93 });

  // Beat detection refs
  const prevAmplitudeRef = useRef(0);
  const beatParticlesRef = useRef<BeatParticle[]>([]);

  // Get current frame data
  const frameIndex = Math.min(frame, data.frames.length - 1);
  const frameData = data.frames[frameIndex];

  // Intro animation with bounce
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 40,
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

  // Combined animations
  const introScale = interpolate(introProgress, [0, 1], [0.3, 1]);
  const outroScale = interpolate(outroProgress, [0, 1], [1, 0.3]);
  const scale = introScale * outroScale;

  const introOpacity = interpolate(introProgress, [0, 1], [0, 1]);
  const outroOpacity = interpolate(outroProgress, [0, 1], [1, 0]);
  const opacity = introOpacity * outroOpacity;

  // Intro slide up effect with bounce
  const introTranslateY = interpolate(introProgress, [0, 1], [150, 0]);

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

  // Beat detection for particle explosions
  const isBeat = detectBeat(amplitude, prevAmplitudeRef.current, 0.15, 0.4);
  prevAmplitudeRef.current = amplitude;

  // Bar parameters
  const numBars = 72;
  const barGap = 3;
  const totalGaps = (numBars - 1) * barGap;
  const availableWidth = width * 0.88;
  const barWidth = (availableWidth - totalGaps) / numBars;
  const maxBarHeight = height * 0.52;
  const startX = (width - availableWidth) / 2;
  const baseY = height * 0.70;

  // Sample spectrum data with smoothing
  const step = Math.floor(spectrum.length / numBars);

  // Scanning line position
  const scanLineX = startX + ((frame * 3) % availableWidth);

  // Wave baseline
  const baselineWave = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= numBars; i++) {
      const x = startX + i * (barWidth + barGap);
      const wave = Math.sin((i / numBars) * Math.PI * 2 + frame * 0.05) * 5 * amplitude;
      const y = baseY + wave;
      points.push(i === 0 ? `M ${x},${y}` : `L ${x},${y}`);
    }
    return points.join(' ');
  }, [numBars, startX, barWidth, barGap, frame, amplitude, baseY]);

  // Energy field background
  const energyField = useMemo(() => generateEnergyField(width, height, frame, amplitude), [width, height, frame, amplitude]);

  // Calculate bar data with spring-like smoothing and enhanced effects
  const barData = useMemo(() => {
    const bars: Array<{
      height: number;
      x: number;
      color: string;
      glowColor: string;
      opacity: number;
      spectrumValue: number;
      frequencyType: "bass" | "mid" | "treble";
      trailHeight: number;
      isNearScanLine: boolean;
    }> = [];

    // Initialize peaks if needed
    if (peakRef.current.values.length !== numBars) {
      peakRef.current.values = new Array(numBars).fill(0);
    }

    for (let i = 0; i < numBars; i++) {
      const spectrumIndex = Math.min(i * step, spectrum.length - 1);
      const spectrumValue = spectrum[spectrumIndex];

      // Determine frequency type based on position
      const normalizedPos = i / numBars;
      let frequencyType: "bass" | "mid" | "treble";
      let bandMultiplier: number;

      if (normalizedPos < 0.25) {
        frequencyType = "bass";
        bandMultiplier = 1 + bands.bass * 0.6;
      } else if (normalizedPos < 0.65) {
        frequencyType = "mid";
        bandMultiplier = 1 + bands.mid * 0.4;
      } else {
        frequencyType = "treble";
        bandMultiplier = 1 + bands.treble * 0.5;
      }

      // Calculate bar height with band influence
      const targetHeight =
        spectrumValue * maxBarHeight * (0.5 + amplitude * 0.5) * bandMultiplier;

      // Update peak with decay
      if (targetHeight > peakRef.current.values[i]) {
        peakRef.current.values[i] = targetHeight;
      } else {
        peakRef.current.values[i] *= peakRef.current.decayRate;
      }

      const x = startX + i * (barWidth + barGap);

      // Check if near scan line for highlight effect
      const isNearScanLine = Math.abs(x - scanLineX) < 30;

      // Color based on frequency type and intensity with gradient
      const colorProgress = spectrumValue + (isNearScanLine ? 0.3 : 0);
      const barColor = interpolateColors(
        Math.min(colorProgress, 1),
        [0, 0.4, 0.7, 1],
        [colors.primary, colors.secondary, colors.accent, "#ffffff"]
      );

      // Trail height (ghost effect)
      const trailHeight = targetHeight * 0.7;

      bars.push({
        height: targetHeight,
        x,
        color: barColor,
        glowColor: colors.accent,
        opacity: 0.75 + spectrumValue * 0.25,
        spectrumValue,
        frequencyType,
        trailHeight,
        isNearScanLine,
      });
    }

    return bars;
  }, [spectrum, amplitude, bands, numBars, step, maxBarHeight, startX, barWidth, barGap, colors, scanLineX]);

  // Beat explosion particles
  const beatParticles = useMemo(() => {
    if (!isBeat) return [];

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      offsetX: number;
      offsetY: number;
    }> = [];

    // Find high-energy bars for particle spawn points
    barData.forEach((bar, i) => {
      if (bar.spectrumValue > 0.5) {
        const numParticles = Math.floor(bar.spectrumValue * 5);
        for (let j = 0; j < numParticles; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 20 + Math.random() * 40;
          particles.push({
            x: bar.x + barWidth / 2,
            y: baseY - bar.height,
            size: 2 + Math.random() * 4,
            color: j % 2 === 0 ? colors.accent : colors.secondary,
            offsetX: Math.cos(angle) * speed,
            offsetY: Math.sin(angle) * speed - 20,
          });
        }
      }
    });

    return particles;
  }, [isBeat, barData, barWidth, baseY, colors]);

  // Background grid lines with enhanced pulse
  const gridLines = useMemo(() => {
    const lines: Array<{ y: number; opacity: number }> = [];
    const numLines = 10;
    const gridHeight = maxBarHeight * 1.3;
    const gridStartY = baseY - gridHeight;

    for (let i = 0; i <= numLines; i++) {
      const y = gridStartY + (gridHeight / numLines) * i;
      // Grid pulses with bass and has wave effect
      const waveOffset = Math.sin(i * 0.5 + frame * 0.05) * 0.05;
      const pulseOpacity = 0.08 + bands.bass * 0.2 + waveOffset;
      lines.push({ y, opacity: pulseOpacity });
    }
    return lines;
  }, [maxBarHeight, baseY, bands.bass, frame]);

  // 3D perspective transform with enhanced depth
  const perspectiveTransform = `perspective(1200px) rotateX(10deg)`;

  // Floating frequency indicators
  const frequencyIndicators = useMemo(() => {
    return [
      { label: "SUB", value: Math.round(bands.subBass * 100), x: startX + availableWidth * 0.05 },
      { label: "BASS", value: Math.round(bands.bass * 100), x: startX + availableWidth * 0.15 },
      { label: "MID", value: Math.round(bands.mid * 100), x: startX + availableWidth * 0.5 },
      { label: "HIGH", value: Math.round(bands.treble * 100), x: startX + availableWidth * 0.85 },
    ];
  }, [bands, startX, availableWidth]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg
        width={width}
        height={height}
        style={{
          transform: `${perspectiveTransform} scale(${scale}) translateY(${introTranslateY}px)`,
          opacity,
          transformOrigin: "center 70%",
        }}
      >
        <defs>
          {/* Enhanced glow filter */}
          <filter id="barGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Neon glow for scan line */}
          <filter id="neonGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Reflection gradient */}
          <linearGradient id="reflectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </linearGradient>

          {/* Bar gradient - vertical */}
          <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="40%" stopColor={colors.secondary} />
            <stop offset="80%" stopColor={colors.accent} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Scan line gradient */}
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.accent} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.accent} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Energy field background */}
        <g opacity={0.4}>
          {energyField.map((line, i) => (
            <path
              key={`energy-${i}`}
              d={line.path}
              fill="none"
              stroke={colors.secondary}
              strokeWidth={1}
              opacity={line.opacity}
            />
          ))}
        </g>

        {/* Background grid */}
        <g opacity={0.6}>
          {gridLines.map((line, i) => (
            <line
              key={`grid-${i}`}
              x1={startX - 40}
              y1={line.y}
              x2={startX + availableWidth + 40}
              y2={line.y}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={line.opacity}
              strokeDasharray="6 12"
            />
          ))}
          {/* Vertical grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
            <line
              key={`vgrid-${i}`}
              x1={startX + availableWidth * pos}
              y1={baseY - maxBarHeight * 1.3}
              x2={startX + availableWidth * pos}
              y2={baseY + 30}
              stroke={colors.accent}
              strokeWidth={1}
              opacity={0.08 + bands.bass * 0.12}
            />
          ))}
        </g>

        {/* Wave baseline with glow */}
        <path
          d={baselineWave}
          fill="none"
          stroke={colors.accent}
          strokeWidth={3}
          opacity={0.5 + amplitude * 0.3}
          filter="url(#barGlow)"
        />

        {/* Bars with enhanced effects */}
        {barData.map((bar, i) => {
          const y = baseY - bar.height;
          const peakY = baseY - peakRef.current.values[i];

          return (
            <g key={i}>
              {/* Ghost trail (motion blur effect) */}
              <rect
                x={bar.x - 1}
                y={baseY - bar.trailHeight - 10}
                width={barWidth + 2}
                height={bar.trailHeight}
                rx={barWidth / 3}
                fill={bar.color}
                opacity={0.15}
              />

              {/* Reflection (mirrored below baseline) with ripple */}
              <rect
                x={bar.x}
                y={baseY + 10}
                width={barWidth}
                height={bar.height * 0.4}
                rx={barWidth / 4}
                fill={bar.color}
                opacity={0.12}
                transform={`scale(1, -1) translate(0, ${-2 * (baseY + 10) - bar.height * 0.4})`}
              />

              {/* Main bar glow - enhanced */}
              <rect
                x={bar.x - 3}
                y={y - 3}
                width={barWidth + 6}
                height={bar.height + 6}
                rx={barWidth / 3}
                fill={bar.color}
                opacity={bar.opacity * 0.35}
                filter="url(#barGlow)"
              />

              {/* Main bar */}
              <rect
                x={bar.x}
                y={y}
                width={barWidth}
                height={bar.height}
                rx={barWidth / 4}
                fill={bar.color}
                opacity={bar.opacity}
              />

              {/* Bar highlight (top) - brighter */}
              <rect
                x={bar.x + barWidth * 0.15}
                y={y}
                width={barWidth * 0.4}
                height={Math.min(bar.height, 25)}
                rx={2}
                fill="#ffffff"
                opacity={0.35 + bar.spectrumValue * 0.25}
              />

              {/* Peak indicator with glow */}
              {peakRef.current.values[i] > bar.height + 8 && (
                <>
                  <rect
                    x={bar.x - 2}
                    y={peakY - 4}
                    width={barWidth + 4}
                    height={4}
                    rx={2}
                    fill={colors.accent}
                    opacity={0.5}
                    filter="url(#neonGlow)"
                  />
                  <rect
                    x={bar.x}
                    y={peakY - 3}
                    width={barWidth}
                    height={3}
                    rx={1}
                    fill={colors.accent}
                    opacity={0.9}
                  />
                </>
              )}

              {/* Top glow for high values - enhanced */}
              {bar.spectrumValue > 0.4 && (
                <circle
                  cx={bar.x + barWidth / 2}
                  cy={y}
                  r={barWidth / 2 + 6}
                  fill={bar.isNearScanLine ? "#ffffff" : bar.glowColor}
                  opacity={(bar.spectrumValue - 0.4) * 0.9}
                  filter="url(#barGlow)"
                />
              )}

              {/* Scan line highlight effect */}
              {bar.isNearScanLine && (
                <rect
                  x={bar.x - 2}
                  y={y - 5}
                  width={barWidth + 4}
                  height={bar.height + 10}
                  rx={barWidth / 3}
                  fill="#ffffff"
                  opacity={0.2}
                />
              )}
            </g>
          );
        })}

        {/* Scanning line */}
        <line
          x1={scanLineX}
          y1={baseY - maxBarHeight * 1.2}
          x2={scanLineX}
          y2={baseY + 20}
          stroke="url(#scanGradient)"
          strokeWidth={4}
          opacity={0.6 + amplitude * 0.3}
          filter="url(#neonGlow)"
        />

        {/* Beat explosion particles */}
        {beatParticles.map((p, i) => (
          <circle
            key={`particle-${i}`}
            cx={p.x + p.offsetX * 0.3}
            cy={p.y + p.offsetY * 0.3}
            r={p.size}
            fill={p.color}
            opacity={0.8}
            filter="url(#barGlow)"
          />
        ))}

        {/* Frequency band labels - enhanced */}
        <g opacity={0.5}>
          {frequencyIndicators.map((ind, i) => (
            <g key={`indicator-${i}`}>
              <text
                x={ind.x}
                y={baseY + 45}
                textAnchor="middle"
                fill={colors.accent}
                fontSize={11}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {ind.label}
              </text>
              <text
                x={ind.x}
                y={baseY + 60}
                textAnchor="middle"
                fill={colors.secondary}
                fontSize={14}
                fontFamily="monospace"
              >
                {ind.value}%
              </text>
            </g>
          ))}
        </g>

        {/* Amplitude indicator - enhanced */}
        <g>
          <text
            x={width / 2}
            y={height * 0.08}
            textAnchor="middle"
            fill={colors.accent}
            fontSize={36}
            fontFamily="monospace"
            fontWeight="bold"
            opacity={0.7}
          >
            {Math.round(amplitude * 100)}%
          </text>
          {/* Level meter background */}
          <rect
            x={width / 2 - 80}
            y={height * 0.10}
            width={160}
            height={6}
            rx={3}
            fill={colors.primary}
            opacity={0.2}
          />
          {/* Level meter fill with gradient */}
          <rect
            x={width / 2 - 80}
            y={height * 0.10}
            width={160 * amplitude}
            height={6}
            rx={3}
            fill={interpolateColors(amplitude, [0, 0.5, 0.8, 1], [colors.primary, colors.secondary, colors.accent, "#ffffff"])}
            opacity={0.9}
          />
          {/* Level meter glow */}
          <rect
            x={width / 2 - 80}
            y={height * 0.10}
            width={160 * amplitude}
            height={6}
            rx={3}
            fill={colors.accent}
            opacity={0.4}
            filter="url(#neonGlow)"
          />
        </g>

        {/* Corner decorations */}
        <g opacity={0.3 + amplitude * 0.2}>
          {/* Top left */}
          <path
            d={`M ${startX - 20},${baseY - maxBarHeight * 1.2} L ${startX - 20},${baseY - maxBarHeight * 1.2 + 30} M ${startX - 20},${baseY - maxBarHeight * 1.2} L ${startX + 10},${baseY - maxBarHeight * 1.2}`}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
          />
          {/* Top right */}
          <path
            d={`M ${startX + availableWidth + 20},${baseY - maxBarHeight * 1.2} L ${startX + availableWidth + 20},${baseY - maxBarHeight * 1.2 + 30} M ${startX + availableWidth + 20},${baseY - maxBarHeight * 1.2} L ${startX + availableWidth - 10},${baseY - maxBarHeight * 1.2}`}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
