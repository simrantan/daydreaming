import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from '@/src/hooks/useAudioPlayer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { DaydreamItem, SongTrack } from '@/api/daydream';
import { VideoCard } from './VideoCard';

type SavedPlayerProps = {
  visible: boolean;
  items: DaydreamItem[];
  onClose: () => void;
};

const LOOP_REPS = 50;

function toAudioSource(source: DaydreamItem['song']['audioSource']): string | number {
  if (typeof source === 'number') return source;
  return source.uri;
}

export function SavedPlayer({ visible, items, onClose }: SavedPlayerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songByIndex, setSongByIndex] = useState<Record<number, SongTrack>>({});

  const audioPlayer = useAudioPlayer(null);

  const loopedItems: DaydreamItem[] = items.length > 0
    ? Array.from({ length: LOOP_REPS * items.length }, (_, i) => items[i % items.length])
    : [];

  const currentItem = loopedItems[currentIndex] ?? null;
  const currentSong = currentItem
    ? (songByIndex[currentIndex] ?? currentItem.song)
    : null;

  useEffect(() => {
    if (visible) {
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
    }
  }, [visible]);

  useEffect(() => {
    if (!currentSong || !visible) return;
    audioPlayer.replace(toAudioSource(currentSong.audioSource));
    audioPlayer.loop = true;
    audioPlayer.play();
  }, [currentSong?.audioId, currentIndex, visible, audioPlayer]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setSongByIndex({});
    } else {
      audioPlayer.pause();
    }
  }, [visible, audioPlayer]);

  if (!visible || items.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <FlatList
          data={loopedItems}
          keyExtractor={(_, index) => `saved-player-${index}`}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          style={{ width, height }}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.y / height);
            setCurrentIndex(i);
          }}
          renderItem={({ item, index }) => {
            const song = songByIndex[index] ?? item.song;
            return (
              <View style={{ width, height }}>
                <VideoCard
                  contentHeight={height}
                  contentWidth={width}
                  item={item}
                  currentSong={song}
                  onTapSongBar={() => {}}
                  onShuffleNextSong={() => {}}
                  isAnySaved={true}
                  onOpenSaveSheet={() => {}}
                  onOpenFilter={() => {}}
                  isFilterActive={false}
                  isActive={index === currentIndex}
                />
              </View>
            );
          }}
        />

        <Pressable
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={16}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 7,
  },
});
