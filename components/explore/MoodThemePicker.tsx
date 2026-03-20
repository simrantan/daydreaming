import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  PanResponder,
  Animated,
} from 'react-native';
import type { VideoTheme } from '@/api/daydream';

const THEMES: { label: string; value: VideoTheme | null }[] = [
  { label: 'All', value: null },
  { label: 'Nature', value: 'nature' },
  { label: 'City', value: 'city' },
  { label: 'Abstract', value: 'abstract' },
  { label: 'Minimal', value: 'minimal' },
];

const THUMB_SIZE = 30;
const TRACK_HEIGHT = 6;
const TRACK_CONTAINER_HEIGHT = 56;

type MoodThemePickerProps = {
  visible: boolean;
  moodValue: number;            // current applied value (0 = calm, 1 = upbeat)
  videoTheme: VideoTheme | null;
  onApply: (mood: number, theme: VideoTheme | null) => void;
  onClose: () => void;
};

function getMoodLabel(val: number): string {
  if (val < 0.25) return 'Calm';
  if (val < 0.5) return 'Mellow';
  if (val < 0.75) return 'Upbeat';
  return 'Energetic';
}

export function MoodThemePicker({
  visible,
  moodValue,
  videoTheme,
  onApply,
  onClose,
}: MoodThemePickerProps) {
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);
  const trackContainerRef = useRef<View>(null);

  // Draft state — only committed when Apply is pressed
  const draftMoodRef = useRef(moodValue);
  const [draftTheme, setDraftTheme] = useState<VideoTheme | null>(videoTheme);
  const [moodLabel, setMoodLabel] = useState(getMoodLabel(moodValue));

  // Animated value drives the thumb position visually (never triggers re-render)
  const animX = useRef(new Animated.Value(moodValue)).current;

  // Reset drafts to current applied values each time the sheet opens
  useEffect(() => {
    if (visible) {
      draftMoodRef.current = moodValue;
      animX.setValue(moodValue);
      setMoodLabel(getMoodLabel(moodValue));
      setDraftTheme(videoTheme);
    }
  }, [visible, moodValue, videoTheme, animX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Use absolute screen x (gestureState.x0) minus the container's pageX
      // — much more reliable than locationX inside a Modal
      onPanResponderGrant: (_e, gestureState) => {
        if (trackWidth.current === 0) return;
        const relX = gestureState.x0 - trackPageX.current;
        const tapped = Math.min(1, Math.max(0, relX / trackWidth.current));
        draftMoodRef.current = tapped;
        animX.setValue(tapped);
      },
      onPanResponderMove: (_e, gestureState) => {
        if (trackWidth.current === 0) return;
        const relX = gestureState.moveX - trackPageX.current;
        const newVal = Math.min(1, Math.max(0, relX / trackWidth.current));
        draftMoodRef.current = newVal;
        animX.setValue(newVal);
      },
      // Update label text once on release (single re-render, not continuous)
      onPanResponderRelease: (_e, gestureState) => {
        if (trackWidth.current === 0) return;
        const relX = gestureState.moveX - trackPageX.current;
        const finalVal = Math.min(1, Math.max(0, relX / trackWidth.current));
        draftMoodRef.current = finalVal;
        setMoodLabel(getMoodLabel(finalVal));
      },
    })
  ).current;

  const thumbLeft = animX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Position the thumb as a percentage, offset by half thumb width
  const thumbTranslateX = animX.interpolate({
    inputRange: [0, 1],
    outputRange: [-THUMB_SIZE / 2, -THUMB_SIZE / 2],
    extrapolate: 'clamp',
  });

  const handleApply = () => {
    onApply(draftMoodRef.current, draftTheme);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.sectionLabel}>Mood</Text>
          <View style={styles.moodEndRow}>
            <Text style={styles.moodEndLabel}>😌 Calm</Text>
            <Text style={styles.moodCurrent}>{moodLabel}</Text>
            <Text style={styles.moodEndLabel}>Upbeat ⚡</Text>
          </View>

          {/* Slider track — large touch area */}
          <View
            ref={trackContainerRef}
            style={styles.trackContainer}
            onLayout={() => {
              // Measure after layout to get absolute screen coordinates
              trackContainerRef.current?.measure((_x, _y, w, _h, pageX) => {
                trackWidth.current = w;
                trackPageX.current = pageX;
              });
            }}
            {...panResponder.panHandlers}
          >
            {/* Track background */}
            <View style={styles.track}>
              <Animated.View
                style={[
                  styles.trackFill,
                  {
                    right: animX.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['100%', '0%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            {/* Thumb */}
            <Animated.View
              style={[
                styles.thumb,
                {
                  left: animX.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                  transform: [{ translateX: -THUMB_SIZE / 2 }],
                },
              ]}
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Video Theme</Text>
          <View style={styles.chipRow}>
            {THEMES.map(({ label, value }) => {
              const active = draftTheme === value;
              return (
                <Pressable
                  key={label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDraftTheme(value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>Apply</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  moodEndRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moodEndLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  moodCurrent: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trackContainer: {
    height: TRACK_CONTAINER_HEIGHT,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#007AFF',
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    top: (TRACK_CONTAINER_HEIGHT - THUMB_SIZE) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
