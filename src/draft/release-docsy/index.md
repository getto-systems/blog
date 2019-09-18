# Docsy で書いたドキュメントを公開する
<a id="top"></a>

Docsy を使用して書いたドキュメントを S3 + CloudFront で公開する。

###### CONTENTS

1. [S3 + CloudFront で公開する方針](#strategy)
1. [baseURL の設定](#setup-base-url)
1. [favicon の設定](#setup-favicon)
1. [getto-detect セットアップ](#setup-getto-detect)
1. [permalink 調整](#arrange-permalink)
1. [更新日設定スクリプト](#modify-date)
1. [GitLab Pipeline で S3 にアップロード](#init-submodules-on-gitlab) GitLab でサブモジュールを init
1. [Lambda@Edge セットアップ](#setup-lambda-edge)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- Elm : 0.18.0
- simonh1000/file-reader : 1.6.0


<a id="docker-for-mac"></a>
### Docker for Mac インストール

[Docker For Mac ダウンロードページ](https://www.docker.com/docker-mac) からダウンロードしてインストールする。

Docker はなかなかの不安定感があるので、 Stable を選択した方が安定して開発できる。
もちろん、新しい機能が欲しい場合は Edge でも良い。


[TOP](#top)
<a id="docker-sync"></a>
### docker-sync インストール

システムに gem をインストールする。

```bash
sudo gem install -n /usr/local/bin docker-sync
```

#### mkmf.rb can't find header files for ruby

このエラーメッセージで止まる場合は XCode のツールをインストールする必要がある。

```bash
sudo xcode-select --install
```

#### docker-sync.yml

以下の内容で docker-sync.yml を作成する。

```yaml
version: "2"

options:
  verbose: true
syncs:
  apps:
    sync_userid: '1000'
    src: './apps'
    sync_excludes: []
  home:
    sync_userid: '1000'
    src: './home'
    sync_excludes: [".local/share/nvim/swap"]
```

ディレクトリ構成は以下の通り。

```text
./
+ docker-sync.yml
+ bin/
+ apps/
+ home/$USER/
```

これをタイムマシンの対象ディレクトリの任意の位置に配置する。
例えば `Works/works` など。
`Documents` の下だと、クラウド同期の対象ディレクトリなので、別なパスを選択する。

`docker-sync.yml` を作成したら、 `docker-sync` を起動する。

```bash
docker-sync start
```

最初は apps と home のコピーが行われ、そのあと同期処理が開始する。

以下のコマンドで、 restart ポリシーを always に設定しておく。

```bash
docker container update --restart=always home
docker container update --restart=always apps
```

これで、 Mac を再起動した時など、 Docker for Mac 起動時に docker-sync が起動する。
ただ、プロセスが起動するのに時間がかかるので、それまでは同期は停止したままであることに注意が必要だ。


[TOP](#top)
<a id="home"></a>
### home ディレクトリ設置

home は `/home` にマウントされる。
この直下にユーザー名でホームディレクトリを作成して、設定ファイルを設置する。

```bash
git clone https://github.com/shun-getto-systems/configfiles.git home/$USER/.config
```


[TOP](#top)
<a id="connect"></a>
### 接続スクリプト用意

`apps/` には、開発用のアプリケーションコードを用意する。

`apps/<クライアント>/<プロジェクト>/<リポジトリ>` というパスにしておく。

接続スクリプトは `getto` の `labo` プロジェクトの `connect` なので、 `apps/getto/labo/connect` に設置する。
`bin` ディレクトリに実行ファイルのシンボリックリンクを設置しておくことでアクセスを簡単にする。

```bash
git clone https://github.com/getto-systems/labo-connect.git apps/getto/labo/connect
cd bin
ln -s ../apps/getto/labo/connect/bin/connect
```

これで、以下のコマンドで `getto/labo-slim` イメージに接続できる。

```bash
./bin/connect $USER
```

ユーザー名はホームディレクトリの名前と一致させること。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2018年現在の開発環境の構築方法をまとめた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [simonh1000/file-reader | GitHub](https://github.com/simonh1000/file-reader)


[TOP](#top)
