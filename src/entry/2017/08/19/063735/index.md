---
title: textlint するために markdown でブログを書いて livereload でプレビューする
---
<a id="top"></a>

* 読みやすいブログのために textlint したい
* それなら markdown で記事を書いて git で管理したい
* livereload でプレビューしつつ書き進められたら便利

今回のソース : [getto-systems/blog : GitHub](https://github.com/getto-systems/blog)

###### CONTENTS

1. [html を livereload でプレビューする](#preview-html-by-livereload)
1. [markdown を html に変換する](#convert-to-html)
1. [layout をつけてブログの体裁を整える](#apply-layout)
1. [textlint で校正する](#apply-textlint)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [npm install](#npm-install)
1. [.gitignore](#gitignore)
1. [gulpfile](#gulpfile)
1. [hatena.jade](#template)

<a id="preview-html-by-livereload"></a>
### html を livereload でプレビューする

まずコンテンツが表示されるとやる気が出るので、 web サーバーのセットアップから行う。

```bash
$ npm install --save-dev \
  gulp \
  gulp-server-livereload
```

`public/` をドキュメントルートとしてポート 8000 で web サーバーを立てて、 livereload するように設定する。

```javascript
var gulp = require("gulp");

var path = {
  root: "public/"
};

gulp.task("livereload", function(){
  gulp.src(path["root"])
    .pipe( require("gulp-server-livereload")({
      host: "0.0.0.0",
      livereload: true,
      open: true
    }) );
});
```

public/index.html に適当なファイルを置いて livereload するか確認する。

livereload 用のスクリプトは html か body タグを目印にして埋め込まれるので、 html か body タグを含める必要がある。

```html
<!doctype html>
<html lang="ja">
  <body>
    <h1>Hello</h1>
    <p>world!!</p>
  </body>
</html>
```

web サーバーを立ち上げてコンテンツを確認する。

```bash
gulp livereload
```

`http://localhost:8000` にアクセスして、 public/index.html を編集した時にリロードされれば OK。

[TOP](#top)
<a id="convert-to-html"></a>
### markdown を html に変換する

html の表示を確認したので、次は markdown を html に変換する。

```bash
$ npm install --save-dev \
  gulp-plumber \
  gulp-markdown
```

src/ 以下の .md ファイルを public/ 以下に html として変換するように設定する。

* gulp-plumber : 変換エラーとかの場合でも、 watch が停止しないようにする

```javascript
var path = {
  root: "public/",
  md: "src/**/*.md"
};

gulp.task("build", function(){
  gulp.src(path["md"])
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-markdown")() )
    .pipe( gulp.dest(path["root"]) );
});

gulp.task("livereload", function(){
  gulp.src("public")
    .pipe( require("gulp-server-livereload")({
      host: "0.0.0.0",
      livereload: true,
      open: true
    }) );
  gulp.watch(path["md"],["build"]);
});
```

src/index.md に適当なファイルを作成する。

```md
# Hello
world!!
```

サーバーを再起動して `http://localhost:8000` にアクセスして確認する。

```bash
gulp livereload
```

src/index.md を編集してみて、 html ができていれば OK。

この時点では、作成された html に body や html タグがないため、 livereload が効いていない。


[TOP](#top)
<a id="apply-layout"></a>
### layout をつけてブログの体裁を整える

markdown を html に変換するための構成は整えたが、レイアウトがないため、 livereload もできない。

レイアウトを整えて、さらにブログの CSS も適用したい。

```bash
$ npm install --save-dev \
  gulp-front-matter \
  gulp-layout \
  jade
```

front-matter で markdown ファイルに追加した追加情報を取り出して layout に流すように設定。

```javascript
gulp.task("build", function(){
  gulp.src(path["md"])
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-front-matter")({remove: true}) )
    .pipe( require("gulp-markdown")() )
    .pipe( require("gulp-layout")(function(file){ return file.frontMatter }) )
    .pipe( gulp.dest(path["root"]) );
});
```

markdown に front-matter 用の情報を追加する。

* ファイルの先頭に追加
* `---` で囲んで記述
* yaml 形式
* layout : 必須。テンプレートファイルのパスを指定
* その他 : テンプレートファイルで使用するパラメータを記述

```md
---
layout: template/hatena.jade
title: Hello
---
# Hello
world!!
```

テンプレートを作成する。（今回作成したテンプレート全体は APPENDIX に掲載）

```jade
doctype html
html(lang="ja")
  head
    meta(charset="utf-8")
    title= title
    block meta
      meta(name="viewport", content="width=device-width")
  body
    != contents
```

`http://localhost:8000` にアクセスして確認する。

```bash
gulp livereload
```


src/index.md を編集した時にテンプレートの通りに変換されれば OK。


[TOP](#top)
<a id="apply-textlint"></a>
### textlint で校正する

```bash
$ npm install --save-dev \
  textlint \
  textlint-rule-preset-ja-technical-writing \
  gulp-textlint
```

front-matter の追加情報を削除した後のコンテンツを校正するように設定する。

```javascript
gulp.task("build", function(){
  gulp.src(path["md"])
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-front-matter")({remove: true}) )
    .pipe( require("gulp-textlint")({formatterName: "pretty-error"}) )
    .pipe( require("gulp-markdown")() )
    .pipe( require("gulp-layout")(function(file){ return file.frontMatter }) )
    .pipe( gulp.dest(path["root"]) );
});
```

textlint は .textlintrc から設定を読み込むようになっているので、 .textlintrc を作成する。

```json
{
  "rules": {
    "preset-ja-technical-writing": true
  }
}
```

今回は textlint-rule-preset-ja-technical-writing を使うことにした。

ルールやフィルタなど、色々あるようなのでその辺りは後日調整していくことにする。

```bash
gulp livereload
```

`http://localhost:8000` にアクセスして src/index.md を編集した時に textlint のログが出れば OK。


[TOP](#top)
<a id="postscript"></a>
### まとめ

これでとりあえず livereload でプレビューしながら markdown で記事を書いて textlint できるようになった。

あとはブログを書きながら textlint の設定周りを見直して行こう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

* [これからはじめるGulp（10）：deprecatedになっていたgulp-connectからgulp-webserverへ乗り換える : whiskers](https://whiskers.nukos.kitchen/2014/12/10/gulp-webserver.html)
* [Markdownをgulpを使いutf-8でhtml出力する(styleも適用) : Qiita](http://qiita.com/pd_takeuchi/items/7f52ff85a6b7e9786a11)
* [gulp で markdown から html と pdf を生成してみる : Qiita](http://qiita.com/kasei-san/items/e428d616cb978162ec9b)
* [textlintで日本語の文章をチェックする : Web Scratch](http://efcl.info/2015/09/10/introduce-textlint/)
* [textlint-ja/textlint-rule-preset-ja-technical-writing : GitHub](https://github.com/textlint-ja/textlint-rule-preset-ja-technical-writing)


[TOP](#top)
<a id="npm-install"></a>
#### npm install

```bash
$ npm init
$ npm install --save-dev \
  gulp \
  gulp-front-matter \
  gulp-layout \
  gulp-markdown \
  gulp-plumber \
  gulp-server-livereload \
  gulp-textlint \
  jade \
  textlint \
  textlint-rule-preset-ja-technical-writing
```

[TOP](#top)
<a id="gitignore"></a>
#### .gitignore

```gitignore
/node_modules
/public
/tmp
```

* 生成された html は git の管理下には置かない


[TOP](#top)
<a id="gulpfile"></a>
#### gulpfile

```javascript
var gulp = require("gulp");

var path = {
  root: "public/",
  md: "src/**/*.md"
};

gulp.task("build", function(){
  gulp.src(path["md"])
    .pipe( require("gulp-plumber")() )
    .pipe( require("gulp-front-matter")({remove: true}) )
    .pipe( require("gulp-textlint")({formatterName: "pretty-error"}) )
    .pipe( require("gulp-markdown")() )
    .pipe( require("gulp-layout")(function(file){
      var params = file.frontMatter;
      var now = new Date;
      params["year"] = now.getFullYear();
      params["month"] = now.getMonth() + 1;
      params["day"] = now.getDate();
      return params;
    }) )
    .pipe( gulp.dest(path["root"]) );
});

gulp.task("livereload", function(){
  gulp.src(path["root"])
    .pipe( require("gulp-server-livereload")({
      host: "0.0.0.0",
      livereload: true,
      open: true
    }) );
  gulp.watch(path["md"],["build"]);
});
```

[TOP](#top)
<a id="template"></a>
#### hatena.jade

```jade
doctype html
html(lang="ja")
  head
    meta(charset="utf-8")
    block meta
      meta(name="viewport", content="width=device-width")

    link(rel="shortcut icon", href="https://cdn.image.st-hatena.com/image/favicon/7d002255cb0e4d23cfb606cb7389b8ae0a0b7b28/version=1/https%3A%2F%2Fcdn.mogile.archive.st-hatena.com%2Fv1%2Fimage%2Fshun-fix9%2F302460045853663223.jpg")
    link(rel="icon", sizes="192x192", href="https://cdn.image.st-hatena.com/image/square/d9eb56e83fa4523b913ab7befea4071b11f6da72/backend=imagemagick;height=192;version=1;width=192/https%3A%2F%2Fcdn.mogile.archive.st-hatena.com%2Fv1%2Fimage%2Fshun-fix9%2F302460045853663223.jpg")

    link(rel="stylesheet", type="text/css", href="https://cdn.blog.st-hatena.com/css/blog.css?version=f0b292df77a2318c6378b0b109796c5516eaa0af&amp;env=production")
    link(rel="stylesheet", type="text/css", href="https://blog.hatena.ne.jp/-/blog_style/10328537792368208553/c23573905a14dfd09e2cf281442a1fc65f9ca1a5")

  body(class="page-index header-image-enable enable-top-editarea globalheader-off")
    div(id="container")
      div(id="container-inner")
        header(id="blog-title", data-brand="hatenablog")
          div(id="blog-title-inner", style="background-image: url('https://cdn-ak.f.st-hatena.com/images/fotolife/s/shun-fix9/20170811/20170811115417.png'); background-position: center -343px;")
            div(id="blog-title-content")
              h1(id="title")
                a(href="/")
                  != "げっとシステムログ"
              h2(id="blog-description")
                != "WEB開発関連メモ"
        div(id="content", class="hfeed")
          div(id="content-inner")
            div(id="wrapper")
              div(id="main")
                div(id="main-inner")
                  article(class="entry hentry js-entry-article date-first autopagerize_page_element chars-2800 words-200 mode-markdown entry-odd", id="entry-10328749687185662488")
                    div(class="entry-inner")
                      header(class="entry-header")
                        div(class="entry-date date first")
                          a(href="#", rel="nofollow")
                            time(pubdate)
                              span(class="date-year")
                                != year
                              span(class="hyphen")
                                != "-"
                              span(class="date-month")
                                != month
                              span(class="hyphen")
                                != "-"
                              span(class="date-day")
                                != day
                        h1(class="entry-title")
                          a(href="#", class="entry-title-link bookmark")
                            != title
                      div(class="entry-content")
                        != contents
            aside(id="box2")
              div(id="box2-inner")
                div(class="hatena-module hatena-module-search-box")
                  div(class="hatena-module-title")
                    != "検索"
                  div(class="hatena-module-body")
                    form(class="search-form" action="#" method="get")
                      input(type="text", class="search-module-input", placeholder="記事を検索")
                      input(type="submit", value="検索", class="search-module-button")
```
