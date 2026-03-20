import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { SongTrack } from '@/api/daydream';

type QueueSheetProps = {
  visible: boolean;
  tracks: SongTrack[];
  currentAudioId?: string;
  onClose: () => void;
  onSelectTrack: (track: SongTrack) => void;
};

export function QueueSheet({ visible, tracks, currentAudioId, onClose, onSelectTrack }: QueueSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Pressable onPress={onClose}>
            <View style={styles.handle} />
          </Pressable>
          <Text style={styles.title}>Up next</Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {tracks.map((t, i) => {
              const isPlaying = t.audioId === currentAudioId;
              return (
                <Pressable
                  key={t.audioId + i}
                  style={({ pressed }) => [
                    styles.row,
                    isPlaying && styles.rowActive,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => onSelectTrack(t)}
                >
                  <Ionicons
                    name={isPlaying ? 'musical-notes' : 'musical-note-outline'}
                    size={18}
                    color={isPlaying ? '#fff' : 'rgba(255,255,255,0.5)'}
                    style={styles.rowIcon}
                  />
                  <Text
                    style={[styles.trackText, isPlaying && styles.trackTextActive]}
                    numberOfLines={1}
                  >
                    {t.songTitle} – {t.artist}
                  </Text>
                  {isPlaying && (
                    <Ionicons name="volume-medium" size={16} color="#fff" style={styles.playingIcon} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  rowActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  rowIcon: {
    marginRight: 10,
    width: 20,
  },
  playingIcon: {
    marginLeft: 8,
  },
  trackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    flex: 1,
  },
  trackTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
