# aws ses でメールを送信してみる

<a id="top"></a>

###### CONTENTS

1. [ドメインを追加する](#add-domain)
1. [aws ses でメールを送信する](#send-email)
1. [メールを送信するためのポリシーを作成する](#create-policy)
1. [rusoto でメールを送信する](#send-by-rusoto)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="add-domain"></a>

### ドメインを追加する

メールの自動送信なので、何かが起こって普段使っているドメインが使えなくなると困るため、新しく追加することにした。

メールアドレスの管理は google workspace でやっている。
google workspace の管理コンソールからドメインの追加、ですんなり追加できた。
おそらく現在使用しているドメインのサブドメインだったからすぐに追加されたのだろう。

メールの送受信をするため、ドメインに mx レコードを設定する必要がある。
ドメインは aws route53 で管理しているので、そこで mx レコードを設定する。

google workspace で新しいグループを追加したら、メールの送受信ができるようになる。

google workspace はドメインが違っても、同じグループ名を使用できないような仕組みになっている。
例えば、`info@example.com` と `info@project.example.com` は同じ workspace では共存できない。
このため、`project@message.example.com` というようなメールアドレスで運用することにした。

ここまでセットアップしたら、追加したメールアドレスでメールの送受信が問題なくできることを確認しておく。

[TOP](#top)
<a id="send-email"></a>

### aws ses でメールを送信する

[ドキュメント](https://aws.amazon.com/jp/getting-started/hands-on/send-an-email/?sc_icampaign=acq_jp_getting-started-handson-202010-send-an-email&sc_language=jp&sc_icontent=awssm-6341&sc_iplace=ribbon&trk=ha_ribbon_acq_jp_getting-started-handson-202010-send-an-email)にしたがってテストメールを送信してみる。

まずメールアドレスの検証、というステップがある。
その前に、[この Qiita の記事](https://qiita.com/OMOIKANESAN/items/1b8941258fb7ebbdb057)にあるように、ドメインの検証を済ませる。
安定したメール配信のために、ドメインの検証をやっておかない理由はない。

ドメインとメールアドレスの検証を済ませたらテストメールの送信をする。
設定が正しければ、問題なくメールが配信されるはず。

#### サンドボックス制限について

デフォルトでアカウントはサンドボックス制限がかかっている。
このため、上記のテストメールも送信先アドレスが検証済みでなければならない。

サンドボックス制限はかなり厳しく、この中で本番運用するのは現実的でない。
本番運用に移行するため、この制限を解除する申請を行う必要がある。
この申請はまだやっていないのでこの記事では触れない。

[TOP](#top)
<a id="create-policy"></a>

### メールを送信するためのポリシーを作成する

[ドキュメント](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/control-user-access.html)によると、下記ポリシーでメールの送信ができる。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["ses:SendEmail"],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "ses:FromAddress": "test@message.example.com"
                }
            }
        }
    ]
}
```

このポリシーで、特定の `from` アドレスからの送信許可が与えられる。

このポリシーをアタッチしたユーザーを作成し、アクセスキー ID とシークレットアクセスキーを用意しておく。

[TOP](#top)
<a id="send-by-rusoto"></a>

### rusoto でメールを送信する

rust でメールを送信したい。
rust の aws sdk として、[rusoto](https://www.rusoto.org/index.html) を選択した。
[aws-sdk-rust](https://github.com/awslabs/aws-sdk-rust) というのもあって、こっちは aws が開発していて公式感があるが、2021-06-29 現在はまだ alpha 版で安定していないために見送った。

下記の dependencies を `Cargo.toml` に記述する。

```toml
[dependencies]
rusoto_core = { version = "0.45", default_features = false, features = ["rustls"] }
rusoto_ses = { version = "0.45", default_features = false, features = ["rustls"] }
```

tls を openssl ではなく rustls にしたいので、上記の feature を指定した。

下記コードでメールが送信できる。

```rust
mod demo {
    use actix_web::{get, Responder};
    use rusoto_core::Region;
    use rusoto_ses::{Body, Content, Destination, Message, SendEmailRequest, Ses, SesClient};

    #[get("/aws-sms")]
    async fn aws_sms() -> impl Responder {
        println!("{}", "init client");
        let client = SesClient::new(Region::ApNortheast1);
        println!("{}", "init request");
        println!("{}", CONTENT);
        let request = SendEmailRequest {
            destination: Destination {
                bcc_addresses: None,
                cc_addresses: None,
                to_addresses: Some(vec!["user@example.com".into()]),
            },
            message: Message {
                subject: Content {
                    charset: Some("UTF-8".into()),
                    data: "rusoto で aws ses を利用してみるテスト".into(),
                },
                body: Body {
                    html: None,
                    text: Some(Content {
                        charset: Some("UTF-8".into()),
                        data: CONTENT.into(),
                    }),
                },
            },
            source: "test@message.example.com".into(),
            ..Default::default()
        };
        println!("{}", "send email");
        match client.send_email(request).await {
            Ok(response) => {
                format!("send email success; message-id: {}", response.message_id)
            }
            Err(err) => {
                format!("send email error!; {}", err)
            }
        }

        "OK"
    }

    const CONTENT: &'static str = r#########"よろしくお願いいたします

####
send by rusoto / aws ses
test@message.example.com
"#########;
}
```

aws ユーザーの設定が問題なければ送信できるはず。

#### rusoto のバージョンについて

version を `0.45` にしているのは、actix-web との絡みがあるため。
2021-06-29 現在、actix-web の最新安定板は 3.3.2 で、内部的に tokio 0.2 系に依存している。
rusoto の最新安定板 0.46 は内部的に tokio 1 系に依存している。

このため、非同期ランタイムが異なる、というエラーが出る。
rusoto のバージョンを `0.45` に落とすことでこれを回避している。

[TOP](#top)
<a id="postscript"></a>

### まとめ

aws ses を利用して email の送信をしてみた。
つまづいたところはそれほどなかったが、作業ログとして残しておく。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [E メールを送信する | aws](https://aws.amazon.com/jp/getting-started/hands-on/send-an-email/?sc_icampaign=acq_jp_getting-started-handson-202010-send-an-email&sc_language=jp&sc_icontent=awssm-6341&sc_iplace=ribbon&trk=ha_ribbon_acq_jp_getting-started-handson-202010-send-an-email)
-   [AWS SES で送信ドメイン認証を設定する | Qiita](https://qiita.com/OMOIKANESAN/items/1b8941258fb7ebbdb057)
-   [Controlling access to Amazon SES | aws docs](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/control-user-access.html)

[TOP](#top)
