# Google Cloud Run で Cloud SQL に接続する

<a id="top"></a>

###### CONTENTS

1. [やること](#task)
1. [Cloud SQL Admin API の有効化](#admin-api)
1. [サービスアカウントの構成](#service-account)
1. [unix socket で接続](#connect-sql)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="task"></a>

### やること

[ドキュメント](https://cloud.google.com/sql/docs/mysql/connect-run#public-ip-default)から、以下のことが必要。

-   Cloud SQL Admin API の有効化
-   サービスアカウントの構成
-   unix socket で接続

cloud run と cloud sql が別のプロジェクトの場合は両方のプロジェクトに設定が必要になる。

また、接続はインスタンスの名前を持つ unix socket を通して行う。

[TOP](#top)
<a id="admin-api"></a>

### Cloud SQL Admin API の有効化

「API とサービス」の画面から有効化できる。

cloud run と cloud sql が別のプロジェクトの場合は両方のプロジェクトで有効化する必要がある。

[TOP](#top)
<a id="service-account"></a>

### サービスアカウントの構成

cloud run のデプロイ画面で、「セキュリティ」タブからサービスアカウントの設定ができる。
このサービスアカウントは「Cloud SQL クライアント」ロールを持っている必要がある。

cloud run と cloud sql が別のプロジェクトの場合は、cloud sql のプロジェクトで IAM ユーザーを追加する必要がある。

1. cloud run のデプロイで使用したサービスアカウントのメールアドレスをコピー
1. cloud sql のプロジェクトでこのメールアドレスを IAM ユーザーとして追加
1. cloud sql のプロジェクトに追加した IAM ユーザーにも「Cloud SQL クライアント」ロールを設定

[TOP](#top)
<a id="connect-sql"></a>

### unix socket で接続

パブリック IP で構成されている場合、unix socket で接続する。
パスは `/cloudsql/${INSTANCE_NAME}`。

接続に URL を使用している場合は、使用しているライブラリごとにパラメータが違うので、ドキュメントを参照すること。

[TOP](#top)
<a id="postscript"></a>

### まとめ

Cloud Run から Cloud SQL に接続する方法をまとめた。

振り返ってみればドキュメントの通りで、よく読んでいれば何もつまづくところはなかったはず。
cloud sql が別プロジェクトだったことと、`127.0.0.1` に接続できると思い込んでいたことでハマってしまった。
まずドキュメントを読むべきだよね。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [Cloud Run から Cloud SQL への接続 | Google Cloud Docs](https://cloud.google.com/sql/docs/mysql/connect-run#public-ip-default)

[TOP](#top)
