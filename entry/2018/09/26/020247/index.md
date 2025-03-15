# npm reload で live reload しつつ CSP 対応する
<a id="top"></a>

「体系的に学ぶ 安全な Web アプリケーションの作り方」を読んで CSP ヘッダをちゃんと設定してみようという試み。

S3 + CloudFront でやってみたという話は[次の記事](/entry/2018/09/26/084813)で。

- npm パッケージの reload を使用して live reload する
- 必要な CSP ヘッダを整える
- Mozilla Obsertatory で結果を確認する

###### CONTENTS

1. [reload-wrapper を使用して live reload する](#reload-wrapper)
1. [Strict-Security-Policy](#Strict-Security-Policy)
1. [X-Content-Type-Options](#X-Content-Type-Options)
1. [X-Frame-Options](#X-Frame-Options)
1. [X-XSS-Protection](#X-XSS-Protection)
1. [Referrer-Policy](#Referrer-Policy)
1. [Content-Security-Policy](#Content-Security-Policy)
1. [Mozilla の Obsertatory を使用して結果を確認する](#Mozilla-Obsertatory)
1. [まとめ](#postscript)
1. [参考資料](#reference)


[TOP](#top)
<a id="reload-wrapper"></a>
### reload-wrapper を使用して live reload する

reload を使用して live reload する。
用意されているコマンドラインツールはヘッダーの指定ができないので、ラッパーを用意した。

```
$ npm install --save-dev reload-wrapper
```

package.json にスクリプトの設定を行う。

```
{
  "script": {
    "reload": "reload-wrapper -d ./public -w ./public/dist"
  }
}
```

headers.json にヘッダを指定する。

```
[
  ["Strict-Transport-Security", "max-age=31536000"],
  ["Content-Security-Policy", [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "connect-src 'self' https://api.example.com",
    "img-src 'self' https://www.google-analytics.com/",
    "font-src 'self' https://fonts.gstatic.com/ https://use.fontawesome.com/",
    "script-src 'self' https://www.google-analytics.com/ https://www.googletagmanager.com/",
    "style-src 'self' https://use.fontawesome.com/ https://css.getto.systems/"
  ]],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-XSS-Protection", "1; mode=block"],
  ["Referrer-Policy", "same-origin"]
]
```

サーバーを起動する。

```
$ npm run reload
```


[TOP](#top)
<a id="Strict-Security-Policy"></a>
### Strict-Security-Policy

指定した秒数の間、 https でアクセスするように指示するもの。

```
Strict-Transport-Security: max-age=31536000
```

max-age は 31536000（１年）にした。


[TOP](#top)
<a id="X-Content-Type-Options"></a>
### X-Content-Type-Options

Content-Type を厳密に解釈するよう指示するもの。

```
X-Content-Type-Options: nosniff
```


[TOP](#top)
<a id="X-Frame-Options"></a>
### X-Frame-Options

frame や iframe での読み込みを許可しないように指示するもの。

```
X-Frame-Options: DENY
```


[TOP](#top)
<a id="X-XSS-Protection"></a>
### X-XSS-Protection

XSS フィルタを強制的に有効にするもの。

```
X-XSS-Protection: 1; mode=block
```


[TOP](#top)
<a id="Referrer-Policy"></a>
### Referrer-Policy

同じ origin のみに Referrer をつけるように指示するもの。

```
Referrer-Policy: same-origin
```


[TOP](#top)
<a id="Content-Security-Policy"></a>
### Content-Security-Policy

ページに含まれるコンテンツのうち、どのコンテンツを実行するかを指示するもの。
適当にやると JavaScript が全滅するので、エラーを見つつ調整する必要がある。

#### default-src

デフォルトではサイト内のコンテンツのみ許可する。

```
default-src 'self'
```


その他、個別に細かく調整する必要がある。

#### object-src

object タグなどは使用していないので許可しない。

```
object-src 'none'
```

#### base-uri

base タグは使用していないので許可しない。

```
base-uri 'none'
```

#### form-action

form の action は self のみ許可する。

```
form-action 'self'
```

#### connect-src

ページからアクセスする先を指定する。

```
connect-src 'self' https://api.example.com/
```

`<a>` ping、Fetch、XMLHttpRequest、WebSocket、EventSource の宛先になっているものを指定する。

#### img-src

画像の読み込み先を指定する。

```
img-src 'self' https://www.google-analytics.com/
```

google analytics は img タグを生成している。

#### font-src

フォントの読み込み先を指定する。

```
font-src 'self' https://fonts.gstatic.com/ https://use.fontawesome.com/
```

web フォント、font awesome はフォントを読み込んでいる。

#### script-src

スクリプトの読み込み先を指定する。

```
script-src 'self' https://www.google-analytics.com/ https://www.googletagmanager.com/
```

google analytics は googletagmanager にもアクセスしていた。

ページ内で使用するスクリプトは外部ファイルに切り出して読み込ませる必要がある。

#### style-src

スタイルの読み込み先を指定する。

```
style-src 'self' https://use.fontawesome.com/
```

font awesome はフォントを読み込んでいる。

ページ内で使用するスタイルは外部ファイルに切り出して読み込ませる必要がある。


#### 全体

以上の内容をセミコロンで繋げて指定する。

```
Content-Security-Policy: default-src 'self'; object-src 'none'; connect-src 'self' https://api.example.com; img-src 'self' https://www.google-analytics.com/; font-src 'self' https://fonts.gstatic.com/ https://use.fontawesome.com/; script-src 'self' https://www.google-analytics.com/ https://www.googletagmanager.com/; style-src 'self' https://use.fontawesome.com/ https://css.getto.systems/
```

長い。

#### script と style について

このヘッダを指定すると、インライン実行ができなくなる。
アプリケーションの作り方によっては詰む。


[TOP](#top)
<a id="Mozilla-Obsertatory"></a>
### Mozilla の Obsertatory を使用して結果を確認する

本番環境に適用した後、[Obsertatory - Mozilla](https://observatory.mozilla.org/) でスコアをチェックできる。
まだ必要なことがあれば対応していきたい。


[TOP](#top)
<a id="postscript"></a>
### まとめ

CSP ヘッダの調整を行なってみた。

スクリプトやスタイルの動かない部分がないか十分テストしてから本番環境に適用してスコアを良くしていきたい。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- 「体系的に学ぶ 安全な Web アプリケーションの作り方」: 徳丸浩
- [Content Security Policy with S3 + CloudFront](https://medium.com/@htayyar/content-security-policy-with-s3-cloudfront-cf7526889510)
- [Content Security Policy with Amazon CloudFront: Part 1](https://codeburst.io/content-security-policy-with-amazon-cloudfront-part-1-5505feeaa75)
- [Obsertatory - Mozilla](https://observatory.mozilla.org/)
- [Content-Security-Policy - MDN web docs](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy)
- [X-Frame-Options - MDN web docs](https://developer.mozilla.org/ja/docs/Web/HTTP/X-Frame-Options)
- [alallier/reload - GitHub](https://github.com/alallier/reload)


[TOP](#top)
