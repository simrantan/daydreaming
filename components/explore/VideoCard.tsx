import React from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { DaydreamItem, SongTrack, VideoAudioSource } from '@/api/daydream';
import { SongBar } from './SongBar';
import { VimeoPlayer } from './VimeoPlayer';

function isVimeoSource(source: VideoAudioSource): source is { uri: string } {
  return typeof source !== 'number' && source.uri.includes('vimeo.com');
}

function LocalVideoPlayer({
  source,
  isActive,
}: {
  source: number;
  isActive: boolean;
}) {
  return (
    <Video
      source={source}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      repeat
      muted
      paused={!isActive}
      controls={false}
      ignoreSilentSwitch="ignore"
    />
  );
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
  const containerStyle = { width: contentWidth, height: contentHeight };
  const source = item.videoSource;

  return (
    <View style={[styles.container, containerStyle]}>
      {isVimeoSource(source) ? (
        isActive ? (
          <VimeoPlayer url={source.uri} isActive={isActive} style={StyleSheet.absoluteFill} />
        ) : (
          item.videoThumbnailUrl ? (
            <Image
              source={{ uri: item.videoThumbnailUrl }}
              style={[StyleSheet.absoluteFill, styles.thumbnail]}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.thumbnailFallback]} />
          )
        )
      ) : (
        <LocalVideoPlayer source={source as number} isActive={isActive} />
      )}

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
  thumbnail: {
    backgroundColor: '#000',
  },
  thumbnailFallback: {
    backgroundColor: '#111',
  },
});
