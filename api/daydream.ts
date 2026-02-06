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

export type SongTrack = {
  audioId: string;
  songTitle: string;
  artist: string;
  album: string;
  audioSource: VideoAudioSource;
  thumbnail?: number; // require() for image
};

export type DaydreamItem = {
  videoId: string;
  audioId: string;
  videoSource: VideoAudioSource;
  song: SongTrack;
};

// --- Local assets: videos and audio from assets/ folder
const LOCAL_VIDEOS = [
  require('@/assets/videos/185947-876963225_small.mp4'),
  require('@/assets/videos/244839_small.mp4'),
  require('@/assets/videos/328167_small.mp4'),
];

const LOCAL_TRACKS: SongTrack[] = [
  {
    audioId: 'choice',
    songTitle: 'Choice',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Choice.mp3'),
  },
  {
    audioId: 'forward',
    songTitle: 'Forward',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Forward.mp3'),
  },
  {
    audioId: 'observation',
    songTitle: 'Observation',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Observation.mp3'),
  },
  {
    audioId: 'repose',
    songTitle: 'Repose',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Repose.mp3'),
  },
  {
    audioId: 'reunion',
    songTitle: 'Reunion',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Reunion.mp3'),
  },
  {
    audioId: 'wave',
    songTitle: 'Wave',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Wave.mp3'),
  },
];

function buildMockDaydreamList(): DaydreamItem[] {
  return LOCAL_VIDEOS.flatMap((videoSource, vi) =>
    LOCAL_TRACKS.map((song, si) => ({
      videoId: `v${vi + 1}`,
      audioId: song.audioId,
      videoSource,
      song,
    }))
  ).slice(0, 9); // 9 cards: each of 3 videos paired with 3 different tracks
}

const MOCK_DAYDREAMS = buildMockDaydreamList();

// --- Public API (same shape whether mock or real).

export async function getFeatured(): Promise<DaydreamItem[]> {
  if (USE_MOCK_DATA) {
    return Promise.resolve(MOCK_DAYDREAMS);
  }

  // When API is available, uncomment and adjust:
  // const res = await fetch(`${API_BASE}/featured`);
  // if (!res.ok) throw new Error('Failed to fetch featured');
  // const data = await res.json();
  // return data as DaydreamItem[];
  return Promise.resolve(MOCK_DAYDREAMS);
}

export async function getRandomDaydream(): Promise<DaydreamItem> {
  if (USE_MOCK_DATA) {
    const list = await getFeatured();
    return list[Math.floor(Math.random() * list.length)];
  }

  // const res = await fetch(`${API_BASE}/random`);
  // if (!res.ok) throw new Error('Failed to fetch random daydream');
  // return res.json();
  const list = await getFeatured();
  return list[Math.floor(Math.random() * list.length)];
}

export async function getNextSong(_videoId: string): Promise<SongTrack> {
  if (USE_MOCK_DATA) {
    return LOCAL_TRACKS[Math.floor(Math.random() * LOCAL_TRACKS.length)];
  }

  // const res = await fetch(`${API_BASE}/next-song?videoId=${encodeURIComponent(videoId)}`);
  // if (!res.ok) throw new Error('Failed to fetch next song');
  // return res.json();
  return LOCAL_TRACKS[Math.floor(Math.random() * LOCAL_TRACKS.length)];
}

export async function getQueue(_audioId: string): Promise<SongTrack[]> {
  if (USE_MOCK_DATA) {
    return Promise.resolve([...LOCAL_TRACKS]);
  }

  // const res = await fetch(`${API_BASE}/queue?audioId=${encodeURIComponent(audioId)}`);
  // if (!res.ok) throw new Error('Failed to fetch queue');
  // const data = await res.json();
  // return data as SongTrack[];
  return Promise.resolve([...LOCAL_TRACKS]);
}
