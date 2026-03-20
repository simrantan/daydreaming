import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVED_KEY = '@daydreaming/saved_v2';

export type SaveType = 'daydream' | 'video' | 'music';

export type SavedItem = {
  type: SaveType;
  videoId?: string;
  audioId?: string;
  videoTheme?: string;
  songTitle?: string;
  artist?: string;
  savedAt: number;
};

export function savedItemId(item: SavedItem): string {
  return `${item.type}:${item.videoId ?? ''}:${item.audioId ?? ''}`;
}

export async function loadSavedItems(): Promise<SavedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw) as SavedItem[];
  } catch {
    // ignore
  }
  return [];
}

export async function persistSavedItems(items: SavedItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
