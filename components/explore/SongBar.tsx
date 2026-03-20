import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const BAR_HEIGHT = 68;
const FONT_SIZE = 17;
const MARQUEE_SPEED = 40; // pts per second
const MARQUEE_PAUSE_MS = 1200;
const MARQUEE_GAP = 60; // gap between repetitions

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
  // Reserve space: thumb + gap + two icon buttons
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
