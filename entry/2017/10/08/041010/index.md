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
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [index.html](#index)

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

Elm を使用して、 index.html だけで全てを完結させる、ということも可能だ。
しかし、一度作成してみたのだが、基礎の自作部分がかなり巨大になってしまった。
Elm の中だけをみた場合、機能ごとにバラバラにページを用意する方がスッキリ実装できる。

例えば index.html は以下のような形となる。
（全体は APPENDIX に掲載）

```html
<div id="app"></div>

<script>
var app = Elm.Main.Index.embed(document.getElementById("app"), {
  page: "Index"
});
</script>
```

ページのモジュールは以下のような形となる。


```elm
module Main.Index exposing (main)

import Html exposing (Html)
import GettoBlog.Page.Index.Base as Base
import GettoBlog.Page.Index.View as View
import GettoBlog.Page.Index.Update as Update
import GettoBlog.Page.Index.Subscriptions as Subscriptions
import GettoBlog.I18n as I18n

opts =
  { translate = I18n.translate
  , authRequired = True
  }
main =
  Html.programWithFlags
    { init = Base.init opts
    , view = View.view
    , update = Update.update
    , subscriptions = Subscriptions.subscriptions
    }

```

このようなファイルを例えば `login/auth.html` など、必要なページの分作成する。
ほとんど同じ内容なので、これらはテンプレートを元にして自動生成する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

サーバーの構成と、ファイルの基本構成をまとめた。
具体的な実装方法などについてはまた別な記事でまとめたい。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [elm-lang.org](http://elm-lang.org/)


[TOP](#top)
<a id="index"></a>
#### index.html

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>ダッシュボード</title>
    <script type="text/javascript" src="/dist/app.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="https://css.getto.systems/0.1.7/getto.css">
  </head>
  <body>

    <div id="app"></div>
    <div id="error" style="display:none">
      <div class="LoginLayout">
        <article>
          <header>
            <p>
            <small id="company">GETTO</small>
            <br>
            <span id="title">Blog</span>
            <br>
            <small id="sub-title">げっとシステムログ</small>
            </p>
          </header>
          <section>
            <p>
            <i class="fa fa-exclamation-triangle"></i>
            システムエラーが発生しました
            </p>
            <form method="get" action="/">
              <p>
              <a href="?reset"><i class="fa fa-refresh"></i> リセット</a>
              </p>
            </form>
          </section>
        </article>
        <footer>
          <span id="project">getto/blog</span>
          <span id="version">version : 0.0.1</span>
        </footer>
      </div>
    </div>

    <script>try {
  var project = document.getElementById("project").innerHTML;

  var host = location.port ?
    location.hostname+":"+(parseInt(location.port)+1) :
    "api.blog.getto.systems";

  var page = "Index";
  var modules = page.split(".");

  var search = location.search.substring(1).split("&").reduce(function(acc,query) {
    if(query.length > 0) {
      var pair = query.split("=");
      acc[pair[0]] = decodeURIComponent(pair[1]) || "";
    }
    return acc;
  }, {});

  var storageKey = "app";

  if(location.search == "?reset") {
    localStorage.setItem(storageKey, null);
    history.pushState(null,null,"?");
  }

  var storage = JSON.parse(localStorage.getItem(storageKey));
  var locale, credential, state;
  if(storage) {
    locale = storage.locale;
    credential = storage.credential;
    terminal = storage.terminal;
    state = storage[page];
  }

  var toJSON = function(data) { return !!data ? JSON.stringify(data) : null };

  var init = {
    page: page,
    query: location.pathname + location.search,
    apiHost: "//"+host+"/"+project,
    locale: locale || document.children[0].getAttribute("lang"),
    project: project,
    version: document.getElementById("version").innerHTML.split(":")[1],
    company: document.getElementById("company").innerHTML,
    title: document.getElementById("title").innerHTML,
    subTitle: document.getElementById("sub-title").innerHTML,
    credential: toJSON(credential),
    terminal: toJSON(terminal),
    state: toJSON(state),
    search: toJSON(search),
    loadAt: (new Date()).toISOString()
  };

  var module = modules.reduce(function(acc,m){return acc[m];},Elm.Main);
  var app = module.embed(document.getElementById("app"), init);
  (function(ports){
    var saveStorage = function(key,data) {
      var current = JSON.parse(localStorage.getItem(storageKey)) || {};
      current[key] = data;
      localStorage.setItem(storageKey, JSON.stringify(current));
    };
    ports.saveCredential.subscribe(function(state) {
      saveStorage("credential", state);
    });
    ports.saveTerminal.subscribe(function(state) {
      saveStorage("terminal", state);
    });
    ports.saveState.subscribe(function(state) {
      saveStorage(page, state);
    });
    ports.redirectTo.subscribe(function(query) {
      location.href = query;
    });
  })(app.ports);
} catch(e) {
  document.getElementById("app").style.display = "none";
  document.getElementById("error").style.display = "block";

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "//"+host+"/api/error", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send("project="+encodeURIComponent(project)+"&message="+encodeURIComponent(e.stack ? e.stack : e.name+": "+e.message));

  throw e;
}
</script>
  </body>
</html>
```


[TOP](#top)
