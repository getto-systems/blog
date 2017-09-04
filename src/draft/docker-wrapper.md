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

1. [docker-wrapper の設置](#install-docker-wrapper)
1. [コマンド用スクリプト](#command-script)
1. [サーバー用スクリプト](#server-script)
1. [direnv による環境変数の設定](#setup-env-by-direnv)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

- [getto-systems/docker-wrapper : GitHub](https://github.com/getto-systems/docker-wrapper)
- [getto-systems/docker-wrapper-commands : GitHub](https://github.com/getto-systems/docker-wrapper-commands)


<a id="install-docker-wrapper"></a>
### docker-wrapper の設置


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
