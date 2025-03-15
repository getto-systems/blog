# Google Container Builder で GKE へデプロイ
<a id="top"></a>

- Google Container Builder でビルド
- できたイメージを Container Registry に push
- このイメージで GKE の deployment を更新

「[GKE で本番環境の構成を考えた](/entry/2018/06/30/032823)」で構築したクラスタを前提にしている。

###### CONTENTS

1. [サービスアカウントにロールを追加](#setup-service-account)
1. [cloudbuild.yaml 作成](#setup-cloudbuild)
1. [リポジトリにタグをつけてビルド](#trigger-build)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### APPENDIX

1. [cloudbuild.yaml](#cloudbuild-yaml)


[TOP](#top)
<a id="setup-service-account"></a>
### サービスアカウントにロールを追加

cloudbuild.yaml から kubectl を使用するので、Container Builder のサービスアカウントにクラスタ管理のロールを追加する。
必要なロールのみ追加するべきだろうが、調べられていない。

[サービス アカウント権限の設定 &nbsp;|&nbsp; Cloud Container Builder &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/how-to/service-account-permissions)

Container Builder を使用するプロジェクトの IAM でサービスアカウントを見つけて、 Kubernetes Engine 管理者のロールを追加する。

サービスアカウントは `[PROJECT_ID]@cloudbuild.gserviceaccount.com` というメールアドレスなので、そこに追加すれば良い。

これで Container Builder から kubectl でリソースの更新ができるようになった。


[TOP](#top)
<a id="setup-cloudbuild"></a>
### cloudbuild.yaml 作成

Container Registry の「トリガー作成」から、リポジトリの連携を追加できる。

現在サポートされているのは Cloud Source Repository、 Bitbucket、 GitHub だった。

今回は、トリガーのタイプは、「タグ」に設定する。
指定した正規表現にマッチするタグをつけたらビルド開始。
正規表現は `[0-9.-]+` で設定した。
バージョン番号のタグをつけたらビルド開始だ。

ビルド設定は cloudbuild.yaml を選択する。
このファイルに記述されているステップが実行される。

[cloudbuild.yaml](#cloudbuild-yaml) の例は記事の最後に記載した。

この例では、以下のステップが実行される。

1. curl で slack にビルド開始を通知
1. Dockerfile をビルド
1. deployment を更新
1. service を更新
1. curl でビルド完了を通知

cloudbuild.yaml では、いくつか変数を使用できる。

[変数値の置換 &nbsp;|&nbsp; Cloud Container Builder &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/configuring-builds/substitute-variable-values)

例では、以下の変数を使用した。

- `$PROJECT_ID`
- `$REPO_NAME`
- `$TAG_NAME`

さらに、トリガー編集画面でカスタム変数を登録しておくことで、追加で変数を使用できる。

この例では、以下の変数を登録した。

- `$_SLACK_CHANNEL`
- `$_SLACK_URL`

カスタム変数はアンダースコアで開始しなければならない。
また、cloudbuild.yaml に含まれるカスタム変数が設定されていない場合はエラーになる。

この例では、ステップで slack への通知を行なっている。

本来、slack への通知は pub/sub 経由で行うべきなのだろうが、すごい面倒。
なので、ビルドステップに含めてしまった。
この方法では、ビルドが失敗した時に通知が来ない。
一番通知してほしいタイミングで通知できないのは厳しいので、通知に関しては今後の課題。

なお、rails の場合、`rails db:migrate` をどこで走らせるか、という問題がある。
現状、うまい方法が見つかっていない。

~~開発環境から `rails db:migrate RAILS_ENV=production` する、とか~~

cloudbuild.yaml が設置できたら準備完了。


[TOP](#top)
<a id="trigger-build"></a>
### リポジトリにタグをつけてビルド

ビルドで、`gcr.io/$PROJECT_ID/$REPO_NAME` の名前でイメージが登録される。
deployment.yaml には、このイメージを指定しておく。

```
version=0.0.1
image=gcr.io/$PROJECT_ID/$REPO_NAME

sed -i 's|image: '$image':[0-9.-]\+$|image: '$image':'$version'|' deployment.yaml
git add deployment.yaml

git tag "$version"
```

この後、リポジトリにタグを push すればビルドが開始する。

なお、ステップの順番的に新しいイメージの push  より、deployment の更新が先に行われる。
このため、deployment は最初 Pull Image Error になるが、しばらく待っていれば新しいイメージが pull できるようになって、正しく更新される。
これが気になる場合は、ステップで明示的に push すれば良い。

[Google Cloud Container BuilderからGKE(kubectl)を操作したい](https://qiita.com/Sho2010@github/items/da8701510e3e347f4fee)


[TOP](#top)
<a id="postscript"></a>
### まとめ

Cloud Container Builder で、Dockerfile のビルドと deployment の更新を行うことができるようになった。

タグをつけるとリリースされる運用でしばらくやってみよう。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Google Cloud Container BuilderからGKE(kubectl)を操作したい](https://qiita.com/Sho2010@github/items/da8701510e3e347f4fee)
- [サービス アカウント権限の設定 &nbsp;|&nbsp; Cloud Container Builder &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/how-to/service-account-permissions)
- [変数値の置換 &nbsp;|&nbsp; Cloud Container Builder &nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/configuring-builds/substitute-variable-values)
- [ビルド リクエスト &nbsp;|&nbsp; Cloud Container Builder のドキュメント&nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/api/build-requests?hl=ja)
- [カスタム ビルド プロセスの作成 &nbsp;|&nbsp; Cloud Container Builder のドキュメント&nbsp;|&nbsp; Google Cloud](https://cloud.google.com/container-builder/docs/config?hl=ja)


[TOP](#top)
<a id="cloudbuild-yaml"></a>
#### cloudbuild.yaml

```yaml
steps:
- name: 'gcr.io/cloud-builders/curl'
  args: ['-X', 'POST', '--data-urlencode', 'payload={"channel": "#$_SLACK_CHANNEL", "username": "rails", "text": "notice: build start", "icon_emoji": ":hammer:"}', '$_SLACK_URL']
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/$REPO_NAME:$TAG_NAME', '.']
  id: 'docker-build'
- name: 'gcr.io/cloud-builders/kubectl'
  args: ['apply', '-f', 'templates/deployment.yaml']
  env:
  - CLOUDSDK_COMPUTE_ZONE=CLUSTER_ZONE
  - CLOUDSDK_CONTAINER_CLUSTER=CLUSTER_NAME
  waitFor: ["docker-build"]
  id: 'deployment'
- name: 'gcr.io/cloud-builders/kubectl'
  args: ['apply', '-f', 'templates/service.yaml']
  env:
  - CLOUDSDK_COMPUTE_ZONE=CLUSTER_ZONE
  - CLOUDSDK_CONTAINER_CLUSTER=CLUSTER_NAME
  waitFor: ["docker-build"]
  id: 'service'
- name: 'gcr.io/cloud-builders/curl'
  args: ['-X', 'POST', '--data-urlencode', 'payload={"channel": "#$_SLACK_CHANNEL", "username": "rails", "text": "notice: build complete", "icon_emoji": ":hammer:"}', '$_SLACK_URL']
  waitFor: ['docker-build','deployment','service']
images: ['gcr.io/$PROJECT_ID/$REPO_NAME']
```

kubectl を使用する場合、`CLOUDSDK_COMPUTE_ZONE` と `CLOUDSDK_CONTAINER_CLUSTER` を環境変数で指定する必要がある。
それぞれ、適切な値に変更すること。

waitFor でステップの id を指定することで、そのステップが完了してから実行させることができる。
これを指定しないと、Container Builder が好きなタイミングで各ステップを実行していくように見える。
基本はステップの順番で並列実行のようだ。

この例だと、 curl の complete のステップがすぐに実行されてしまったので waitFor を指定した。


[TOP](#top)
