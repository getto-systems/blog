---
title: Authorization Bearer ヘッダを用いた認証 API の実装
---
<a id="top"></a>

- API サーバーを構築する際に、認証機構を実装する必要がある
- 何かしらフレームワークを使用して済ませることも考えられるが、今回は自前で用意することにした
- Authorization: Bearer ヘッダを用いて認証 API を実装する際のヘッダの仕様を確認する

###### CONTENTS

1. [全体像](#overall)
1. [Authorization: Bearer ヘッダの送信](#authorization-header)
1. [エラーレスポンスの内容](#response-header)
1. [トークンのセキュリティについて](#security)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="overall"></a>
### 全体像

認証 API を実装する上で、トークンのやりとりを行う必要がある。
トークンの発行はレスポンスに含めれば良いのでどうとでもなるが、トークンの受け取りは色々方法がある。

- リクエストボディに含める
- 独自ヘッダを使用する
- Authorization ヘッダを使用する

リクエストボディに含めるやり方はどうとでもなるので、ヘッダを使用する方法を調べてみる。
（ダウンロードさせる API も用意したいので、トークンをリクエストボディに含めて送信させる形式も必要）


[TOP](#top)
<a id="authorization-header"></a>
### Authorization: Bearer ヘッダの送信

ヘッダを使用する方法については以下の記事にまとまっている。

- [トークンを利用した認証・認可 API を実装するとき Authorization: Bearer ヘッダを使っていいのか調べた : Qiita](https://qiita.com/uasi/items/cfb60588daa18c2ec6f5)

ヘッダを送信する場合は以下のことを守る。

- 送信するヘッダ : `Authorization: Bearer トークン`
- トークンは token68 文字列を指定する
- 改行のない base64 文字列は正しい token68 文字列である

仕様ではスコープについても記述があるが、今回は触れない。


[TOP](#top)
<a id="response-header"></a>
### エラーレスポンスの内容

サーバーからのレスポンスをいくつかの場合ごとに例示する。

正しいトークンが送信された場合は、通常のレスポンスを返せば良いので、ここでは認証エラーが起こった場合のレスポンスを挙げる。


#### Authorization ヘッダなしでアクセスした場合

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="example"
```

認証が必要なリソースに、認証ヘッダなしでアクセスした場合は `WWW-Authenticate` ヘッダに `realm` パラメータをつけて返す。
`realm` パラメータの値はリソースについての適切な説明を返す。
当然のことだが、トークンの類推が容易になるような情報を返してはならない。

認証ヘッダ自体がない場合には、下記に示す `error` パラメータはつけない。


#### トークンが正しくない場合

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="example",
  error="invalid_token",
  error_description="The access token expired"
```

送信されたトークンが正しくなかった場合は `WWW-Authenticate` ヘッダに `error` パラメータをつけて返す。
`error` パラメータの値は `invalid_token` を返す。

オプションで、詳細な説明を `error_description` で返すことができる。
当然のことだが、トークンの類推が容易になるような情報を返してはならない。


[TOP](#top)
<a id="security"></a>
### トークンのセキュリティについて

RFC 6750 には以下のような推奨事項が書かれている。

- クライアントはトークンをリークさせないように実装されなければならない
- クライアントは TLS の証明書情報を検証しなければならない
- クライアントは常に TLS を使用しなければならない
- トークンをクッキーに保存してはならない
- トークンの有効期限は 1時間かそれ以下にするべき
- トークンはスコープを限って発行するべき
- トークンは URL に含めるべきではない

トークンは localStorage に保存して、対象の API サーバー以外にはトークンを送信しないようにする。
特に、 XSS 脆弱性には気をつけて実装する必要がある。

また、トークンを URL に含めて返さなければならない場面では、トークンの有効期限をできる限り短くしておく。
さらに、このトークンが有効な API を限定しておく。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Authorization: Bearer ヘッダを使用した認証を実装する上で必要なことについてまとめた。

特に難しいことはなく、レスポンスヘッダを適切に返せば良い。
トークン自体の運用については別な記事でまとめる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [トークンを利用した認証・認可 API を実装するとき Authorization: Bearer ヘッダを使っていいのか調べた : Qiita](https://qiita.com/uasi/items/cfb60588daa18c2ec6f5)
- [RFC 6750 : The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://tools.ietf.org/html/rfc6750)


[TOP](#top)
