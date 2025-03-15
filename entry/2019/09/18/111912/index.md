# Docsy でドキュメントを書く
<a id="top"></a>

[Hugo](https://gohugo.io/) のテーマである [Docsy](https://www.docsy.dev/) を使用してドキュメントを書く環境を整える。

###### CONTENTS

1. [Node.js のインストール](#install-nodejs)
1. [Hugo セットアップ](#setup-hugo)
1. [必要なコンポーネントのインストール](#install-components)
1. [Docsy のインストール](#install-docsy)
1. [Docsy Example からコンテンツをコピー](#copy-example)
1. [hugo server でコンテンツを確認](#hugo-server)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCES

- [getto-systems/docs](https://github.com/getto-systems/docs)


###### ENVIRONMENTS

- Node.js : 12
- Hugo : 0.57.2


<a id="install-nodejs"></a>
### Node.js のインストール

Docsy には、PostCSS と Autoprefixer が必要。
このために Node.js も必要。

```bash
# exec as root
export NODE_VERSION=12
curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
apt-get install -y nodejs
npm install -g npm
```


[TOP](#top)
<a id="setup-hugo"></a>
### Hugo セットアップ

まずは [Hugo](https://gohugo.io/) のセットアップを行う。
[Getting Started : Docsy](https://www.docsy.dev/docs/getting-started/) によると、最新の extended な Hugo が推奨とのこと。

ここでは 0.57.2 をインストールした。

```bash
export HUGO_VERSION=0.57.2
curl -L -o hugo.tar.gz https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz
```

Hugo は Go 製のツールなので、ダウンロードしてパスを通せば使える。

以下のコマンドで `./docs` にサイトの雛形が作成される。

```bash
hugo new site docs
```

今後は `./docs` ディレクトリで作業を行う。


[TOP](#top)
<a id="install-components"></a>
### 必要なコンポーネントのインストール

PostCSS と Autoprefixer をインストールする。

```bash
npm install --save-dev postcss-cli
npm install --save-dev autoprefixer
```

また、textlint も入れておいた。

```bash
npm install --save-dev textlint
npm install --save-dev textlint-rule-preset-ja-technical-writing
```


[TOP](#top)
<a id="install-docsy"></a>
### Docsy のインストール

Docsy はサブモジュールとしてインストールした。

```bash
git init
git submodule add https://github.com/google/docsy.git themes/docsy
git submodule update --init --recursive
```


[TOP](#top)
<a id="copy-example"></a>
### Docsy Example からコンテンツをコピー

Docsy は[サンプルサイト](https://example.docsy.dev/)が用意されている。
ソースは [google/docsy-example](https://github.com/google/docsy-example) にあるので、ここから必要なコンテンツをコピーする。

とりあえず以下をコピーした。

```txt
- config.toml
- content
  - blog
  - docs
  - about
  - _index.html
  - featured-background.jpg
  - search.md
```


[TOP](#top)
<a id="hugo-server"></a>
### hugo server でコンテンツを確認

`hugo server` コマンドで web サーバーを起動できる。
live reload もやってくれる。

```bash
hugo server
```

これでコンテンツを作成する準備が整った。
[ドキュメント](https://www.docsy.dev/docs/adding-content/)を見つつ、コンテンツを追加していこう。


[TOP](#top)
<a id="postscript"></a>
### まとめ

これで Hugo を使用してドキュメントを書く準備が整った。
ページの書き方の詳細は[ドキュメント](https://www.docsy.dev/docs/adding-content/)にまとまっているので、これを参照しつつドキュメントを書いていける。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Docsy](https://www.docsy.dev/)
- [Hugo](https://gohugo.io/)


[TOP](#top)
