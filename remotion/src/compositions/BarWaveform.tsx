/**
 * Bar Waveform Visualization
 * Displays spectrum data as vertical bars (equalizer style).
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { AudioAnalysisData, VisualizationProps, COLOR_SCHEMES } from "../types/audio-data";

interface BarWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

export const BarWaveform: React.FC<BarWaveformProps> = ({
  data,
  audioSrc,
  colorScheme
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;

  // Get current frame data
  const frameIndex = Math.min(frame, data.frames.length - 1);
  const frameData = data.frames[frameIndex];

  if (!frameData) {
    return (
      <AbsoluteFill style={{ backgroundColor: colors.background }}>
        <Audio src={staticFile(audioSrc)} />
      </AbsoluteFill>
    );
  }

  const { amplitude, spectrum } = frameData;

  // Bar parameters
  const numBars = 64; // Use subset of spectrum for cleaner look
  const barGap = 4;
  const totalGaps = (numBars - 1) * barGap;
  const availableWidth = width * 0.8;
  const barWidth = (availableWidth - totalGaps) / numBars;
  const maxBarHeight = height * 0.6;
  const startX = (width - availableWidth) / 2;
  const baseY = height * 0.7;

  // Sample spectrum data
  const step = Math.floor(spectrum.length / numBars);

  const bars: JSX.Element[] = [];

  for (let i = 0; i < numBars; i++) {
    const spectrumIndex = Math.min(i * step, spectrum.length - 1);
    const spectrumValue = spectrum[spectrumIndex];

    // Bar height varies with spectrum value and amplitude
    const barHeight = spectrumValue * maxBarHeight * (0.5 + amplitude * 0.5);

    const x = startX + i * (barWidth + barGap);
    const y = baseY - barHeight;

    // Color gradient based on height
    const hue = 200 + (spectrumValue * 60); // Blue to purple range
    const saturation = 70 + spectrumValue * 30;
    const lightness = 50 + spectrumValue * 20;

    bars.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={barWidth / 4}
        fill={colors.primary}
        opacity={0.6 + spectrumValue * 0.4}
      />
    );

    // Reflection
    bars.push(
      <rect
        key={`reflection-${i}`}
        x={x}
        y={baseY + 5}
        width={barWidth}
        height={barHeight * 0.3}
        rx={barWidth / 4}
        fill={colors.primary}
        opacity={0.15}
        transform={`scale(1, -1) translate(0, ${-2 * (baseY + 5) - barHeight * 0.3})`}
      />
    );

    // Top glow
    if (spectrumValue > 0.5) {
      bars.push(
        <circle
          key={`glow-${i}`}
          cx={x + barWidth / 2}
          cy={y}
          r={barWidth / 2 + 2}
          fill={colors.accent}
          opacity={spectrumValue * 0.5}
          filter="url(#barGlow)"
        />
      );
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg width={width} height={height}>
        <defs>
          <filter id="barGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>

        {/* Base line */}
        <line
          x1={startX - 20}
          y1={baseY}
          x2={startX + availableWidth + 20}
          y2={baseY}
          stroke={colors.accent}
          strokeWidth={2}
          opacity={0.3}
        />

        {/* Bars */}
        {bars}

        {/* Amplitude indicator */}
        <text
          x={width / 2}
          y={height * 0.15}
          textAnchor="middle"
          fill={colors.accent}
          fontSize={24}
          fontFamily="monospace"
          opacity={0.5}
        >
          {Math.round(amplitude * 100)}%
        </text>
      </svg>
    </AbsoluteFill>
  );
};
