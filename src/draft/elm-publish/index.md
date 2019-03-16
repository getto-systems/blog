# Elm パッケージを publish する
<a id="top"></a>

基本的には書籍「基礎からわかる Elm」の「ライブラリの公開」の通りだが、操作に詰まった点をまとめておく。

###### CONTENTS

1. [パッケージ用 elm.json の記述](#edit-elm-json)
1. [必要なパッケージのインストール](#install-packages)
1. [ドキュメントの記述](#add-docs)
1. [テストでドキュメントの生成をしておく](#create-docs)
1. [GitHub に push](#push-to-github)
1. [elm publish](#elm-publish)
1. [アップデートする](#elm-publish-update)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Elm : 0.19.0


<a id="edit-elm-json"></a>
### パッケージ用 elm.json の記述

普通に `elm init` するとアプリケーション用の elm.json ができる。
これではパッケージには使えないので、いくつかの項目を修正する必要がある。

```json
{
  "type": "package",
  "name": "GITHUB-USER/REPO-NAME",
  "summary": "SUMMARY of the package",
  "license": "MIT",
  "version": "1.0.0",
  "exposed-modules": [],
  "elm-version": "0.19.0 <= v < 0.20.0",
  "dependencies": {},
  "test-dependencies": {}
}
```

まず以下の項目を追加する。

- `name`
- `summary`
- `license`
- `version`
- `elm-version`
- `exposed-modules`

また、 `dependencies` と `test-dependencies` は一旦 `{}` にしておく。
これは、`dependencies` の書き方がアプリケーションとパッケージで異なるので、アプリケーションの雛形のままだとエラーになるため。

`name` には GitHub のユーザー名とリポジトリのパスを指定する必要がある。
このリポジトリには publish 時にアクセスできなければならない。

`version` に指定できる最低バージョンは "1.0.0" にする必要がある。
なので、最初に publish するパッケージは publish の練習用として割り切って考えた方が良い。
`version` の付け方はかなり厳格に規定されているので、その具合を確認してから本番のパッケージを公開しても遅くない。

`exposed-modules` には、公開するモジュールを列挙する。
ここに列挙していないモジュールはパッケージの外部からアクセスできない。


[TOP](#top)
<a id="install-packages"></a>
### 必要なパッケージのインストール

`dependencies` と `test-dependencies` を一旦 `{}` にしたので、 `elm make` するためには必要なパッケージをインストールする必要がある。

```bash
$ elm install elm/core
$ elm-test init
```

`elm/core` の他にも依存しているパッケージがあるなら追加していく。


[TOP](#top)
<a id="add-docs"></a>
### ドキュメントの記述

`exposed-modules` に列挙したモジュールにはドキュメントを記述しなければならない。

```elm
module MyModule exposing ( myFunc )

{-| sample module

# Helper
@docs myFunc
 -}

import Set


{-| sample function

    "my value" |> MyModule.myFunc
 -}
myFunc : String -> Set.Set String
myFunc = Set.singleton
```

`{-|` と `-}` で囲んだ部分がドキュメントとして使用される。
ドキュメントは markdown 形式で記述する。
インデントすることでサンプルコードも記述できるので、追加しておくと良い。

モジュール定義の直後にはモジュールのドキュメントを記述する。
ここには目次を含めるのだが、 exposing する関数や type などをすべて列挙する必要がある。

関数などの定義の直前にはそれぞれのドキュメントを記述する。


[TOP](#top)
<a id="create-docs"></a>
### テストでドキュメントの生成をしておく

ドキュメントは以下のコマンドで生成できる。

```bash
$ elm make --docs=docs.json
```

publish する時、ドキュメントに不備があると失敗する。
CI ではドキュメントの生成もしておきたい。

```json
{
  "scripts": {
    "test": "elm-test && elm make --docs=docs.json"
  }
}
```


[TOP](#top)
<a id="push-to-github"></a>
### GitHub に push

リリースの準備ができたら、GitHub に push する。

```bash
$ git tag $VERSION
$ git push $GITHUB master --tags
```

まずリリースするバージョンのタグをつけて、そのタグを GitHub に push する。
このタグをつけたコミットにいないと publish できない。


[TOP](#top)
<a id="elm-publish"></a>
### elm publish

ここまで準備ができたら publish できるはず。

```bash
$ elm publish
```

もしエラーになった場合は表示されたエラーを修正して、 GitHub に push したタグを**一旦削除してから**もう一度やり直す。


[TOP](#top)
<a id="elm-publish-update"></a>
### アップデートする

パッケージをアップデートする場合は `bump` コマンドを使用する。

```bash
$ elm bump
$ git add elm.json
$ git commit -m "version up"
$ git tag $VERSION
$ git push $GITHUB master --tags
$ elm publish
```

このコマンドは、直前にリリースしたバージョンと比べて API にどのような変更があったかを調べて次のバージョンを決める。
このコマンドが提示したバージョン**以外では publish ができない**。

`bump` コマンドは elm.json を書き換えるので、これをコミットして `publish` する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Elm 0.19.0 でパッケージを publish する方法をまとめた。

バージョン番号の運用が厳格すぎて辛い。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- 書籍「基礎からわかる Elm」
- [How to publish an Elm package | Medium](https://medium.com/@Max_Goldstein/how-to-publish-an-elm-package-3053b771e545)


[TOP](#top)
