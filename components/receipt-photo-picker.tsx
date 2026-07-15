import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ReceiptPhotoPickerProps = {
  value: string | null;
  onChange: (uri: string | null) => void;
};

type PickSource = 'camera' | 'library';

export function ReceiptPhotoPicker({ value, onChange }: ReceiptPhotoPickerProps) {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const borderColor = colorScheme === 'dark' ? '#3a3d3e' : '#e2e2e2';
  const [loading, setLoading] = useState(false);

  const pickFrom = async (source: PickSource) => {
    setLoading(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('カメラを利用できません', '設定アプリでカメラへのアクセスを許可してください。');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
        if (!result.canceled) {
          onChange(result.assets[0]?.uri ?? null);
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('写真ライブラリを利用できません', '設定アプリで写真へのアクセスを許可してください。');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled) {
        onChange(result.assets[0]?.uri ?? null);
      }
    } catch {
      Alert.alert('写真を取得できませんでした', 'もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'web') {
      pickFrom('library');
      return;
    }

    Alert.alert('レシート写真を追加', undefined, [
      { text: 'カメラで撮影', onPress: () => pickFrom('camera') },
      { text: 'アルバムから選択', onPress: () => pickFrom('library') },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  if (value) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: value }} style={styles.preview} contentFit="cover" />
        <View style={styles.previewActions}>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.actionButton, { borderColor }, pressed && styles.pressed]}>
            <ThemedText style={styles.actionLabel}>変更</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onChange(null)}
            style={({ pressed }) => [styles.actionButton, { borderColor }, pressed && styles.pressed]}>
            <ThemedText style={styles.actionLabel}>削除</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [
        styles.addButton,
        { borderColor: tint, opacity: loading || pressed ? 0.6 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <ThemedText style={[styles.addLabel, { color: tint }]}>📷 レシート写真を追加</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  previewWrap: {
    gap: 8,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.6,
  },
});
