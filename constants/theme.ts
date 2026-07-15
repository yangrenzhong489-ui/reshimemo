/**
 * レシメモ全体の色定義。暖かみのあるオフホワイトを基調に、
 * 通常操作は青緑系（tint）、成功はgreen、注意はamber、危険な操作はred系で統一する。
 */

import { Platform } from 'react-native';

const tintColorLight = '#2A9D8F';
const tintColorDark = '#4FC3B0';

export const Colors = {
  light: {
    text: '#3A342C',
    background: '#FFFBF6',
    card: 'rgba(42, 157, 143, 0.08)',
    border: '#EAE1D3',
    placeholder: '#AFA290',
    tint: tintColorLight,
    icon: '#8A7B6C',
    tabIconDefault: '#8A7B6C',
    tabIconSelected: tintColorLight,
    success: '#3E9C5C',
    warning: '#F2A93B',
    danger: '#E0245E',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    card: 'rgba(255, 255, 255, 0.06)',
    border: '#3A3D3E',
    placeholder: '#6B7280',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    success: '#4CAF50',
    warning: '#F5A623',
    danger: '#E0245E',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
