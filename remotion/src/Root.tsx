/**
 * Root component that registers all compositions.
 */
import React, { useEffect, useState } from "react";
import { Composition, delayRender, continueRender, staticFile } from "remotion";
import { CircularWaveform } from "./compositions/CircularWaveform";
import { RadialWaveform } from "./compositions/RadialWaveform";
import { BarWaveform } from "./compositions/BarWaveform";
import { AudioAnalysisData, VisualizationProps } from "./types/audio-data";

// Default props for preview
const defaultProps: VisualizationProps = {
  dataFile: "/data/sample.json",
  audioSrc: "/audio/sample.mp3",
  colorScheme: "blue"
};

// Default empty data for when no data file is loaded
const createEmptyData = (): AudioAnalysisData => ({
  duration: 10,
  fps: 30,
  total_frames: 300,
  frames: Array.from({ length: 300 }, (_, i) => ({
    time: i / 30,
    amplitude: Math.sin(i / 10) * 0.5 + 0.5,
    spectrum: Array.from({ length: 128 }, (_, j) =>
      Math.sin((i + j) / 5) * 0.5 + 0.5
    )
  }))
});

// Hook to load audio data with delayRender
const useAudioData = (dataFile: string): AudioAnalysisData => {
  const [data, setData] = useState<AudioAnalysisData | null>(null);
  const [handle] = useState(() => delayRender("Loading audio data"));

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use staticFile to get the correct URL
        const url = staticFile(dataFile);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
        continueRender(handle);
      } catch (error) {
        console.error("Error loading audio data:", error);
        // Use empty data as fallback
        setData(createEmptyData());
        continueRender(handle);
      }
    };

    loadData();
  }, [dataFile, handle]);

  return data || createEmptyData();
};

// Wrapper components that load data
const CircularWaveformWrapper: React.FC<VisualizationProps> = (props) => {
  const data = useAudioData(props.dataFile);
  return <CircularWaveform {...props} data={data} />;
};

const RadialWaveformWrapper: React.FC<VisualizationProps> = (props) => {
  const data = useAudioData(props.dataFile);
  return <RadialWaveform {...props} data={data} />;
};

const BarWaveformWrapper: React.FC<VisualizationProps> = (props) => {
  const data = useAudioData(props.dataFile);
  return <BarWaveform {...props} data={data} />;
};

// Calculate metadata by loading data file
const calculateMetadata = async ({ props }: { props: VisualizationProps }) => {
  try {
    const url = staticFile(props.dataFile);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.status}`);
    }
    const data: AudioAnalysisData = await response.json();
    return {
      durationInFrames: data.total_frames,
      fps: data.fps
    };
  } catch {
    return {
      durationInFrames: 300,
      fps: 30
    };
  }
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CircularWaveform"
        component={CircularWaveformWrapper}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />

      <Composition
        id="RadialWaveform"
        component={RadialWaveformWrapper}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />

      <Composition
        id="BarWaveform"
        component={BarWaveformWrapper}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
