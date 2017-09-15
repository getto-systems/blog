---
title: Docker for Mac で開発環境を構築する - その３
---
<a id="top"></a>

- 開発環境にアクセスできなくなるリスクを無くしたい
- 開発者ごとの環境差位を無くしたい
- 特定の言語に縛られない開発がしたい

前回はラップスクリプトの作成まで行なった。

今回はラップスクリプト用の環境変数を設定してプロジェクトごとにグループ化して作業できるようにする。

これで mac で、 OS には実行環境をインストールせずに開発ができるようになる。

- [その１ - docker run でコマンドを起動する](/entry/2017/09/02/170406)
- [その２ - docker run をラップする](/entry/2017/09/09/111638)
- その３ - プロジェクトごとにグループ化して作業する

###### CONTENTS

1. [全体像](#strategy)
1. [tmux によるグループ化](#setup-env-by-tmux)
1. [direnv によるグループ化](#setup-env-by-direnv)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

- [getto-systems/birdfirm : GitHub](https://github.com/getto-systems/birdfirm)
- [getto-systems/tmux-wrapper : GitHub](https://github.com/getto-systems/tmux-wrapper)


<a id="strategy"></a>
### 全体像

[その２](/entry/2017/09/09/111638)では、ラッパースクリプトを作成して、コマンドがインストールされているかのように作業できるようにした。

このスクリプトは環境変数によって挙動を変える仕組みになっている。

tmux と direnv によって環境変数を管理することで、プロジェクトごとにグループ化して作業を行えるようにする。

設定が必要な環境変数は以下の通り。

```bash
DOCKER_WRAPPER_IMAGE_$image        # コンテナのイメージ名
DOCKER_WRAPPER_SERVER_HOSTNAME     # サーバー名のベース
DOCKER_WRAPPER_SERVER_OPTS_$server # サーバーの追加オプション
DOCKER_WRAPPER_LOGS_TARGET         # logs で呼び出すサーバーコマンド
LABO_PORT_PREFIX                   # サーバーが使用するポート
APP_ROOT                           # サーバーのアプリケーションルート
```


[TOP](#top)
<a id="setup-env-by-tmux"></a>
### tmux によるグループ化

tmux の設定ファイルに以下の記述を行うと、環境変数を渡すことができる。

```
set-environment -g MY_ENV VALUE
```

これを利用して、ベースとなる以下の環境変数を設定する。

```
DOCKER_WRAPPER_SERVER_HOSTNAME # サーバー名のベース
LABO_PORT_PREFIX               # サーバーが使用するポート
```

[birdfirm](https://github.com/getto-systems/birdfirm) と [tmux-wrapper](https://github.com/getto-systems/tmux-wrapper) を使用してセットアップする。

```bash
#!/bin/bash
# ~/.birdfirm/rc

tmux_to_local=$HOME/.birdfirm/tmux_to_local

birdfirm_cage $tmux_to_local getto-blog  100
birdfirm_cage $tmux_to_local getto-css   101
birdfirm_cage $tmux_to_local getto-base  110
```

実際に実行するスクリプトはこれ。

```bash
#!/bin/bash
# ~/.birdfirm/tmux_to_local

project=$1; shift
port_prefix=$1; shift
path=$1; shift

if [ -z "$path" ]; then
  path=/apps/${project//-/\/}
fi

. tmux_wrapper.sh

tmux_wrapper_shell=zsh
tmux_wrapper_color=cyan

tmux_wrapper_session=$project

tmux_wrapper_env DOCKER_WRAPPER_SERVER_HOSTNAME $project
tmux_wrapper_env LABO_PORT_PREFIX $port_prefix

tmux_wrapper_bind c home $path

tmux_wrapper_main
```

これで、 `birdfirm` でホストを選択すると、プロジェクトごとの環境変数を持った tmux session が起動する。


[TOP](#top)
<a id="setup-env-by-direnv"></a>
### direnv によるグループ化

[direnv](https://github.com/direnv/direnv) を使用すると、あるディレクトリ以下で環境変数を上書きして作業することができる。

これを利用して以下の環境変数を設定する。

```bash
DOCKER_WRAPPER_IMAGE_$image        # コンテナのイメージ名
DOCKER_WRAPPER_SERVER_OPTS_$server # サーバーの追加オプション
DOCKER_WRAPPER_LOGS_TARGET         # logs で呼び出すサーバーコマンド
APP_ROOT                           # サーバーのアプリケーションルート
```

実際に使用している .envrc はこれ。

```bash
export APP_ROOT=$(pwd)
export PATH=$APP_ROOT/bin:$PATH

export DOCKER_WRAPPER_IMAGE_node=8.4.0
export DOCKER_WRAPPER_SERVER_OPTS_livereload="-p ${LABO_PORT_PREFIX}80:8000 -p ${LABO_PORT_PREFIX}29:${LABO_PORT_PREFIX}29"

export DOCKER_WRAPPER_LOGS_TARGET=lr
```

これで、必要な全ての環境変数が設定される。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Docker for Mac によって、 OS に実行環境をインストールせずに、開発する準備が整った。

リモートに開発環境を用意すると、サーバーや経路に不具合があった場合に開発が停止してしまう。
これを防ぐためにローカルの開発機で実装が続けられるようにしたかった。

また、Docker を使用しているため、開発者ごとの環境差異もできにくいはず。
（現状１人開発なのだけれども）

何より、どんな言語でも、どんなバージョンでも気軽に開発をスタートさせることができる。
特定の言語の新しいバージョンを使用してみたいと思ったら、環境変数を設定するだけで新しいバージョンが使用できる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [direnv/direnv : GitHub](https://github.com/direnv/direnv)


[TOP](#top)
