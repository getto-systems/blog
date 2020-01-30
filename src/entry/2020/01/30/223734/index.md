# go package の構成についてのまとめ
<a id="top"></a>

golang 始めたばかりでよくわかっていないけれど、パッケージの構成についてまとめてみた。

###### CONTENTS

1. [パッケージとディレクトリの構成](#package-and-directory)
1. [初期設定の仕方](#go-mod-init)
1. [import の仕方](#import)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- GO : 1.13.6


<a id="package-and-directory"></a>
### パッケージとディレクトリの構成

ここでは以下のパッケージを開発しているとする。

```txt
- main
- awesome
- feature
  - component
```

この時、ディレクトリ構成は以下の通り。

```txt
- main.go
- awesome/awesome.go
- feature/feature.go
- feature/component/component.go
```

以下のルールでファイルを配置する。

- main.go はプロジェクト直下に配置
- パッケージと同名のディレクトリを作成
- パッケージと同名のファイルにコードを保存
- ネストしたパッケージについても同様

go では、同じパッケージなら、同じディレクトリに複数のファイルで定義できる。
なぜそうしたいのかよくわからない。
（機能ごとに分けるとかなら別パッケージにするべきじゃないかな）

まあコンパイルするし、IDE 使えばわかるし、カジュアルにファイルを分けようって方針な気もする。


[TOP](#top)
<a id="go-mod-init"></a>
### 初期設定の仕方

以下のコマンドでモジュールのパスを指定する。

```bash
go mod init $MODULE_PATH
```

ここでは `MODULE_PATH=github.com/getto-systems/golang-example` として説明する。
これは GitHub で `getto-systems` アカウントの `golang-example` リポジトリでこのモジュールを公開する、という意味になる。

仕組みはよく調べていないが、ほかのモジュールから参照されたとき、アクセス可能なパスであれば依存関係を解決してくれるようだ。
（GitHub が止まったらコンパイルできなくなるのかな）

自分からしか参照しないなら、実際に GitHub で公開されていなくてもコンパイルは通る。


[TOP](#top)
<a id="import"></a>
### import の仕方

パッケージを import するときはモジュールのパスから指定する。

```golang
package main

import (
	github.com/getto-systems/golang-example/awesome
	github.com/getto-systems/golang-example/feature
	github.com/getto-systems/golang-example/feature/component
)
```

自分のモジュールでも、フルパスで指定する必要がある。


[TOP](#top)
<a id="postscript"></a>
### まとめ

golang のパッケージの構成の仕方をまとめた。
まだ書き始めたばかりでほかのソースをよく見ていないので、これじゃうまくないところもあるだろうがとりあえずこれで始めてみる。

バージョンの管理についてもろいろやり方があるようだが、よく調べていない。
モジュールを公開することになったらまた調べてみる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [A beginners guide to Packages in Golang | Callicoder](https://www.callicoder.com/golang-packages/)
- [モジュール対応モードへの移行を検討する | text.Baldanders.info プログラミング言語 Go](https://text.baldanders.info/golang/go-module-aware-mode/)


[TOP](#top)
