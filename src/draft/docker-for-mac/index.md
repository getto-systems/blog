---
title: Docker for Mac で開発環境を構築する - その後
---
<a id="top"></a>

- mount 遅い問題をなんとかしたい
- docker のリセットで volume が失われないようにしたい
- docker-sync で解決しよう

###### CONTENTS

1. [mount 遅い問題](#slow-mount-host-volume)
1. [開発に使用している volume をホストにバックアップ](#backup-volumes)
1. [docker-sync 導入](#docker-sync)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="slow-mount-host-volume"></a>
### mount 遅い問題

[Docker for Mac で開発環境を構築する](/entry/2017/09/16/180320) の形でしばらく運用していたのだが、ホストのディレクトリを直接 mount するのがとても遅いため、なんとかしたくなった。

#### ホストのディレクトリを mount するのはなぜか

Docker は結構不安定で、「リセット」で完全にデータを削除しないと立ち上がらなくなることがままある。

Docker for Mac は volume の内容が Mac からアクセスできない。
Docker が動いていれば方法はあるが、今必要なのは Docker が起動しなくなった時に volume を救出する方法だ。

Linux 上で CoreOS を運用していた時は volume の内容が見えていたので、これをバックアップしておけば、データを削除しても volume の復旧が簡単だった。

volume 上に開発中のコードや home ディレクトリ下の鍵などが保存されているため、これらが失われてしまうのは非常に面倒だ。

そこで、ホストのディレクトリを直接 mount させることで解決しよう、と考えたわけだ。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2018年現在の github-flow についてまとめてみた。
今年も色々とやり方が変わるだろうけど、現在大切にしていることを文章にしてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [docker-sync](http://docker-sync.io/)


[TOP](#top)
