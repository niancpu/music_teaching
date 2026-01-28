export interface Track {
  id: string;
  name: string;
  section: string;
  icon: string;
  audioFile: string;
  scoreFile?: string;
}

export interface Song {
  slug: string;
  title: string;
  composer: string;
  description: string;
  category: 'classical' | 'folk';
  icon: string;
  iconColor: string;
  totalAudio: string;
  totalScore?: string;
  tracks: Track[];
}
