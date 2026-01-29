/**
 * Circular Waveform Visualization
 * Displays spectrum data as a circular waveform with amplitude-based radius.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { AudioAnalysisData, VisualizationProps, COLOR_SCHEMES } from "../types/audio-data";

interface CircularWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

export const CircularWaveform: React.FC<CircularWaveformProps> = ({
  data,
  audioSrc,
  colorScheme
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

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

  // Center of the canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Base radius and max extension
  const baseRadius = Math.min(width, height) * 0.2;
  const maxExtension = Math.min(width, height) * 0.25;

  // Number of points around the circle
  const numPoints = spectrum.length;
  const angleStep = (2 * Math.PI) / numPoints;

  // Generate path points
  const points: string[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const spectrumValue = spectrum[i];

    // Radius varies with spectrum value and overall amplitude
    const radius = baseRadius + spectrumValue * maxExtension * (0.5 + amplitude * 0.5);

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    points.push(`${x},${y}`);
  }

  // Close the path
  const pathData = `M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(" ")} Z`;

  // Glow effect based on amplitude
  const glowIntensity = 10 + amplitude * 30;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg width={width} height={height}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius * 0.8}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2}
          opacity={0.3}
        />

        {/* Main waveform */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth={3}
          filter="url(#glow)"
        />

        {/* Inner filled area with transparency */}
        <path
          d={pathData}
          fill={colors.primary}
          opacity={0.2}
        />

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r={10 + amplitude * 20}
          fill={colors.accent}
          opacity={0.8}
        />
      </svg>
    </AbsoluteFill>
  );
};
