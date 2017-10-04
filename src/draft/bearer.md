---
title: Authorization Bearer ヘッダを用いた認証 API の実装
---
<a id="top"></a>

- API サーバーを構築する際に、認証機構を実装する必要がある
- 何かしらフレームワークを使用して済ませることも考えられるが、今回は自前で用意することにした
- Authorization: Bearer ヘッダを用いて認証 API を実装する

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

#### トークンが正しくない場合


[TOP](#top)
<a id="security"></a>
### トークンのセキュリティについて


[TOP](#top)
<a id="postscript"></a>
### まとめ

Authorization: Bearer ヘッダを使用した認証を実装する上で必要なことについてまとめた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [トークンを利用した認証・認可 API を実装するとき Authorization: Bearer ヘッダを使っていいのか調べた : Qiita](https://qiita.com/uasi/items/cfb60588daa18c2ec6f5)
- [RFC 6750 : The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://tools.ietf.org/html/rfc6750)


[TOP](#top)
