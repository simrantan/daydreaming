/**
 * Daydream API / service layer.
 * Uses local video/audio assets from assets/videos and assets/audio.
 * When you have the real API: set USE_MOCK_DATA = false and uncomment the fetch implementations below.
 */

// Set to false when you have API base URL and want to use real endpoints.
const USE_MOCK_DATA = true;

// When API is available, set this and use in the commented fetch calls.
// const API_BASE = 'https://staging.daydreaming.com/api'; // example

export type VideoAudioSource = { uri: string } | number; // number = require() asset id

export type MoodLabel = 'calm' | 'mellow' | 'upbeat' | 'energetic';
export type VideoTheme = 'nature' | 'city' | 'abstract' | 'minimal';

export type SongTrack = {
  audioId: string;
  songTitle: string;
  artist: string;
  album: string;
  audioSource: VideoAudioSource;
  thumbnail?: number;
  calmness: number;   // 0 = very upbeat → 1 = very calm
  mood: MoodLabel;
};

export type VideoMeta = {
  source: VideoAudioSource;
  videoId: string;
  theme: VideoTheme;
};

export type DaydreamItem = {
  videoId: string;
  audioId: string;
  videoSource: VideoAudioSource;
  videoTheme: VideoTheme;
  song: SongTrack;
};

// --- Local assets: videos and audio from assets/ folder
const LOCAL_VIDEO_META: VideoMeta[] = [
  { videoId: 'v1', source: require('@/assets/videos/185947-876963225_small.mp4'), theme: 'nature' },
  { videoId: 'v2', source: require('@/assets/videos/244839_small.mp4'),           theme: 'city' },
  { videoId: 'v3', source: require('@/assets/videos/328167_small.mp4'),           theme: 'abstract' },
];

const LOCAL_TRACKS: SongTrack[] = [
  {
    audioId: 'choice',
    songTitle: 'Choice',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Choice.mp3'),
    calmness: 0.7,
    mood: 'calm',
  },
  {
    audioId: 'forward',
    songTitle: 'Forward',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Forward.mp3'),
    calmness: 0.3,
    mood: 'upbeat',
  },
  {
    audioId: 'observation',
    songTitle: 'Observation',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Observation.mp3'),
    calmness: 0.9,
    mood: 'calm',
  },
  {
    audioId: 'repose',
    songTitle: 'Repose',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Repose.mp3'),
    calmness: 0.8,
    mood: 'mellow',
  },
  {
    audioId: 'reunion',
    songTitle: 'Reunion',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Reunion.mp3'),
    calmness: 0.5,
    mood: 'mellow',
  },
  {
    audioId: 'wave',
    songTitle: 'Wave',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Wave.mp3'),
    calmness: 0.2,
    mood: 'energetic',
  },
];

function buildMockDaydreamList(moodValue?: number, theme?: VideoTheme | null): DaydreamItem[] {
  let videos = LOCAL_VIDEO_META;
  if (theme) {
    videos = LOCAL_VIDEO_META.filter((v) => v.theme === theme);
    if (videos.length === 0) videos = LOCAL_VIDEO_META;
  }

  let tracks = [...LOCAL_TRACKS];
  if (moodValue !== undefined) {
    const target = 1 - moodValue;
    tracks.sort((a, b) => Math.abs(a.calmness - target) - Math.abs(b.calmness - target));
  }

  const count = Math.max(videos.length * 3, 9);
  return Array.from({ length: count }, (_, i) => {
    const video = videos[i % videos.length];
    const song = tracks[i % tracks.length];
    return {
      videoId: video.videoId,
      audioId: song.audioId,
      videoSource: video.source,
      videoTheme: video.theme,
      song,
    };
  });
}

// --- Public API (same shape whether mock or real).

export async function getFeatured(moodValue?: number, theme?: VideoTheme | null): Promise<DaydreamItem[]> {
  if (USE_MOCK_DATA) {
    return Promise.resolve(buildMockDaydreamList(moodValue, theme));
  }

  // When API is available, uncomment and adjust:
  // const params = new URLSearchParams();
  // if (moodValue !== undefined) params.set('mood', String(moodValue));
  // if (theme) params.set('theme', theme);
  // const res = await fetch(`${API_BASE}/featured?${params}`);
  // if (!res.ok) throw new Error('Failed to fetch featured');
  // return res.json() as Promise<DaydreamItem[]>;
  return Promise.resolve(buildMockDaydreamList(moodValue, theme));
}

export async function getRandomDaydream(moodValue?: number): Promise<DaydreamItem> {
  const list = await getFeatured(moodValue);
  return list[Math.floor(Math.random() * list.length)];
}

export async function getNextSong(_videoId: string, moodValue?: number): Promise<SongTrack> {
  if (USE_MOCK_DATA) {
    if (moodValue !== undefined) {
      const sorted = [...LOCAL_TRACKS].sort(
        (a, b) => Math.abs(a.calmness - (1 - moodValue)) - Math.abs(b.calmness - (1 - moodValue))
      );
      const topK = sorted.slice(0, Math.ceil(sorted.length / 2));
      return topK[Math.floor(Math.random() * topK.length)];
    }
    return LOCAL_TRACKS[Math.floor(Math.random() * LOCAL_TRACKS.length)];
  }

  // const res = await fetch(`${API_BASE}/next-song?videoId=${encodeURIComponent(_videoId)}`);
  // if (!res.ok) throw new Error('Failed to fetch next song');
  // return res.json();
  return LOCAL_TRACKS[Math.floor(Math.random() * LOCAL_TRACKS.length)];
}

export async function getQueue(_audioId: string): Promise<SongTrack[]> {
  if (USE_MOCK_DATA) {
    return Promise.resolve([...LOCAL_TRACKS]);
  }

  // const res = await fetch(`${API_BASE}/queue?audioId=${encodeURIComponent(_audioId)}`);
  // if (!res.ok) throw new Error('Failed to fetch queue');
  // return res.json() as Promise<SongTrack[]>;
  return Promise.resolve([...LOCAL_TRACKS]);
}
