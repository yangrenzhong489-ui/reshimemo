import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { useCsvExport } from '@/hooks/use-csv-export';
import { exportBackup, pickAndRestoreBackup } from '@/services/backup-service';
import { clearBudget } from '@/services/budget-storage';
import { clearAllExpenses, getExpenses } from '@/services/expense-storage';
import { deleteReceiptPhoto } from '@/services/receipt-photo-storage';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { exporting, handleExportCsv } = useCsvExport();
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleBackup = async () => {
    if (backingUp) return;

    setBackingUp(true);
    try {
      const result = await exportBackup();

      if (result.success) {
        Alert.alert('バックアップを作成しました', '共有シートからファイルを保存・送信できます。');
        return;
      }

      if (result.reason === 'no-data') {
        Alert.alert('バックアップするデータがありません');
        return;
      }
      if (result.reason === 'not-available') {
        Alert.alert('共有機能が利用できません', 'この端末では共有機能を利用できませんでした。');
        return;
      }
      Alert.alert('バックアップの作成に失敗しました', 'もう一度お試しください。');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = () => {
    if (restoring) return;

    Alert.alert(
      '現在のデータを上書きしますか？',
      '選択したバックアップファイルの内容で、現在の支出データと予算データがすべて置き換わります。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '復元する', style: 'destructive', onPress: runRestore },
      ]
    );
  };

  const runRestore = async () => {
    setRestoring(true);
    try {
      const result = await pickAndRestoreBackup();

      if (result.success) {
        Alert.alert('データを復元しました', '', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }

      if (result.reason === 'canceled') {
        return;
      }
      if (result.reason === 'invalid-format') {
        Alert.alert(
          '復元できませんでした',
          'ファイルの形式が正しくないか、レシメモのバックアップファイルではないようです。'
        );
        return;
      }
      Alert.alert('復元に失敗しました', 'もう一度お試しください。');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteAll = () => {
    if (deletingAll) return;

    Alert.alert(
      '本当にすべてのデータを削除しますか？',
      'この操作は取り消せません。支出データ・予算設定・保存されたレシート写真がすべて削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除する', style: 'destructive', onPress: runDeleteAll },
      ]
    );
  };

  const runDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const expenses = await getExpenses();
      for (const expense of expenses) {
        if (expense.photoUri) {
          deleteReceiptPhoto(expense.photoUri);
        }
      }

      const expensesCleared = await clearAllExpenses();
      const budgetCleared = await clearBudget();

      if (expensesCleared && budgetCleared) {
        Alert.alert('すべてのデータを削除しました', '', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }
      Alert.alert('削除に失敗しました', 'もう一度お試しください。');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <ScreenContainer edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>データ管理</ThemedText>
          <SettingsRow
            icon="📄"
            label="CSV出力"
            loading={exporting}
            onPress={handleExportCsv}
          />
          <SettingsRow
            icon="💾"
            label="データをバックアップ"
            loading={backingUp}
            onPress={handleBackup}
          />
          <SettingsRow
            icon="📥"
            label="データを復元"
            loading={restoring}
            onPress={handleRestore}
          />
          <SettingsRow icon="🎯" label="予算を設定" onPress={() => router.push('/set-budget')} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>危険な操作</ThemedText>
          <SettingsRow
            icon="🗑️"
            label="すべてのデータを削除"
            loading={deletingAll}
            destructive
            onPress={handleDeleteAll}
          />
        </View>

        <View style={styles.appInfoSection}>
          <ThemedText style={styles.appInfoTitle}>レシメモ</ThemedText>
          <ThemedText style={styles.appInfoText}>バージョン {APP_VERSION}</ThemedText>
          <ThemedText style={styles.appInfoText}>レシート写真付き支出メモアプリ</ThemedText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 4,
  },
  appInfoSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appInfoText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
