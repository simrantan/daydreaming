import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Pressable,
  Text,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeatured, getNextSong, getQueue, type DaydreamItem, type SongTrack } from '@/api/daydream';
import { VideoCard } from '@/components/explore/VideoCard';
import { QueueSheet } from '@/components/explore/QueueSheet';

const SAVED_DAYDREAMS_KEY = '@daydreaming/saved';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<DaydreamItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSongByIndex, setCurrentSongByIndex] = useState<Record<number, SongTrack>>({});
  const [queue, setQueue] = useState<SongTrack[]>([]);
  const [queueVisible, setQueueVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_DAYDREAMS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setSavedIds(new Set(arr));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFeatured().then((data) => {
      if (!cancelled) {
        setList(data);
        data.forEach((item, i) => {
          setCurrentSongByIndex((prev) => ({
            ...prev,
            [i]: item.song,
          }));
        });
        setLoading(false);
      }
    });
    loadSaved();
    return () => { cancelled = true; };
  }, [loadSaved]);

  const currentItem = list[currentIndex] ?? null;
  const currentSong = currentItem
    ? (currentSongByIndex[currentIndex] ?? currentItem.song)
    : null;

  const handleShuffleForCard = useCallback(
    async (videoId: string) => {
      const next = await getNextSong(videoId);
      setCurrentSongByIndex((prev) => ({ ...prev, [currentIndex]: next }));
    },
    [currentIndex]
  );

  const openQueue = useCallback(async () => {
    if (!currentItem) return;
    const tracks = await getQueue(currentItem.audioId);
    setQueue(tracks);
    setQueueVisible(true);
  }, [currentItem]);

  const toggleSave = useCallback(
    async (item: DaydreamItem) => {
      const id = `${item.videoId}-${item.audioId}`;
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        AsyncStorage.setItem(SAVED_DAYDREAMS_KEY, JSON.stringify([...next]));
        return next;
      });
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

  if (loading || list.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  const { height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>DayDreaming</Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => `${item.videoId}-${item.audioId}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / height);
          setCurrentIndex(i);
        }}
        renderItem={({ item, index }) => (
          <View style={{ height }}>
            <VideoCard
              item={item}
              currentSong={
                currentSongByIndex[index] ?? item.song
                  ? {
                      songTitle: (currentSongByIndex[index] ?? item.song).songTitle,
                      artist: (currentSongByIndex[index] ?? item.song).artist,
                      album: (currentSongByIndex[index] ?? item.song).album,
                    }
                  : { songTitle: '', artist: '', album: '' }
              }
              onTapSongBar={openQueue}
              onShuffleNextSong={() => handleShuffleForCard(item.videoId)}
              isSaved={savedIds.has(`${item.videoId}-${item.audioId}`)}
              onToggleSave={() => toggleSave(item)}
              isActive={index === currentIndex}
            />
          </View>
        )}
      />

      <QueueSheet
        visible={queueVisible}
        tracks={queue}
        onClose={() => setQueueVisible(false)}
      />

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
    backgroundColor: '#fff',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});
