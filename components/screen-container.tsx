import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';

type Edge = 'top' | 'bottom' | 'left' | 'right';

type ScreenContainerProps = PropsWithChildren<{
  /** Safe Area分の余白を入れる辺。ヘッダー付きの画面では top を指定しない。 */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

/** ノッチ・ステータスバー・ホームインジケーターなどのSafe Areaを考慮した画面ラッパー。 */
export function ScreenContainer({ children, edges = [], style }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: edges.includes('left') ? insets.left : 0,
          paddingRight: edges.includes('right') ? insets.right : 0,
        },
        style,
      ]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
