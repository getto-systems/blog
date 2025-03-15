# Rust で gRPC を Google Cloud Run で

<a id="top"></a>

###### CONTENTS

1. [Rust で gRPC](#tonic)
1. [TLS 対応](#tonic-tls)
1. [Cloud Run の認証に対応](#auth-for-cloud-run)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="tonic"></a>

### Rust で gRPC

Rust で gRPC するために [tonic](https://github.com/hyperium/tonic) を使用する。

protocol buffers から[コードを生成](https://github.com/hyperium/tonic/tree/master/tonic-build)したり、[サーバーコード](https://github.com/hyperium/tonic/blob/master/examples/helloworld-tutorial.md#writing-our-server)を書いたり、[クライアントコード](https://github.com/hyperium/tonic/blob/master/examples/helloworld-tutorial.md#writing-our-client)を書く。
この時に苦労したこととかあったはずだけど、仕事で忙しくしているうちに失われてしまった。
仕事が忙しくても、新しいことをしたときはブログにまとめるべきなんだ。
反省。

[TOP](#top)
<a id="tonic-tls"></a>

### TLS 対応

[この記事](https://qiita.com/K-Kachi/items/67c871a09f22d839eeff#grpc-クライアント)にある通り、TLS で通信するためにはクライアントの接続設定で TLS 用の設定をしなければならない。

```rust
let tls = ClientTlsConfig::new()
    .domain_name("example.com");

let channel = Channel::from_static("https://example.com")
    .tls_config(tls)?
    .connect()
    .await?;
```

example.com の部分に Cloud Run の URL が入る。

[TOP](#top)
<a id="auth-for-cloud-run"></a>

### Cloud Run の認証に対応

[ドキュメント](https://cloud.google.com/run/docs/samples/cloudrun-grpc-request-auth)によれば、認証ありの Cloud Run に接続するためには authorization メタデータを送信する必要がある。

```rust
let request: tonic::Request;
let token: String;

request.metadata_mut().insert(
    "authorization",
    tonic::metadata::MetadataValue::from_str(&format!("Bearer {}", token))?,
);
```

token は google のメタデータサーバーから取得できる。
（gRPC リクエストを発行するプロセスも Cloud Run で稼働している前提）

```rust
let service_url: String;

let mut request_url = reqwest::Url::parse("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity")?;
request_url.set_query(Some(&format!("audience={}", service_url)));

let request = reqwest::Client::new()
    .get(request_url)
    .header("Metadata-Flavor", "Google");

let response = request.send().await?;
let token = response.text().await?;
```

ここでは [reqwest](https://docs.rs/reqwest/0.11.6/reqwest/index.html) を使用して http リクエストを発行している。

`service_url` には、アクセス先の gRPC サービス URL を指定する。

ちなみに、「すべてのトラフィックを許可」しないといけない。

[TOP](#top)
<a id="postscript"></a>

### まとめ

Rust で Google Cloud Run に認証ありでデプロイされている gRPC サービスに接続する方法をまとめた。

忙しくしているうちに色々調べてつまづいた記録が失われてしまった。
本当はその情報が欲しかったのだけどしょうがないね。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [hyperium/tonic | GitHub](https://github.com/hyperium/tonic)
-   [hyperium/tonic-build | GitHub](https://github.com/hyperium/tonic/tree/master/tonic-build)
-   [Getting Started | hyperium/tonic | GitHub](https://github.com/hyperium/tonic/blob/master/examples/helloworld-tutorial.md#writing-our-server)
-   [Rust と Cloud Run でサーバレスな (Unary) gRPC サーバを構築する方法 | Qiita](https://qiita.com/K-Kachi/items/67c871a09f22d839eeff)
-   [認証付き gRPC リクエストを送信する | Google Cloud Docs](https://cloud.google.com/run/docs/samples/cloudrun-grpc-request-auth)
-   [reqwest | Rust Docs](https://docs.rs/reqwest/0.11.6/reqwest/index.html)

[TOP](#top)
