import { useState } from 'react';
import { Alert } from 'react-native';

import { exportExpensesCsv } from '@/services/csv-export';
import { getExpenses } from '@/services/expense-storage';

/** CSV出力ボタンの実行状態とハンドラーをまとめたフック（ホーム画面・設定画面から共通利用）。 */
export function useCsvExport() {
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (exporting) return;

    setExporting(true);
    try {
      const expenses = await getExpenses();
      const result = await exportExpensesCsv(expenses);

      if (result.success) {
        Alert.alert('CSVを出力しました', '共有シートからファイルを保存・送信できます。');
        return;
      }

      if (result.reason === 'no-data') {
        Alert.alert('出力する支出データがありません');
        return;
      }
      if (result.reason === 'not-available') {
        Alert.alert('共有機能が利用できません', 'この端末では共有機能を利用できませんでした。');
        return;
      }
      Alert.alert('CSVの出力に失敗しました', 'もう一度お試しください。');
    } finally {
      setExporting(false);
    }
  };

  return { exporting, handleExportCsv };
}
