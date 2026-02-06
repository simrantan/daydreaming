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
  contentHeight: number;
  contentWidth: number;
};

export function VideoCard({
  item,
  currentSong,
  onTapSongBar,
  onShuffleNextSong,
  isSaved,
  onToggleSave,
  isActive = true,
  contentHeight,
  contentWidth,
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

  const containerStyle = { width: contentWidth, height: contentHeight };

  return (
    <View style={[styles.container, containerStyle]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <Pressable style={styles.heartButton} onPress={onToggleSave} hitSlop={12}>
        <Ionicons
          name={isSaved ? 'heart' : 'heart-outline'}
          size={28}
          color={isSaved ? '#e74c3c' : '#fff'}
        />
      </Pressable>
      <SongBar
        songTitle={currentSong.songTitle}
        artist={currentSong.artist}
        album={currentSong.album}
        onPress={onTapSongBar}
        onShuffle={onShuffleNextSong}
        contentWidth={contentWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
});
