# golang で test カバレッジを計測する
<a id="top"></a>

###### CONTENTS

1. [なにがしたいのか](#purpose)
1. [golang でカバレッジを計測する](#cover)
1. [カバレッジを取るパッケージを指定する](#coverpkg)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="purpose"></a>
### なにがしたいのか

- 複数のパッケージで開発している
- テストが含まれないパッケージもある
- テストが含まれていないパッケージも含めてカバレッジを計測したい


[TOP](#top)
<a id="cover"></a>
### golang でカバレッジを計測する

golang でカバレッジを計測するには、以下のコマンドを使用すればいい。

```bash
go test ./... -cover
```

このコマンドではカバレッジを表示して終了する。
カバレッジのレポートが欲しいので、以下のようにプロフィールを出力するようにする。

```bash
go test ./... -coverprofile=cover.out
```

このプロフィールを指定して html を生成できる。

```bash
go tool cover -html=cover.out -o cover.html
```

これで見やすい形式のカバレッジレポートを見られる。


[TOP](#top)
<a id="coverpkg"></a>
### カバレッジを取るパッケージを指定する

ここまでは普通にドキュメントに書いてあるのでつまづくところはなかった。
しかし上記の方法では、カバレッジのレポートがテストを書いてあるパッケージしか出なかった。

そこで、以下のようにカバレッジをレポートするパッケージを指定する必要がある。

```bash
go test ./... -coverprofile=cover.out -coverpkg=./...
```

[cover コマンドのドキュメント](https://golang.org/cmd/cover/)を見たところ、シンプルに `go help testflag` を確認してみろ、と書いてあった。
`go help testflag` を確認してみると、以下のような箇所が見つかった。

```text
-coverpkg pattern1,pattern2,pattern3
    Apply coverage analysis in each test to packages matching the patterns.
    The default is for each test to analyze only the package being tested.
    See 'go help packages' for a description of package patterns.
    Sets -cover.
```

`-coverpkg` に、カバレッジをレポートするパッケージを指定すればいいらしい。
デフォルトでは、テストが書いてあるパッケージのみ、レポートするようになっているようだ。

関連するすべてのパッケージのカバレッジを計測したいので、この記事では `./...` を指定してある。


[TOP](#top)
<a id="postscript"></a>
### まとめ

複数のパッケージのレポートを生成する方法がすんなり見つからなかったのでまとめておいた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [The cover story | The Go Blog](https://blog.golang.org/cover)
- [Command cover | golang docs](https://golang.org/cmd/cover/)


[TOP](#top)
