# AWS CloudFormation で Lambda をデプロイする
<a id="top"></a>

Slack Bot のイベントハンドラを Lambda で作成したい。

そのために、ローカルでテストしつつ、CloudFormation でデプロイを自動化したい。

###### CONTENTS

1. [この記事の内容](#abstract)
1. [できあがったもの](#outcome)
1. [aws cloudformation package でパッケージング](#package)
1. [aws cloudformation deploy でデプロイ](#deploy)
1. [デプロイスクリプト](#deploy-script)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="abstract"></a>
### この記事の内容

ほぼ下記の記事と同じ内容。
これをトレースしてみたもの。

- [Lambda＆API GatewayをCloudFormationで作成する - 闘うITエンジニアの覚え書き](https://www.magata.net/memo/index.php?Lambda%A1%F5API%20Gateway%A4%F2CloudFormation%A4%C7%BA%EE%C0%AE%A4%B9%A4%EB)


[TOP](#top)
<a id="outcome"></a>
### できあがったもの

以下のテンプレートを `aws cloudformation` コマンドで処理する。

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: STACK_DESCRIPTION
Parameters:
  Role:
    Type: String
    Description: "lambda role arn"
  KMS:
    Type: String
    Description: "KMS key arn"
  SecretRegion:
    Type: String
    Description: "region of secret"
  SecretId:
    Type: String
    Description: "id of secret"
Resources:
  lambdaResource:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: LAMBDA_FUNCTION_NAME
      Runtime: nodejs10.x
      Handler: index.handler
      MemorySize: 128
      Timeout: 3
      CodeUri: ..
      AutoPublishAlias: active
      KmsKeyArn:
        Ref: KMS
      Role:
        Ref: Role
      Environment:
        Variables:
          SECRET_REGION:
            Ref: SecretRegion
          SECRET_ID:
            Ref: SecretId
```

`deploy` する際に必要なポリシーは以下の通り。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "cloudformation",
      "Effect": "Allow",
      "Action": [
        "cloudformation:GetTemplateSummary",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeChangeSet",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet"
      ],
      "Resource": [
        "arn:aws:cloudformation:REGION:ACCOUNT:stack/STACK_NAME/*"
      ]
    },
    {
      "Sid": "transform",
      "Effect": "Allow",
      "Action": "cloudformation:CreateChangeSet",
      "Resource": "arn:aws:cloudformation:REGION:aws:transform/*"
    },
    {
      "Sid": "lambda",
      "Effect": "Allow",
      "Action": [
        "lambda:ListVersionsByFunction",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:ListTags",
        "lambda:GetFunction",
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:UpdateFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:PublishVersion",
        "lambda:CreateAlias",
        "lambda:UpdateAlias"
      ],
      "Resource": [
        "arn:aws:lambda:REGION:ACCOUNT:function:FUNCTION_NAME"
      ]
    },
    {
      "Sid": "iam",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::ACCOUNT:role/ROLE_NAME"
      ]
    }
  ]
}
```

`REGION`、`ACCOUNT`、`STACK_NAME`、`FUNCTION_NAME`、`ROLE_NAME` は適宜指定する。


[TOP](#top)
<a id="package"></a>
### aws cloudformation package でパッケージング

以下の記事を参考にテンプレートを作成する。

- [Lambda＆API GatewayをCloudFormationで作成する - 闘うITエンジニアの覚え書き](https://www.magata.net/memo/index.php?Lambda%A1%F5API%20Gateway%A4%F2CloudFormation%A4%C7%BA%EE%C0%AE%A4%B9%A4%EB)
- [AWS::Serverless 変換 : aws docs](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/transform-aws-serverless.html)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: STACK_DESCRIPTION
Parameters:
  Role:
    Type: String
    Description: "lambda role arn"
  KMS:
    Type: String
    Description: "KMS key arn"
  SecretRegion:
    Type: String
    Description: "region of secret"
  SecretId:
    Type: String
    Description: "id of secret"
Resources:
  lambdaResource:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: LAMBDA_FUNCTION_NAME
      Runtime: nodejs10.x
      Handler: index.handler
      MemorySize: 128
      Timeout: 3
      CodeUri: ..
      AutoPublishAlias: active
      KmsKeyArn:
        Ref: KMS
      Role:
        Ref: Role
      Environment:
        Variables:
          SECRET_REGION:
            Ref: SecretRegion
          SECRET_ID:
            Ref: SecretId
```

- Parameters : コマンドラインから指定するパラメータ。テンプレートからは `Ref: KEY` で参照
- AutoPublishAlias : デプロイ時にエイリアスを付け替える

エイリアスについては [AWS Lambda で Slack Bot イベントハンドラを作る](/entry/2019/08/03/214352) にまとめた。

`STACK_DESCRIPTION`、`LAMBDA_FUNCTION_NAME` は適宜指定する。

ディレクトリ構成は以下のような形にした。

```text
- package.json
- node_modules/
- index.js
- lib/
- config/
  - template.yaml
```

このテンプレートを `aws cloudformation package` コマンドで処理するとデプロイ可能な形式に変換できる。

```bash
aws cloudformation package \
  --template-file config/template.yaml \
  --output-template-file config/packaged-template.yaml \
  --s3-bucket $S3_BUCKET_NAME
```

`$S3_BUCKET_NAME` は適宜指定する。
ここには `CodeUri` で指定したソースがアップロードされる。

このコマンドを実行するユーザーは `$S3_BUCKET_NAME` で指定するバケットにアップロードする権限を持っている必要がある。


[TOP](#top)
<a id="deploy"></a>
### aws cloudformation deploy でデプロイ

先に package コマンドで生成した `packaged-template.yaml` を deploy すると、テンプレートで定義した Lambda がデプロイされる。
`--parameter-overrides` に `Parameters` の内容を指定する。

```bash
aws cloudformation deploy \
  --template-file config/packaged-template.yaml \
  --region $STACK_REGION \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    Role=$ROLE_ARN \
    KMS=$KMS_ARN \
    SecretRegion=$SECRET_REGION \
    SecretId=$SECRET_ID
```

変数はそれぞれ、以下のものを設定する。

- `$STACK_REGION` : このスタックのリージョン
- `$STACK_NAME` : スタック名
- `$ROLE_ARN` : Lambda のロール（詳細は [AWS Lambda で Slack Bot イベントハンドラを作る](/entry/2019/08/03/214352)）
- `$KMS_ARN` : KMS キー
- `$SECRET_REGION` : シークレットのリージョン
- `$SECRET_ID` : シークレット名（詳細は [AWS Secrets Manager で機密情報を保存する](/entry/2019/08/03/192052)）

`deploy` する際に必要なポリシーは以下の通り。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "cloudformation",
      "Effect": "Allow",
      "Action": [
        "cloudformation:GetTemplateSummary",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeChangeSet",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet"
      ],
      "Resource": [
        "arn:aws:cloudformation:REGION:ACCOUNT:stack/STACK_NAME/*"
      ]
    },
    {
      "Sid": "transform",
      "Effect": "Allow",
      "Action": "cloudformation:CreateChangeSet",
      "Resource": "arn:aws:cloudformation:REGION:aws:transform/*"
    },
    {
      "Sid": "lambda",
      "Effect": "Allow",
      "Action": [
        "lambda:ListVersionsByFunction",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:ListTags",
        "lambda:GetFunction",
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:UpdateFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:PublishVersion",
        "lambda:CreateAlias",
        "lambda:UpdateAlias"
      ],
      "Resource": [
        "arn:aws:lambda:REGION:ACCOUNT:function:FUNCTION_NAME"
      ]
    },
    {
      "Sid": "iam",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::ACCOUNT:role/ROLE_NAME"
      ]
    }
  ]
}
```

`REGION`、`ACCOUNT`、`STACK_NAME`、`FUNCTION_NAME`、`ROLE_NAME` は適宜指定する。

~複数のユーザーでデプロイするのが面倒だったので、~stack, function に関してはデプロイする分だけ複数指定するようにした。


[TOP](#top)
<a id="deploy-script"></a>
### デプロイスクリプト

パラメータは１度指定すれば良いので、`--parameter-overrides` はデプロイスクリプトでは指定する必要はない。

```bash
aws cloudformation package \
  --template-file config/template.yaml \
  --output-template-file config/packaged-template.yaml \
  --s3-bucket $S3_BUCKET_NAME \
&& \
aws cloudformation deploy \
  --template-file config/packaged-template.yaml \
  --region $STACK_REGION \
  --stack-name $STACK_NAME
```


[TOP](#top)
<a id="postscript"></a>
### まとめ

CloufFormation で Lambda をデプロイしてみた。
これでデプロイを自動化できるので、ローカルでテストしつつ、マージされたらデプロイというフローで開発できる。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Lambda＆API GatewayをCloudFormationで作成する - 闘うITエンジニアの覚え書き](https://www.magata.net/memo/index.php?Lambda%A1%F5API%20Gateway%A4%F2CloudFormation%A4%C7%BA%EE%C0%AE%A4%B9%A4%EB)
- [AWS::Serverless 変換 : aws docs](https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/transform-aws-serverless.html)
- [AWS Serverless Application Model (SAM) : GitHub](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction)
- [Safe Lambda deployments : GitHub](https://github.com/awslabs/serverless-application-model/blob/master/docs/safe_lambda_deployments.rst)


[TOP](#top)
