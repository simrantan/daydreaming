import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type SongBarProps = {
  songTitle: string;
  artist: string;
  album: string;
  onPress: () => void;
  onShuffle: () => void;
};

export function SongBar({ songTitle, artist, album, onPress, onShuffle }: SongBarProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.content} onPress={onPress}>
        <View style={styles.thumb} />
        <Text style={styles.text} numberOfLines={1}>
          {songTitle} – {artist} – {album}
        </Text>
      </Pressable>
      <Pressable style={styles.shuffleButton} onPress={onShuffle} hitSlop={8}>
        <Ionicons name="shuffle" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  shuffleButton: {
    padding: 8,
  },
});
