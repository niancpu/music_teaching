/**
 * Audio analysis data types matching backend output.
 */
import { z } from "zod";

export interface AudioFrameData {
  time: number;        // Timestamp in seconds
  amplitude: number;   // RMS amplitude (0-1)
  spectrum: number[];  // Spectrum data (128 frequency bands)
}

export interface AudioAnalysisData {
  duration: number;    // Total duration in seconds
  fps: number;         // Frame rate (30)
  total_frames: number;
  frames: AudioFrameData[];
}

/**
 * Zod schema for visualization props - required for Remotion Composition typing
 */
export const VisualizationPropsSchema = z.object({
  dataFile: z.string(),    // Path to analysis JSON (e.g., "/data/xxx.json")
  audioSrc: z.string(),    // Path to audio file (e.g., "/audio/xxx.mp3")
  colorScheme: z.string(), // Color scheme name
});

export type VisualizationProps = z.infer<typeof VisualizationPropsSchema>;

export type ColorScheme = {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
};

export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  blue: {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    background: "#0F172A",
    accent: "#93C5FD"
  },
  purple: {
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    background: "#1E1B4B",
    accent: "#C4B5FD"
  },
  green: {
    primary: "#10B981",
    secondary: "#34D399",
    background: "#022C22",
    accent: "#6EE7B7"
  },
  orange: {
    primary: "#F97316",
    secondary: "#FB923C",
    background: "#431407",
    accent: "#FDBA74"
  },
  pink: {
    primary: "#EC4899",
    secondary: "#F472B6",
    background: "#500724",
    accent: "#F9A8D4"
  }
};
