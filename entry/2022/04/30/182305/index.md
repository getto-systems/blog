# GitLab で private レジストリのイメージを参照
<a id="top"></a>

###### CONTENTS

1. [やりたいこと](#goal)
1. [CI/CD variables の設定](#setup-variables)
1. [DOCKER_AUTH_CONFIG の中身](#docker-auth-config)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="goal"></a>
### やりたいこと

Rust のテストをするとき、毎回の依存パッケージビルドが無駄なのでビルド済みイメージを参照したい。
ビルド済みイメージは完全なアプリケーションを含むので、private レジストリを使用したい。

image に private レジストリのイメージを指定する。

```yaml
image: private.registory.example.com/path/to/image:tag
```

単にこう書いただけだと、イメージを pull できないって言われてエラーになる。

イメージを pull するには設定が必要。


[TOP](#top)
<a id="setup-variables"></a>
### CI/CD variables の設定

CI/CD の variables に以下の設定を追加する。

```bash
DOCKER_AUTH_CONFIG=<.docker/config.json の内容>
```

ここで、protected ではないパイプラインで private レジストリのイメージを使用する場合は protected のチェックを外す必要がある。

設定が正しい場合、以下のログが確認できる。

```txt
Using Docker executor with image private.registory.example.com/path/to/image:tag ...
Authenticating with credentials from $DOCKER_AUTH_CONFIG
Pulling docker image private.registory.example.com/path/to/image:tag ...
```

`Authenticating with credentials from $DOCKER_AUTH_CONFIG` が出ていれば正しく設定されている。
これが出ていない場合は設定が通っていない。


[TOP](#top)
<a id="docker-auth-config"></a>
### DOCKER_AUTH_CONFIG の中身

`DOCKER_AUTH_CONFIG` は `~/.docker/config.json` の内容を指定する。

これは以下の手順で生成できる。

```bash
docker login private.registory.example.com
cat ~/.docker/config.json
```

必要なのは "auths" と該当するドメインの設定のみ。
パイプラインからここに列挙したレジストリへのアクセスが許可されるので、必要なものだけ設定する。

設定によっては docker login で `~/.docker/config.json` が更新されない場合もあるっぽいけど、その場合は[他の方法](https://docs.gitlab.com/ee/ci/docker/using_docker_images.html#use-statically-defined-credentials)になる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

DOCKER_AUTH_CONFIG を protected で作成していたため、テストパイプラインで参照できずに認証が通らないところではまったのでまとめてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Run your CI/CD jobs in Docker containers | GitLab Docs](https://docs.gitlab.com/ee/ci/docker/using_docker_images.html#use-statically-defined-credentials)


[TOP](#top)
