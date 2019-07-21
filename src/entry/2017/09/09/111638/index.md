---
title: Docker for Mac で開発環境を構築する - その２
---
<a id="top"></a>

- 開発環境にアクセスできなくなるリスクを無くしたい
- 開発者ごとの環境差位を無くしたい
- 特定の言語に縛られない開発がしたい

前回は docker コンテナの起動まで行なった。

今回は各実行環境を docker run するラップスクリプトを作成して、コマンドがインストールされているかのように実行できるところまで。

環境変数の設定を行うことで、プロジェクトごとにグループ化して作業できるようにするのは「その３」でやります。

- [その１ - docker run でコマンドを起動する](/entry/2017/09/02/170406)
- その２ - docker run をラップする
- [その３ - プロジェクトごとにグループ化して作業する](/entry/2017/09/16/180320)

###### CONTENTS

1. [全体像](#strategy)
1. [コマンドラインツール用スクリプト](#command-line-script)
1. [サーバー用スクリプト](#setup-server)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

- [getto-systems/docker-wrapper : GitHub](https://github.com/getto-systems/docker-wrapper)
- [getto-systems/docker-wrapper-commands : GitHub](https://github.com/getto-systems/docker-wrapper-commands)


<a id="strategy"></a>
### 全体像

[その１](/entry/2017/09/02/170406)では、実行環境を OS にインストールすることなく、docker run によってツールを使用できることを説明した。

ただ、 docker run をその都度打ち込むのはもちろんやりたくないし、各プロジェクトで個別にスクリプトを用意するのも気が進まない。

できればスクリプト集を作っておき、各プロジェクトごとに環境変数を変えて実行することでうまく起動できるようにしたい。

今の所、以下の２種類を作成すれば作業に支障はない。

- コマンドラインツール用スクリプト
- サーバー用スクリプト


[TOP](#top)
<a id="command-line-script"></a>
### コマンドラインツール用スクリプト

まずコマンドラインツール用のラッパーを考えてみる。

- 実行が終わったらコンテナを削除する
- UID 1000、GID 1000 で起動する
- 端末を結びつける
- カレントディレクトリで実行したかのように振る舞うようにする
- 現在の環境変数を引き継ぐ
- イメージ名は環境変数で指定する

コマンドラインツールとして必要なオプションはこんなところだ。

実際のスクリプトは以下のもの。

```bash
#!/bin/bash
. docker-wrapper.sh
docker run \
  --rm \
  -u 1000:1000 \
  $(docker_wrapper_tty) \
  $(docker_wrapper_volumes) \
  -w $(pwd) \
  "${docker_wrapper_envs[@]}" \
  $(docker_wrapper_image ruby) \
  ruby "$@" \
;
```


#### 実行が終わったらコンテナを削除する

コマンドラインツールなので、実行終了後にコンテナが残っていて欲しいことはほぼない。

容量を圧迫するし、残しておいてもいいことはないので、実行終了後に削除してしまう。


#### UID 1000、 GID 1000 で起動する

ほとんどのイメージでは、デフォルトで root で起動される。

これはあまり良くないので、 UID と GID を指定して起動したい。

[その１](/entry/2017/09/02/170406)で使用したイメージ（[getto/labo-slim](https://github.com/getto-systems/labo-slim)）では、作業ユーザーの UID, GID は 1000 なので、この ID で起動する。


#### 端末を結びつける

irb などの対話型ツールを使用する場合は `-it` オプションを指定する必要がある。

ただし、 `-it` を常につけておくと、パイプで起動した時などにはエラーになってしまう。

このため、端末を持っている場合のみ、 `-it` を指定するようにする。

```bash
if [ -t 1 ]; then
  -it --detach-key ctrl-[,ctrl-[
fi
```

`-t 1` で、標準出力がオープンされていて、端末を参照していることをチェックできる。

`--detach-keys` は、 `ctrl-[` を２回打ち込むことにしておく。

- 自分の環境では Esc キーで `ctrl-[` が入力される


#### カレントディレクトリで実行したかのように振る舞うようにする

コマンドラインツールなので、当然、カレントディレクトリで実行したい。

しかし、 docker run で起動するので、本質的に異なる環境で実行される。

volume を共有して起動することで、カレントディレクトリで実行したかのようにエミュレートする。

作業ディレクトリを環境変数に記録しておき、同じ volume を同じパスにマウントすることでファイルを共有する。

```bash
DOCKER_WRAPPER_VOLUMES=/path/to/apps:/apps,/path/to/dotfiles:/home/labo

if [ -n "$DOCKER_WRAPPER_VOLUMES" ]; then
  -v ${DOCKER_WRAPPER_VOLUMES//,/ -v }
fi
```

さらに、 `-w $(pwd)` で、 working directory をカレントディレクトリにする。

こうすることで、カレントディレクトリで実行したかのように振る舞う。


#### 現在の環境変数を引き継ぐ

環境変数も現在の値を引き継いで実行したい。

しかし、 docker run で起動するので、本質的に異なる環境で実行される。

現在の環境変数を全て `-e` で引き継ぐことで、同じ環境で実行したかのようにエミュレートする。

ただし、PATH と LANG は上書きするとよくないので除外する。

また、 ENV_FILES は --env-file に変換して渡す。

```bash
$ ENV_FILES=my.env,other.env MY_ENV=VALUE ruby
# => docker run \
  --env-file my.env \
  --env-file other.env \
  -e MY_ENV=VALUE \
  (-e other current envs...) \
  ...
```


#### イメージ名は環境変数で指定する

異なるプロジェクトで異なるイメージを使用したいことは当然考えられるので、イメージは環境変数から取得するようにする。

ruby や elixir などはオフィシャルなものがあり、 `ruby:2.4.1` のような指定で pull できる。
これを使用する場合は `2.4.1` のように、タグの指定のみを行いたい。

他のイメージを使用したい場合も当然あるので、イメージの指定も行えるようにしたい。

```bash
DOCKER_WRAPPER_IMAGE_ruby=2.4.1
docker_wrapper_image ruby # => ruby:2.4.1

DOCKER_WRAPPER_IMAGE_ruby=example/my_ruby:1.0.0
docker_wrapper_image ruby # => example/my_ruby:1.0.0
```


[TOP](#top)
<a id="setup-server"></a>
### サーバー用スクリプト

次にサーバー用のラッパーを考える。

- バックグラウンドで起動する
- UID 1000、GID 1000 で起動する
- コンテナ名を指定する
- プロジェクトルートディレクトリで実行したかのように振る舞うようにする
- サーバー用のオプションを指定する
- 現在の環境変数を引き継ぐ
- イメージ名は環境変数で指定する
- start, stop, restart などのサブコマンドを受け付ける

サーバー用のラッパーとして必要なオプションはこんなところだ。

実際のスクリプトは以下のもの。

```bash
#!/bin/bash
. docker-wrapper.sh
docker_wrapper_server phoenix "$@"
if [ "$docker_wrapper_server_cmd" == start ]; then
  docker run \
    -d \
    -u 1000:1000 \
    $(docker_wrapper_server_name) \
    $(docker_wrapper_volumes) \
    -w $APP_ROOT \
    "${docker_wrapper_envs[@]}" \
    $(docker_wrapper_image elixir) \
    mix phoenix.server \
  ;
fi
```


#### バックグラウンドで起動する

サーバーなので、フォアグラウンドで起動したいことはない。

このため、常に `-d` をつけて起動したい。


#### コンテナ名を指定する

サーバーなので、複数起動したいことはない。

このため、コンテナ名を適切につけて、重複して起動することの無いようにする。

環境変数にベースとなる名前を記録しておき、サーバーコマンドの名前に応じたコンテナ名をつける。

```bash
DOCKER_WRAPPER_SERVER_HOSTNAME=my-project

docker_wrapper_server phoenix "$@"

docker_wrapper_server_name
# => --name my-project-phoenix
     --host my-project-phoenix
```

- ついでに host も名前と同じものにしておく


#### サーバー用オプションを指定する

サーバーなので、ポートの publish など、追加のオプションを指定したい。

環境変数に追加オプションを記述しておくことで、オプションをマージする。

```bash
DOCKER_WRAPPER_SERVER_OPTS_phoenix=-p 4000:4000

docker_wrapper_server phoenix "$@"

${docker_wrapper_envs[@]} # => -p 4000:4000 (other env vars...)
```

この方法だと、スペースを含むオプションを指定することはできない。

- 環境変数にスペースが含まれている場合は `--env-file` でなんとかなる
- 他にスペースを含むオプションを指定したいことは今の所発生していない


#### start, stop, restart などのサブコマンドを受け付ける

以下のサブコマンドを受け付けるようにしたい。

- start : サーバーの起動
- stop : サーバーの停止、コンテナの削除
- restart : stop, start
- logs : ログの表示
- status : 状態の表示
- ps : docker ps の表示

これらのうち、 start 以外はコンテナ名があれば実行が可能だ。

コンテナ名はすでにわかっているので、 start 以外のサブコマンドなら共通に処理できる。

```bash
docker_wrapper_server phoenix "$@"
if [ "$docker_wrapper_server_cmd" == start ]; then
  docker run ...
fi
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

[getto-systems/docker-wrapper](https://github.com/getto-systems/docker-wrapper) を使用することで、各種ラッパースクリプトを量産できる。

このスクリプトは環境変数を使用して挙動の変更を行なっているので、プロジェクトごとに環境変数を切り替える必要がある。

tmux や direnv を使用することで、プロジェクトごとに環境変数を切り替えて作業できる。

[「その３」](/entry/2017/09/16/180320)へ続く。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Man page of Bash](https://linuxjm.osdn.jp/html/GNU_bash/man1/bash.1.html)
- [docker attach : Docker Docs](https://docs.docker.com/engine/reference/commandline/attach/)


[TOP](#top)
