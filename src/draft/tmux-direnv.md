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
1. [tmux による環境変数の設定](#setup-env-by-tmux)
1. [direnv による環境変数の設定](#setup-env-by-direnv)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [zplug によるプラグインの管理](#zplug)

###### SOURCE

- [getto-systems/birdfirm : GitHub](https://github.com/getto-systems/birdfirm)
- [getto-systems/tmux-wrapper : GitHub](https://github.com/getto-systems/tmux-wrapper)


<a id="strategy"></a>
### 全体像

[その２](/entry/2017/09/09/111638)では、ラッパースクリプトを作成して、コマンドがインストールされているかのように作業できるようにした。

このスクリプトは環境変数によって挙動を変える仕組みになっている。

tmux と direnv によって環境変数を管理することで、プロジェクトごとにグループ化して作業を行えるようにする。


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
<a id="zplug"></a>
#### zplug によるプラグインの管理


[TOP](#top)
