---
layout: template/hatena.jade
title: AWS Lambda でヘルスチェックする
---
<a id="top"></a>

* AWS Lambda を触ってみたい
* S3 のアップロードをトリガーにして、スケジューラーの監視もしたい
* WEB 上のコントロールパネルからインラインでコードを編集する方法で試す

###### CONTENTS

1. [全体の流れ](#application-flow)
1. [S3 にバケットを作成](#create-s3-bucket)
1. [S3 にファイルがアップロードされたら実行](#trigger-by-s3)
1. [ファイルに書かれた URL へアクセスして結果を保存](#access-url)
1. [監視対象のサーバーから S3 にファイルをアップロード](#upload-to-s3)
1. [10分ごとに状態をチェックする](#check-state)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### APPENDIX

1. [checkEcho のテストイベントの内容](#check-echo-event)
1. [checkEcho](#check-echo)
1. [checkResult](#check-result)


<a id="application-flow"></a>
### 全体の流れ

1. 10分ごとに、 S3 へチェックするべき URL を記述したファイルをアップロード
1. S3 へのアップロードをトリガーにしてファイルに記載された URL へアクセス
1. アクセスした結果を S3 に保存
1. 10分ごとに、保存された状態をチェックして問題があれば通知


[TOP](#top)
<a id="create-s3-bucket"></a>
### S3 にバケットを作成

まず、アップロード先の S3 バケットを作成する。

このバケットには、以下のフォルダを作成しておく。

* pulse : このフォルダに json をアップロードする
* echo : pulse の json に記載された URL へアクセスした結果を保存する


[TOP](#top)
<a id="trigger-by-s3"></a>
### S3 にファイルがアップロードされたら実行

参考資料（[ステップ 2.1: Hello World Lambda 関数を作成する : AWS doc](http://docs.aws.amazon.com/ja_jp/lambda/latest/dg/get-started-create-function.html)）を参考にして作業を行なっていく。

まず、 S3 にファイルをアップロードしたらそのファイルの情報をログに出力する関数を作成する。

「関数の作成」ボタンを押すと、4ステップのウィザードで Lambda 関数を作成することができる。

1. 設計図の選択
1. トリガーの設定
1. 関数の設定
1. 確認

最初の設計図として、「s3-get-object」がサンプルとして用意されているので、これを選択する。

すると、トリガーとして S3 が選択済みなので、必要な設定を行なっていく。

* 名前 : `checkEcho`
* バケット : 先ほど作成したバケット
* イベントタイプ : アップロードの時に関数を起動したいので「POST」を選択する。
* プレフィックス : pulse/

「トリガーの有効化」は、テストが完了した時点で有効にするべきなので、チェックを外したままで次へ進む。

今回は「コードをインラインで編集」する。

以下が初期のサンプルコード。

```javascript
'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });


exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        } else {
            console.log('CONTENT TYPE:', data.ContentType);
            callback(null, data.ContentType);
        }
    });
};
```

1. イベントからターゲットのバケットとオブジェクトのキーを取り出す
1. そのオブジェクトを S3 から取得して ContentType をログに記録する

現段階ではとりあえずこのまま編集はしないで先に進む。

ロールの設定では、以下のようなポリシーをアタッチしたロールを作成する。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "s3:*"
            ],
            "Resource": [
                "arn:aws:logs:*:*:*",
                "arn:aws:s3:::作成したバケット",
                "arn:aws:s3:::作成したバケット/*"
            ]
        }
    ]
}
```

この後で、 S3 へファイルをアップロードする必要があるので、そのための権限を付与しておく。

最後に、「関数の作成」ボタンで関数が作成される。


[TOP](#top)
<a id="access-url"></a>
### ファイルに書かれた URL にアクセスして結果を保存

1. `pulse/` に監視する対象の URL を記述した json をアップロードする
1. アップロードされたら、ファイルの URL にアクセスする
1. レスポンスが json の記述と一致する場合に `echo/` へ `"ok"` という内容でファイルをアップロードする
1. 10分ごとに `pulse/` へアップロードしてチェックを行う
1. `echo/` に 15分以上前のファイルがあったらチェック失敗

#### テストデータの用意

実装を始める前に、テストデータとして、作成したバケットに `pulse/myhost.json` をアップロードしておく。

```json
{
    "url":  アクセスする URL,
    "body": 期待するレスポンス body
}
```

`url` と `body` はそれぞれ、監視対象の URL と、そのレスポンスにしておく。

「アクション」から「テストイベントの設定」を選択すると、「テスト」ボタンで実行するときの `event` の内容を設定することができる。  
（テストイベントは APPENDIX に掲載）

このイベントの中の `s3.object.key` に、 `pulse/myhost.json` を指定しておくと、「テスト」を実行した時に `pulse/myhost.json` がアップロードされたかのように関数が実行される。

#### 実装

インラインで編集しつつ、「テスト」で動作確認しつつ実装していく。

シンタックスエラーは「保存」した時にエディタ上でわかるようになっている。

まず pulse の内容を `JSON.parse` する。

```javascript
try {
    const pulse = JSON.parse(data.Body);
    console.log('PULSE:',JSON.stringify(pulse));
} catch(parseError) {
    console.log(parseError);
    const message = `Error parsing object ${data.Body}. key: ${key}, bucket: ${bucket}`;
    callback(message);
}
```

次に https で指定された URL にアクセスしてレスポンス body を取得する。

```javascript
https.get(pulse.url, (response)=>{
    let body = '';
    response.on('data', (chunk)=>{
        body += chunk;
    });
    response.on('end', (res)=>{
        console.log("EXPECTS: ", pulse.body, ", GOT: ", body);
    });
}).on('error', (httpError)=>{
    console.log(httpError);
    const message = `Error getting url ${data.Body}. url: ${pulse.url}`;
    callback(message);
});
```

最後に、 `pulse.body` とレスポンスの内容を比較した結果を `echo` に保存する。

```javascript
if(body != pulse.body) {
    console.log("EXPECTS: ", pulse.body, ", GOT: ", body);
    callback(null, "check failure");
} else {
    const putKey = key.replace(/^pulse/, "echo");
    s3.putObject({
        Bucket: bucket,
        Key: putKey,
        Body: new Buffer("ok"),
    }, (s3PutError, putData)=>{
        if (s3PutError){
            console.log(s3PutError);
            const message = `Error putting object ${putKey} bucket ${bucket}`
            console.log(message);
            callback(message);
        } else {
            callback(null, "check ok");
        }
    })
}
```

テストが完了したら、「トリガー」のタブで、トリガーを有効化する。

[TOP](#top)
<a id="upload-to-s3"></a>
### 監視対象のサーバーから S3 にファイルをアップロード

awscli を監視対象のサーバーにインストールして awscli のセットアップを行う。

```bash
$ aws configure
AWS Access Key ID [None]: <アクセスキーID>
AWS Secret Access Key [None]: <Secret Access Key>
Default region name [None]: ap-northeast-1
Default output format [None]:
```

アプリケーションが使用しているスケジューラーで、 10分ごとに、作成したバケットに pulse データをアップロードする。

```bash
$ aws s3 cp myhost.json s3://作成したバケット/pulse/myhost.json --acl private
```

アップロードしたら、 `checkEcho` が起動されることを確認する。

[TOP](#top)
<a id="check-state"></a>
### 10分ごとに状態をチェックする

コントロールパネルの「関数の作成」ボタンで、チェック用の関数を作成する。

今度は「一から作成」を選択して、トリガーとして CloudWatch Events を選択する。

CloudWatch Events の新しいルールを作成して、スケジュール式を記述する。

* 名前 : `checkResult`
* スケジュール式 : `rate(10 minutes)`

#### 実装

1. `echo/` にアップロードされたファイルの LastModified が 15分以上前のものが存在するかチェック
1. 存在する場合、環境変数で設定した slack に通知する。

まず、 `echo/` にアップロードされたファイルを取得する。

```javascript
s3.listObjects({
    Bucket: bucket,
    Prefix: "echo/",
}, (s3ListError, data) => {
    if(s3ListError) {
        console.log(s3ListError);
        const message = `Error listing objects`;
        callback(message);
    } else {
        console.log(data);
    }
});
```

 LastModified からの経過時間が閾値を超えているものを取り出す。

```javascript
let result = {};
let errors = [];
const now = new Date();
data.Contents.forEach((val,index,arr)=>{
    const key = val.Key.replace("echo/","");
    if (key) {
        const lastModified = new Date(val.LastModified);
        const interval = now - lastModified;
        const isOutdated = interval > outdatedLimit;
        result[key] = {
            lastModified: lastModified,
            interval: interval,
            isOutdated: isOutdated,
        };
        if (isOutdated) {
            errors.push(`${key}: ${lastModified}`);
        }
    }
});
console.log(result);
```

閾値を超えているものがあった場合は Slack に通知する。

```javascript
if (errors.length > 0) {
	const postData = querystring.stringify({
		payload: JSON.stringify({
			channel: slackOpts.channel,
			username: slackOpts.user,
			text: `${errors.join("\n")}`,
			icon_emoji: ":exclamation:",
		}),
	});
	const request = https.request({
		host: slackOpts.url.host,
		path: slackOpts.url.path,
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": Buffer.byteLength(postData),
		},
	});
	request.write(postData);
	request.end();
	callback(null, "outdated exists");
} else {
	callback(null, "all checked");
}
```

テストが完了したら、「トリガー」のタブで、トリガーを有効化する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

AWS Lambda を触ってみるという目標は達成されたが、本格的に開発するためには色々と考えなければならない部分がある。

まず、今回はインラインで編集する方法を試したが、本番運用する場合はバージョン管理を入れたいのでこの方法では難しそうだ。何より、動いているものを編集するというのは選択肢になり得ない。

AWS の色々なサービスと連携して組み立てれば色々なことが考えられそう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

* [ステップ 2.1: Hello World Lambda 関数を作成する : AWS doc](http://docs.aws.amazon.com/ja_jp/lambda/latest/dg/get-started-create-function.html)
* [Node.jsでHTTP GETしてJSONパースするメモ : Qiita](http://qiita.com/n0bisuke/items/788dc4379fd57e8453a3)
* [HTTPS : Node.js v8.4.0 Documentation](https://nodejs.org/api/https.html)
* [AWS CLI で S3 にファイルをアップロード : Qiita](http://qiita.com/seyself/items/43426f57c50021ea55f8)


[TOP](#top)
<a id="check-echo-event"></a>
#### checkEcho のテストイベントの内容

```json
{
  "Records": [
    {
      "eventVersion": "2.0",
      "eventTime": "1970-01-01T00:00:00.000Z",
      "requestParameters": {
        "sourceIPAddress": "127.0.0.1"
      },
      "s3": {
        "configurationId": "testConfigRule",
        "object": {
          "eTag": "0123456789abcdef0123456789abcdef",
          "sequencer": "0A1B2C3D4E5F678901",
          "key": "pulse/myhost.json",
          "size": 1024
        },
        "bucket": {
          "arn": "arn:aws:s3:::作成したバケット",
          "name": "作成したバケット",
          "ownerIdentity": {
            "principalId": "EXAMPLE"
          }
        },
        "s3SchemaVersion": "1.0"
      },
      "responseElements": {
        "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
        "x-amz-request-id": "EXAMPLE123456789"
      },
      "awsRegion": "ap-northeast-1",
      "eventName": "ObjectCreated:Put",
      "userIdentity": {
        "principalId": "EXAMPLE"
      },
      "eventSource": "aws:s3"
    }
  ]
}
```

[TOP](#top)
<a id="check-echo"></a>
#### checkEcho

```javascript
'use strict';

console.log('Loading function');

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const https = require('https');

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    s3.getObject({
        Bucket: bucket,
        Key: key,
    }, (s3GetError, data) => {
        if (s3GetError) {
            console.log(s3GetError);
            const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        } else {
            try {
                const pulse = JSON.parse(data.Body);
                console.log('URL:',pulse.url);
                https.get(pulse.url, (response)=>{
                    let body = '';
                    response.on('data', (chunk)=>{
                        body += chunk;
                    });
                    response.on('end', (res)=>{
                        if(body != pulse.body) {
                            console.log("EXPECTS: ", pulse.body, ", GOT: ", body);
                            callback(null, "check failure");
                        } else {
                            const putKey = key.replace(/^pulse/, "echo");
                            s3.putObject({
                                Bucket: bucket,
                                Key: putKey,
                                Body: new Buffer("ok"),
                            }, (s3PutError, putData)=>{
                                if (s3PutError){
                                    console.log(s3PutError);
                                    const message = `Error putting object ${putKey} bucket ${bucket}`
                                    console.log(message);
                                    callback(message);
                                } else {
                                    callback(null, "check ok");
                                }
                            })
                        }
                    });
                }).on('error', (httpError)=>{
                    console.log(httpError);
                    const message = `Error getting url ${data.Body}. url: ${pulse.url}`;
                    callback(message);
                });
            } catch(parseError) {
                console.log(parseError);
                const message = `Error parsing object ${data.Body}. key: ${key}, bucket: ${bucket}`;
                callback(message);
            }
        }
    });
};
```

[TOP](#top)
<a id="check-result"></a>
#### checkResult

```javascript
'use strict';

console.log('Loading function');

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const url = require('url');
const querystring = require('querystring');
const https = require('https');

const outdatedLimit = 15 * 60 * 1000;

const bucket = process.env.BUCKET;
const slackOpts = {
    url: url.parse(process.env.SLACK_URL),
    channel: "#medical-check",
    user: "medic",
};

exports.handler = (event, context, callback) => {
    s3.listObjects({
        Bucket: bucket,
        Prefix: "echo/",
    }, (s3ListError, data) => {
        if(s3ListError) {
            console.log(s3ListError);
            const message = `Error listing objects`;
            callback(message);
        } else {
            let result = {};
            let errors = [];
            const now = new Date();
            data.Contents.forEach((val,index,arr)=>{
                const key = val.Key.replace("echo/","");
                if (key) {
                    const lastModified = new Date(val.LastModified);
                    const interval = now - lastModified;
                    const isOutdated = interval > outdatedLimit;
                    result[key] = {
                        lastModified: lastModified,
                        interval: interval,
                        isOutdated: isOutdated,
                    };
                    if (isOutdated) {
                        errors.push(`${key}: ${lastModified}`);
                    }
                }
            });
            console.log(result);
            if (errors.length > 0) {
                const postData = querystring.stringify({
                    payload: JSON.stringify({
                        channel: slackOpts.channel,
                        username: slackOpts.user,
                        text: `${errors.join("\n")}`,
                        icon_emoji: ":exclamation:",
                    }),
                });
                const request = https.request({
                    host: slackOpts.url.host,
                    path: slackOpts.url.path,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Content-Length": Buffer.byteLength(postData),
                    },
                });
                request.write(postData);
                request.end();
                callback(null, "outdated exists");
            } else {
                callback(null, "all checked");
            }
        }
    });
};
```

[TOP](#top)
