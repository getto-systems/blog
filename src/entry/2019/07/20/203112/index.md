# dockle で docker build のベストプラクティスをチェックしてみる
<a id="top"></a>

###### CONTENTS

1. [dockle をインストールする](#install-dockle)
1. [dockle を試してみる](#check-image)
1. [DOCKER_CONTENT_TRUST について](#about-docker-content-trust)
1. [sudo について](#about-sudo)
1. [apt-get のキャッシュクリアについて](#about-apt-cache-clear)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- dockle : v0.1.14


<a id="install-dockle"></a>
### dockle をインストールする

[goodwithtech/dockle : GitHub](https://github.com/goodwithtech/dockle) を参考に dockle をインストールする。

実行環境は docker コンテナを使用するようにしているので、docker で起動する方法を選択した。


[TOP](#top)
<a id="check-image"></a>
### dockle を試してみる

dockle コマンドで指定したイメージのチェックができる。

```bash
dockle [イメージ]
```

開発に使用しているイメージ ([getto-systems/labo-container-dockerfile](https://github.com/getto-systems/labo-container-dockerfile)) をチェックしてみたところ、いくつか警告が出た。

特に、以下の項目について知らなかったので調べた記録を残しておく。

- DOCKER_CONTENT_TRUST を有効にしているか
- apt-get のキャッシュがクリアされていない
- sudo を使うべきではない


[TOP](#top)
<a id="about-docker-content-trust"></a>
### DOCKER_CONTENT_TRUST について

DOCKER_CONTENT_TRUST を 1 にしておくと、`docker pull` する時に trust data をチェックするようになる。
pull したイメージが、作成した人の public key で検証できなければエラーになる、というもののようだ。

今 [Introducing Docker Content Trust : Docker Blog](https://blog.docker.com/2015/08/content-trust-docker-1-8/) を読んでいる途中だが、どう使えば良いかわかっていない。
とりあえず、以下の方法を探っている。

- 本番環境で DOCKER_CONTENT_TRUST を有効にする方法
- 本番環境で使用するイメージを DOCKER_CONTENT_TRUST を有効にして作成する方法

これらの方法が理解できれば、DOCKER_CONTENT_TRUST にうまく乗っかれるはず。


[TOP](#top)
<a id="about-sudo"></a>
### sudo について

sudo コマンドは使用を避けるべき、ということが [best practices : docker docs](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user) に書いてある。
どうしても root になる挙動が欲しいなら、[tianon/gosu : GitHub](https://github.com/tianon/gosu) のようなツールを使用する、とある。

[tianon/gosu : GitHub](https://github.com/tianon/gosu) では、Alternatives の項目に `setpriv` も同じことが実現できると書かれていたので、これを使用することにした。

`setpriv` を使用して書き直した `entrypoint.sh` がこれ。

```bash
#!/bin/bash

groupmod -n $LABO_USER $BUILD_LABO_USER
usermod -l $LABO_USER -d /home/$LABO_USER -g $LABO_USER -G $LABO_USER,docker $BUILD_LABO_USER

export HOME=/home/$LABO_USER

exec setpriv --reuid $LABO_USER --regid $LABO_USER --init-groups "$@"
```

`setpriv` は環境変数を初期化しないので、`HOME` を設定しないと `HOME=/root` のままになってしまう。
`--reset-env` というオプションが [man](https://manpages.debian.org/buster/util-linux/setpriv.1.en.html) に乗っていたのだが、そんなオプションはないと言われてしまった。

これで `sudo` を使用するのとだいたい同じ挙動になった。


[TOP](#top)
<a id="about-apt-cache-clear"></a>
### apt-get のキャッシュクリアについて

apt-get のキャッシュは以下のコマンドでクリアできる。

```bash
apt-get clean && rm -rf /var/lib/apt/lists/*
```

これを `apt-get install` の後に実行するようにすれば良い。


[TOP](#top)
<a id="postscript"></a>
### まとめ

dockle を使用してベストプラクティスにしたがっているかチェックした。
知らないことが色々あったので今後も追っていきたい。

また、これを CI に組み込んで定期的にチェックできるようにしたい。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [goodwithtech/dockle : GitHub](https://github.com/goodwithtech/dockle)
- [人を震えさせるツール｢Dockle｣の仕組みを解説〜Dockerセキュリティの基礎知識も一緒に : Qiita](https://qiita.com/tomoyamachi/items/8e042e4269427bb3b326)


[TOP](#top)
