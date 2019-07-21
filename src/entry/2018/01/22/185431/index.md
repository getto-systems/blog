---
title: Docker for Mac で開発環境を構築する - その後
---
<a id="top"></a>

- mount 遅い問題をなんとかしたい
- docker のリセットで volume が失われないようにしたい
- docker-sync で解決しよう

###### CONTENTS

1. [mount 遅い問題](#mount-host-volume)
1. [開発に使用している volume をホストにバックアップ](#backup-volumes)
1. [docker-sync 導入](#docker-sync)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="mount-host-volume"></a>
### mount 遅い問題

[Docker for Mac で開発環境を構築する](/entry/2017/09/02/170406) の形でしばらく運用していたのだが、ホストのディレクトリを直接 mount するのがとても遅いため、なんとかしたくなった。

#### ホストのディレクトリを mount するのはなぜか

Docker は結構不安定で、「リセット」で完全にデータを削除しないと立ち上がらなくなることがままある。

Docker for Mac は volume の内容が Mac からアクセスできない。
Docker が動いていれば方法はあるが、今必要なのは Docker が起動しなくなった時に volume を救出する方法だ。

CoreOS で運用していた時は volume の内容が見えていたので、これをバックアップしておけば、データを削除しても volume の復旧が簡単だった。

volume 上に開発中のコードや鍵などが保存されているため、これらが失われてしまうのは非常に面倒だ。

そこで、ホストのディレクトリを直接 mount させることで解決しよう、と考えたわけだ。

しかし、 Docker for Mac でホストのディレクトリをマウントするととても遅い。
Mac のファイルシステムとの相性の問題らしいが、詳しいことは調べていない。
最近のアップデートで、マウントするときのフラグを指定していくらか改善したが、満足できる速度にはならなかった。


[TOP](#top)
<a id="backup-volumes"></a>
### 開発に使用している volume をホストにバックアップ

ホストのディレクトリをマウントすると遅いので、普通の volume を使用して開発することを考える。
しかし、普通の volume を使用すると、 Docker が起動しなくなった時に volume の救出が難しい。

そこで、 volume の内容をホストにバックアップしておくことにする。
コンテナで rsync 等を動かしてホストにバックアップすれば良いだろう。
すでにツールがあるので、それを導入する。


[TOP](#top)
<a id="docker-sync"></a>
### docker-sync 導入

docker-sync は ruby で書かれていて gem になっている。
今回は Mac にインストールされているシステムの ruby を使用することにした。

```bash
sudo gem install -n /usr/local/bin docker-sync
```

インストールが以下のエラーで止まったので、調べてみると開発用のツールが足りないらしい。

```text
mkmf.rb can't find header files for ruby
```

- [Docker for Mac - mkmf.rb can't find header files for ruby : stack overflow](https://stackoverflow.com/questions/46377667/docker-for-mac-mkmf-rb-cant-find-header-files-for-ruby)

これによれば XCode のツールをインストールする必要がある。

```bash
sudo xcode-select --install
```

#### docker-sync.yml

現在使用している docker-sync.yml は以下の内容だ。

```yaml
version: "2"

options:
  verbose: true
syncs:
  apps:
    sync_userid: '1000'
    src: './apps'
    sync_excludes: []
  home:
    sync_userid: '1000'
    src: './home'
    sync_excludes: [".local/share/nvim/swap"]
```

ディレクトリ構成は以下の通り。

```text
./
+ docker-sync.yml
+ apps/
+ home/
```

`docker-sync start` で、 apps と home という volume にそれぞれファイルがコピーされる。

あとは、 apps と home をマウントして開発を開始すれば良い。
volume に対して行なった変更も、ホストのディレクトリに対して行なった変更も、双方向で同期される。

ホストのディレクトリをタイムマシンの対象ディレクトリに置いておけば、バックアップもひとまず安心だ。


#### システムの ruby を使用するのはなぜか

rbenv などのツールを使用して、システムの gem を使用しないようにした方が良さそうに思える。

しかし、 Docker で環境を構築する動機の１つに、開発機を素早く移行したいというものがあるのだ。
Mac にインストールするものは最小限にしたい。

Mac 上で直接 ruby の開発をするわけではなく、ツールを使用するだけだ。
なので、システムの ruby を使用することにした。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Docker for Mac で開発環境を構築して、快適に開発できるようになってきた。
`docker-sync` を使用することになったが、この依存はしょうがないと割り切ることにした。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [docker-sync](http://docker-sync.io/)
- [Docker for Mac - mkmf.rb can't find header files for ruby : stack overflow](https://stackoverflow.com/questions/46377667/docker-for-mac-mkmf-rb-cant-find-header-files-for-ruby)


[TOP](#top)
