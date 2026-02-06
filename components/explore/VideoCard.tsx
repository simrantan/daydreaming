import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { DaydreamItem, VideoAudioSource } from '@/api/daydream';
import { SongBar } from './SongBar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

function videoSourceToExpoSource(source: VideoAudioSource): string | number {
  if (typeof source === 'number') return source;
  return source.uri;
}

type VideoCardProps = {
  item: DaydreamItem;
  currentSong: { songTitle: string; artist: string; album: string };
  onTapSongBar: () => void;
  onShuffleNextSong: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  isActive?: boolean;
};

export function VideoCard({
  item,
  currentSong,
  onTapSongBar,
  onShuffleNextSong,
  isSaved,
  onToggleSave,
  isActive = true,
}: VideoCardProps) {
  const source = videoSourceToExpoSource(item.videoSource);
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  return (
    <View style={styles.container}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable style={styles.heartButton} onPress={onToggleSave} hitSlop={12}>
        <Ionicons
          name={isSaved ? 'heart' : 'heart-outline'}
          size={32}
          color={isSaved ? '#e74c3c' : '#fff'}
        />
      </Pressable>
      <SongBar
        songTitle={currentSong.songTitle}
        artist={currentSong.artist}
        album={currentSong.album}
        onPress={onTapSongBar}
        onShuffle={onShuffleNextSong}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
});
