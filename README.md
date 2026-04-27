# Chrono Quest

ゼルダの伝説風アクションRPG（Webブラウザ動作）

## 開発環境セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く

## ビルド・デプロイ

```bash
npm run build   # dist/ に出力
```

Vercel に GitHub リポジトリを連携すると push 時に自動デプロイされます。

## 技術スタック

- [Phaser 3](https://phaser.io/) - HTML5 ゲームフレームワーク（MIT）
- [Vite](https://vite.dev/) - ビルドツール
- [Vercel](https://vercel.com/) - ホスティング

## 操作方法

| ボタン（ゲームパッド） | キーボード | アクション |
|----------------------|-----------|-----------|
| 十字キー | WASD / 矢印キー | 移動 |
| A | Enter / Z | 攻撃 / インタラクト |
| B | Shift / X | 回避 |
| X | Q | アイテム使用 |
| Y | E | 武器切替 |
| L1 | Tab | ロックオン |
| L2 | 左Ctrl | ダッシュ |
| R1 | R | スキル1 |
| R2 | F | スキル2 |
| Start | Esc | システムメニュー |
| Select | M | マップ |

## 仕様書

[docs/SPEC.md](docs/SPEC.md) を参照
