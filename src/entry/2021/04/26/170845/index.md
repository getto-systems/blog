# Rust でも protobuf したい

<a id="top"></a>

###### CONTENTS

1. [protobuf で protobuf する](#protobuf)
1. [protobuf-codegen-pure でコード生成](#codegen)
1. [親モジュールのコードを生成](#module-index)
1. [actix-web でレスポンスを返す](#response-actix-web)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### ENVIRONMENTS

-   rust: 1.51.0

<a id="protobuf"></a>

### protobuf で protobuf する

[protobuf](https://docs.rs/protobuf/2.23.0/protobuf/) を使って protobuf することにする。
理由は探したとき最初に出てきたから、くらい。

[TOP](#top)
<a id="codegen"></a>

### protobuf-codegen-pure でコード生成

`build.rs` にコード生成のためのコードを追加する。

```rust
use protobuf_codegen_pure::Codegen

fn main() {
    Codegen::new()
        .out_dir("path/to/out")
        .inputs(&["path/to/source/example.proto"])
        .include("path/to/source")
        .run()
        .expect("failed to codegen")
}
```

せっかくなので pure rust のコードを使用することにする。
protoc コマンドをインストールしなくていい rust 実装を使いたい。
[ドキュメント](https://github.com/stepancheg/rust-protobuf/tree/master/protobuf-codegen-pure)にはバグがあったら教えてねって書いてあるけど。
特殊なことをするつもりはないので、大丈夫だろうと判断した。

[TOP](#top)
<a id="module-index"></a>

### 親モジュールのコードを生成

上記コードで、`hello.proto` から `hello.rs` が生成される。

実際には複数の proto ファイルを 1 つのディレクトリに作成したい。
そうすると out_dir に `mod.rs` を作成して、生成されたモジュールを公開するようにしたい。

```rust
use protobuf_codegen_pure::Codegen

fn main() {
    let mut file = fs::File::create("path/to/out/mod.rs")?;
    write!(
        file,
        "{}",
        ["example"]
            .iter()
            .map(|name| format!("pub mod {};\n", name))
            .collect::<String>()
    )?;
    file.flush()
}
```

このコードで proto ファイルごとに `pub mod example;` する `mod.rs` が生成される。

[TOP](#top)
<a id="response-actix-web"></a>

### actix-web でレスポンスを返す

生成されたコードで actix-web のレスポンスを返してみる。

```rust
use actix_web::{get, error::ErrorInternalServerError, Responder};
use base64;

#[get("/hello")]
async fn hello() -> impl Responder {
    let mut message = Hello_pb::new();
    message.set_message("hello".to_string());
    message
        .write_to_bytes()
        .map(|bytes| base64::encode_config(bytes, base64::STANDARD))
        .map_err(ErrorInternalServerError)
}
```

結果を `base64::encode_config` で、エラーを `ErrorInternalServerError` で変換している。

#### 追記

最初は `actix_web::web::Bytes` でエンコードする記事だった。
ただ、受け取る javascript 側のコードは以下のような形にしたい。

```typescript
Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
```

このためにはレスポンスを base64 しないと上手くいかない。
というわけで base64 でエンコードして返すように記事を修正した。

なお、javascript から送信する値も base64 されているので、受け取るときに decode しなければならない。

[TOP](#top)
<a id="postscript"></a>

### まとめ

とりあえず rust でも protobuf できるようになった。
これでフロントエンドと接続できるはず。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [protobuf | Rust docs](https://docs.rs/protobuf/2.23.0/protobuf/)
-   [rust-protobuf | GitHub](https://github.com/stepancheg/rust-protobuf)
-   [Rust でファイルの入出力](https://qiita.com/fujitayy/items/12a80560a356607da637)

[TOP](#top)
