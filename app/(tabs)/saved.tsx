import { StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export default function SavedScreen() {
  return (
    <Text style={styles.placeholder}>My Daydreams (placeholder)</Text>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: 20 },
});
