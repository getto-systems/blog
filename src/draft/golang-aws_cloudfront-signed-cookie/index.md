# golang で aws cloudfront signed cookie
<a id="top"></a>

AWS CloudFront でプライベートコンテンツを配信したい。
このために Signed Cookie を使う方法があるが、これを golang を使用して生成したい。

###### CONTENTS

1. [AWS CloudFront Signed Cookie](#aws_cloudfront-signed-cookie)
1. [カスタムポリシーを使用した Signed Cookie](#custom-policy)
1. [カスタムポリシーを作成する](#create-policy)
1. [カスタムポリシーを base64 エンコードする](#encode-base64)
1. [キーペアを使用して署名](#sign-policy)
1. [golang で署名](#golang-sign)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### SOURCES

- [getto-systems/aws_cloudfront_token-go | GitHub](https://github.com/getto-systems/aws_cloudfront_token-go)


###### ENVIRONMENTS

- golang : 1.14.4


<a id="aws_cloudfront-signed-cookie"></a>
### AWS CloudFront Signed Cookie

CloudFront でプライベートコンテンツを配信するのは[この記事](https://dev.classmethod.jp/articles/cf-s3-deliveries-use-signurl/)と[この記事](https://dev.classmethod.jp/articles/cf-s3-private-content-signed-cookies/)を参考にして特につまづくことなくできた。
この Signed Cookie を生成するパッケージを作るのに苦労したのでまとめておく。

プライベートコンテンツを配信する方法は Signed URL と Signed Cookie の２つの方法が用意されている。
このうち Signed Cookie を選択した。

理由は Cookie を使用する方法なら `HttpOnly` にすることで、クライアントがトークンを扱うことなくアクセスできるから。


[TOP](#top)
<a id="custom-policy"></a>
### カスタムポリシーを使用した Signed Cookie

Signed Cookie には、既定のポリシーを使用するものと、カスタムポリシーを使用するものの２つが用意されている。
このうち、カスタムポリシーを使用するほうを選択した。

理由は、既定のポリシーを使用するほうは単一のファイルのみの対応のため。
別なファイルにアクセスするには Cookie を再発行しなければならない。

これだと Cookie を受け取ってからファイルにアクセスするまでに、別なタブとかで新しい Cookie を受け取ってしまうとアクセスに失敗する。
これではうまくいかない。

複数のリソースを取得できるようにするにはカスタムポリシーを使用する必要がある。


[TOP](#top)
<a id="create-policy"></a>
### カスタムポリシーを作成する

まず、カスタムポリシーを作成する。

```json
{
   "Statement": [
      {
         "Resource":"URL of the file",
         "Condition":{
            "DateLessThan":{"AWS:EpochTime":"required ending date and time in Unix time format and UTC"},
            "DateGreaterThan":{"AWS:EpochTime":"optional beginning date and time in Unix time format and UTC"},
            "IpAddress":{"AWS:SourceIp":"optional IP address"}
         }
      }
   ]
}
```

- Resource : ファイルの URL。ワイルドカードを指定可能
- DateLessThan : ここで指定した Unix time までの間、リソースにアクセスできる
- DateGreaterThan : ここで指定した Unix time から、リソースにアクセスできる
- IpAddress : ここで指定した IP アドレスからのみ、リソースにアクセスできる

以下がカスタムポリシーの例。

```json
{"Statement":[{"Resource":"https://example.getto.systems/*","Condition":{"DateLessThan":{"AWS:EpochTime":1591811666}}}]}
```

**空白や改行の削除は必須**なので注意。


[TOP](#top)
<a id="encode-base64"></a>
### カスタムポリシーを base64 エンコードする

さらにこいつを base64 でエンコードする。
そして、以下の文字の置き換えを行わなければならない。

- `+` → `=`
- `=` → `_`
- `/` → `~`

**base64 の url エンコードとは微妙に異なる**ので注意。
ただ、デコードはできるのでこういう仕様もあるのだろう。


[TOP](#top)
<a id="sign-policy"></a>
### キーペアを使用して署名

base64 でエンコードした文字列を手に入れたら、あとは署名するだけ。

署名にはキーペアのプライベートキーを使用する。
[この記事](https://dev.classmethod.jp/articles/cf-s3-deliveries-use-signurl/)を参考にしてダウンロードしておく。

署名までできたら、Cookie に以下の値を設定する。

- CloudFront-Policy : base64 でエンコードしたポリシー
- CloudFront-Signature : ポリシーを署名した結果
- CloudFront-Key-Pair-Id : 使用したキーベアの ID

これでプライベートコンテンツにアクセスできる。


[TOP](#top)
<a id="golang-sign"></a>
### golang で署名

golang でプライベートキーを扱う方法は[この gist](https://gist.github.com/junxie6/514c8cf56d46d5ad4f291b13d75e526e) を参考にした。

署名するコードは以下の通り。

```golang
import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"encoding/pem"
	"io/ioutil"
	"log"
)

privateKey := ioutil.ReadFile("path/to/key_pair/pk.pem")
policy := byte[]("base64-encoded-policy")

block, _ := pem.Decode(privateKey)
key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
if err != nil {
	log.Fatal(err)
}

rng := rand.Reader

hashed := sha1.Sum(policy)
signed, err := rsa.SignPKCS1v15(rng, key, crypto.SHA1, hashed[:])
if err != nil {
	log.Fatal(err)
}

// signed : signed cookie
```

作ったパッケージは [GitHub](https://github.com/getto-systems/aws_cloudfront_token-go) に置いてある。


[TOP](#top)
<a id="postscript"></a>
### まとめ

ポリシーの作成方法や base64 エンコードの癖があったために難航したけれど、何とか signed cookie でアクセスできるところまでたどり着けた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [CloudFront+S3 署名付き URL でプライベートコンテンツを配信する | Developpers.IO](https://dev.classmethod.jp/articles/cf-s3-deliveries-use-signurl/)
- [CloudFront+S3 署名付き Cookie でプライベートコンテンツを配信する | Developpers.IO](https://dev.classmethod.jp/articles/cf-s3-private-content-signed-cookies/)
- [カスタムポリシーを使用した署名付き Cookie の設定 | AWS Doc](https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/private-content-setting-signed-cookie-custom-policy.html)
- [Using a Linux Command and OpenSSL for Base64-Encoding and Encryption | AWS Doc](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-linux-openssl.html)
- [Golang RSA encrypt and decrypt example | GitHub Gist](https://gist.github.com/junxie6/514c8cf56d46d5ad4f291b13d75e526e)


[TOP](#top)
