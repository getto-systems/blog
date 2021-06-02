# rust で aws cloudfront signed cookie

signed cookie をやる方法は[この記事](/entry/2020/06/11/034625)にまとめた。
rust でやったらまたハマったのでまたまとめておく。

<a id="top"></a>

###### CONTENTS

1. [コード](#code)
1. [pem をパース](#parse)
1. [policy を構築](#build-policy)
1. [rsa private key で sign](#sign)
1. [base64 エンコード](#base64)
1. [デバッグ方法について](#debug)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### ENVIRONMENTS

-   rust: 1.52.1

```toml
[dependencies]
base64 = "0.13"
rsa = "0.4"
sha-1 = "0.9"
digest = "0.9"
pem = "0.8"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

<a id="code"></a>

### コード

```rust
use pem::parse;
use rsa::RSAPrivateKey;

use serde::Serialize;
use serde_json::to_string;

use digest::Digest;
use rsa::{Hash, PaddingScheme, RSAPrivateKey};
use sha1::Sha1;

use base64::{encode_config, STANDARD};

fn sign() {
    let pem = parse(PEM)
        .expect("parse pem error");

    let private_key = RSAPrivateKey::from_pkcs1(pem.contents.as_ref())
        .expect("parse key error");

    let policy = Policy {
        statement: vec![Statement {
            resource,
            condition: Condition {
                date_less_than: ConditionDateLessThan {
                    epoch_time: expires,
                },
            },
        }],
    };
    let policy = to_string(&policy)
        .expect("encode json error");

    let padding = PaddingScheme::new_pkcs1v15_sign(Some(Hash::SHA1));
    let hash = Sha1::new().chain(policy.as_bytes()).finalize();
    let signature = private_key.sign(padding, hash.as_ref())
        .expect("sign error");

    println!("{}", cloudfront_base64(policy));
    println!("{}", cloudfront_base64(signature));
}

fn cloudfront_base64(source: impl AsRef<[u8]>) -> String {
    // cloudfront flavored base64
    encode_config(source, STANDARD)
        .replace("+", "-")
        .replace("=", "_")
        .replace("/", "~")
}

#[derive(Serialize)]
pub struct Policy {
    #[serde(rename = "Statement")]
    pub statement: Vec<Statement>,
}
#[derive(Serialize)]
pub struct Statement {
    #[serde(rename = "Resource")]
    pub resource: String,
    #[serde(rename = "Condition")]
    pub condition: Condition,
}
#[derive(Serialize)]
pub struct Condition {
    #[serde(rename = "DateLessThan")]
    pub date_less_than: ConditionDateLessThan,
}
#[derive(Serialize)]
pub struct ConditionDateLessThan {
    #[serde(rename = "AWS:EpochTime")]
    pub epoch_time: i64,
}

const PEM: &'static str = "-----BEGIN RSA PRIVATE KEY-----
MIIBPQIBAAJBAOsfi5AGYhdRs/x6q5H7kScxA0Kzzqe6WI6gf6+tc6IvKQJo5rQc
dWWSQ0nRGt2hOPDO+35NKhQEjBQxPh/v7n0CAwEAAQJBAOGaBAyuw0ICyENy5NsO
2gkT00AWTSzM9Zns0HedY31yEabkuFvrMCHjscEF7u3Y6PB7An3IzooBHchsFDei
AAECIQD/JahddzR5K3A6rzTidmAf1PBtqi7296EnWv8WvpfAAQIhAOvowIXZI4Un
DXjgZ9ekuUjZN+GUQRAVlkEEohGLVy59AiEA90VtqDdQuWWpvJX0cM08V10tLXrT
TTGsEtITid1ogAECIQDAaFl90ZgS5cMrL3wCeatVKzVUmuJmB/VAmlLFFGzK0QIh
ANJGc7AFk4fyFD/OezhwGHbWmo/S+bfeAiIh2Ss2FxKJ
-----END RSA PRIVATE KEY-----
";
```

[TOP](#top)
<a id="parse"></a>

### pem をパース

```rust
use pem::parse;
use rsa::RSAPrivateKey;

fn parse() {
    let pem = parse(PEM)
        .expect("parse pem error");

    let private_key = RSAPrivateKey::from_pkcs1(pem.contents.as_ref())
        .expect("parse key error");
}
```

aws のキーペアを生成すると、秘密鍵は `BEGIN RSA PRIVATE KEY` で始まる pem ファイルとしてダウンロードできる。
これを rsa の `RSAPrivateKey` として読み込む。

[rsa のドキュメント](https://docs.rs/rsa/0.4.0/rsa/index.html)には、ファイルの内容を自分で読む方法が書かれているのだが、ちょっと嫌だった。
そこで [pem](https://docs.rs/pem/0.8.3/pem/index.html) を使用してバイトを読み出すことにした。
やっていることは多分同じようなはず。

これで private key が手に入った。

[TOP](#top)
<a id="build-policy"></a>

### policy を構築

```rust
use serde::Serialize;
use serde_json::to_string;

fn build(resource: String, expires: i64) {
    let policy = Policy {
        statement: vec![Statement {
            resource,
            condition: Condition {
                date_less_than: ConditionDateLessThan {
                    epoch_time: expires,
                },
            },
        }],
    };
    let policy = to_string(&policy)
        .expect("encode json error");
}

#[derive(Serialize)]
pub struct Policy {
    #[serde(rename = "Statement")]
    pub statement: Vec<Statement>,
}
#[derive(Serialize)]
pub struct Statement {
    #[serde(rename = "Resource")]
    pub resource: String,
    #[serde(rename = "Condition")]
    pub condition: Condition,
}
#[derive(Serialize)]
pub struct Condition {
    #[serde(rename = "DateLessThan")]
    pub date_less_than: ConditionDateLessThan,
}
#[derive(Serialize)]
pub struct ConditionDateLessThan {
    #[serde(rename = "AWS:EpochTime")]
    pub epoch_time: i64,
}
```

正しく signed cookie 用の policy が構築できるように struct を構成する。
こいつに対して `serde_json::to_string` すると json 文字列が手に入る。

[TOP](#top)
<a id="sign"></a>

### rsa private key で sign

```rust
use digest::Digest;
use rsa::{Hash, PaddingScheme, RSAPrivateKey};
use sha1::Sha1;

fn sign(policy: String) {
    let padding = PaddingScheme::new_pkcs1v15_sign(Some(Hash::SHA1));
    let hash = Sha1::new().chain(policy.as_bytes()).finalize();
    let signature = private_key.sign(padding, hash.as_ref())
        .expect("sign error");
}
```

signed cookie は sha1 でハッシュして sign する必要がある。
sha256 や sha512 を試したけどやっぱりだめだった。
(sha1 は使うなっていろんなところで言われてるけど大丈夫なのかしら)

`new_pkcs1v15_sign` メソッドで `Hash::SHA1` な `PaddingScheme` を手に入れたら、`RSAPrivateKey` で sign する。
これで signed cookie の `Signature` が手に入る。

`Sha1::new` を使用するには `digest::Digest` を use する必要がある。
`sha1::Digest` としても公開されているが、将来的に他の hash に切り替える可能性を考慮して大元の digest クレートから use している。

[TOP](#top)
<a id="base64"></a>

### base64 エンコード

```rust
use base64::{encode_config, STANDARD};

fn encode(policy: String, signature: String) {
    println!("{}", cloudfront_base64(policy));
    println!("{}", cloudfront_base64(signature));
}

fn cloudfront_base64(source: impl AsRef<[u8]>) -> String {
    // cloudfront flavored base64
    encode_config(source, STANDARD)
        .replace("+", "-")
        .replace("=", "_")
        .replace("/", "~")
}
```

signed cookie は base64 でエンコードしたあと、特定の文字を置換する必要がある。
[AWS のドキュメント](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-setting-signed-cookie-custom-policy.html#private-content-custom-policy-signature-cookies)にしたがってエンコードすれば完成。

[TOP](#top)
<a id="debug"></a>

### デバッグ方法について

cloudfront の signed cookie が正しく動いているかは、本番で試さないとわからない。
しかしいちいち本番にリリースしていると時間がかかってしょうがない。
そこで確認のための時間のかからない方法を用意しておく。

以下のコマンドで Signature を得ることができる。

```bash
cat policy.json | openssl sha1 -sign private_key.pem | openssl base64 | tr -- '+=/' '-_~'
```

まず、この Signature を使用して `curl` などで正しくアクセスできることを確認しておく。
そのあと、生成した cookie がこの値と一致することを確認する。
これで sign のプロセスは問題なく動いていることが確認できる。

[TOP](#top)
<a id="postscript"></a>

### まとめ

aws cloudfront の signed cookie を rust で生成する方法をまとめた。

sha512 とかにできないかといろいろ試したのがハマった原因。
キャッシュの関係で、正しくない cookie でもアクセスに成功しているように見えたのも敗因。
時間だけかかって結局 sha1 じゃないと上手くいかないっていうドキュメントに書いてある通りの結論になって（涙）。
まあ、そうだよね。
けど sha1 を使いたくないじゃん、っていう気持ちがあってね。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [Creating a signature for a signed cookie that uses a custom policy | AWS Docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-setting-signed-cookie-custom-policy.html#private-content-custom-policy-signature-cookies)
-   [rsa | docs.rs](https://docs.rs/rsa/0.4.0/rsa/index.html)
-   [pem | docs.rs](https://docs.rs/pem/0.8.3/pem/index.html)

[TOP](#top)
