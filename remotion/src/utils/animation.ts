/**
 * Animation utilities for music visualization
 * Provides frequency band extraction, beat detection, spring configs, and dynamic colors
 */
import { interpolateColors } from "remotion";

/**
 * Frequency band data extracted from spectrum
 */
export interface FrequencyBands {
  bass: number;      // Low frequencies (0-20% of spectrum)
  mid: number;       // Mid frequencies (20-60% of spectrum)
  treble: number;    // High frequencies (60-100% of spectrum)
  subBass: number;   // Sub-bass (0-10% of spectrum)
}

/**
 * Extract frequency bands from spectrum data
 * @param spectrum - Array of 128 frequency values (0-1)
 * @returns FrequencyBands object with averaged values for each band
 */
export function extractFrequencyBands(spectrum: number[]): FrequencyBands {
  const len = spectrum.length;
  if (len === 0) {
    return { bass: 0, mid: 0, treble: 0, subBass: 0 };
  }

  // Define band ranges (as percentages of spectrum)
  const subBassEnd = Math.floor(len * 0.1);
  const bassEnd = Math.floor(len * 0.2);
  const midEnd = Math.floor(len * 0.6);

  // Calculate averages for each band
  const subBass = averageRange(spectrum, 0, subBassEnd);
  const bass = averageRange(spectrum, 0, bassEnd);
  const mid = averageRange(spectrum, bassEnd, midEnd);
  const treble = averageRange(spectrum, midEnd, len);

  return { bass, mid, treble, subBass };
}

/**
 * Calculate average of array range
 */
function averageRange(arr: number[], start: number, end: number): number {
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += arr[i] || 0;
  }
  return sum / (end - start);
}

/**
 * Beat detection state for tracking amplitude changes
 */
export interface BeatDetectorState {
  prevAmplitude: number;
  beatCooldown: number;
  lastBeatFrame: number;
}

/**
 * Detect beats based on amplitude changes
 * @param amplitude - Current amplitude (0-1)
 * @param prevAmplitude - Previous frame amplitude
 * @param threshold - Minimum amplitude change to trigger beat (default 0.15)
 * @param minAmplitude - Minimum amplitude required (default 0.3)
 * @returns true if beat detected
 */
export function detectBeat(
  amplitude: number,
  prevAmplitude: number,
  threshold: number = 0.15,
  minAmplitude: number = 0.3
): boolean {
  const delta = amplitude - prevAmplitude;
  return delta > threshold && amplitude > minAmplitude;
}

/**
 * Enhanced beat detection with cooldown
 * @param amplitude - Current amplitude
 * @param frame - Current frame number
 * @param state - Beat detector state (mutated)
 * @param cooldownFrames - Minimum frames between beats (default 8)
 * @returns true if beat detected
 */
export function detectBeatWithCooldown(
  amplitude: number,
  frame: number,
  state: BeatDetectorState,
  cooldownFrames: number = 8
): boolean {
  const isBeat = detectBeat(amplitude, state.prevAmplitude) &&
    (frame - state.lastBeatFrame) >= cooldownFrames;

  if (isBeat) {
    state.lastBeatFrame = frame;
  }
  state.prevAmplitude = amplitude;

  return isBeat;
}

/**
 * Spring configuration presets for Remotion spring animations
 */
export const SPRING_CONFIGS = {
  // Smooth, gentle animations
  smooth: {
    damping: 200,
    stiffness: 100,
    mass: 1,
  },
  // Bouncy, playful animations
  bouncy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  },
  // Quick, snappy animations
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  // Very responsive, minimal overshoot
  responsive: {
    damping: 30,
    stiffness: 200,
    mass: 0.6,
  },
  // Slow, dramatic entrance
  dramatic: {
    damping: 15,
    stiffness: 50,
    mass: 1.2,
  },
  // Pulse effect
  pulse: {
    damping: 8,
    stiffness: 180,
    mass: 0.4,
  },
} as const;

/**
 * Get dynamic color based on amplitude
 * Interpolates between colors based on intensity
 * @param amplitude - Current amplitude (0-1)
 * @param colors - Array of colors to interpolate [low, mid, high]
 * @param thresholds - Amplitude thresholds (default [0, 0.5, 1])
 * @returns Interpolated color string
 */
export function getDynamicColor(
  amplitude: number,
  colors: [string, string, string],
  thresholds: [number, number, number] = [0, 0.5, 1]
): string {
  return interpolateColors(amplitude, thresholds, colors);
}

/**
 * Calculate intro animation progress
 * @param frame - Current frame
 * @param introDuration - Duration of intro in frames (default 30)
 * @returns Progress value 0-1
 */
export function getIntroProgress(frame: number, introDuration: number = 30): number {
  return Math.min(frame / introDuration, 1);
}

/**
 * Calculate outro animation progress
 * @param frame - Current frame
 * @param totalFrames - Total frames in composition
 * @param outroDuration - Duration of outro in frames (default 30)
 * @returns Progress value 0-1 (0 = not started, 1 = fully faded)
 */
export function getOutroProgress(
  frame: number,
  totalFrames: number,
  outroDuration: number = 30
): number {
  const outroStart = totalFrames - outroDuration;
  if (frame < outroStart) return 0;
  return (frame - outroStart) / outroDuration;
}

/**
 * Easing functions for custom animations
 */
export const EASINGS = {
  // Smooth ease in-out
  easeInOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  // Bounce effect
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  // Elastic effect
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  // Back effect (slight overshoot)
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Generate smooth bezier curve points from discrete data
 * Uses Catmull-Rom spline interpolation
 * @param points - Array of [x, y] points
 * @param tension - Curve tension (0-1, default 0.5)
 * @returns SVG path data string
 */
export function generateSmoothPath(
  points: [number, number][],
  tension: number = 0.5,
  closed: boolean = false
): string {
  if (points.length < 2) return "";

  const pts = closed ? [...points, points[0], points[1]] : points;

  let path = `M ${pts[0][0]},${pts[0][1]}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[Math.min(i + 1, pts.length - 1)];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  if (closed) {
    path += " Z";
  }

  return path;
}

/**
 * Create particle offset data for individual particle animations
 */
export interface ParticleOffset {
  phase: number;      // Phase offset for oscillation
  frequency: number;  // Frequency multiplier
  amplitude: number;  // Amplitude multiplier
}

/**
 * Generate random particle offsets for varied animations
 * @param count - Number of particles
 * @param seed - Random seed for reproducibility
 * @returns Array of particle offsets
 */
export function generateParticleOffsets(count: number, seed: number = 42): ParticleOffset[] {
  const offsets: ParticleOffset[] = [];

  // Simple seeded random
  const random = (i: number): number => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    offsets.push({
      phase: random(i) * Math.PI * 2,
      frequency: 0.5 + random(i + count) * 1.5,
      amplitude: 0.5 + random(i + count * 2) * 1.0,
    });
  }

  return offsets;
}

/**
 * Smooth value transition using exponential moving average
 * @param current - Current value
 * @param target - Target value
 * @param smoothing - Smoothing factor (0-1, higher = faster)
 * @returns Smoothed value
 */
export function smoothValue(current: number, target: number, smoothing: number = 0.1): number {
  return current + (target - current) * smoothing;
}
