import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const MIN_SONG_BAR_HEIGHT = 40;
const MAX_SONG_BAR_HEIGHT = 52;

type SongBarProps = {
  songTitle: string;
  artist: string;
  album: string;
  onPress: () => void;
  onShuffle: () => void;
  contentWidth: number;
};

export function SongBar({ songTitle, artist, album, onPress, onShuffle, contentWidth }: SongBarProps) {
  const barHeight = Math.min(MAX_SONG_BAR_HEIGHT, Math.max(MIN_SONG_BAR_HEIGHT, contentWidth * 0.12));
  const paddingH = Math.max(10, contentWidth * 0.04);
  const thumbSize = Math.round(barHeight * 0.7);
  const fontSize = Math.max(11, Math.min(14, contentWidth * 0.035));
  const iconSize = Math.round(barHeight * 0.55);

  return (
    <View style={[styles.container, { height: barHeight, paddingHorizontal: paddingH }]}>
      <Pressable style={styles.content} onPress={onPress}>
        <View style={[styles.thumb, { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2, marginRight: paddingH }]} />
        <Text style={[styles.text, { fontSize }]} numberOfLines={1}>
          {songTitle} – {artist} – {album}
        </Text>
      </Pressable>
      <Pressable style={styles.shuffleButton} onPress={onShuffle} hitSlop={8}>
        <Ionicons name="shuffle" size={iconSize} color="#fff" />
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  thumb: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  text: {
    color: '#fff',
    flex: 1,
  },
  shuffleButton: {
    padding: 6,
  },
});
