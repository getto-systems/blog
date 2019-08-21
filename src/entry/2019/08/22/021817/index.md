# AWS Lambda から DynamoDB にアクセスする
<a id="top"></a>

「[Slack Bot でデプロイする](/entry/2019/08/04/045006)」で、１回の発言に対して複数回リクエストが来た。
処理は１回にしたいので、処理済みの発言を DynamoDB に登録しておく。

###### CONTENTS

1. [DynamoDB で二重処理を防ぐ](#prevent-double-trigger)
1. [Lambda からアクセスする](#access-from-lambda)
1. [テーブルを作成する](#create-table)
1. [項目を追加する](#put-item)
1. [項目を取得する](#query)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Node.js : 10.16.0


<a id="prevent-double-trigger"></a>
### DynamoDB で二重処理を防ぐ

「[Slack Bot でデプロイする](/entry/2019/08/04/045006)」で、１回の発言に対して複数回リクエストが来た。
以下の手順で DynamoDB に項目を登録し、複数回処理が走らないようにする。

- `team`, `channel`, `timestamp` をプライマリキーとして登録
- `progress_id` に uuid を生成して登録
- 生成した uuid で検索することで登録完了を確認


複数回のリクエストについては詳しく調べていないが、おそらく、Lambda のレスポンスが 200 ではなかった時に Slack がリクエストを再送しているのだろう。
そっちを対応するのが本筋の気はする。


[TOP](#top)
<a id="access-from-lambda"></a>
### Lambda からアクセスする

今回必要となるポリシーは以下の通り。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT:table/TABLE_NAME"
      ]
    }
  ]
}
```

`REGION`、`ACCOUNT`、`TABLE_NAME` を適当な値に設定する。


[TOP](#top)
<a id="create-table"></a>
### テーブルを作成する

今回はテーブルの作成は AWS コンソールからぽちぽちすることにした。
「テーブルの作成」から作成すれば良い。

キャパシティモードはオンデマンドで作成した。
Slack Bot への会話は現在のところリリースだけなので、それほどのコストにはならないだろうと判断した。
ただ、プロビジョンドの方がコストを削減できそうなので、月々のコストをみて調べることにする。

ここでは `sample-table` をパーティションキー `team`、ソートキー `conversation` で作成したことにして進める。


[TOP](#top)
<a id="put-item"></a>
### 項目を追加する

以下のコードを Lambda で実行すると、`sample-table` に項目が追加される。

```javascript
const AWS = require("aws-sdk");
const uuid = require("uuid/v4"); // npm install --save uuid

const client = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

const table = "sample-table";

const team = "TEAM";
const conversation = "CHANNEL:TIMESTAMP";
const progress_id = uuid();

const params = {
  TableName: table,
  Item: {
    team,
    conversation,
    progress_id,
  }
  ConditionExpression: "attribute_not_exists(team) and attribute_not_exists(conversation)",
};

client.put(params, (err, data) => {
  if (err) {
    console.error("PUT Error JSON:", JSON.stringify(err, null, 2));
  } else {
    console.log("put item:", JSON.stringify(data, null, 2));
  }
});
```

各項目については以下の通り。

- team : 発言した channel の team
- conversation : 発言の channel と timestamp を繋げたもの
- uuid : 処理ごとに生成される uuid

`ConditionExpression` に `attribute_not_exists` を指定すると、重複した put でエラーになる。
しかし、これだけでは重複を防げなかった。
同時に put すると例外が発生しないこともあるようだ。

詳しく追えていないが、ここでは uuid を生成して登録することで重複処理を防ぐことにする。


[TOP](#top)
<a id="query"></a>
### 項目を取得する

以下のコードを Lambda で実行すると、`sample-table` から項目を取得できる。

```javascript
const AWS = require("aws-sdk");

const client = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
});

const table = "sample-table";

const team = "TEAM";
const conversation = "CHANNEL:TIMESTAMP";
const uuid = "UUID";

const params = {
  TableName,
  KeyConditionExpression: "team = :team and conversation = :conversation",
  FilterExpression: "progress_id = :progress_id",
  ExpressionAttributeValues: {
    ":team": team,
    ":conversation": conversation,
    ":progress_id": progress_id,
  },
  ProjectionExpression: "progress_id",
};

client.put(params, (err, data) => {
  if (err) {
    console.error("QUERY Error JSON:", JSON.stringify(err, null, 2));
  } else {
    console.log("query result", JSON.stringify(data, null, 2));
  }
});
```

テーブルに存在する `team`、`conversation`、`progress_id` で検索すると、結果を取得できる。

- `KeyConditionExpression` : プライマリキーの条件を指定
- `FilterExpression` : 追加の絞り込み
- `ProjectionExpression` : 取得する項目の指定

`progress_id` は処理ごとに生成される uuid なので、これで項目が取得できた場合は正しく put できている。
この場合に限って処理を行うことで重複処理を防ぐ。

Slack からのリクエストは同時に 3件程度なので、uuid がぶつかる可能性はほぼ 0 だと考えて良い。

ドキュメントには、put してから query できるまでに時間がかかる、と書いてある。
今回試したところ必要なかったが、多少待つか、何回か query しないといけない可能性はある。


[TOP](#top)
<a id="postscript"></a>
### まとめ

DynamoDB で重複処理を防いでみた。
とりあえず、リリースの処理が連続で走ってしまっていたのを防ぐことができている。

今後、コストがどの程度かかるのかを追跡したい。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Amazon DynamoDB とは : AWS ドキュメント](https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/Introduction.html)
- [ステップ 3: 項目を作成、読み込み、更新、削除する : AWS ドキュメント - Amazon DynamoDB](https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html)
- [比較演算子および関数リファレンス : AWS ドキュメント - Amazon DynamoDB](https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html)


[TOP](#top)
