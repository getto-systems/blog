# golang パッケージのタグのつけ方
<a id="top"></a>

###### CONTENTS

1. [やりたいこと](#purpose)
1. [パッケージの公開](#publish-package)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- host: GitHub


<a id="purpose"></a>
### やりたいこと

golang のパッケージは GitHub に push するだけで公開できる。
しかし、バージョンのつけ方がわかりくかったのでまとめておく。


[TOP](#top)
<a id="publish-package"></a>
### パッケージの公開

パッケージの公開は GitHub に push するだけ。
パッケージを使用する側が参照できれば問題なくビルドできる。

新しいバージョンを公開したい場合は `v0.0.0` というようなフォーマットでタグをつける必要がある。
先頭の `v` が重要。
`0.0.0` という、先頭の `v` がないタグは新しいバージョンとして認識されなかった。


[TOP](#top)
<a id="postscript"></a>
### まとめ

golang のバージョンのつけ方をまとめた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Go Modules: v2 and Beyond | The Go Blog](https://blog.golang.org/v2-go-modules)


[TOP](#top)
