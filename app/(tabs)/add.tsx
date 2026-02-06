import { StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export default function AddScreen() {
  return (
    <Text style={styles.placeholder}>Add (placeholder)</Text>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: 20 },
});
