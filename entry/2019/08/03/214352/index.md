# AWS Lambda で Slack Bot イベントハンドラを作る
<a id="top"></a>

Slack Bot にデプロイを頼めるようにするため、イベントハンドラを作成したい。

これを AWS Lambda を使用してデプロイしてみる。


###### CONTENTS

1. [この記事の内容](#abstract)
1. [できあがったもの](#outcome)
1. [Slack Bot User を作成する](#create-slack-bot-user)
1. [Slack Bot のイベントに応答する AWS Lambda をデプロイする](#deploy-lambda)
1. [Slack Bot の URL verification に応答する](#response-challenge)
1. [Slack Event に応じて Slack API を叩く（叩くとは言っていない）](#handle-event)
1. [queryString パラメータを取得するには](#handle-queryString)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Node.js 10.16.0


<a id="abstract"></a>
### この記事の内容

ほぼ下記の記事と同じ内容。
これを AWS Lambda で試してみたもの。

- [Enabling interactions with bots : Slack api docs](https://api.slack.com/bot-users)


[TOP](#top)
<a id="outcome"></a>
### できあがったもの

以下の内容の AWS Lambda 関数に API Gateway を紐づけて Slack Event API の Request URL に設定した。

```javascript
exports.handler = async (aws_lambda_event) => {
  // logging event object for debug real-world slack event
  console.log(aws_lambda_event);

  const body = JSON.parse(aws_lambda_event.body);

  // challenge-request has no event
  if (body.event) {
    handle_event(body.evnet);
  }

  // response to challenge-request
  return {
    statusCode: 200,
    body: JSON.stringify({
      challenge: body.challenge,
    }),
  };
};

const handle_event = (bot_event) => {
  if (bot_event.type === "app_mention") {
    if (bot_event.text.includes("よろ")) {
      console.log("ここで /api/chat.postMessage を叩く");
    }
  }
}
```


[TOP](#top)
<a id="create-slack-bot-user"></a>
### Slack Bot User を作成する

まず、[Your Apps : Slack](https://api.slack.com/apps) の一覧画面にある「Create New App」から、Slack App を作成する。

- App Name : Slack App の名前
- Development Slack Workspace : この App を開発する workspace。あとで変更できない

Bot を追加したい workspace で作業するようにすれば問題ない。

作成した Slack App の設定画面の「Bot Users」から、Bot User を作成する。

- Display Name : Bot User の表示名
- Default Username : mention に使用する名前
- Always Show My Bot as Online : 「有効」に設定しておくことで、いつでも mention に応答できる

これで Bot User の準備が整った。

Bot User のアクセストークンを AWS Secret Manager に保存しておく。
（[AWS Secrets Manager で機密情報を保存する](/entry/2019/08/03/192052) に詳細をまとめた）

アクセストークンは、Slack App の設定画面の「OAuth & Permissions」からも参照できる。


[TOP](#top)
<a id="deploy-lambda"></a>
### Slack Bot のイベントに応答する AWS Lambda をデプロイする

Slack Bot のイベントを受け取るためにはエンドポイントが必要なので、まず AWS Lambda のデプロイを行う。

AWS Lambda の画面から、「関数の作成」を行う。

1. 「一から作成」を選択
1. 関数名は適当につける
1. 実行ロールは下記のポリシーを持ったロールを作成する

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "logs:CreateLogGroup",
      "Resource": "arn:aws:logs:$REGION:$ACCOUNT:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:$REGION:$ACCOUNT:log-group:/aws/lambda/$FUNCTION:*"
      ]
    }
  ]
}
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:$REGION:$ACCOUNT:secret:$SECRET"
    }
  ]
}
```

`$REGION`、`$ACCOUNT`、`$FUNCTION`、`$SECRET` は適宜指定する。

関数を作成したら、まず「アクション」から「新しいバージョンを発行」して、エイリアスをつけておく。


#### API Gateway を作成する

作成したエイリアスを選択して、「Designer」から「トリガーを追加」して、API Gateway を作成する。

Slack Bot のイベントは header を追加したりできないので、アクセスは「オープン」で作成する。

このままではどんなリクエストでも Lambda が呼び出されてしまうので、ちょっと工夫する。

1. API → リソース → ANY → メソッドリクエストの設定を開く
1. 「リクエストの検証」に「クエリ文字列パラメータおよびヘッダーの検証」を設定
1. 「URL クエリ文字列パラメータ」にランダムな文字列をキーにして「必須」にチェックを入れる

これで、設定したランダムなキーをクエリパラメータに含まなければ Lambda が呼び出されることはない。
しかし、デフォルトではクエリパラメータを含まないリクエストに対して、「（名前）パラメータが必要です」というエラーメッセージが出てしまう。

これを以下の手順で塞ぐ。

1. API → リソース → リクエストパラメータが不正です の設定を開く
1. 「編集」でレスポンステンプレートの「application/json」を選択して json を編集

完了したら「リソース」の「アクション」から「API のデプロイ」を行って、設定が正しくできたか確認しておく。

- 必要なパラメータを持っていない場合のエラーメッセージの確認
- 必要なパラメータを持っている場合は Lambda が呼び出されることを確認

以上で作成したロール、API Gateway はあとで CloudFormation でデプロイするときにも使用する。
一方、Lambda は置き換える。
（CloudFormation の話は別の記事でまとめるのでこの記事では関係ないが）

[TOP](#top)
<a id="response-challenge"></a>
### Slack Bot の URL verification に応答する

Slack App の設定画面の「Event Subscriptions」から、イベントの設定ができる。

これを有効にするためには、リクエスト URL の設定が必要だ。
URL を設定すると、URL verification が走って URL をチェックするのだが、以下の条件を満たさないと有効判定が出ない。

- POST body に含まれる challenge トークンをレスポンスに含めて返す
- POST body は json で、challenge トークンは `{"challenge":TOKEN}` の位置に指定される
- レスポンスは `{"challenge":TOKEN}` の形式で返す

まずこれを満たすように Lambda を編集する。

```javascript
exports.handler = async (aws_lambda_event) => {
  // logging event object for debug real-world slack event
  console.log(aws_lambda_event);

  const body = JSON.parse(aws_lambda_event.body);

  // response to challenge-request
  return {
    statusCode: 200,
    body: JSON.stringify({
      challenge: body.challenge,
    }),
  };
};
```

ここでは body のパースに失敗した場合のハンドリングを省略している。

この内容で保存して、新しいバージョンを発行、エイリアスを切り替える。
これで Slack App の設定画面の「Event Subscriptions」から、URL の設定が可能になる。
API Gateway の URL にパラメータをつけて設定すれば通るはず。


[TOP](#top)
<a id="handle-event"></a>
### Slack Event に応じて Slack API を叩く（叩くとは言っていない）

Request URL の設定が完了したら、イベントに応答するコードを書いていく。

まず、「Event Subscriptions」の、「Subscribe to Bot Events」で、`app_mention` を選択する。
これで Bot に mention をつけるとイベントが飛んでくるようになる。

このイベントに反応するようにコードを変更する。

```javascript
exports.handler = async (aws_lambda_event) => {
  // logging event object for debug real-world slack event
  console.log(aws_lambda_event);

  const body = JSON.parse(aws_lambda_event.body);

  // challenge-request has no event
  if (body.event) {
    handle_event(body.evnet);
  }

  // response to challenge-request
  return {
    statusCode: 200,
    body: JSON.stringify({
      challenge: body.challenge,
    }),
  };
};

const handle_event = (bot_event) => {
  if (bot_event.type === "app_mention") {
    if (bot_event.text.includes("よろ")) {
      console.log("ここで /api/chat.postMessage を叩く");
    }
  }
}
```

これで「よろ」を含む Bot への mention で「ここで /api/chat.postMessage を叩く」ログが出るはず。


#### 実際に API を叩くには

以下のリクエストを投げれば OK。

```HTTP
POST https://slack.com/api/chat.postMessage
Content-type: application/json
Authorization: Bearer BOTS_TOKEN

{
    "text": "よろしくお願いいたします",
    "channel": "CHANNEL"
}
```

BOTS_TOKEN には先に Secrets Manager へ保存したトークンを指定する。

channel には slack で割り振られている ID を指定する。
channel の表示名で行けるかどうかは試していないし、表示名で叩くべきではない。
channel ID はリクエストに含まれているのでそこから取得すれば良い。

リクエストは `fetch` を使用したいが、ここからは使用できないので、`console.log` で出力を確認するだけとした。


[TOP](#top)
<a id="handle-queryString"></a>
### queryString パラメータを取得するには

API Gateway 経由で queryString パラメータを取得するには、以下の項目を設定すれば良い。

1. API → リソース → ANY → 統合リクエストの設定を開く
1. Lambda プロキシ統合の使用にチェックを入れる

上記手順で API Gateway を作成した場合はデフォルトでチェックが入っているはず。

これで以下のようにパラメータを取得できる。

```javascript
exports.handler = async (aws_lambda_event) => {
  const q = aws_lambda_event.queryStringParameters;
  console.log(q);
};
```

- [How to pass a querystring or route parameter to AWS Lambda from Amazon API Gateway : StackOverflow](https://stackoverflow.com/questions/31329958/how-to-pass-a-querystring-or-route-parameter-to-aws-lambda-from-amazon-api-gatew)


[TOP](#top)
<a id="postscript"></a>
### まとめ

Slack Bot のイベントハンドラを AWS Lambda で作成してみた。

ここから実際に Slack API を叩いたり、他のことをしたりするわけだ。
が、そのためには多少入り組んだことをする必要があるので、ここからはインライン編集では力不足だ。
（[JavaScript の async/await について](/entry/2019/08/03/164422) に書いたようにインライン編集で数時間溶かしてしまった）

ローカルでテストしつつ、CloudFormation でデプロイを自動化したい。
その記事はまた別にまとめる。
（[AWS CloudFormation で Lambda をデプロイする](/entry/2019/08/04/025509) にまとめた）


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Enabling interactions with bots : Slack api docs](https://api.slack.com/bot-users)
- [How to pass a querystring or route parameter to AWS Lambda from Amazon API Gateway : StackOverflow](https://stackoverflow.com/questions/31329958/how-to-pass-a-querystring-or-route-parameter-to-aws-lambda-from-amazon-api-gatew)


[TOP](#top)
