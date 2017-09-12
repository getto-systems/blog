---
title: Docker for Mac で開発環境を構築する - その１
---
<a id="top"></a>

- 開発環境にアクセスできなくなるリスクを無くしたい
- 開発者ごとの環境差位を無くしたい
- 特定の言語に縛られない開発がしたい

今回は基本の docker コンテナを起動して、各実行環境を docker run するところまで。

docker run をラップしてコマンドがインストールされているかのように作業するのは「その２」でやります。

- その１ - docker run でコマンドを起動する
- [その２ - docker run をラップする](/entry/2017/09/09/111638)
- その３ - プロジェクトごとにグループ化して作業する

###### CONTENTS

1. [全体像](#development-flow)
1. [docker 入りのコンテナを起動](#run-docker-container)
1. [ruby スクリプトを実行](#run-ruby-script)
1. [web サーバーを起動](#run-web-server)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [entrypoint.sh](#entrypoint)

###### SOURCE

- [getto-systems/labo-slim : GitHub](https://github.com/getto-systems/labo-slim)
- [getto-systems/labo-connect : GitHub](https://github.com/getto-systems/labo-connect)


<a id="development-flow"></a>
### 全体像

1. Docker for Mac から docker 入りコンテナを起動
1. `docker run` で言語ごとのコンテナを起動

![全体像](https://i.gyazo.com/c5bb4d0c566fb9daf0fe604ef9c53558.png)


[TOP](#top)
<a id="run-docker-container"></a>
### docker 入りのコンテナを起動

getto/labo-slim イメージを使用する。

- [getto-systems/labo-slim : GitHub](https://github.com/getto-systems/labo-slim)

ubuntu をベースに、 docker に加えて zsh と neovim が開発用として入っている。

まず、ローカルの適当なディレクトリに apps と dotfiles ディレクトリを作成する。

dotfiles ディレクトリには自分の dotfiles を展開しておく。

```
/WORK_ROOT
  |
  +- apps
  +- dotfiles : your favorite dotfiles
```

用意ができたら、このイメージを使用して環境に入る。

```bash
user=${YOUR_USER_NAME}
root=${YOUR_WORKING_ROOT_DIR}
home=/home/$user
timezone=Asia/Tokyo
image=getto/labo-slim
name=getto-labo

docker run -it --rm \
  --detach-keys ctrl-@,ctrl-@ \
  --name $name \
  -e DOCKER_WRAPPER_VOLUMES=$root/apps:/apps,$root/dotfiles:$home \
  -e LABO_USER=$user \
  -e LABO_TIMEZONE=$timezone \
  -v $root/apps:/apps \
  -v $root/dotfiles:$home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w $home \
  $image
```

実際に使用しているスクリプトはこちら。

- [getto-systems/labo-connect : GitHub](https://github.com/getto-systems/labo-connect)

user は好みのユーザー名を使用できる。（entrypoint.sh は APPENDIX に掲載）

キーシークエンスで detach する場合は `ctrl-@` を２回入力する。

- 自分の環境では `ctrl-space` で `ctrl-@` が入力される。 tmux のエスケープシークエンスと同じになるのでこう設定している
- iterm2 を落とした場合は detach された。コンテナが起動していれば attach することでもう一度コンテナに入ることができる

このコンテナの中では docker コマンドを使用可能になっている。

```bash
$ docker ps
CONTAINER ID ... （実際の出力）
```

もし `permission denied` で実行できない場合は以下のコマンドを実行しておく。

```bash
$ sudo chown $LABO_USER:$LABO_USER /var/run/docker.sock
```

- 実験はしていないが、このコマンドを実行すると、どのユーザーでも docker コマンドが実行できるようになってしまうように感じる。 mac を共有して使用している場合はその辺り検証する必要がある


[TOP](#top)
<a id="run-ruby-script"></a>
### ruby スクリプトを実行

```bash
docker run \
  --rm \
  -it \
  --detach-keys ctrl-@,ctrl-@ \
  -u 1000:1000 \
  -w $(pwd) \
  -e HOME=$HOME \
  -v ${DOCKER_WRAPPER_VOLUMES//,/ -v } \
  -e MY_ENV=VALUE \
  ruby:latest \
  ruby ${ARG1} ${ARG2}
```

作業用のコンテナを起動するときに指定した、 ${DOCKER_WRAPPER_VOLUMES} を元に -v オプションを生成する。

- /apps と $HOME を共有して起動する、ということになる

さらに、 $(pwd) を working directory に指定することで、まるで ruby をインストールしてあるかのようにコマンドを実行することができる。

-it オプションにより、 irb 等の対話的コマンドも問題なく実行することが可能。


[TOP](#top)
<a id="run-web-server"></a>
### web サーバーを起動

```bash
docker run \
  -d \
  -u 1000:1000 \
  -w $APP_ROOT \
  --name ${SERVER_NAME}
  --host ${SERVER_HOST}
  -p 80:80 \
  -e HOME=$HOME \
  -v ${DOCKER_WRAPPER_VOLUMES//,/ -v } \
  -e MY_ENV=VALUE \
  node:latest \
  npm run livereload
```

コマンド実行とほぼ同等だが、 -d でバックグラウンド起動、 name や host も指定する。

停止は docker stop、ログは docker logs で確認できる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

docker コマンドが実行できれば、 ruby や node などの実行環境を簡単に手に入れることができる。

しかし、そのためには長い docker run コマンドを打ち込む必要がある。

docker run をラップしたスクリプトを用意しておけば、それらの実行環境がインストールされているかのように開発することができる。

「その２」へ続く。


#### docker 入りのコンテナを動かす理由は何か

単に docker run すれば mac に ruby や node などの実行環境がインストールされているかのように作業することができる。

しかし、 zsh や neovim といった開発用の shell 環境で作業したいため、 docker 入りのコンテナを docker for mac 上にもう１つ動かしている。

VS Code 等のツールを使用して開発する場合はこれが必要なくなりそうだ。

- VS Code 使いたいけど、背景を透過する方法が見当たらなくて保留にした
- 別に背景透過しなくても作業はできる、できるのだけど


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [docker attach : Docker Docs](https://docs.docker.com/engine/reference/commandline/attach/)


[TOP](#top)
<a id="entrypoint"></a>
#### entrypoint.sh

```bash
#!/bin/bash

: ${LABO_USER:=labo}

useradd $LABO_USER -s /bin/zsh && \
  usermod -aG sudo $LABO_USER

if [ -n "$LABO_TIMEZONE" ]; then
  if [ -f "/usr/share/zoneinfo/$LABO_TIMEZONE" ]; then
    ln -sf /usr/share/zoneinfo/$LABO_TIMEZONE /etc/localtime
  fi
fi

exec sudo -E -H -u $LABO_USER "$@"
```

- 指定されたユーザーを作成、 sudo グループ付与
- タイムゾーン設定
- 指定されたユーザーで、指定されたコマンドを実行
- 環境変数を引き継いで実行する
- ホームディレクトリを適切に設定する


[TOP](#top)
