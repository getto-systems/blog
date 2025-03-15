# S3 + CloudFront でフロントエンドを配信する話ふたたび
<a id="top"></a>

- S3 オブジェクトに設定したヘッダ用メタデータからヘッダを設定する
- `*/` へのリクエストで `*/index.html` を要求する

###### CONTENTS

1. [メタデータからヘッダを設定する](#response-header)
1. [ディレクトリインデックスを要求する](#request-directory-index)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### SOURCES

- [getto-systems/content-delivery-aws-lambda-edge : GitHub](https://github.com/getto-systems/content-delivery-aws-lambda-edge)


###### ENVIRONMENTS

- Node.js : 10


<a id="response-header"></a>
### メタデータからヘッダを設定する

S3 からのレスポンスにヘッダを追加するのは[以前の記事](/entry/2018/10/08/193909)でも行なった。

今回は、S3 オブジェクトに追加したメタデータからヘッダを設定してみる。

```javascript
'use strict';

exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    let headers = response.headers;

    Object.keys(headers).forEach((raw) => {
        const lower = raw.toLowerCase();
        const pattern = /^x-amz-meta-header-/;
        if (lower.match(pattern)) {
            const key = lower.replace(pattern, "");
            headers[key] = [{
                key: key,
                value: headers[raw][0].value,
            }];
        }
    });

    return response;
};
```

- S3 のメタデータは `x-amz-meta-` という接頭辞がついている
- ヘッダにするメタデータにはさらに `header-` をつけることにした
- `headers` には、`[{ "key": "Name", "value": "Header" }]` の形式でヘッダを指定する

この関数を `Origin Response` に設定する。


[TOP](#top)
<a id="request-directory-index"></a>
### ディレクトリインデックスを要求する

CloudFront では、`*/` へのリクエストを `*/index.html` にしてくれる機能はない。
（リダイレクトとかできるといいのに…）

なので、 Lambda@Edge を仕込むことにする。
[この記事](https://aws.amazon.com/jp/blogs/compute/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-lambdaedge/)を参考にした。

```javascript
'use strict';

exports.handler = async (event) => {
    let request = event.Records[0].cf.request;
    request.uri = request.uri.replace(/\/$/, '/index.html');
    return request;
};
```

- `/` で終わっているなら `index.html` を追加する

この関数を `Origin Request` に設定する。


[TOP](#top)
<a id="postscript"></a>
### まとめ

S3 + CloudFront でフロントエンドを配信する際に必要な Lambda@Edge function をまとめた。
（結局、Lambda が必要なんだな…）

今回作成した function なら、複数のプロジェクトから使用可能なはず。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Implementing Default Directory Indexes in Amazon S3-backed Amazon CloudFront Origins Using Lambda@Edge : AWS Compute Blog](https://aws.amazon.com/jp/blogs/compute/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-lambdaedge/)


[TOP](#top)
