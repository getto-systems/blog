# Docker Hub からの webhook で GitLab から latest タグをつける
<a id="top"></a>

Docker Hub の Auto Build でイメージをビルドしたい。
ただし、latest タグは別ビルドにしたくない。

そこで、webhook で build 完了を検知して GitLab の pipeline から latest タグを push する。

###### CONTENTS

1. [できあがったもの](#outcome)
1. [DockerHub で webhook を設定する](#setup-webhook)
1. [webhook で GitLab の pipeline をトリガーする](#trigger-pipeline)
1. [ビルド完了で Slack に通知する](#notify-slack)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- DockerHub webhook
- Node.js : 10.16.0
- GitLab trigger
- Slack


<a id="outcome"></a>
### できあがったもの

- [getto-systems/psycher-dockerhub : GitHub](https://github.com/getto-systems/psycher-dockerhub)
- [getto-systems/psycher-getto : GitHub](https://github.com/getto-systems/psycher-getto)


[TOP](#top)
<a id="setup-webhook"></a>
### DockerHub で webhook を設定する

前提として、対象のリポジトリに対して Auto Build の設定は完了済みである。

[Docker Hub Webhooks : Docker Docs](https://docs.docker.com/docker-hub/webhooks/) を参考にして webhook を設定する。
特に何か設定が必要な項目はなく、build 完了時に叩かれる URL を指定するだけ。

リクエストは以下のような json で post される。
（上記ドキュメントから転載）

```json
{
  "callback_url": "https://registry.hub.docker.com/u/svendowideit/testhook/hook/.../",
  "push_data": {
    "images": [
        "..."
    ],
    "pushed_at": 1.417566161e+09,
    "pusher": "trustedbuilder",
    "tag": "latest"
  },
  "repository": {
    "comment_count": 0,
    "date_created": 1.417494799e+09,
    "description": "",
    "dockerfile": "...",
    "full_description": "Docker Hub based automated build from a GitHub repo",
    "is_official": false,
    "is_private": true,
    "is_trusted": true,
    "name": "testhook",
    "namespace": "svendowideit",
    "owner": "svendowideit",
    "repo_name": "svendowideit/testhook",
    "repo_url": "https://registry.hub.docker.com/u/svendowideit/testhook/",
    "star_count": 0,
    "status": "Active"
  }
}
```

これに応じて GitLab のトリガーを起動するようにする。


[TOP](#top)
<a id="trigger-pipeline"></a>
### webhook で GitLab の pipeline をトリガーする

AWS Lambda に [getto-systems/psycher-dockerhub](https://github.com/getto-systems/psycher-dockerhub) をデプロイした。

GitLab の pipeline は、サイン済みイメージを push することが目的だ。
以下の手順で作業する。

1. build されたイメージを pull
1. Docker Content Trust-ed なイメージであれば push 済みなので何もしない
1. build されたタグを Docker Hub にサイン済みで再 push
1. 同じイメージを latest タグで push

こうすると、webhook からの post は以下のタイミングで行われる。

- 最初の build 完了
- サイン済みの push が行われた
- latest の push が行われた

このフローでは、最初の build 完了と、サイン済み push で pipeline をトリガーする。
latest の push では pipeline はトリガーしなくて良い。

サイン済みの push で pipeline をトリガーするのは、webhook の post body からは、サイン済みで push されたものかどうかの判断ができないため。


[TOP](#top)
<a id="notify-slack"></a>
### ビルド完了で Slack に通知する

ビルドが完了したことを Slack に通知したい。
GitLab の pipeline の目的はサイン済みイメージの push だが、webhook のデータからはこの完了が判断できない。

そこで、GitLab の pipeline で、Docker Hub に push したあと、[getto-systems/psycher-getto](https://github.com/getto-systems/psycher-getto) を使用して Slack へ通知するようにした。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Docker Hub の Auto Build から latest タグの push と、Slack への通知までのフローを組んでみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Docker Hub Webhooks : Docker Docs](https://docs.docker.com/docker-hub/webhooks/)


[TOP](#top)
