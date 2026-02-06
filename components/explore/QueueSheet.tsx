import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import type { SongTrack } from '@/api/daydream';
import Ionicons from '@expo/vector-icons/Ionicons';

type QueueSheetProps = {
  visible: boolean;
  tracks: SongTrack[];
  onClose: () => void;
};

export function QueueSheet({ visible, tracks, onClose }: QueueSheetProps) {
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
            {tracks.map((t, i) => (
              <View key={t.audioId + i} style={styles.row}>
                <Text style={styles.trackText} numberOfLines={1}>
                  {t.songTitle} – {t.artist} – {t.album}
                </Text>
              </View>
            ))}
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trackText: {
    color: '#fff',
    fontSize: 15,
  },
});
