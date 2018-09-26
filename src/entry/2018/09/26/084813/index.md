# AWS S3 + CloudFront で CSP 対応する
<a id="top"></a>

###### CONTENTS

1. [CloudFront でヘッダを指定するために Lambda 関数を定義](#create-lambda)
1. [CloudFront の Behavior で Lambda を指定](#setup- behavior)
1. [Mozilla の Obsertatory を使用して結果を確認する](#Mozilla-Obsertatory)
1. [まとめ](#postscript)
1. [参考資料](#reference)


[TOP](#top)
<a id="create-lambda"></a>
### CloudFront でヘッダを指定するために Lambda 関数を定義

CloudFront でヘッダを指定するためには Lambda@Edge を作成する必要がある。
CloudFront だけでやる方法は見つからなかった。

当然課金されるので、コストを監視しておこう。

Lambda@Edge は us-east-1 でしか定義できない。
us- east-1 を選択したら lambda 関数を作成していく。

「関数の作成」ボタンで「一から作成」を選択、適宜項目を設定していく。

- 名前 : cf-csp-header-<ドメイン>
- ランタイム : Node.js 8.10
- ロール : 既存のロールを選択 → lambda_basic_execution

#### lambda_basic_execution の作成

lambda_basic_execution が存在しない場合は、「カスタムロールの作成」を選択して作成する。
この時、追加で IAM の設定を行う必要がある。

IAM から「ロール」を開いて、「信頼関係」の設定を行う。

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

"edgelambda.amazonaws.com" を追加する必要がある。

#### 関数の定義

項目を適切に設定すると、関数を定義できるようになる。

```js
'use strict';

const headers = [
  ["Strict-Transport-Security", "max-age=31536000"],
  ["Content-Security-Policy", [
    "default-src 'self'",
    "object-src 'none'",
    "connect-src 'self'",
    "img-src 'self'",
    "font-src 'self' https://fonts.gstatic.com/ https://use.fontawesome.com/",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com/ https://use.fontawesome.com/"
  ]],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-XSS-Protection", "1; mode=block"],
  ["Referrer-Policy", "same-origin"]
].map(function(header) {
  const key = header[0];
  let value = header[1];
  if (value.join) {
    value = value.join("; ");
  }
  return [key, value];
});

exports.handler = async (event) => {
  const response = event.Records[0].cf.response;

  headers.forEach((h) => {
    const key = h[0];
    const value = h[1];
    response.headers[key.toLowerCase()] = [{
      key: key,
      value: value,
    }];
  });

  return response;
};

```

全てのコンテンツに同じヘッダを追加してしまう。
~面倒くさいし~~

何か問題があれば適宜調整する。

ちなみに環境変数を使ったら怒られたので、関数はドメインごとに管理する必要がある。
超面倒くさい。
別なやり方が見つかったらすぐ移行しよう。

関数を保存したら新しいバージョンを作成する。
このバージョンの ARN をコピーしておく。


[TOP](#top)
<a id="setup- behavior"></a>
### CloudFront の Behavior で Lambda を指定

CloudFront の behaviors タブから編集画面を開く。

下の方に Lambda Function Associations という項目があるので、ここに設定を追加する。

CloudFront Event は Origin Response を選択し、先にコピーしておいた ARN を設定する。

設定を保存すると Distribution の Status が In Progress になるのでしばらく待つ。
終わったら Invalidation した後、ブラウザでアクセスしてみて、ヘッダを確認しよう。

問題なければ設定は完了。


[TOP](#top)
<a id="Mozilla-Obsertatory"></a>
### Mozilla の Obsertatory を使用して結果を確認する

設定を反映させた後は、[Obsertatory - Mozilla](https://observatory.mozilla.org/) でスコアをチェックしてみよう。
まだ必要なことがあれば対応する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

S3 + CloudFront の環境で CSP ヘッダの調整を行なってみた。

ちょっと面倒くさすぎるので他の方法も調べたい。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- 「体系的に学ぶ 安全な Web アプリケーションの作り方」: 徳丸浩
- [Content Security Policy with S3 + CloudFront](https://medium.com/@htayyar/content-security-policy-with-s3-cloudfront-cf7526889510)
- [Content Security Policy with Amazon CloudFront: Part 1](https://codeburst.io/content-security-policy-with-amazon-cloudfront-part-1-5505feeaa75)
- [Obsertatory - Mozilla](https://observatory.mozilla.org/)
- [Content-Security-Policy - MDN web docs](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy)
- [X-Frame-Options - MDN web docs](https://developer.mozilla.org/ja/docs/Web/HTTP/X-Frame-Options)


[TOP](#top)
