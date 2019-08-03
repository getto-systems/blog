# AWS Secrets Manager で機密情報を保存する
<a id="top"></a>

Slack Bot トークンを AWS Secrets Manager に保存して、Lambda からアクセスできるようにしたい。

今回は自動化せず、コンソールから作成してアクセスするところまでまとめておく。

###### CONTENTS

1. [AWS Key Management Service にキーを追加する](#add-kms-key)
1. [AWS Secrets Manager にシークレットを追加する](#add-secret)
1. [javascript からシークレットを取得する](#get-secret)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Node.js 10.16.0


<a id="add-kms-key"></a>
### AWS Key Management Service にキーを追加する

AWS Secrets Manager を利用するためには KMS にキーを登録する必要がある。

AWS のコンソールから Key Management Service を開いて、「キーの作成」を行う。

- エイリアス : このキーの名前みたいなもの。あとでシークレットを作成するときに参照する
- キー管理者 : このキーを管理できるユーザー。指定しなくても大丈夫
- キーのアクセス許可 : デプロイするときのユーザーと lambda のロールを選択

これで KMS キーの登録が完了する。
キーとシークレットは lambda ごとに作成するので、名前は lambda に対応してつけておく。


[TOP](#top)
<a id="add-secret"></a>
### AWS Secrets Manager にシークレットを追加する

AWS のコンソールから Secrets Manager を開いて、「シークレットの保存」を行う。

- シークレットの種類 : 今回は Slack Bot のトークンを保存したいので、「その他のシークレット」を選択
- シークレットキー / 値 : Slack Bot のトークンを指定
- 暗号化キー : 先ほど作成した KMS のキーを選択
- シークレットの名前 : lambda に対応したものをつける
- 自動ローテーション : 今回は Slack Bot のトークンなので、ローテーションは無効にしておく

これでシークレットの保存が完了する。

今回保存する Slack Bot のトークンは、定期的な変更はする予定がないため、自動ローテーションは無効にした。


[TOP](#top)
<a id="get-secret"></a>
### javascript からシークレットを取得する

Secrets Manager の画面のサンプルコードを参考にしてシークレットを取得するコードを試してみる。

```javascript
const AWS = require("aws-sdk");

/**
 * env : {
 *   region: aws region
 *   secret_id: secret id : see aws secret manager
 * }
 */
const get = (env) => {
  return new Promise((resolve, reject) => {
    new AWS.SecretsManager({
      region: env.region,
    }).getSecretValue({SecretId: env.secret_id}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data.SecretString));
      }
    });
  });
};
```

このコードを KMS でキーのアクセスを許可したユーザーかロールから実行すると、保存したデータが取得できる。

なお、実行するユーザーには以下のポリシーが必要。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SID",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "resource-ARN"
    }
  ]
}
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

AWS Secrets Manager にシークレットを保存する方法をまとめた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [AWS Secrets Manager の主な用語と概念 : AWS ドキュメント](https://docs.aws.amazon.com/ja_jp/secretsmanager/latest/userguide/terms-concepts.html)


[TOP](#top)
