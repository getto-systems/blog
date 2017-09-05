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

tmux を使用して、環境変数の設定を行うことでサーバーをグループ化して作業できるようにするのは「その３」でやります。

- [その１](/entry/2017/09/02/170406)
- その２
- その３

###### CONTENTS

1. [環境変数の受け渡し](#setup-env-vars)
1. [コマンド用スクリプト](#command-script)
1. [サーバー用スクリプト](#server-script)
1. [direnv による環境変数の設定](#setup-env-by-direnv)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [docker-wrapper の設置](#install-docker-wrapper)

###### SOURCE

- [getto-systems/docker-wrapper : GitHub](https://github.com/getto-systems/docker-wrapper)
- [getto-systems/docker-wrapper-commands : GitHub](https://github.com/getto-systems/docker-wrapper-commands)


<a id="setup-env-vars"></a>
### 環境変数の受け渡し

docker run でコンテナを起動してコマンドを実行するので、環境変数は -e オプションで受け渡さなければならない。

```bash
$ ENV=VALUE docker run ... # こうではなく
$ docker run -e ENV=VALUE  # こうしなければならない
```

docker run の部分をラッパースクリプトで置き換えるので、以下のような見た目になる。

```bash
$ ENV=VALUE ruby # こうではなく
$ ruby ENV=VALUE # このような感じ
```

しかし、このままでは `ENV=VALUE` という引数が渡されるだけで、環境変数しては設定されない。

この引数を `-e ENV=VALUE` の形にして `docker run` に渡す必要がある。

もちろん、コマンドの引数はそのまま渡さなければならない。

```bash
$ ruby ARG1 ARG2 ENV=VALUE
```


[TOP](#top)
<a id="command-script"></a>
### コマンド用スクリプト


[TOP](#top)
<a id="server-script"></a>
### サーバー用スクリプト


[TOP](#top)
<a id="setup-env-by-direnv"></a>
### direnv による環境変数の設定


[TOP](#top)
<a id="postscript"></a>
### まとめ

「その３」へ続く。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [docker attach : Docker Docs](https://docs.docker.com/engine/reference/commandline/attach/)


[TOP](#top)
<a id="install-docker-wrapper"></a>
#### docker-wrapper の設置


[TOP](#top)
