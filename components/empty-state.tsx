import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type EmptyStateProps = {
  title: string;
  description?: string;
};

/** データが無い場合の共通表示。タイトル＋補足説明で「次に何をすればいいか」を伝える。 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {description && <ThemedText style={styles.description}>{description}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    opacity: 0.5,
    textAlign: 'center',
  },
});
