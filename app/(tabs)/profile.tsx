import { StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

export default function ProfileScreen() {
  return (
    <Text style={styles.placeholder}>Profile (placeholder)</Text>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: 20 },
});
