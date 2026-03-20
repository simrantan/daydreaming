import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { DaydreamItem, SongTrack, VideoAudioSource } from '@/api/daydream';
import { SongBar } from './SongBar';

function videoSourceToExpoSource(source: VideoAudioSource): string | number {
  if (typeof source === 'number') return source;
  return source.uri;
}

type VideoCardProps = {
  item: DaydreamItem;
  currentSong: SongTrack;
  onTapSongBar: () => void;
  onShuffleNextSong: () => void;
  isAnySaved: boolean;
  onOpenSaveSheet: () => void;
  onOpenFilter: () => void;
  isFilterActive: boolean;
  isActive?: boolean;
  contentHeight: number;
  contentWidth: number;
};

export function VideoCard({
  item,
  currentSong,
  onTapSongBar,
  onShuffleNextSong,
  isAnySaved,
  onOpenSaveSheet,
  onOpenFilter,
  isFilterActive,
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

      {/* Top-left: filter icon */}
      <Pressable style={styles.filterIconButton} onPress={onOpenFilter} hitSlop={12}>
        <Ionicons name="options" size={32} color="#fff" />
      </Pressable>

      {/* Top-right: heart */}
      <Pressable style={styles.heartButton} onPress={onOpenSaveSheet} hitSlop={12}>
        <Ionicons
          name={isAnySaved ? 'heart' : 'heart-outline'}
          size={32}
          color={isAnySaved ? '#e74c3c' : '#fff'}
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
  filterIconButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 4,
    zIndex: 10,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
});
