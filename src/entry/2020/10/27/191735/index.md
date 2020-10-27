# Web IDE を試す
<a id="top"></a>

###### CONTENTS

1. [なんでそんなことをするのか](#purpose)
1. [Theia を選んだ理由](#why-theia)
1. [Theia セットアップ](#setup-theia)
1. [built-in 拡張機能のセットアップ](#setup-built-in-extensions)
1. [拡張機能のインストール](#install-extensions)
1. [キーボードショートカットの設定](#setup-shortcuts)
1. [typescript のセットアップ](#setup-typescript)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### APPENDIX

1. [ベースイメージ Dockerfile](#appendix-base-dockerfile)


###### ENVIRONMENTS

- Theia : 1.7.0-next


<a id="purpose"></a>
### なんでそんなことをするのか

[この記事](https://qiita.com/verde9917/items/5151368d1bb4a9467ff1)を読んで、self-hosted な web IDE があることを知った。

今、Docker な開発環境で、アプリケーションサーバーを立ち上げて開発している。
おんなじように、self-hosted な web IDE コンテナを立ち上げればそのまま使えるのではないかと考えた。


[TOP](#top)
<a id="why-theia"></a>
### Theia を選んだ理由

[Theia](https://theia-ide.org/) は「Cloud & Desktop IDE Platform」と名乗っている。
[この記事](https://qiita.com/verde9917/items/5151368d1bb4a9467ff1)でも言われているが、これをそのまま使うのではなく、アプリケーションに組み込んだりして使うことを想定している感じだ。
例えば [Gitpod](https://www.gitpod.io/) は Theia を使用しているらしい。

本当は Gitpod の OSS 版を使いたかったのだけど、検索して出てくるのはクラウドサービスのほうばっかり。
（そりゃそうなんだけど）
なので Theia を直接使うことにした。

[Eclipse Che](https://www.eclipse.org/che/) というのもあるけど、これは k8s 上で動かすので、今回は重過ぎるかなあと見送った。

あと、特に重要というわけではないけど、ベンダーニュートラル。
Eclipse は仕事を始める前に Java を書いていた時に使っていた IDE なので懐かしい気持ちもある。
VSCode の拡張を使える、というのもうれしい。


[TOP](#top)
<a id="setup-theia"></a>
### Theia セットアップ

[ドキュメント](https://theia-ide.org/docs/composing_applications/)のとおりにセットアップする。
アプリケーションに組み込むことを想定しているので、そのまま使うためのセットアップ手順はちょっと奥のほうにある。

まず必要なものをインストールする必要がある。
DockerHub の node:12.19.0-buster には必要なものがすべて含まれているので、これを使用する。
Node のバージョンは 12 でなければならない。

[Todo Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree) という拡張を使用するために ripgrep が必要なので、この記事では ripgrep を追加でインストールしたイメージを使用している。
（APPENDIX [ベースイメージ Dockerfile](#appendix-base-dockerfile) 参照）

使用する機能と built-in する extension を package.json に記述する。

```json
{
  "private": true,
  "dependencies": {
    "@theia/callhierarchy": "next",
    "@theia/console": "next",
    "@theia/core": "next",
    "@theia/debug": "next",
    "@theia/editor": "next",
    "@theia/editor-preview": "next",
    "@theia/file-search": "next",
    "@theia/filesystem": "next",
    "@theia/getting-started": "next",
    "@theia/git": "next",
    "@theia/keymaps": "next",
    "@theia/markers": "next",
    "@theia/messages": "next",
    "@theia/metrics": "next",
    "@theia/mini-browser": "next",
    "@theia/monaco": "next",
    "@theia/navigator": "next",
    "@theia/outline-view": "next",
    "@theia/output": "next",
    "@theia/plugin-dev": "next",
    "@theia/plugin-ext": "next",
    "@theia/plugin-ext-vscode": "next",
    "@theia/plugin-metrics": "next",
    "@theia/preferences": "next",
    "@theia/preview": "next",
    "@theia/process": "next",
    "@theia/scm": "next",
    "@theia/scm-extra": "next",
    "@theia/search-in-workspace": "next",
    "@theia/task": "next",
    "@theia/terminal": "next",
    "@theia/timeline": "next",
    "@theia/typehierarchy": "next",
    "@theia/userstorage": "next",
    "@theia/variable-resolver": "next",
    "@theia/vsx-registry": "next",
    "@theia/workspace": "next"
  },
  "devDependencies": {
    "@theia/cli": "next"
  },
  "scripts": {
    "prepare": "yarn run clean && yarn build && yarn run download:plugins",
    "clean": "theia clean",
    "build": "theia build --mode development",
    "start": "theia start --plugins=local-dir:plugins",
    "download:plugins": "theia download:plugins"
  },
  "theiaPluginsDir": "plugins",
  "theiaPlugins": {
    "css": "http://localhost:8080/css-1.51.0.vsix",
    "html": "http://localhost:8080/html-1.51.0.vsix",
    "javascript": "http://localhost:8080/javascript-1.51.0.vsix",
    "json": "http://localhost:8080/json-1.51.0.vsix",
    "markdown": "http://localhost:8080/markdown-1.51.0.vsix",
    "markdown-language-features": "http://localhost:8080/markdown-language-features-1.51.0.vsix",
    "theme-monokai": "http://localhost:8080/theme-monokai-1.51.0.vsix",
    "typescript": "http://localhost:8080/typescript-1.51.0.vsix",
    "typescript-language-features": "http://localhost:8080/typescript-language-features-1.51.0.vsix"
  }
}
```

dependencies は [Example](https://github.com/eclipse-theia/theia/blob/master/examples/browser/package.json) の package.json を参考に選んだ。
使わないやつがいろいろありそう。

theiaPlugins に関しては次節で解説する。
とりあえず `http://localhost:8080` で各 vsix ファイルが配信されていることにして先に進める。

package.json を用意したら以下のコマンドで必要なものをインストールする。

```bash
yarn
```

インストールが終わったら以下のコマンドでサーバーを立ち上げる。

```bash
yarn start /path/to/workspace \
  --hostname 0.0.0.0 \
  --port 8080 \
  --ssl --cert /path/to/cert --certkey /path/to/key
```

workspace の指定はしなくてもいい。
あとで open workspace で任意のパスを開ける。

- hostname : localhost 以外からアクセスする場合は必要
- port : listen する port 番号を指定
- ssl : https で公開する場合は必要

うちの開発環境はサーバーが立っているので hostname に `0.0.0.0` を指定した。
諸事情あって、このサーバーへのアクセスは https にする必要があるので、ssl を指定した。

ここにアクセスして IDE が立ち上がるのを確認できれば OK。

ただし、任意のファイルを閲覧、編集できるだけでなく、terminal を立ち上げることで文字通りなんでもできる環境が立ち上ったことになる。
これが何の認証もなくアクセスできてしまっていることに注意。
公開されたネットワークではやってはいけない。


[TOP](#top)
<a id="setup-built-in-extensions"></a>
### built-in 拡張機能のセットアップ

[ドキュメント](https://theia-ide.org/docs/composing_applications/)には、VSCode の拡張を built-in でセットアップする手順もまとめられている。
その際の package.json は以下のとおり。

```json
{
  ...
  "theiaPluginsDir": "plugins",
  "theiaPlugins": {
    "vscode-builtin-css": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/css-1.39.1-prel.vsix",
    "vscode-builtin-html": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/html-1.39.1-prel.vsix",
    "vscode-builtin-javascript": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/javascript-1.39.1-prel.vsix",
    "vscode-builtin-json": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/json-1.39.1-prel.vsix",
    "vscode-builtin-markdown": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/markdown-1.39.1-prel.vsix",
    "vscode-builtin-npm": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/npm-1.39.1-prel.vsix",
    "vscode-builtin-scss": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/scss-1.39.1-prel.vsix",
    "vscode-builtin-typescript": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/typescript-1.39.1-prel.vsix",
    "vscode-builtin-typescript-language-features": "https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/typescript-language-features-1.39.1-prel.vsix"
  }
}
```

`vscode-builtin-extensions` の[リリース](https://github.com/theia-ide/vscode-builtin-extensions/releases/download/v1.39.1-prel/)からそれぞれ vsix をダウンロードする指定。
これは少々古いので、最新のものをビルドして使用したい。

[README](https://github.com/theia-ide/vscode-builtin-extensions) のとおりにビルドしていく。

まず clone して、submodule のセットアップを行う。

```bash
cd vscode-builtin-extensions
git submodule init
git submodule update
```

そうしたら vscode を最新にしておく。

```bash
cd vscode
git switch 1.50.0 # 2020/10/27 現在の最新
cd -
```

これでビルドすると、最新の vsix が `dist` ディレクトリに作成される。

```bash
yarn
yarn package-vsix:next
```

手元の環境でやったらロードアベレージがすごいことになってなかなか終わらなかった。

とにかく vsix ファイルが手に入ったら、http でアクセス可能な場所に置く。

[前節](#setup-theia)では、下記のように書いておいた。

> とりあえず `http://localhost:8080` で各 vsix ファイルが配信されていることにして先に進める。

適当なところで web サーバーを立ち上げ、`http://localhost:8080` でこれらのファイルが配信されるようにしておく。
別な URL になるなら、package.json のほうを変えればいい。

仕組み的には vsix の中身が theiaPluginsDir に展開されていれば良さそう。
そのままコピーして展開してもいいはずだが、仕様を調べるのがめんどくさかったので web サーバーを立てた。


[TOP](#top)
<a id="install-extensions"></a>
### 拡張機能のインストール

おそらく以下が含まれていれば、立ち上がった Theia の「拡張機能」メニューから、登録されている拡張機能を検索してインストールできる。

- `@theia/plugin-ext`
- `@theia/vsx-registry`

これは VSCode と同様の手順なので簡単。
ただ、marketplace に登録されているものすべてが含まれているわけではない。

そんな拡張を使いたい場合は、vsix をダウンロードできる URL を theiaPlugins の URL として指定する。
そうすることで built-in な拡張として使用可能になる。
[この記事](https://qiita.com/tosier/items/b3b7d42b2580cb63c9ee)のとおり、marketplace のページに Download Extension のメニューがあるので、これを指定すればいい。

インストールした拡張はホームディレクトリの `.theia` 以下に保存される。

今のところ、以下の拡張をインストールした。

- Bracket Pair Colorizer : 後継の拡張があるのは知っているが、なんか動かんかった
- Code Spell Checker
- Todo Tree
- ESLint
- Prettier


[TOP](#top)
<a id="setup-shortcuts"></a>
### キーボードショートカットの設定

キーボードショートカットは設定のメニューからカスタマイズできる。
しかし、Web IDE なので、ブラウザのショートカットと完全に衝突するやつが結構ある。
ブラウザのショートカットを無効にする方法もいくつかあるようだが、ここではそれはせずに、Theia のショートカットをカスタムすることで対応することにした。

とりあえず使ってみたいショートカットを以下にまとめておく。

#### 編集

- Copy : `ctrlcmd + c` : 選択なしで行コピー
- Cut : `ctrlcmd + x` : 選択なしで行カット
- Undo : `ctrlcmd + z`
- Redo : `ctrlcmd + shift + z`
- Outdent Line : `ctrl + [`
- Indent Line : `ctrl + ]`
- Toggle Block Comment : `alt + .`
- Toggle Line Comment : `alt + /`
- Insert Line Below : `ctrl + enter`
- Insert Line Above : `shift + ctrl + enter`
- Change All Occurrences : `ctrl + i`
- Move Line Down : `alt + down`
- Move Line Up : `alt + up`


#### 選択

- Expand Selection : `alt + u`
- Select All : `ctrlcmd + a`


#### ファイル

- File: New File : `alt + o`


#### 検索

- Find : `f3`


#### 移動

- Go to Bracket : `ctrl + 5`
- Go to Definition : `ctrlcmd + f11`
- Go to Line... : `ctrl + g`
- Go to Next Problem : `alt + f8`
- Go to Next Problem in Files : `f8`
- Go to Previous Problem : `shift + alt + f8`
- Go to Previous Problem in Files : `shift + f8`
- cursor : 矢印キー : ctrl で単語の移動


#### 表示

- Peek Definition : `alt + f12`
- View: Switch to Next Tab : `alt + j`
- View: Switch to Previous Tab : `alt + k`


[TOP](#top)
<a id="setup-typescript"></a>
### typescript のセットアップ

built-in で typescript 関連のものを追加してある。
あと、ESLint と Prettier を入れてあるので、とりあえずセットアップは完了している。

すぐに typescript できるのだが、tsconfig は workspace のトップに置かないと認識してくれなかった。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2020年現在の開発環境は Web IDE ということになった。

以前 VSCode を使ってみようとしたときは、開発環境が別サーバーになっている関係で、実行環境をうまく整えられなくて見送った。

今回、Web IDE で VSCode みたいな環境をうまくセットアップできた。
VSCode の時に課題だった実行環境との接続は、同じイメージに実行環境を含めればいいので何の問題もなくなった。

あとはこれが手になじめばいいな。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [クラウドサービスではなく、あえて self-hosted 版 WebIDE について調べてみた | Qiita](https://qiita.com/verde9917/items/5151368d1bb4a9467ff1)
- [Theia - Cloud & Desktop IDE Platform](https://theia-ide.org/)
- [vscode-builtin-extensions | GitHub](https://github.com/theia-ide/vscode-builtin-extensions)
- [VSCode に必ず入れておきたい拡張機能 | Qiita](https://qiita.com/ucan-lab/items/e85931bf8276da43cc97)
- [VSCodeのオススメ拡張機能 24 選 (とTipsをいくつか) | Qiita](https://qiita.com/sensuikan1973/items/74cf5383c02dbcd82234)


[TOP](#top)
<a id="appendix-base-dockerfile"></a>
### ベースイメージ Dockerfile

使用している Dockerfile は以下のとおり。

```dockerfile
FROM node:12.19.0-buster

RUN : && \
  : "install packages" && \
  apt-get update && \
  apt-get install -y \
    ripgrep \
  && \
  : "setup theia work dir" && \
  mkdir /opt/theia && \
  chown 1000:1000 /opt/theia && \
  : "cleanup apt caches" && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  :

COPY package.json /opt/theia/package.json

WORKDIR /opt/theia

USER 1000

RUN : && \
  yarn && \
  sed -i lib/index.html -e 's|</script>|</script><link rel="stylesheet" href="./custom.css">|' && \
  :

COPY custom.css /opt/theia/lib/custom.css
```

#### おまけ

theia は web アプリケーションなので、`index.html` がある。
そこで、追加の css を読み込むように手を加えてやると、css をいじることができる。
（css 以外もいじれるけど大変になるのでやめておく）

```css
:root {
  --theia-ui-font-family: 'あんずもじ等幅';
  --theia-ui-font-size1: 18px;
}
```

- theia 全体がお気に入りのフォントになるように ui font family を変更
- サイドバーとかのフォントサイズが小さいので大きく変更

[TOP](#top)
