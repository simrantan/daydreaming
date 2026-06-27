#!/bin/bash
# Run this from the root of the daydreaming repo.
# It applies the full Expo → bare React Native migration.
set -e

echo "Applying Expo → bare React Native migration..."

# ── index.js ──────────────────────────────────────────────────────────────────
cat > index.js << 'HEREDOC'
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
HEREDOC

# ── app.json ──────────────────────────────────────────────────────────────────
cat > app.json << 'HEREDOC'
{
  "name": "DayDreaming",
  "displayName": "DayDreaming"
}
HEREDOC

# ── babel.config.js ───────────────────────────────────────────────────────────
cat > babel.config.js << 'HEREDOC'
module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
    'react-native-reanimated/plugin',
  ],
};
HEREDOC

# ── metro.config.js ───────────────────────────────────────────────────────────
cat > metro.config.js << 'HEREDOC'
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {});
HEREDOC

# ── react-native.config.js ────────────────────────────────────────────────────
cat > react-native.config.js << 'HEREDOC'
module.exports = {
  assets: ['./assets/fonts'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
};
HEREDOC

# ── tsconfig.json ─────────────────────────────────────────────────────────────
cat > tsconfig.json << 'HEREDOC'
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
HEREDOC

# ── App.tsx ───────────────────────────────────────────────────────────────────
cat > App.tsx << 'HEREDOC'
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import ExploreScreen from './app/(tabs)/index';
import SavedScreen from './app/(tabs)/saved';
import ProfileScreen from './app/(tabs)/profile';
import Colors from './constants/Colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000' },
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'compass-outline';
          if (route.name === 'Explore') iconName = 'compass-outline';
          else if (route.name === 'Saved') iconName = 'bookmark-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar barStyle="light-content" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
HEREDOC

# ── src/hooks/useAudioPlayer.ts ───────────────────────────────────────────────
mkdir -p src/hooks
cat > src/hooks/useAudioPlayer.ts << 'HEREDOC'
import { useRef, useEffect } from 'react';
import Sound from 'react-native-sound';

Sound.setCategory('Playback', true);

export type AudioSource = string | number | null;

export type AudioPlayer = {
  play: () => void;
  pause: () => void;
  replace: (source: AudioSource) => void;
  loop: boolean;
};

export function setAudioModeAsync(_options: {
  playsInSilentMode?: boolean;
  interruptionMode?: string;
}): Promise<void> {
  return Promise.resolve();
}

export function useAudioPlayer(_initialSource: AudioSource = null): AudioPlayer {
  const soundRef = useRef<Sound | null>(null);
  const loopRef = useRef(false);
  const pendingPlay = useRef(false);

  useEffect(() => {
    return () => {
      soundRef.current?.release();
    };
  }, []);

  const loadAndPlay = (source: AudioSource, playOnLoad: boolean) => {
    soundRef.current?.stop();
    soundRef.current?.release();
    soundRef.current = null;

    if (source === null) return;

    let sound: Sound;
    if (typeof source === 'number') {
      sound = new Sound(source as unknown as string, (error) => {
        if (error) return;
        sound.setNumberOfLoops(loopRef.current ? -1 : 0);
        if (playOnLoad || pendingPlay.current) {
          sound.play();
          pendingPlay.current = false;
        }
      });
    } else {
      sound = new Sound(source, '', (error) => {
        if (error) return;
        sound.setNumberOfLoops(loopRef.current ? -1 : 0);
        if (playOnLoad || pendingPlay.current) {
          sound.play();
          pendingPlay.current = false;
        }
      });
    }
    soundRef.current = sound;
  };

  const player: AudioPlayer = {
    play() {
      if (soundRef.current) {
        soundRef.current.play();
      } else {
        pendingPlay.current = true;
      }
    },
    pause() {
      soundRef.current?.pause();
      pendingPlay.current = false;
    },
    replace(source: AudioSource) {
      loadAndPlay(source, pendingPlay.current);
    },
    get loop() {
      return loopRef.current;
    },
    set loop(value: boolean) {
      loopRef.current = value;
      soundRef.current?.setNumberOfLoops(value ? -1 : 0);
    },
  };

  return player;
}
HEREDOC

# ── components/ExternalLink.tsx ───────────────────────────────────────────────
cat > components/ExternalLink.tsx << 'HEREDOC'
import React from 'react';
import { Pressable, Linking, StyleProp, ViewStyle } from 'react-native';

type Props = {
  href: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function ExternalLink({ href, style, children }: Props) {
  return (
    <Pressable style={style} onPress={() => Linking.openURL(href)}>
      {children}
    </Pressable>
  );
}
HEREDOC

# ── components/explore/VideoCard.tsx ─────────────────────────────────────────
cat > components/explore/VideoCard.tsx << 'HEREDOC'
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
HEREDOC

# ── components/explore/SavedPlayer.tsx ───────────────────────────────────────
cat > components/explore/SavedPlayer.tsx << 'HEREDOC'
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
HEREDOC

# ── components/explore/SongBar.tsx ───────────────────────────────────────────
cat > components/explore/SongBar.tsx << 'HEREDOC'
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BAR_HEIGHT = 68;
const FONT_SIZE = 17;
const MARQUEE_SPEED = 40;
const MARQUEE_PAUSE_MS = 1200;
const MARQUEE_GAP = 60;

type SongBarProps = {
  songTitle: string;
  artist: string;
  album: string;
  onPress: () => void;
  onShuffle: () => void;
  contentWidth: number;
};

function MarqueeText({ text, containerWidth }: { text: string; containerWidth: number }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    translateX.setValue(0);

    if (textWidth <= containerWidth || textWidth === 0 || containerWidth === 0) return;

    const scrollDistance = textWidth + MARQUEE_GAP;
    const duration = (scrollDistance / MARQUEE_SPEED) * 1000;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(MARQUEE_PAUSE_MS),
        Animated.timing(translateX, {
          toValue: -scrollDistance,
          duration,
          useNativeDriver: true,
        }),
        Animated.delay(MARQUEE_PAUSE_MS),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animRef.current = anim;
    anim.start();

    return () => {
      anim.stop();
    };
  }, [textWidth, containerWidth, text, translateX]);

  const shouldScroll = textWidth > containerWidth && containerWidth > 0;

  return (
    <View style={styles.marqueeContainer}>
      <Animated.Text
        style={[
          styles.marqueeText,
          shouldScroll && { transform: [{ translateX }] },
        ]}
        numberOfLines={1}
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
      >
        {text}
        {shouldScroll ? `${'  '.repeat(8)}${text}` : ''}
      </Animated.Text>
    </View>
  );
}

export function SongBar({ songTitle, artist, album, onPress, onShuffle, contentWidth }: SongBarProps) {
  const paddingH = Math.max(12, contentWidth * 0.04);
  const thumbSize = Math.round(BAR_HEIGHT * 0.52);
  const iconSize = 24;
  const textContainerWidth = contentWidth - paddingH * 2 - thumbSize - paddingH - iconSize * 2 - 24;

  const displayText = album ? `${songTitle} – ${artist} – ${album}` : `${songTitle} – ${artist}`;

  return (
    <View style={[styles.container, { height: BAR_HEIGHT, paddingHorizontal: paddingH }]}>
      <Pressable style={styles.content} onPress={onPress}>
        <View
          style={[
            styles.thumb,
            { width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2, marginRight: paddingH * 0.6 },
          ]}
        />
        <View style={[styles.textWrap, { width: textContainerWidth }]}>
          <MarqueeText text={displayText} containerWidth={textContainerWidth} />
        </View>
      </Pressable>
      <Pressable style={styles.iconButton} onPress={onShuffle} hitSlop={8}>
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
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },
  thumb: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  textWrap: {
    overflow: 'hidden',
  },
  marqueeContainer: {
    overflow: 'hidden',
  },
  marqueeText: {
    color: '#fff',
    fontSize: FONT_SIZE,
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
    flexShrink: 0,
  },
});
HEREDOC

# ── components/explore/QueueSheet.tsx ────────────────────────────────────────
cat > components/explore/QueueSheet.tsx << 'HEREDOC'
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
HEREDOC

# ── components/explore/SaveOptionsSheet.tsx ───────────────────────────────────
cat > components/explore/SaveOptionsSheet.tsx << 'HEREDOC'
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type SaveOptionsSheetProps = {
  visible: boolean;
  initialDaydreamSaved: boolean;
  initialVideoSaved: boolean;
  initialMusicSaved: boolean;
  onSave: (saveDaydream: boolean, saveVideo: boolean, saveMusic: boolean) => void;
  onClose: () => void;
};

type CheckRow = {
  key: 'daydream' | 'video' | 'music';
  label: string;
  sublabel: string;
  icon: string;
};

const ROWS: CheckRow[] = [
  { key: 'daydream', label: 'Save Daydream', sublabel: 'Video + music together', icon: 'heart-outline' },
  { key: 'video',    label: 'Save Video',    sublabel: 'Just the visuals',        icon: 'film-outline' },
  { key: 'music',    label: 'Save Music',    sublabel: 'Just the track',          icon: 'musical-notes-outline' },
];

export function SaveOptionsSheet({
  visible,
  initialDaydreamSaved,
  initialVideoSaved,
  initialMusicSaved,
  onSave,
  onClose,
}: SaveOptionsSheetProps) {
  const [saveDaydream, setSaveDaydream] = useState(initialDaydreamSaved);
  const [saveVideo, setSaveVideo] = useState(initialVideoSaved);
  const [saveMusic, setSaveMusic] = useState(initialMusicSaved);

  useEffect(() => {
    if (visible) {
      setSaveDaydream(initialDaydreamSaved);
      setSaveVideo(initialVideoSaved);
      setSaveMusic(initialMusicSaved);
    }
  }, [visible, initialDaydreamSaved, initialVideoSaved, initialMusicSaved]);

  const states = { daydream: saveDaydream, video: saveVideo, music: saveMusic };
  const setters = {
    daydream: setSaveDaydream,
    video: setSaveVideo,
    music: setSaveMusic,
  };

  const handleSave = () => {
    onSave(saveDaydream, saveVideo, saveMusic);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Save to My Daydreams</Text>

          <View style={styles.rows}>
            {ROWS.map(({ key, label, sublabel, icon }) => {
              const checked = states[key];
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => setters[key]((v) => !v)}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={styles.rowIcon}>
                    <Ionicons name={icon} size={22} color={checked ? '#fff' : 'rgba(255,255,255,0.5)'} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, checked && styles.rowLabelChecked]}>{label}</Text>
                    <Text style={styles.rowSublabel}>{sublabel}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  rows: {
    gap: 4,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  rowIcon: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  rowLabelChecked: {
    color: '#fff',
    fontWeight: '600',
  },
  rowSublabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
});
HEREDOC

# ── app/(tabs)/index.tsx ──────────────────────────────────────────────────────
cat > "app/(tabs)/index.tsx" << 'HEREDOC'
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Text,
  Modal,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from '@/src/hooks/useAudioPlayer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { getFeatured, getMoreFromApi, getNextSong, getQueue, type DaydreamItem, type SongTrack, type VideoAudioSource, type VideoTheme } from '@/api/daydream';
import { loadSavedItems, persistSavedItems, savedItemId, type SavedItem, type SaveType } from '@/api/saved';
import { VideoCard } from '@/components/explore/VideoCard';
import { QueueSheet } from '@/components/explore/QueueSheet';
import { MoodThemePicker } from '@/components/explore/MoodThemePicker';
import { SaveOptionsSheet } from '@/components/explore/SaveOptionsSheet';

function toAudioSource(source: VideoAudioSource): string | number {
  if (typeof source === 'number') return source;
  return source.uri;
}

function isSoundCloudSource(source: VideoAudioSource): source is { uri: string } {
  return typeof source !== 'number' && source.uri.includes('soundcloud.com');
}

function soundCloudWidgetUrl(trackUrl: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&buying=false&liking=false&download=false&sharing=false&visual=false`;
}

const HEADER_BAR_HEIGHT = 56;
const TAB_BAR_HEIGHT = 49;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = insets.top + HEADER_BAR_HEIGHT;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;
  const contentHeight = height - headerHeight - tabBarHeight;

  const [list, setList] = useState<DaydreamItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSongByIndex, setCurrentSongByIndex] = useState<Record<number, SongTrack>>({});
  const [queue, setQueue] = useState<SongTrack[]>([]);
  const [queueVisible, setQueueVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodValue, setMoodValue] = useState(0.5);
  const [videoTheme, setVideoTheme] = useState<VideoTheme | null>(null);
  const [moodPickerVisible, setMoodPickerVisible] = useState(false);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [saveSheetItem, setSaveSheetItem] = useState<{ item: DaydreamItem; song: SongTrack } | null>(null);

  const audioPlayer = useAudioPlayer(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, []);

  const currentItem = list[currentIndex] ?? null;
  const currentSong = currentItem
    ? (currentSongByIndex[currentIndex] ?? currentItem.song)
    : null;

  useEffect(() => {
    if (!currentSong) return;
    if (isSoundCloudSource(currentSong.audioSource)) return;
    const source = toAudioSource(currentSong.audioSource);
    audioPlayer.replace(source);
    audioPlayer.loop = true;
    audioPlayer.play();
  }, [currentSong?.audioId, currentIndex, audioPlayer]);

  const loadSaved = useCallback(async () => {
    const items = await loadSavedItems();
    setSavedItems(items);
  }, []);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const storedMood = await AsyncStorage.getItem('@daydreaming/moodValue');
        const storedTheme = await AsyncStorage.getItem('@daydreaming/videoTheme');
        if (storedMood !== null) setMoodValue(parseFloat(storedMood));
        if (storedTheme !== null) setVideoTheme(storedTheme === '' ? null : storedTheme as VideoTheme);
        setMoodPickerVisible(true);
      } catch {
        // ignore
      }
    }
    loadPrefs();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeatured(moodValue, videoTheme).then((data) => {
      if (!cancelled) {
        setList(data);
        setCurrentIndex(0);
        const initial: Record<number, SongTrack> = {};
        data.forEach((item, i) => { initial[i] = item.song; });
        setCurrentSongByIndex(initial);
        setLoading(false);
      }
    });
    loadSaved();
    return () => { cancelled = true; };
  }, [loadSaved, moodValue, videoTheme]);

  const handleShuffleForCard = useCallback(
    async (videoId: string) => {
      const next = await getNextSong(videoId, moodValue);
      setCurrentSongByIndex((prev) => ({ ...prev, [currentIndex]: next }));
    },
    [currentIndex, moodValue]
  );

  const handleSelectTrack = useCallback(
    (track: SongTrack) => {
      setCurrentSongByIndex((prev) => ({ ...prev, [currentIndex]: track }));
      setQueueVisible(false);
    },
    [currentIndex]
  );

  const appendMore = useCallback(() => {
    getMoreFromApi(6, moodValue).then((newItems) => {
      setList((prev) => {
        setCurrentSongByIndex((prevSongs) => {
          const extra: Record<number, SongTrack> = {};
          newItems.forEach((item, i) => { extra[prev.length + i] = item.song; });
          return { ...prevSongs, ...extra };
        });
        return [...prev, ...newItems];
      });
    });
  }, [moodValue]);

  const openQueue = useCallback(async () => {
    if (!currentItem) return;
    const tracks = await getQueue(currentItem.audioId);
    setQueue(tracks);
    setQueueVisible(true);
  }, [currentItem]);

  const setSaveForType = useCallback(
    (item: DaydreamItem, type: SaveType, song: SongTrack, shouldSave: boolean) => {
      setSavedItems((prev) => {
        const candidate: SavedItem = {
          type,
          videoId: type !== 'music' ? item.videoId : undefined,
          audioId: type !== 'video' ? song.audioId : undefined,
          videoTheme: type !== 'music' ? item.videoTheme : undefined,
          songTitle: type !== 'video' ? song.songTitle : undefined,
          artist: type !== 'video' ? song.artist : undefined,
          savedAt: Date.now(),
        };
        const id = savedItemId(candidate);
        const exists = prev.some((s) => savedItemId(s) === id);
        if (shouldSave && !exists) {
          const next = [candidate, ...prev];
          persistSavedItems(next);
          return next;
        }
        if (!shouldSave && exists) {
          const next = prev.filter((s) => savedItemId(s) !== id);
          persistSavedItems(next);
          return next;
        }
        return prev;
      });
    },
    []
  );

  const handleSaveOptions = useCallback(
    (saveDaydream: boolean, saveVideo: boolean, saveMusic: boolean) => {
      if (!saveSheetItem) return;
      const { item, song } = saveSheetItem;
      setSaveForType(item, 'daydream', song, saveDaydream);
      setSaveForType(item, 'video', song, saveVideo);
      setSaveForType(item, 'music', song, saveMusic);
    },
    [saveSheetItem, setSaveForType]
  );

  const isSaved = useCallback(
    (item: DaydreamItem, type: SaveType, song: SongTrack): boolean => {
      const candidate: SavedItem = {
        type,
        videoId: type !== 'music' ? item.videoId : undefined,
        audioId: type !== 'video' ? song.audioId : undefined,
        savedAt: 0,
      };
      const id = savedItemId(candidate);
      return savedItems.some((s) => savedItemId(s) === id);
    },
    [savedItems]
  );

  const isAnySaved = useCallback(
    (item: DaydreamItem, song: SongTrack): boolean =>
      isSaved(item, 'daydream', song) ||
      isSaved(item, 'video', song) ||
      isSaved(item, 'music', song),
    [isSaved]
  );

  const openSaveSheet = useCallback(
    (item: DaydreamItem, song: SongTrack) => {
      setSaveSheetItem({ item, song });
      setSaveSheetVisible(true);
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

  const isFilterActive = moodValue !== 0.5 || videoTheme !== null;

  if (loading || list.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.placeholderText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, height: headerHeight }]}>
        <Text style={styles.headerTitle}>DayDreaming</Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item, index) => `daydream-${index}-${item.videoId}-${item.audioId}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={{ marginTop: headerHeight, height: contentHeight }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / contentHeight);
          setCurrentIndex(i);
        }}
        onEndReached={appendMore}
        onEndReachedThreshold={2}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        renderItem={({ item, index }) => {
          const song = currentSongByIndex[index] ?? item.song;
          return (
            <View style={{ width, height: contentHeight }}>
              <VideoCard
                contentHeight={contentHeight}
                contentWidth={width}
                item={item}
                currentSong={song}
                onTapSongBar={openQueue}
                onShuffleNextSong={() => handleShuffleForCard(item.videoId)}
                isAnySaved={isAnySaved(item, song)}
                onOpenSaveSheet={() => openSaveSheet(item, song)}
                onOpenFilter={() => setMoodPickerVisible(true)}
                isFilterActive={isFilterActive}
                isActive={index === currentIndex}
              />
            </View>
          );
        }}
      />

      <QueueSheet
        visible={queueVisible}
        tracks={queue}
        currentAudioId={currentSong?.audioId}
        onClose={() => setQueueVisible(false)}
        onSelectTrack={handleSelectTrack}
      />

      <MoodThemePicker
        visible={moodPickerVisible}
        moodValue={moodValue}
        videoTheme={videoTheme}
        onApply={(mood, theme) => {
          setMoodValue(mood);
          setVideoTheme(theme);
          AsyncStorage.setItem('@daydreaming/moodValue', String(mood)).catch(() => {});
          AsyncStorage.setItem('@daydreaming/videoTheme', theme ?? '').catch(() => {});
        }}
        onClose={() => setMoodPickerVisible(false)}
      />

      {saveSheetItem && (
        <SaveOptionsSheet
          visible={saveSheetVisible}
          initialDaydreamSaved={isSaved(saveSheetItem.item, 'daydream', saveSheetItem.song)}
          initialVideoSaved={isSaved(saveSheetItem.item, 'video', saveSheetItem.song)}
          initialMusicSaved={isSaved(saveSheetItem.item, 'music', saveSheetItem.song)}
          onSave={handleSaveOptions}
          onClose={() => setSaveSheetVisible(false)}
        />
      )}

      {currentSong && isSoundCloudSource(currentSong.audioSource) && (
        <WebView
          key={currentSong.audioSource.uri}
          style={styles.hiddenWebView}
          source={{ uri: soundCloudWidgetUrl(currentSong.audioSource.uri) }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      )}

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
    backgroundColor: '#000',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
  hiddenWebView: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
HEREDOC

# ── app/(tabs)/saved.tsx ──────────────────────────────────────────────────────
cat > "app/(tabs)/saved.tsx" << 'HEREDOC'
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { loadSavedItems, persistSavedItems, savedItemId, type SavedItem, type SaveType } from '@/api/saved';
import { resolveDaydreamItems } from '@/api/daydream';
import { SavedPlayer } from '@/components/explore/SavedPlayer';

const TABS: { label: string; type: SaveType }[] = [
  { label: 'Daydreams', type: 'daydream' },
  { label: 'Videos', type: 'video' },
  { label: 'Music', type: 'music' },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function itemIcon(type: SaveType): string {
  if (type === 'video') return 'film-outline';
  if (type === 'music') return 'musical-notes-outline';
  return 'heart-outline';
}

function itemTitle(item: SavedItem): string {
  if (item.type === 'video') return `Video • ${item.videoTheme ?? item.videoId ?? ''}`;
  if (item.type === 'music') return item.songTitle ?? item.audioId ?? '';
  return `${item.songTitle ?? ''} + ${item.videoTheme ?? item.videoId ?? ''}`;
}

function itemSubtitle(item: SavedItem): string {
  if (item.type === 'video') return item.videoId ?? '';
  if (item.type === 'music') return item.artist ?? '';
  return item.artist ?? '';
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SaveType>('daydream');
  const [allItems, setAllItems] = useState<SavedItem[]>([]);
  const [playerVisible, setPlayerVisible] = useState(false);

  const reload = useCallback(async () => {
    const items = await loadSavedItems();
    setAllItems(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = allItems.filter((i) => i.type === activeTab);

  const daydreamItems = useMemo(
    () => resolveDaydreamItems(allItems.filter((i) => i.type === 'daydream')),
    [allItems]
  );

  const handleDelete = useCallback(
    (item: SavedItem) => {
      Alert.alert('Remove', `Remove this ${item.type} from saved?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAllItems((prev) => {
              const id = savedItemId(item);
              const next = prev.filter((s) => savedItemId(s) !== id);
              persistSavedItems(next);
              return next;
            });
          },
        },
      ]);
    },
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>My Daydreams</Text>
        {activeTab === 'daydream' && daydreamItems.length > 0 && (
          <Pressable
            style={styles.playButton}
            onPress={() => setPlayerVisible(true)}
            hitSlop={12}
          >
            <Ionicons name="play-circle" size={36} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.tabRow}>
        {TABS.map(({ label, type }) => (
          <Pressable
            key={type}
            style={[styles.tabItem, activeTab === type && styles.tabItemActive]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name={itemIcon(activeTab)} size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>
            {activeTab === 'daydream'
              ? 'No saved daydreams yet'
              : activeTab === 'video'
              ? 'No saved videos yet'
              : 'No saved music yet'}
          </Text>
          <Text style={styles.emptyHint}>
            {activeTab === 'daydream'
              ? 'Tap the heart on a video, then choose Save Daydream'
              : activeTab === 'video'
              ? 'Tap the heart on a video, then choose Save Video'
              : 'Tap the heart on a video, then choose Save Music'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => savedItemId(item) + item.savedAt}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={itemIcon(item.type)} size={28} color="#fff" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {itemTitle(item)}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {itemSubtitle(item)}
                </Text>
                <Text style={styles.cardDate}>{formatDate(item.savedAt)}</Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
                hitSlop={12}
              >
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <SavedPlayer
        visible={playerVisible}
        items={daydreamItems}
        onClose={() => setPlayerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  playButton: {
    padding: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#1c1c1e',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  cardDate: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
HEREDOC

# ── app/modal.tsx ─────────────────────────────────────────────────────────────
cat > app/modal.tsx << 'HEREDOC'
import React from 'react';
import { StatusBar, Platform, StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/modal.tsx" />
      <StatusBar barStyle={Platform.OS === 'ios' ? 'light-content' : 'default'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
HEREDOC

# ── Delete Expo-only files ─────────────────────────────────────────────────────
rm -f app/_layout.tsx
rm -f "app/(tabs)/_layout.tsx"
rm -f app/+html.tsx
rm -f app/+not-found.tsx
rm -f components/useClientOnlyValue.ts
rm -f components/useClientOnlyValue.web.ts
rm -f components/useColorScheme.web.ts
rm -f expo-env.d.ts

echo ""
echo "✓ All files written. Now install dependencies and commit:"
echo ""
echo "  npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \\"
echo "    react-native-video react-native-sound react-native-vector-icons \\"
echo "    babel-plugin-module-resolver @react-native/babel-preset @react-native/metro-config \\"
echo "    @tsconfig/react-native"
echo ""
echo "  git add ."
echo "  git commit -m 'Migrate from Expo to bare React Native'"
echo "  git push origin claude/daydreaming-xcode-error-m53nq9"
