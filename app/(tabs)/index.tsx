import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Text,
  Modal,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeatured, getNextSong, getQueue, type DaydreamItem, type SongTrack, type VideoAudioSource, type VideoTheme } from '@/api/daydream';
import { loadSavedItems, persistSavedItems, savedItemId, type SavedItem, type SaveType } from '@/api/saved';
import { VideoCard } from '@/components/explore/VideoCard';
import { QueueSheet } from '@/components/explore/QueueSheet';
import { MoodThemePicker } from '@/components/explore/MoodThemePicker';
import { SaveOptionsSheet } from '@/components/explore/SaveOptionsSheet';

function toAudioSource(source: VideoAudioSource): string | number {
  if (typeof source === 'number') return source;
  return source.uri;
}

const HEADER_BAR_HEIGHT = 56;
const TAB_BAR_HEIGHT = 49;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = insets.top + HEADER_BAR_HEIGHT;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;
  const contentHeight = height - headerHeight - tabBarHeight;

  const [list, setList] = useState<DaydreamItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSongByIndex, setCurrentSongByIndex] = useState<Record<number, SongTrack>>({});
  const [queue, setQueue] = useState<SongTrack[]>([]);
  const [queueVisible, setQueueVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodValue, setMoodValue] = useState(0.5);
  const [videoTheme, setVideoTheme] = useState<VideoTheme | null>(null);
  const [moodPickerVisible, setMoodPickerVisible] = useState(false);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [saveSheetItem, setSaveSheetItem] = useState<{ item: DaydreamItem; song: SongTrack } | null>(null);

  const audioPlayer = useAudioPlayer(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentSong) return;
    const source = toAudioSource(currentSong.audioSource);
    audioPlayer.replace(source);
    audioPlayer.loop = true;
    audioPlayer.play();
  }, [currentSong?.audioId, currentIndex, audioPlayer]);

  const loadSaved = useCallback(async () => {
    const items = await loadSavedItems();
    setSavedItems(items);
  }, []);

  // Load persisted preferences; auto-open picker if first launch
  useEffect(() => {
    async function loadPrefs() {
      try {
        const storedMood = await AsyncStorage.getItem('@daydreaming/moodValue');
        const storedTheme = await AsyncStorage.getItem('@daydreaming/videoTheme');
        if (storedMood !== null) setMoodValue(parseFloat(storedMood));
        if (storedTheme !== null) setVideoTheme(storedTheme === '' ? null : storedTheme as VideoTheme);

        // Always show the picker on launch so user can set mood/theme
        setMoodPickerVisible(true);
      } catch {
        // ignore
      }
    }
    loadPrefs();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeatured(moodValue, videoTheme).then((data) => {
      if (!cancelled) {
        setList(data);
        setCurrentIndex(0);
        const initial: Record<number, SongTrack> = {};
        data.forEach((item, i) => { initial[i] = item.song; });
        setCurrentSongByIndex(initial);
        setLoading(false);
      }
    });
    loadSaved();
    return () => { cancelled = true; };
  }, [loadSaved, moodValue, videoTheme]);

  const currentItem = list[currentIndex] ?? null;
  const currentSong = currentItem
    ? (currentSongByIndex[currentIndex] ?? currentItem.song)
    : null;

  const handleShuffleForCard = useCallback(
    async (videoId: string) => {
      const next = await getNextSong(videoId, moodValue);
      setCurrentSongByIndex((prev) => ({ ...prev, [currentIndex]: next }));
    },
    [currentIndex, moodValue]
  );

  const handleSelectTrack = useCallback(
    (track: SongTrack) => {
      setCurrentSongByIndex((prev) => ({ ...prev, [currentIndex]: track }));
      setQueueVisible(false);
    },
    [currentIndex]
  );

  const openQueue = useCallback(async () => {
    if (!currentItem) return;
    const tracks = await getQueue(currentItem.audioId);
    setQueue(tracks);
    setQueueVisible(true);
  }, [currentItem]);

  const setSaveForType = useCallback(
    (item: DaydreamItem, type: SaveType, song: SongTrack, shouldSave: boolean) => {
      setSavedItems((prev) => {
        const candidate: SavedItem = {
          type,
          videoId: type !== 'music' ? item.videoId : undefined,
          audioId: type !== 'video' ? song.audioId : undefined,
          videoTheme: type !== 'music' ? item.videoTheme : undefined,
          songTitle: type !== 'video' ? song.songTitle : undefined,
          artist: type !== 'video' ? song.artist : undefined,
          savedAt: Date.now(),
        };
        const id = savedItemId(candidate);
        const exists = prev.some((s) => savedItemId(s) === id);
        if (shouldSave && !exists) {
          const next = [candidate, ...prev];
          persistSavedItems(next);
          return next;
        }
        if (!shouldSave && exists) {
          const next = prev.filter((s) => savedItemId(s) !== id);
          persistSavedItems(next);
          return next;
        }
        return prev;
      });
    },
    []
  );

  const handleSaveOptions = useCallback(
    (saveDaydream: boolean, saveVideo: boolean, saveMusic: boolean) => {
      if (!saveSheetItem) return;
      const { item, song } = saveSheetItem;
      setSaveForType(item, 'daydream', song, saveDaydream);
      setSaveForType(item, 'video', song, saveVideo);
      setSaveForType(item, 'music', song, saveMusic);
    },
    [saveSheetItem, setSaveForType]
  );

  const isSaved = useCallback(
    (item: DaydreamItem, type: SaveType, song: SongTrack): boolean => {
      const candidate: SavedItem = {
        type,
        videoId: type !== 'music' ? item.videoId : undefined,
        audioId: type !== 'video' ? song.audioId : undefined,
        savedAt: 0,
      };
      const id = savedItemId(candidate);
      return savedItems.some((s) => savedItemId(s) === id);
    },
    [savedItems]
  );

  const isAnySaved = useCallback(
    (item: DaydreamItem, song: SongTrack): boolean =>
      isSaved(item, 'daydream', song) ||
      isSaved(item, 'video', song) ||
      isSaved(item, 'music', song),
    [isSaved]
  );

  const openSaveSheet = useCallback(
    (item: DaydreamItem, song: SongTrack) => {
      setSaveSheetItem({ item, song });
      setSaveSheetVisible(true);
    },
    []
  );

  const handleShare = useCallback(async () => {
    setMenuVisible(false);
    if (!currentItem) return;
    try {
      await Share.share({
        message: `Daydream: ${currentSong?.songTitle ?? ''} – ${currentSong?.artist ?? ''}`,
        title: 'DayDreaming',
      });
    } catch {
      // user dismissed
    }
  }, [currentItem, currentSong]);

  const handleReport = useCallback(() => {
    setMenuVisible(false);
    Alert.alert('Report', 'Report option placeholder. Connect to your backend when ready.');
  }, []);

  const handleOtherActions = useCallback(() => {
    setMenuVisible(false);
    Alert.alert('Other Actions', 'Other actions placeholder.');
  }, []);

  const isFilterActive = moodValue !== 0.5 || videoTheme !== null;

  if (loading || list.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, height: headerHeight }]}>
        <Text style={styles.headerTitle}>DayDreaming</Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item, index) => `daydream-${index}-${item.videoId}-${item.audioId}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={{ marginTop: headerHeight, height: contentHeight }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / contentHeight);
          setCurrentIndex(i);
        }}
        renderItem={({ item, index }) => {
          const song = currentSongByIndex[index] ?? item.song;
          return (
            <View style={{ width, height: contentHeight }}>
              <VideoCard
                contentHeight={contentHeight}
                contentWidth={width}
                item={item}
                currentSong={song}
                onTapSongBar={openQueue}
                onShuffleNextSong={() => handleShuffleForCard(item.videoId)}
                isAnySaved={isAnySaved(item, song)}
                onOpenSaveSheet={() => openSaveSheet(item, song)}
                onOpenFilter={() => setMoodPickerVisible(true)}
                isFilterActive={isFilterActive}
                isActive={index === currentIndex}
              />
            </View>
          );
        }}
      />

      <QueueSheet
        visible={queueVisible}
        tracks={queue}
        currentAudioId={currentSong?.audioId}
        onClose={() => setQueueVisible(false)}
        onSelectTrack={handleSelectTrack}
      />

      <MoodThemePicker
        visible={moodPickerVisible}
        moodValue={moodValue}
        videoTheme={videoTheme}
        onApply={(mood, theme) => {
          setMoodValue(mood);
          setVideoTheme(theme);
          AsyncStorage.setItem('@daydreaming/moodValue', String(mood)).catch(() => {});
          AsyncStorage.setItem('@daydreaming/videoTheme', theme ?? '').catch(() => {});
        }}
        onClose={() => setMoodPickerVisible(false)}
      />

      {saveSheetItem && (
        <SaveOptionsSheet
          visible={saveSheetVisible}
          initialDaydreamSaved={isSaved(saveSheetItem.item, 'daydream', saveSheetItem.song)}
          initialVideoSaved={isSaved(saveSheetItem.item, 'video', saveSheetItem.song)}
          initialMusicSaved={isSaved(saveSheetItem.item, 'music', saveSheetItem.song)}
          onSave={handleSaveOptions}
          onClose={() => setSaveSheetVisible(false)}
        />
      )}

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuPopover}>
            <Pressable style={styles.menuItem} onPress={handleShare}>
              <Text style={styles.menuItemText}>Share</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleReport}>
              <Text style={styles.menuItemText}>Report</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleOtherActions}>
              <Text style={styles.menuItemText}>Other Actions</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  menuButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 24,
  },
  menuPopover: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
});
