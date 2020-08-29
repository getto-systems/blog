# Google Cloud Run にデプロイしてみる
<a id="top"></a>

###### CONTENTS

1. [なぜそんなことをするのか](#purpose)
1. [Cloud Run にデプロイ](#deploy-cloud-run)
1. [Secret Manager で機密情報を管理](#manage-secret)
1. [distroless イメージを使用してビルド](#use-distroless)
1. [CI によるデプロイ](#ci-deploy)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="purpose"></a>
### なぜそんなことをするのか

これまで GKE で K8s のクラスタにデプロイしていた。
Cloud Run はコンテナをそのまま走らせられるサービスなので、Cloud Run でもいいのではないかと考えた。
常時 Node を起動させておく GKE に比べて、実行時間で課金される Cloud Run のほうが安く済む可能性もある。


#### 他の選択肢

- Azure のコンテナインスタンス
- Amazon にも似たようなのはあるはず（調べてないけど Fargate ってのがそうかも）

Google のサービスを選択したのは、単に GKE を使っていたから。
あと、サービスが https で公開されるので、証明書を自前で用意しなくていい、というのもポイントが高い。
（必須ではないので、Google だけではなく Asure や Amazon のサービスを使用してデプロイする方法も検討したい）


[TOP](#top)
<a id="deploy-cloud-run"></a>
### Cloud Run にデプロイ

Cloud Run にデプロイするのは[ドキュメント](https://cloud.google.com/run/docs/quickstarts/prebuilt-deploy)の通りにすれば特に問題なくデプロイできる。
大まかな流れは以下の通り。

1. デプロイするイメージを用意
1. gcr.io にイメージをアップロード
1. アップロードしたイメージを指定してサービスを作成
1. 払い出された URL にアクセスしてみて、ちゃんと動いていることを確認

デプロイごとに、どの程度トラフィックを流すか、という設定もできるようだが詳しくは調べていない。


[TOP](#top)
<a id="manage-secret"></a>
### Secret Manager で機密情報を管理

前のセクションでは、Cloud Run にデプロイする際、プラットフォームとして「フルマネージド」を選択した。
フルマネージドでは、機密情報へのアクセスには Secret Manager サービスを使用しなければならない。

フルマネージド以外の選択肢としては、GKE クラスタを立ててそこにデプロイする、というのがある。
こうすると K8s の Secret を mount できるようになる。
けど、GKE のクラスタを使用しないで Cloud Run したいのでこの方法は却下。

Secret Manager の[ドキュメント](https://cloud.google.com/secret-manager/docs/quickstart#secretmanager-quickstart-go)に書いてある通りにすれば問題なくアクセスできる。
大まかな流れは以下の通り。

1. Secret Manager に Secret を登録
1. クライアントライブラリで Secret にアクセス

Secret Manager の Secret 名は Cloud Run の環境変数で指定すればいい。

Secret にアクセスする際、以下の権限が必要。

- secretmanager.versions.access

この権限を持ったサービスアカウントでデプロイする必要がある。

これでアプリケーションから機密情報にアクセスする方法が整った。


[TOP](#top)
<a id="use-distroless"></a>
### distroless イメージを使用してビルド

golang で書いているので、アプリケーションは scratch にコピーするだけで動く。
しかし、Secret Manager にアクセスする場合、scratch を使用すると動かない。
必要な証明書にアクセスできないため、Secret Manager への接続が失敗する。

このため、ベースイメージとして [distroless](https://github.com/GoogleContainerTools/distroless) を使用する必要がある。
Dockerfile は以下のようになる。
（後半の `FROM distroless` がここでは重要）

```Dockerfile
FROM golang:1.15.0-buster as builder
COPY . /build
WORKDIR /build
RUN : && \
  CGO_ENABLED=0 \
  GOOS=linux \
  GOARCH=amd64 \
  go build -a -o app main.go && \
  :

FROM gcr.io/distroless/static-debian10
COPY --from=builder /build/app /app
CMD ["/app"]
```

このサンプルでは `gcr.io/distroless/static-debian10` を使用しているが、プロジェクトに合ったものを選択すればいい。


[TOP](#top)
<a id="ci-deploy"></a>
### CI によるデプロイ

デプロイは CI 経由でやりたい。
やることは大きく分けて以下の2つ。

1. イメージをビルドして gcr に push
1. 新しいデプロイを作成


#### イメージをビルドして gcr に push

```bash
#!/bin/sh

build_main() {
  if [ ! -f "${GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON}" ]; then
    echo "key file : GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON is not exists"
    exit 1
  fi

  local host
  local project
  local image
  local version
  local tag

  host=${HOST} # asia.gcr.io

  cat $GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON | docker login -u _json_key --password-stdin https://${host}

  project=${PROJECT}
  image=${IMAGE}
  version=${VERSION}

  tag=${host}/${project}/${image}:${version}

  docker build -t $tag . &&
  docker push $tag
}

build_main
```

必要な権限は以下の通り。

- storage.buckets.get
- storage.objects.create
- storage.objects.delete
- storage.objects.get
- storage.objects.list


#### 新しいデプロイを作成

```bash
#!/bin/sh

deploy_main() {
  if [ ! -f "${GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON}" ]; then
    echo "key file : GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON is not exists"
    exit 1
  fi

  local host
  local region
  local project
  local image
  local version
  local tag
  local account

  host=${HOST} # asia.gcr.io
  region=${REGION} # asia-northeast1

  project=${PROJECT}
  image=${IMAGE}
  version=${VERSION}

  tag=${host}/${project}/${image}:${version}

  service=${SERVICE}

  export HOME=$(pwd)

  cp "${GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_JSON}" .ci/google_cloud_service_account_key.json

  gcloud auth activate-service-account --key-file=.ci/google_cloud_service_account_key.json
  gcloud run deploy $service --image="$tag" --platform=managed --region="$region" --project="$project"
}

deploy_main
```

イメージのタグはビルドしたときと同じものにする。

必要な権限は以下の通り。

- iam.serviceAccounts.actAs
- run.services.create
- run.services.delete
- run.services.get
- run.services.list
- run.services.update

デプロイするときに、コンテナにサービスアカウントを関連付けるため `iam.serviceAccounts.actAs` が必要になる。

デプロイスクリプトでは、サービスアカウントの指定や環境変数の指定をやっていない。
最初のデプロイでこれらを指定するようにして、CI ではこれらの情報にアクセスしなくていいように、と考えた。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Cloud Run でデプロイする方法をまとめた。
これで運用コストが下がるといいな。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [クイックスタート: 事前にビルドされたサンプル コンテナをデプロイする | Cloud Run ドキュメント](https://cloud.google.com/run/docs/quickstarts/prebuilt-deploy)
- [Quickstart | Secret Manager ガイド](https://cloud.google.com/secret-manager/docs/quickstart#secretmanager-quickstart-go)
- [GoogleContainerTools / distroless | GitHub](https://github.com/GoogleContainerTools/distroless)


[TOP](#top)
