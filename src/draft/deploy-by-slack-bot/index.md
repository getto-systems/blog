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

`bot_event` に応じたアクションを返す。
各 `handler` は、アクションを実行する場合は `Promise` を返し、何もしない場合は null を返す。
アクションの実行は `outgoing_messenger` を使用して外部と通信する。

アクションの追加は `handler.js` にハンドラを追加することで行う。

会話を行うことは考えていない。
なんらかの状態を保存してリクエストを直列化する必要があるはず。
スレッドを使用することでそれほど複雑にしないで実装できる可能性はある。


#### bot_event

- slack_bot_event : Slack イベント : 特定の mention であることを確認する
- getto_bot_event : 独自イベント : GitLab の pipeline が success か failure かを確認する


#### outgoing_messenger

外部との通信を行う。
必要なトークンは `psycher_secret` から取得する。

- slack : `channel`、`timestamp` を使用して Slack へ投稿を行う
- gitlab : `team`、`channel` からトークンを割り出して GitLab のトリガーを POST する


#### psycher_secret

AWS Secrets Manager からシークレットを取得してトークンを取り出す。


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
