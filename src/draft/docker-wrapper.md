---
layout: template/hatena.jade
title: Docker for Mac で開発環境を構築する - その２
---
<a id="top"></a>

- 開発環境にアクセスできなくなるリスクを無くしたい
- 開発者ごとの環境差位を無くしたい
- 特定の言語に縛られない開発がしたい

前回は docker コンテナの起動まで行なった。

今回は各実行環境を docker run するコマンドをラップするスクリプトを作成して、コマンドがインストールされているかのように実行できるところまで。

direnv や tmux を使用して環境変数の設定を行うことで、グループ化して作業できるようにするのは「その３」でやります。

- [その１ - docker run でコマンドを起動する](/entry/2017/09/02/170406)
- その２ - docker run をラップする
- その３ - プロジェクトごとにグループ化して作業する

###### CONTENTS

1. [ラッパースクリプトを作成する](#wrapper-script)
1. [対話フラグ設定](#setup-tty)
1. [VOLUME の設定](#setup-volumes)
1. [環境変数の引き継ぎ](#setup-env-vars)
1. [IMAGE の設定](#setup-image)
1. [サーバー用スクリプト](#setup-server)
1. [コンテナ名とホストの設定](#server-name-and-host)
1. [サーバー用オプションの設定](#server-opts)
1. [サブコマンド受付](#server-command)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [docker-wrapper の設置](#install-docker-wrapper)

###### SOURCE

- [getto-systems/docker-wrapper : GitHub](https://github.com/getto-systems/docker-wrapper)
- [getto-systems/docker-wrapper-commands : GitHub](https://github.com/getto-systems/docker-wrapper-commands)


<a id="wrapper-script"></a>
### ラッパースクリプトを作成する

まずコマンドラインツール用のラッパーを作成する。

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

- 実行が終わったら削除する
- UID 1000 で起動する
- 端末を持って起動した場合は -it と --detach-key を指定する
- $DOCKER_WRAPPER_VOLUMES で指定された VOLUME をマウントする
- working directory は $(pwd) を指定する
- 現在の環境変数を引き継ぐ
- ruby のイメージ名を環境変数から取り出す

この例では docker 経由で ruby を起動できる。

このようなスクリプトを必要なだけ作成することで、まるでそのコマンドがインストールされているかのように作業することができる。


[TOP](#top)
<a id="setup-tty"></a>
### 対話フラグの設定

`$(docker_wrapper_tty)` で `-it --detach-key ctrl-@,ctrl-@` が指定される。

ただし、 `-it` を常につけておくと、パイプで起動した時などにはエラーになってしまう。

このため、端末を持っているかチェックする必要がある。

```bash
if [ -t 1 ]; then
  -it --detach-key ctrl-@,ctrl-@
fi
```

`-t 1` で、標準出力がオープンされていて、端末を参照していることをチェックできる。


[TOP](#top)
<a id="setup-volumes"></a>
### VOLUME の設定

コマンドの実行はカレントディレクトリで行いたい。

このため、 volume を共有して起動する必要がある。

shell 用のコンテナを起動した時に、 volume を `$DOCKER_WRAPPER_VOLUMES` に記録しておく。

```base
docker run \
  -v /path/to/apps:/apps \
  -v /path/to/dotfiles:/home/labo \
  -e DOCKER_WRAPPER_VOLUMES=/path/to/apps:/apps,/path/to/dotfiles:/home/labo \
  ...
```

`$DOCKER_WRAPPER_VOLUMES` から volume の設定を行い、 `-w $(pwd)` で実行する。
これで、まるでカレントディレクトリで実行したようにコマンドを実行することができる。

```bash
if [ -n "$DOCKER_WRAPPER_VOLUMES" ]; then
  -v ${DOCKER_WRAPPER_VOLUMES//,/ -v }
fi
```


[TOP](#top)
<a id="setup-env-vars"></a>
### 環境変数の引き継ぎ

docker run でコンテナを起動してコマンドを実行するので、環境変数は -e オプションで受け渡さなければならない。

```bash
$ ENV=VALUE docker run ... # こうではなく
$ docker run -e ENV=VALUE  # こうしなければならない
```

明示的に指定するのは面倒なので、現在の環境変数の値を読み込んでしまう。

PATH と LANG は上書きするとよくないので除外し、 ENV_FILES は --env-file のリストとして扱う。

こうすることで環境変数は透過的に渡される。


[TOP](#top)
<a id="setup-image"></a>
### IMAGE の設定

異なるプロジェクトで異なるイメージを使用したいことは当然考えられるので、イメージは環境変数から取得するようにする。

```bash
DOCKER_WRAPPER_IMAGE_ruby=2.4.1
DOCKER_WRAPPER_IMAGE_ruby=my_ruby/image:2.4.1
```


[TOP](#top)
<a id="setup-server"></a>
### サーバー用スクリプト

サーバーの起動では、 start, stop などのサブコマンドを受け付けるようにしたい。

```bash
#!/bin/bash
. docker-wrapper.sh
docker_wrapper_server phoenix "$@"
if [ "$docker_wrapper_server_cmd" == start ]; then
  docker run \
    -d \
    -u 1000:1000 \
    -w $APP_ROOT \
    $(docker_wrapper_server_name) \
    $(docker_wrapper_volumes) \
    "${docker_wrapper_envs[@]}" \
    $(docker_wrapper_image elixir) \
    mix phoenix.server \
  ;
fi
```

- `docker_wrapper_server` で start 以外の共通の処理を行う
- `-d` でバックグラウンド起動
- UID 1000 で起動する
- `$(docker_wrapper_server_name)` で --name と --host を指定
- $DOCKER_WRAPPER_VOLUMES で指定された VOLUME をマウントする
- working directory は `$APP_ROOT` を指定
- 現在の環境変数を引き継ぐ
- elixir のイメージ名を環境変数から取り出す

この例では docker 経由で `mix phoenix.server` が実行される。

volume と環境変数はコマンドライン用のスクリプトと同様に設定する。


[TOP](#top)
<a id="server-name-and-host"></a>
### コンテナ名とホストの設定

$DOCKER_WRAPPER_SERVER_HOSTNAME から、コンテナ名とホストの設定を行う。

```bash
DOCKER_WRAPPER_SERVER_HOSTNAME=my-project
# => --name my-project-phoenix
     --host my-project-phoenix
```

$DOCKER_WRAPPER_SERVER_HOSTNAME にはプロジェクト名を設定することで、プロジェクトごとにサーバーをグループ化して管理する。


[TOP](#top)
<a id="server-opts"></a>
### サーバー用オプションの設定

$DOCKER_WRAPPER_SERVER_OPTS_phoenix に、追加のオプションを設定しておくことで、 `${docker_wrapper_envs[@]}` にオプションがマージされる。

```bash
DOCKER_WRAPPER_SERVER_OPTS_phoenix=-p 4000:4000
${docker_wrapper_envs[@]} # => -p 4000:4000
```


[TOP](#top)
<a id="server-command"></a>
### サブコマンド受付

`docker_wrapper_server` で、サブコマンドの処理が行われる。

コンテナ名がわかっているので、 stop, ps, logs などのコマンドは共通に処理することができる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

「その３」へ続く。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Man page of Bash](https://linuxjm.osdn.jp/html/GNU_bash/man1/bash.1.html)
- [docker attach : Docker Docs](https://docs.docker.com/engine/reference/commandline/attach/)


[TOP](#top)
<a id="install-docker-wrapper"></a>
#### docker-wrapper の設置


[TOP](#top)
