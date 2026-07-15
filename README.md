# レシメモ

レシートを撮影して支出をメモできる、シンプルな支出管理アプリです。

## アプリ概要

「レシメモ」は、日々の買い物のレシートをもとに支出を手軽に記録できるアプリです。難しい設定なしに、金額・カテゴリ・写真を数タップで記録し、今日・今月の使いすぎをすぐに把握できることを目指しています。まずはOCRやAIに頼らない「手入力ベースのMVP」として作られています。

## 主な機能

- 支出入力（金額・日付・カテゴリ・メモ）
- カテゴリ分類（10種類の固定カテゴリ）
- 今日の合計・今月の合計の表示
- カテゴリ別合計の表示
- レシート写真の添付（カメラ撮影 or ライブラリから選択）
- カテゴリ別支出の円グラフ表示
- 支出の詳細表示・編集・削除
- すべてのデータは端末内（AsyncStorage）に保存

## 使用技術

- Expo SDK 54 / Expo Router v6
- React Native 0.81 / React 19
- TypeScript
- `@react-native-async-storage/async-storage`（ローカル保存）
- `expo-image-picker` / `expo-file-system`（写真添付・永続保存）
- `react-native-chart-kit` / `react-native-svg`（グラフ表示）

## セットアップ方法

1. 依存パッケージをインストール

   ```bash
   npm install
   ```

2. （Windows環境でTLS証明書エラーが出る場合）

   環境によっては `npm install` や `npx expo start` の実行時に `UNABLE_TO_VERIFY_LEAF_SIGNATURE` のようなTLSエラーが出ることがあります。その場合は以下のように `NODE_OPTIONS` を設定してから実行してください（OSの証明書ストアを利用するようになります）。

   ```powershell
   $env:NODE_OPTIONS="--use-system-ca"; npm install
   ```

## 起動方法

開発サーバーを起動します。

```bash
npx expo start
```

（TLS証明書エラーが出る場合は `$env:NODE_OPTIONS="--use-system-ca"; npx expo start`）

起動後、ターミナルに表示されるQRコードを **Expo Go** アプリ（iOS/Android）でスキャンするか、`w`キーでWebブラウザ、`a`キーでAndroidエミュレータ、`i`キーでiOSシミュレータを起動できます。

## スクリーンショット

<!-- 画像を用意したら docs/screenshots/ に配置してください（詳細は docs/screenshots/README.md 参照） -->

| ホーム画面 | 支出追加画面 | グラフ画面 |
|---|---|---|
| ![ホーム画面](./docs/screenshots/home.png) | ![支出追加画面](./docs/screenshots/add-expense.png) | ![グラフ画面](./docs/screenshots/graph.png) |

## プロジェクト構成

- `app/` — 画面（Expo Routerのファイルベースルーティング）
  - `(tabs)/index.tsx` — ホーム画面（合計・カテゴリ別内訳・最近の支出一覧）
  - `add-expense.tsx` — 支出入力画面（モーダル）
  - `expense/[id].tsx` — 支出の詳細画面
  - `edit-expense.tsx` — 支出の編集画面（モーダル）
  - `graph.tsx` — カテゴリ別支出のグラフ画面
- `components/` — 画面を構成する部品（フォーム、カテゴリ選択、写真ピッカーなど）
- `services/` — データ永続化（`expense-storage.ts`、`receipt-photo-storage.ts`）
- `types/` — 支出データの型定義
- `constants/categories.ts` — カテゴリ定義（色・絵文字・ラベル）
- `utils/` — 日付・金額フォーマット・集計ロジック

## 今後追加予定の機能

- レシート画像のOCRによる自動読み取り
- AIによるカテゴリ自動分類
- 広告表示
- Pro版（課金機能）

これらはMVPの範囲外のため、現時点では未実装です。

## 開発ルール

このプロジェクトの開発方針は [`AGENTS.md`](./AGENTS.md) と [`CLAUDE.md`](./CLAUDE.md) にまとめています。
