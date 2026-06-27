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
