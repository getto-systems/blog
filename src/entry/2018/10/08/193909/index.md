# S3 + CloudFront でフロントエンドを配信する
<a id="top"></a>

フロントエンドを Elm で実装、バックエンドに Rails、という構成でシステムを構築している。
フロントエンドの本番環境は S3 + CloudFront を使用して静的に配信している。
その部分をまとめておく。


###### CONTENTS

1. [S3 にコンテンツをアップロード](#upload-contents)
1. [CloudFront に Distribution を作成](#create-distribution)
1. [Route53 でドメインを設定](#setup-domain)
1. [Lambda@Edge でヘッダを追加](#add-headers)
1. [まとめ](#postscript)
1. [参考資料](#reference)


[TOP](#top)
<a id="upload-contents"></a>
### S3 にコンテンツをアップロード

フロントエンドは SPA の構成にしていない。
S3 + CloudFront で静的に配信したかったので、html をそれぞれのページで個別に作成しないといけない。
と思っていたが実はそんなことはなく、ちゃんと設定することで SPA できる。

ただし、まだ SPA のメリットをうまく飲み込めていないので、ここは当初の予定通り個別 html で構築する。

S3 バケットは配信するドメイン名で作成するのがわかりやすい。

作成した html や JavaScript を S3 バケットにまるごとアップロードする必要がある。
フロントエンドのリリース時に、public ディレクトリを S3 にアップロードするように CI を構成しておく。


[TOP](#top)
<a id="create-distribution"></a>
### CloudFront に Distribution を作成

CloudFront の画面から、Distribution を作成する。
Web を選択し、それぞれ設定を行う。

その前に、まず ssl certificate の発行を行っておく。

下の方にある distribution settings の中の、request or import a certificate with ACM ボタンから発行できる。

1. 配信するドメインで証明書のリクエスト
1. 手続きを進めて発行済みになっていることを確認
1. request or import a certificate with ACM ボタンの下の証明書選択で、発行した証明書が選択できることを確認

発行した証明書がない場合は画面を再読み込みすると出てくるはず。
これを確認したら、項目を設定していこう。

#### origin settings

- origin domain name : 配信する S3 バケットを選択する
- restrict bucket access : Yes
- origin access identity : 新規作成
- grant read permission on bucket : Yes

#### default cache behavior settings

- viewer plotocol policy : redirect http to https
- object caching : customize
- minimum TTL : 86400
- maximum TTL : 31536000
- default TTL : 1209600
- compress objects automatically : Yes

キャッシュの設定で origin のやつを使うことにすると、S3 のオブジェクトに個別に有効期限のヘッダを追加するように設定しておく必要がある。
これは面倒なので、カスタム設定でキャッシュするように設定する。

この設定を行うと、ブラウザがキャッシュするため、CloudFront で Invalidation してもすぐに反映されない場合がある。
このため、コンテンツの構成を考えておく必要がある。

今のところ、以下のようにしてある。

1. バージョンごとに /1.0.0/index.html のようにリリース
1. /index.html では最新のパスにリダイレクト
1. 各バージョンのファイルでも、最新のパスが見つかったらリダイレクト

[getto-detect : GitHub](https://github.com/getto-systems/getto-detect)

これでページを表示するたび、最新のバージョンへリダイレクトするようにしている。

#### distribution settings

- price class : Asia までのやつ
- alternate domain names : 配信するドメイン名
- ssl certificate : custom ssl certificate
- default root  object : index.html
- comment : サービス名 (Distribution 一覧画面で表示されるわかりやすい名前)

ssl certificate は、発行しておいた証明書を選択する。


作成ボタンを押したあと、Distribution 一覧画面で status が in progress になる。
これが enabled になったら準備完了。
結構時間がかかるので、お茶の時間にしよう。


[TOP](#top)
<a id="setup-domain"></a>
### Route53 でドメインを設定

Route53 で、新しいレコードを新規作成する。
type は A レコードを選択する。
Alias をチェックして、作成した CloudFront の Distribution を選択する。
一覧に出てこない場合は再読み込みして再度やってみる。

設定が正しければ、ブラウザで https://配信するドメイン へアクセスできるようになっている。


[TOP](#top)<a id="add-headers"></a>
### Lambda@Edge でヘッダを追加

そのままだと、CSP ヘッダは送られないので、この設定も行っておく。

[AWS S3 + CloudFront で CSP 対応する](/entry/2018/09/26/084813)

[TOP](#top)
<a id="postscript"></a>
### まとめ

現在本番環境の配信に使用している S3 + CloudFront の構成方法をまとめてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- aws 管理画面

最初に設定した時は色々参考にしたはずだが、それらのリンクは失われてしまった。
申し訳ありません。
調べた直後に記事を書かないとね。


[TOP](#top)
