/**
 * Radial Waveform Visualization
 * Displays spectrum data as radial spikes emanating from center.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile } from "remotion";
import { AudioAnalysisData, VisualizationProps, COLOR_SCHEMES } from "../types/audio-data";

interface RadialWaveformProps extends VisualizationProps {
  data: AudioAnalysisData;
}

export const RadialWaveform: React.FC<RadialWaveformProps> = ({
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

  // Center of the canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Spike parameters
  const innerRadius = Math.min(width, height) * 0.1;
  const maxSpikeLength = Math.min(width, height) * 0.35;

  // Number of spikes (use every other spectrum value for cleaner look)
  const numSpikes = Math.floor(spectrum.length / 2);
  const angleStep = (2 * Math.PI) / numSpikes;

  // Generate spikes
  const spikes: JSX.Element[] = [];

  for (let i = 0; i < numSpikes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const spectrumValue = spectrum[i * 2];

    // Spike length varies with spectrum value
    const spikeLength = innerRadius + spectrumValue * maxSpikeLength * (0.6 + amplitude * 0.4);

    const x1 = centerX + Math.cos(angle) * innerRadius;
    const y1 = centerY + Math.sin(angle) * innerRadius;
    const x2 = centerX + Math.cos(angle) * spikeLength;
    const y2 = centerY + Math.sin(angle) * spikeLength;

    // Color interpolation based on spectrum value
    const opacity = 0.4 + spectrumValue * 0.6;
    const strokeWidth = 2 + spectrumValue * 4;

    spikes.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colors.primary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
      />
    );

    // Add glow spike
    spikes.push(
      <line
        key={`glow-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colors.secondary}
        strokeWidth={strokeWidth + 4}
        strokeLinecap="round"
        opacity={opacity * 0.3}
        filter="url(#spikeGlow)"
      />
    );
  }

  // Rotation based on frame for dynamic effect
  const rotation = (frame / 2) % 360;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Audio src={staticFile(audioSrc)} />

      <svg width={width} height={height}>
        <defs>
          <filter id="spikeGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor={colors.accent} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rotating spike group */}
        <g transform={`rotate(${rotation}, ${centerX}, ${centerY})`}>
          {spikes}
        </g>

        {/* Center glow */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius + amplitude * 30}
          fill="url(#centerGradient)"
          opacity={0.6}
        />

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius * 0.5}
          fill={colors.accent}
          opacity={0.9}
        />

        {/* Pulsing ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius + amplitude * 50}
          fill="none"
          stroke={colors.secondary}
          strokeWidth={2}
          opacity={0.3 + amplitude * 0.3}
        />
      </svg>
    </AbsoluteFill>
  );
};
