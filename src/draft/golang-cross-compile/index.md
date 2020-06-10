# golang でクロスコンパイルする話
<a id="top"></a>

###### CONTENTS

1. [やりたいこと](#purpose)
1. [できたやつ](#outcome)
1. [CGO_ENABLED](#cgo_enabled)
1. [GOOS と GOARCH](#goos_goarch)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- golang : 1.14.4


<a id="purpose"></a>
### やりたいこと

go build した結果だけを含んだ Docker Image を作りたい。
このためには `CGO_ENABLED` を無効にする必要がある。


[TOP](#top)
<a id="define-proto"></a>
### できたやつ

以下の Dockerfile をビルドする。

```Dockerfile
FROM golang:1.14.4-buster as builder
COPY . /build
WORKDIR /build
RUN : && \
  CGO_ENABLED=0 \
  GOOS=linux \
  GOARCH=amd64 \
  go build -a -o app . && \
  :

FROM scratch
COPY --from=builder /build/app /app
CMD ["/app"]
```

使用する golang のイメージは適宜指定する。
また、`GOOS` と `GOARCH` はデプロイするノードの環境と合わせる。


[TOP](#top)
<a id="cgo_enabled"></a>
### CGO_ENABLED

雑な理解では、これはコンパイル時にシステム native な C ライブラリの使用を指定するもの。
クロスコンパイルを行うときは自動的に無効となる、と[ドキュメント](https://golang.org/cmd/cgo/)に書いてある。

native なライブラリとリンクすることになるので、実行時に「なんか起動できない」っていうエラーになる。
実際に出たエラーメッセージは以下の通り。

```text
standard_init_linux.go:211: exec user process caused "no such file or directory"
```


[TOP](#top)
<a id="goos_goarch"></a>
### GOOS と GOARCH

クロスコンパイルするための OS とアーキテクチャの指定。
何を指定するかは[この記事](https://qiita.com/Jxck_/items/02185f51162e92759ebe)を参考にした。
最新のリストは[ソース](https://github.com/golang/go/blob/master/src/go/build/syslist.go)を見るとわかる。

これは実際に動かすマシンのものを指定する。
今回は GKE の「コンテナ用に最適化された OS（cos）」で動かすので、`GOOS=linux`、`GOARCH=amd64` を指定した。


[TOP](#top)
<a id="postscript"></a>
### まとめ

go build を scratch においてデプロイするための Dockerfile についてまとめた。

「なんか実行できない」っていう例のエラーから `CGO_ENABLED` にたどり着くのまで結構な時間がかかってしまったが、何とかデプロイまでたどり着けたのでヨシとする。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Use multi-stage builds | Docker docs](https://docs.docker.com/develop/develop-images/multistage-build/)
- [Command cgo | GO documents](https://golang.org/cmd/cgo/)
- [Go のクロスコンパイル環境構築](https://qiita.com/Jxck_/items/02185f51162e92759ebe)
- [golang/go : src/go/build/syslist.go | GitHub](https://github.com/golang/go/blob/master/src/go/build/syslist.go)


[TOP](#top)
