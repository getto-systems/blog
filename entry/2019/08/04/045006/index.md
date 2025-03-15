# Slack Bot でデプロイする
<a id="top"></a>

Slack Bot にデプロイを頼めるようにしたい。

###### CONTENTS

1. [できあがったもの](#outcome)
1. [デプロイ](#deploy)
1. [実装詳細](#details)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="outcome"></a>
### できあがったもの

#### Slack Bot 用エンドポイント

- [getto-systems/psycher-slack : GitHub](https://github.com/getto-systems/psycher-slack)

Slack イベントを受け取ってイベントに応じたアクションをする。

- 「リリース」、「release」を含む mention を受け取った場合、対応する GitLab trigger を POST
- 「よろ」を含む mention を受け取った場合、Slack に返信
- その他の mention を受け取った場合、Slack に返信


#### デプロイ完了通知エンドポイント

- [getto-systems/psycher-getto : GitHub](https://github.com/getto-systems/psycher-getto)

独自のイベントを受け取ってイベントに応じたアクションをする。

- source=gitlab で result=[success|failure] を受け取った場合、Slack に返信


[TOP](#top)
<a id="deploy"></a>
### デプロイ

- Slack channel に Bot User を招待
- シークレットの `slack-bot-token` に Slack Bot トークンを保存
- シークレットの `gitlab-trigger-tokens` に GitLab のトリガートークンを保存
- .gitlab-ci のワークフローに `deploy` と `notify` を追加

GitLab のトリガートークンは以下のような json で保存する。

```json
{
  "TEAM-ID": {
    "CHANNEL-ID": {
      "PROJECT": { "project_id": "PROJECT-ID", "token": "TRIGGER-TOKEN" }
    }
  }
}
```

`.gitlab-ci.yml` は以下のようにする。

```yaml
stages:
  - deploy
  - notify

deploy:
  stage: deploy
  only:
    refs:
      - triggers
    variables:
      - $RELEASE

  image: buildpack-deps:disco-scm

  script:
    - ./bin/deploy.sh

deploy_success:
  stage: notify
  only:
    refs:
      - triggers
    variables:
      - $RELEASE
  when: on_success

  image: buildpack-deps:disco-curl

  script:
    - ./bin/notify.sh success

deploy_failure:
  stage: notify
  only:
    refs:
      - triggers
    variables:
      - $RELEASE
  when: on_failure

  image: buildpack-deps:disco-curl

  script:
    - ./bin/notify.sh failure
```

`notify.sh` は以下のようなスクリプトを用意する。

```bash
#!/bin/bash

result=$1

echo "$result : $channel / $timestamp"
curl "$NOTIFY_URL?$NOTIFY_TOKEN=true&source=gitlab&result=$result&channel=$channel&timestamp=$timestamp"
```

- `$NOTIFY_URL` : デプロイ完了通知エンドポイントの URL を指定する
- `$NOTIFY_TOKEN` : API Gateway で設定したパラメータを指定する

それぞれ、GitLab の Variables で設定できる。

`deploy.sh` でデプロイを実行することで Slack Bot への mention でデプロイできるようになる。


[TOP](#top)
<a id="details"></a>
### 実装詳細

#### handler

`slack_bot_event` に応じて `conversation` を行う。
`type` が `mention` の場合は `handlers/mention.js` がハンドリングする。

会話を行うには `message.channels` 用のハンドラを用意する必要がある。
このハンドラでは、なんらかの状態を保存してリクエストを直列化する必要があるはず。
スレッドを使用することでそれほど複雑にしないで実装できる可能性はある。


#### slack_bot_event

aws lambda から渡された生の json をハンドリングしやすいように加工したイベントオブジェクト。


#### conversation

イベントオブジェクトから情報を取り出して会話を行う。

実際の処理は `progress`、`job`、`replyer` に委譲する。


##### progress

会話の処理がすでに開始されているかどうかを `session` に問い合わせることで判定する。
mention は１回でも、Slack からの通知が複数回飛んでくることがあるため、すでに開始した処理については無視する。

おそらく、レスポンスステータスが 200 でなかった場合に Slack が同じ内容でエンドポイントを叩くのだと考えている。
もう少し丁寧なエラー処理が必要なのだろう。


##### job

`deployment` からデプロイする対象を取得できた場合、`pipeline` にデプロイの実行を依頼する。


##### replyer

メッセージや絵文字のリアクションを `stream` に返信する。


#### repository

##### session

`uuid_store` から uuid を取得し、`document_store` に会話を登録する。
この時、会話の ID (team, channel, timestamp) がすでに登録されていた場合は uuid の登録は行わない。

`document_store` から `uuid` を再取得することで、すでに処理が開始されていないことを確認する。


##### deployment

`secret_store` に登録されている token から、デプロイ可能な対象を取得する。


##### pipeline

指定された対象のデプロイを `job_store` に依頼する。
デプロイ用のトークンは `secret_store` から取得する。


##### stream

指定されたメッセージを `message_store` に流す。
投稿用のトークンは `secret_store` から取得する。


#### infra

- uuid_store : uuid を生成
- document_store : AWS DynamoDB から会話データを取得
- secret_store : AWS Secrets からトークンを取得
- job_store : GitLab API を通じてデプロイ job を開始
- message_store : Slack API を通じてメッセージを投稿


[TOP](#top)
<a id="postscript"></a>
### まとめ

Slack Bot に mention を飛ばすことでデプロイできるようにしてみた。

これまでは shell スクリプトでデプロイしていたので、開発者がスクリプトを叩く必要があった。
また、デプロイするブランチを master 以外にしてしまうことも不可能ではなかった。

Slack Bot の mention でデプロイすることで、master からのデプロイを強制できるようになった。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [AWS Secrets Manager で機密情報を保存する](/entry/2019/08/03/192052)
- [AWS Lambda で Slack Bot イベントハンドラを作る](/entry/2019/08/03/214352)
- [AWS CloudFormation で Lambda をデプロイする](/entry/2019/08/04/025509)


[TOP](#top)
