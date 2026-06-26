/**
 * Daydream API / service layer.
 * Uses local video/audio assets from assets/videos and assets/audio.
 * Flip USE_MOCK_DATA to false once the API provides non-null mediaUrl for all providers.
 */

const USE_MOCK_DATA = false;

const API_BASE = 'https://daydreaming-backend.anna-d9d.workers.dev/api';

export type VideoAudioSource = { uri: string } | number; // number = require() asset id

export type MoodLabel = 'calm' | 'mellow' | 'upbeat' | 'energetic';
export type VideoTheme = 'nature' | 'beach' | 'animals' | 'minimal';

// --- Raw API response shapes ---

type ApiSong = {
  id: string;
  title: string;
  provider: string;
  mediaUrl: string;
  creator: string;
  url: string;
  start: number;
  stop: number;
  length: number;
  energy: number;
  affect: number; // -2 (very calm) → +2 (very energetic)
  space: number;
};

type ApiVideo = {
  id: string;
  provider: string;
  title: string;
  creator: string;
  thumbnailUrl: string;
  length: number;
  start: number;
  stop: number;
  url: string;
  mediaUrl: string | null; // will be non-null once API is updated
  energy: number;
  affect: number;
  space: number;
};

// --- Internal types ---

export type SongTrack = {
  audioId: string;
  songTitle: string;
  artist: string;
  album?: string;
  audioSource: VideoAudioSource;
  thumbnail?: number;
  upbeat?: number;    // -2 (calmest) → +2 (most upbeat); optional until API provides tags
  mood?: MoodLabel;  // optional until API provides tags
  provider?: string;
  start?: number;
  stop?: number;
  length?: number;
};

export type VideoMeta = {
  source: VideoAudioSource;
  videoId: string;
  theme?: VideoTheme;  // optional until API provides video type tags
  title?: string;
  creator?: string;
  thumbnailUrl?: string;
  start?: number;
  stop?: number;
  provider?: string;
};

// --- Adapters: API → internal types ---

function affectToMood(affect: number): MoodLabel {
  if (affect <= -1) return 'calm';
  if (affect === 0) return 'mellow';
  if (affect === 1) return 'upbeat';
  return 'energetic';
}

function adaptSong(s: ApiSong): SongTrack {
  return {
    audioId: s.id,
    songTitle: s.title,
    artist: s.creator,
    album: s.provider,
    audioSource: { uri: s.mediaUrl },
    upbeat: s.affect,              // -2 (calmest) → +2 (most upbeat), direct from API
    mood: affectToMood(s.affect),
    provider: s.provider,
    start: s.start,
    stop: s.stop,
    length: s.length,
  };
}

function adaptVideo(v: ApiVideo): VideoMeta {
  return {
    videoId: v.id,
    source: { uri: v.mediaUrl ?? v.url }, // mediaUrl will be non-null once API is updated
    // theme not yet provided by API — left undefined
    title: v.title,
    creator: v.creator,
    thumbnailUrl: v.thumbnailUrl,
    start: v.start,
    stop: v.stop,
    provider: v.provider,
  };
}

export type DaydreamItem = {
  videoId: string;
  audioId: string;
  videoSource: VideoAudioSource;
  videoTheme?: VideoTheme;  // optional until API provides video type tags
  videoThumbnailUrl?: string;
  videoTitle?: string;
  videoCreator?: string;
  song: SongTrack;
};

// --- Local assets: videos and audio from assets/ folder
const LOCAL_VIDEO_META: VideoMeta[] = [
  { videoId: 'v1', source: require('@/assets/videos/185947-876963225_small.mp4'), theme: 'nature' },
  { videoId: 'v2', source: require('@/assets/videos/244839_small.mp4'),           theme: 'beach' },
  { videoId: 'v3', source: require('@/assets/videos/328167_small.mp4'),           theme: 'animals' },
];

const LOCAL_TRACKS: SongTrack[] = [
  {
    audioId: 'choice',
    songTitle: 'Choice',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Choice.mp3'),
    upbeat: -0.8,
    mood: 'calm',
  },
  {
    audioId: 'forward',
    songTitle: 'Forward',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Forward.mp3'),
    upbeat: 0.8,
    mood: 'upbeat',
  },
  {
    audioId: 'observation',
    songTitle: 'Observation',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Observation.mp3'),
    upbeat: -1.6,
    mood: 'calm',
  },
  {
    audioId: 'repose',
    songTitle: 'Repose',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Repose.mp3'),
    upbeat: -1.2,
    mood: 'mellow',
  },
  {
    audioId: 'reunion',
    songTitle: 'Reunion',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Reunion.mp3'),
    upbeat: 0,
    mood: 'mellow',
  },
  {
    audioId: 'wave',
    songTitle: 'Wave',
    artist: 'Ambient Themes',
    album: 'Commercial Version',
    audioSource: require('@/assets/audio/Ambient Themes/Commercial Version/MP3/Wave.mp3'),
    upbeat: 1.2,
    mood: 'energetic',
  },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Tracks the global rotation position across all getMoreDaydreams calls.
let videoRotationIndex = 0;

/** Generate `count` daydream items, rotating videos in order and randomizing songs. */
export function getMoreDaydreams(
  count: number,
  moodValue?: number,
  theme?: VideoTheme | null
): DaydreamItem[] {
  let videos = LOCAL_VIDEO_META;
  if (theme) {
    const filtered = LOCAL_VIDEO_META.filter((v) => v.theme === theme);
    if (filtered.length > 0) videos = filtered;
  }

  let tracks = [...LOCAL_TRACKS];
  if (moodValue !== undefined) {
    // moodValue 0→1 maps to upbeat -2→+2
    const targetUpbeat = (moodValue - 0.5) * 4;
    tracks.sort((a, b) => Math.abs((a.upbeat ?? 0) - targetUpbeat) - Math.abs((b.upbeat ?? 0) - targetUpbeat));
    tracks = tracks.slice(0, Math.max(1, Math.ceil(tracks.length / 2)));
  }

  return Array.from({ length: count }, () => {
    const video = videos[videoRotationIndex % videos.length];
    videoRotationIndex++;
    const song = randomItem(tracks);
    return {
      videoId: video.videoId,
      audioId: song.audioId,
      videoSource: video.source,
      videoTheme: video.theme,
      song,
    };
  });
}

/**
 * Reconstruct full DaydreamItems from stored { videoId, audioId } pairs.
 * Falls back to first video/track if an ID is no longer found.
 */
export function resolveDaydreamItems(
  pairs: { videoId?: string; audioId?: string }[]
): DaydreamItem[] {
  return pairs.map(({ videoId, audioId }) => {
    const video = LOCAL_VIDEO_META.find((v) => v.videoId === videoId) ?? LOCAL_VIDEO_META[0];
    const track = LOCAL_TRACKS.find((t) => t.audioId === audioId) ?? LOCAL_TRACKS[0];
    return {
      videoId: video.videoId,
      audioId: track.audioId,
      videoSource: video.source,
      videoTheme: video.theme,
      song: track,
    };
  });
}

// --- Public API (same shape whether mock or real).

// moodValue (0–1) → affect (-2 to +2) for API filtering
function moodToAffect(moodValue: number): number {
  return Math.round((moodValue - 0.5) * 4);
}

async function fetchRandomSong(affect?: number): Promise<SongTrack> {
  const params = affect !== undefined ? `?affect=${affect}` : '';
  const res = await fetch(`${API_BASE}/song${params}`);
  if (!res.ok) throw new Error('Failed to fetch song');
  return adaptSong(await res.json() as ApiSong);
}

async function fetchRandomVideo(affect?: number): Promise<VideoMeta> {
  const params = affect !== undefined ? `?affect=${affect}` : '';
  const res = await fetch(`${API_BASE}/video${params}`);
  if (!res.ok) throw new Error('Failed to fetch video');
  return adaptVideo(await res.json() as ApiVideo);
}

export async function getFeatured(moodValue?: number, theme?: VideoTheme | null): Promise<DaydreamItem[]> {
  if (USE_MOCK_DATA) {
    videoRotationIndex = 0;
    return Promise.resolve(getMoreDaydreams(9, moodValue, theme));
  }

  const affect = moodValue !== undefined ? moodToAffect(moodValue) : undefined;
  const count = 9;
  const pairs = await Promise.all(
    Array.from({ length: count }, () =>
      Promise.all([fetchRandomVideo(affect), fetchRandomSong(affect)])
    )
  );

  return pairs.map(([video, song]) => ({
    videoId: video.videoId,
    audioId: song.audioId,
    videoSource: video.source,
    videoTheme: video.theme,
    videoThumbnailUrl: video.thumbnailUrl,
    videoTitle: video.title,
    videoCreator: video.creator,
    song,
  }));
}

export async function getRandomDaydream(moodValue?: number): Promise<DaydreamItem> {
  const list = await getFeatured(moodValue);
  return list[Math.floor(Math.random() * list.length)];
}

export async function getNextSong(_videoId: string, moodValue?: number): Promise<SongTrack> {
  if (USE_MOCK_DATA) {
    if (moodValue !== undefined) {
      const targetUpbeat = (moodValue - 0.5) * 4;
      const sorted = [...LOCAL_TRACKS].sort(
        (a, b) => Math.abs((a.upbeat ?? 0) - targetUpbeat) - Math.abs((b.upbeat ?? 0) - targetUpbeat)
      );
      const topK = sorted.slice(0, Math.ceil(sorted.length / 2));
      return topK[Math.floor(Math.random() * topK.length)];
    }
    return LOCAL_TRACKS[Math.floor(Math.random() * LOCAL_TRACKS.length)];
  }

  const affect = moodValue !== undefined ? moodToAffect(moodValue) : undefined;
  return fetchRandomSong(affect);
}

export async function getMoreFromApi(count: number = 6, moodValue?: number): Promise<DaydreamItem[]> {
  if (USE_MOCK_DATA) return Promise.resolve(getMoreDaydreams(count, moodValue));

  const affect = moodValue !== undefined ? moodToAffect(moodValue) : undefined;
  const pairs = await Promise.all(
    Array.from({ length: count }, () =>
      Promise.all([fetchRandomVideo(affect), fetchRandomSong(affect)])
    )
  );
  return pairs.map(([video, song]) => ({
    videoId: video.videoId,
    audioId: song.audioId,
    videoSource: video.source,
    videoTheme: video.theme,
    videoThumbnailUrl: video.thumbnailUrl,
    videoTitle: video.title,
    videoCreator: video.creator,
    song,
  }));
}

export async function getQueue(_audioId: string): Promise<SongTrack[]> {
  if (USE_MOCK_DATA) {
    return Promise.resolve([...LOCAL_TRACKS]);
  }

  // Queue endpoint not yet available — fetch a handful of random songs
  const songs = await Promise.all(Array.from({ length: 6 }, fetchRandomSong));
  return songs;
}
