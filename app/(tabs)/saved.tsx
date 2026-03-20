import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { loadSavedItems, persistSavedItems, savedItemId, type SavedItem, type SaveType } from '@/api/saved';

const TABS: { label: string; type: SaveType }[] = [
  { label: 'Daydreams', type: 'daydream' },
  { label: 'Videos', type: 'video' },
  { label: 'Music', type: 'music' },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function itemIcon(type: SaveType): React.ComponentProps<typeof Ionicons>['name'] {
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

  const reload = useCallback(async () => {
    const items = await loadSavedItems();
    setAllItems(items);
  }, []);

  // Reload whenever the tab becomes focused
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = allItems.filter((i) => i.type === activeTab);

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
      <Text style={styles.screenTitle}>My Daydreams</Text>

      {/* Segmented tabs */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
