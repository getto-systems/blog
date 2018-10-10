# BitBuckbt の Pipeline で S3 にアップロードする
<a id="top"></a>

フロントエンドを Elm で実装、バックエンドに Rails、という構成でシステムを構築している。
開発は BitBucket で行っているので、Pipeline を使ってテストとリリースをしてみる。


###### CONTENTS

1. [bitbucket-pipelines.yml を作成](#create-config)
1. [タグをつけたら本番環境にリリース](#release-by-tagged-build)
1. [まとめ](#postscript)
1. [参考資料](#reference)


[TOP](#top)
<a id="create-config"></a>
### bitbucket-pipelines.yml を作成

BitBucket のリポジトリ画面で、メニューから Pipelines を選択する。
Pipeline の設定が表示されるので、言語を選択して Pipeline を有効にする。

```
image: node:10.11.0-stretch

pipelines:
  default:
    - step:
        caches:
          - node
        script:
          - npm install
          - npm test
```

フロントエンドは Elm で実装しているので、ここでは node の設定を選択した。
image には DockerHub にあるやつを指定できる。

default のステップでは、master へコミットされた場合に実行するコマンドを書いておく。
ここではテストを実行するようにして、master が壊れていないことを確認できるようにした。

試しに何かマージしてみて、動作を確認しておこう。


[TOP](#top)
<a id="release-by-tagged-build"></a>
### タグをつけたら本番環境にリリース

```
image: node:10.11.0-stretch

pipelines:
  default:
    - step:
        caches:
          - node
        script:
          - npm install
          - npm test

  tags:
    "*":
      - step:
          caches:
            - node
          script:
            - npm install
            - npm test
            - npm run elm-install
            - ./bin/build.sh
```

tags の項目を追加すると、タグをつけた時に実行するステップを定義できる。
ここではリリースコマンドを実行するようにした。

#### S3 バケットの設定

S3 バケットへアクセスするために、ポリシーを作成してユーザーをアタッチしておく必要がある。

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "SID",
            "Effect": "Allow",
            "Action": [
                "s3:DeleteObject",
                "s3:GetBucketLocation",
                "s3:GetBucketWebsite",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::バケット名",
                "arn:aws:s3:::バケット名/*"
            ]
        }
    ]
}
```

このユーザーのアクセスキーとシークレットキーが必要なのでコピーしておくこと。

#### S3 バケットにアップロード

S3 バケットへアップロードするために、s3cmd を使用した。

```
apt-get update
apt-get install -y s3cmd

echo "[default]" > $HOME/.s3cfg
echo "access_key = $AWS_ACCESS_KEY" >> $HOME/.s3cfg
echo "secret_key = $AWS_SECRET_KEY" >> $HOME/.s3cfg

s3cmd sync --acl-private --verbose ./public/ "$AWS_S3_URL"
```

まず s3cmd をインストールして、設定を行う。

アクセスキーとシークレットキーは環境変数で設定しておく必要がある。
リポジトリ画面で、Settings を開くと、Pipelines の項目に Environment variables がある。
鍵マークをクリックして登録すると、あとでこの画面から読み出せなくできるので、機密情報はこれで登録する。

試しにタグをつけてみて、正しくリリースされるか確認しておこう。


[TOP](#top)
<a id="postscript"></a>
### まとめ

BitBucket の Pipeline を使用してフロントエンドのリリースを行う方法をまとめてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Environment variables - Atlassian Documentation](https://confluence.atlassian.com/bitbucket/environment-variables-794502608.html)
- [Configure bitbucket-pipelines.yml - Atlassian Documentation](https://confluence.atlassian.com/bitbucket/configure-bitbucket-pipelines-yml-792298910.html#Configurebitbucket-pipelines.yml-ci_tagstags)


[TOP](#top)
