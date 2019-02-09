# Cross Origin でカスタムヘッダを送受信する
<a id="top"></a>

Cross Origin でカスタムヘッダを送信する方法をまとめる。


###### CONTENTS

1. [sinatra でのサンプル](#sample-on-sinatra)
1. [preflight レスポンスヘッダ](#headers-for-options)
1. [コンテンツレスポンスヘッダ](#headers-for-contents)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- ruby : 2.6.1
- sinatra : 2.0.5


[TOP](#top)
<a id="sample-on-sinatra"></a>
### sinatra でのサンプル

まず sinatra でのサンプルを示す。

```ruby
require "sinatra"

options "*" do
  headers(
    "Access-Control-Allow-Origin" => "https://example.com",
    "Access-Control-Allow-Methods" => "GET,POST,PUT,DELETE,OPTIONS,HEAD",
    "Access-Control-Allow-Headers" => "Authorization",
  )
end

post "/upload" do
  halt 401 unless authorize(env["HTTP_AUTHORIZATION"]) # authorize by token

  halt 400 unless file = (params[:file] && params[:file][:tempfile])

  upload_id = upload file # process uploaded file...

  headers(
    "Access-Control-Allow-Origin" => "https://example.com",
    "Access-Control-Expose-Headers" => "X-Upload-ID",
    "X-Upload-ID" => upload_id.to_s,
  )

  content_type "application/json"
  { message: :ok }.to_json
end
```

ここでは以下の流れを想定している。

1. `https://example.com` で html を配信して、そこから ajax リクエストを受ける
1. Authorization ヘッダでトークンを受け取り、認証
1. ファイルアップロードの処理を行い、 ID を生成
1. 生成された ID を X-Upload-ID ヘッダで返す

これは「シンプルなリクエスト」ではないので、ブラウザは preflight リクエストを行う。


[TOP](#top)
<a id="headers-for-options"></a>
### preflight レスポンスヘッダ

「シンプルなリクエスト」以外のリクエストをする場合、ブラウザは preflight リクエストを行う。
preflight リクエストは対象のリソースに対して `OPTIONS` メソッドでリクエストの可否を問い合わせる。

この時、サーバーは以下のヘッダを含めて応答する。

- Access-Control-Allow-Origin : アクセスを許可する Origin
- Access-Control-Allow-Methods : アクセスを許可する Method
- Access-Control-Allow-Headers : 含めて良い Header

`Access-Control-Allow-Headers` に関してはを「シンプルなリクエストヘッダ」は常に許可されるので列挙する必要はない。

ブラウザは、このレスポンスヘッダで許可されたリクエストのみサーバーに発行する。


#### シンプルなリクエスト

「シンプルなリクエスト」は以下を満たす。

- 以下のメソッドのうち、いずれかである
  - HEAD
  - GET
  - POST
- 以下のヘッダ以外を含まない
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type
  - Last-Event-ID
- 以下の Content-Type のうち、いずれかである
  - application/x-www-form-urlencoded
  - multipart/form-data
  - text/plain


#### シンプルなリクエストヘッダ

- Accept
- Accept-Language
- Content-Language
- Content-Type は以下のうち、いずれかである
  - application/x-www-form-urlencoded
  - multipart/form-data
  - text/plain


[TOP](#top)
<a id="headers-for-contents"></a>
### コンテンツレスポンスヘッダ

コンテンツとして「シンプルなレスポンスヘッダ」以外を返したい場合、 `Access-Control-Expose-Headers` を含める必要がある。
これを含めないと、 `xhr.getResponseHeader` や `xhr.getAllResponseHeaders` でレスポンスヘッダを受け取ることができない。

ちなみにヘッダは case-insensitive なので、この例では `xhr.getResponseHeader("x-upload-id")` で取得できる。


#### シンプルなレスポンスヘッダ

- Cache-Control
- Content-Language
- Content-Type
- Expires
- Last-Modified
- Pragma


[TOP](#top)
<a id="postscript"></a>
### まとめ

ヘッダを返すことをしてこなかったので `Access-Content-Expose-Headers` のことを知らなかったのでまとめてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [xmlHttp.getResponseHeader + Not working for CORS | stackoverflow](https://stackoverflow.com/questions/14686769/xmlhttp-getresponseheader-not-working-for-cors)
- [Using CORS | HTML5 Rocks](https://www.html5rocks.com/en/tutorials/cors/)
- [Access-Control-Allow-Headers | MDN web docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
- [Are HTTP headers case-sensitive? | stackoverflow](https://stackoverflow.com/questions/5258977/are-http-headers-case-sensitive)


[TOP](#top)
