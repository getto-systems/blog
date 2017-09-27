---
title: Elm 言語の開発方針まとめ
---
<a id="top"></a>

- alt javascript の関数型言語 Elm で開発している
- 現在の開発の約束事をまとめる

###### CONTENTS

1. [全体像](#overall)
1. [静的な WEB コンテンツとバックエンドサーバー](#static-web)
1. [完全 SPA ではなくアプリケーションの機能ごとにページを作成](#one-work-per-page)
1. [テンプレートで html を生成](#generate-html-by-template)
1. [その他の色々](#misc)
 - localStorage にページのデータを保存
 - 関数呼び出しはパイプで
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [Elm 言語を選択した理由](#why-elm)

<a id="overall"></a>
### 全体像

![全体像](https://i.gyazo.com/2be8c08b7c91727b530e768968762a89.png)

- WEB コンテンツは静的な WEB サーバーで配布
- アプリケーションは API サーバー上で構築
- データベースは Google DataStore を使用
- 分析は Google BigQuery を使用


[TOP](#top)
<a id="static-web"></a>
### 静的な WEB コンテンツとバックエンドサーバー

フロントエンドは静的な WEB コンテンツとして構成する。
こうすることで、フロントエンド部分を AWS S3 に配備して、ランニングコストを抑えることができる。
また、 WEB コンテンツ配布部分のメンテナンスも考えなくてよくなる。

フロントエンドを構成する javascript でバックエンドの API サーバーにアクセスし、データの登録、参照を行う。

データは Google の DataStore に保管し、分析は Google の BigQuery で行う。
これらを使用する理由は、想定される使用状況では、ほぼ無料で利用が可能だからだ。

API サーバーは Google の GCE を使用する。

- DataStore や BigQuery を使用するので、サーバーも Google のもので、という理由
- 特に強い理由はない

現状はほぼ Google のサービスを利用する形になっている。
構成を工夫して AWS や Azure など、複数のサービスを使用することで、どのサービスが利用困難になっても良いようにしておきたい。
これは将来の課題として残っている。


[TOP](#top)
<a id="one-work-per-page"></a>
### 完全 SPA ではなくアプリケーションの機能ごとにページを作成

Elm を使用して、 index.html だけで全てを完結させる、ということもできないことはない。
しかし、バージョン 0.18 時点でこれを行うのは難しかった。

- 区別されるべき複数の機能が一つのアプリケーションにまとまっている
- 機能ごとにモジュールを分けたいので、 `Html.map` や `Cmd.map` などでまとめることになる
- メニューをクリックしたらページが変わる、といった基本となる部分が用意されていないので自作することになる

一度作成してみたのだが、基礎の自作部分がかなり巨大になってしまった。
Elm の中だけをみた場合、機能ごとにバラバラにページを用意する方がスッキリ実装できる。

- login/auth.html : 認証フォーム
- login/forget.html : パスワード忘れ
- etc...

ただし、この方法では html が結構な数作成され、ほとんど同じ内容になる。
そのため、これら html はテンプレートを元にして自動生成することにする。


[TOP](#top)
<a id="postscript"></a>
### まとめ



[TOP](#top)
<a id="reference"></a>
### 参考資料

- Soft Skills : John Z. Sonmez


[TOP](#top)
