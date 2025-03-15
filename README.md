# GETTO SYSTEMS ブログ

このリポジトリは GETTO SYSTEMS のブログ記事を管理するためのプロジェクトです。記事は Markdown 形式で記述され、textlint によって日本語の技術文書としての品質がチェックされます。

## 構成

- `entry/` - ブログ記事が日付ごとに整理されています
  - 例: `entry/2021/11/04/010314/index.md`

## セットアップ

```bash
# 依存関係のインストール
npm install
```

## 使い方

### 記事の作成

新しい記事は `entry/YYYY/MM/DD/HHMMSS/index.md` の形式で作成します。

### 記事の構造

記事は以下の構造に従って作成することをお勧めします。

```markdown
# タイトル

<a id="top"></a>

###### CONTENTS

1. [セクション1](#section1)
1. [セクション2](#section2)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="section1"></a>

### セクション1

内容...

[TOP](#top)
<a id="section2"></a>

### セクション2

内容...

[TOP](#top)
<a id="postscript"></a>

### まとめ

まとめの内容...

[TOP](#top)
<a id="reference"></a>

### 参考資料

- [参考リンク1](https://example.com)
- [参考リンク2](https://example.com)

[TOP](#top)
```

### 文章のチェック

textlint を使用して記事の文章をチェックします。

```bash
# 文章のチェック
npm run lint

# 自動修正可能な問題を修正
npm run lint:fix
```

## textlint の設定

このプロジェクトでは、日本語の技術文書向けの textlint ルールセット `textlint-rule-preset-ja-technical-writing` を使用しています。

## ライセンス

このプロジェクトは [MIT ライセンス](./LICENSE) の下で公開されています。詳細については LICENSE ファイルを参照してください。
