# Docker Hub からの webhook で GitLab から latest タグをつける
<a id="top"></a>

前回の「[dockle で docker build のベストプラクティスをチェックしてみる](/entry/2019/07/20/203112)」で、 [dockle](https://github.com/goodwithtech/dockle) 試してみるところまでやってみた。

今回は CI で定期的にチェックするようにする。
また、[trivy](https://github.com/knqyf263/trivy) で脆弱性のテストができるので、これも組み込んでみる。

###### CONTENTS

1. [できあがったもの](#outcome)
1. [dockle でテストする](#test-by-dockle)
1. [trivy でテストする](#test-by-trivy)
1. [merge-request でテストする](#test-on-merge-request)
1. [定期的にテストする](#test-every-period)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- GitLab
- dockle : v0.1.14
- trivy : 0.1.4


<a id="outcome"></a>
### できあがったもの

.gitlab-ci.yml

```yaml
test:
  only:
    - merge_requests

  image: docker:stable

  variables:
    DOCKER_HOST: tcp://docker:2375/
    DOCKER_DRIVER: overlay2
    DOCKER_CONTENT_TRUST: 1
  services:
    - docker:dind

  cache:
    paths:
      - .cache

  before_script:
    - ./bin/install_ci_tools.sh
  script:
    - ./bin/test.sh
```

bin/install_ci_tools.sh

```bash
#!/bin/sh

apk -Uuv add bash git curl tar sed grep && \
./bin/install_dockle.sh && \
./bin/install_trivy.sh && \
:
```

bin/install_dockle.sh

```bash
#!/bin/bash

VERSION=$(
  curl --silent "https://api.github.com/repos/goodwithtech/dockle/releases/latest" | \
  grep '"tag_name":' | \
  sed -E 's/.*"v([^"]+)".*/\1/' \
) && \
curl -L -o dockle.tar.gz https://github.com/goodwithtech/dockle/releases/download/v${VERSION}/dockle_${VERSION}_Linux-64bit.tar.gz && \
tar zxvf dockle.tar.gz && \
mv dockle /usr/bin && \
:
```

bin/install_trivy.sh

```bash
#!/bin/bash

VERSION=$(
  curl --silent "https://api.github.com/repos/knqyf263/trivy/releases/latest" | \
  grep '"tag_name":' | \
  sed -E 's/.*"v([^"]+)".*/\1/' \
) && \
curl -L -o trivy.tar.gz https://github.com/knqyf263/trivy/releases/download/v${VERSION}/trivy_${VERSION}_Linux-64bit.tar.gz && \
tar zxvf trivy.tar.gz && \
mv trivy /usr/bin && \
:
```

bin/test.sh

```bash
#!/bin/bash

set -x

export HOME=$(pwd)

image=ci/build

docker build -t $image:${CI_COMMIT_SHORT_SHA} . && \
dockle --exit-code 1 $image:${CI_COMMIT_SHORT_SHA} && \
trivy --exit-code 1 --quiet --auto-refresh $image:${CI_COMMIT_SHORT_SHA} && \
:
```


[TOP](#top)
<a id="test-by-dockle"></a>
### dockle でテストする

dockle は docker サービスを必要とするので、そのための設定を .gitlab-ci.yml に追加する。

```yaml
test:
  only:
    - merge_requests

  image: docker:stable

  variables:
    DOCKER_HOST: tcp://docker:2375/
    DOCKER_DRIVER: overlay2
    DOCKER_CONTENT_TRUST: 1
  services:
    - docker:dind

  before_script:
    - ./bin/install_ci_tools.sh
  script:
    - ./bin/test.sh
```

`before_script` で必要なツールをインストールする。
ここでは dockle に必要なパッケージの追加と dockle のダウンロードを行う。

bin/install_ci_tools.sh

```bash
#!/bin/sh

apk -Uuv add bash git curl tar sed grep && \
./bin/install_dockle.sh && \
:
```

`bin/install_ci_tools.sh` の起動時には `bash` が存在しない。
このため、`#!/bin/bash` と書くと「`bin/install_ci_tools.sh` が見つからない」というエラーが出るので注意。

bin/install_dockle.sh

```bash
#!/bin/bash

VERSION=$(
  curl --silent "https://api.github.com/repos/goodwithtech/dockle/releases/latest" | \
  grep '"tag_name":' | \
  sed -E 's/.*"v([^"]+)".*/\1/' \
) && \
curl -L -o dockle.tar.gz https://github.com/goodwithtech/dockle/releases/download/v${VERSION}/dockle_${VERSION}_Linux-64bit.tar.gz && \
tar zxvf dockle.tar.gz && \
mv dockle /usr/bin && \
:
```

`script` で docker イメージのビルドと dockle でのチェックを行う。

bin/test.sh

```bash
#!/bin/bash

set -x

image=ci/build

docker build -t $image:${CI_COMMIT_SHORT_SHA} . && \
dockle --exit-code 1 $image:${CI_COMMIT_SHORT_SHA} && \
:
```

ここで指定する `$image` は単に dockle でビルドしたイメージを参照するためのものなので、どんな名前でも良い。


[TOP](#top)
<a id="test-by-trivy"></a>
### trivy でテストする

trivy の設定は dockle のものとほとんど同じ。
trivy は `$HOME/.cache` にキャッシュを作成するので、そのための `cache` 設定を追加する。

```yaml
test:
  only:
    - merge_requests

  image: docker:stable

  variables:
    DOCKER_HOST: tcp://docker:2375/
    DOCKER_DRIVER: overlay2
    DOCKER_CONTENT_TRUST: 1
  services:
    - docker:dind

  cache:
    paths:
      - .cache

  before_script:
    - ./bin/install_ci_tools.sh
  script:
    - ./bin/test.sh
```

`before_script` で必要なツールをインストールする。

bin/install_ci_tools.sh

```bash
#!/bin/sh

apk -Uuv add bash git curl tar sed grep && \
./bin/install_trivy.sh && \
:
```

bin/install_trivy.sh

```bash
#!/bin/bash

VERSION=$(
  curl --silent "https://api.github.com/repos/knqyf263/trivy/releases/latest" | \
  grep '"tag_name":' | \
  sed -E 's/.*"v([^"]+)".*/\1/' \
) && \
curl -L -o trivy.tar.gz https://github.com/knqyf263/trivy/releases/download/v${VERSION}/trivy_${VERSION}_Linux-64bit.tar.gz && \
tar zxvf trivy.tar.gz && \
mv trivy /usr/bin && \
:
```

`script` で docker イメージのビルドと trivy でのチェックを行う。

bin/test.sh

```bash
#!/bin/bash

set -x

export HOME=$(pwd)

image=ci/build

docker build -t $image:${CI_COMMIT_SHORT_SHA} . && \
trivy --exit-code 1 --quiet --auto-refresh $image:${CI_COMMIT_SHORT_SHA} && \
:
```

trivy の `--quiet` はインジケータの表示を抑制するもので、`--auto-refresh` は脆弱性データベースの更新を行うもの。

trivy は `$HOME/.cache` にキャッシュを作成する。
GitLab は `cache` を設定することで指定したパスに生成されたものを job をまたいで再利用できる。
しかし、これはプロジェクトの中のディレクトリのみが対象となっている。
具体的にはビルド開始時のディレクトリ以下のファイルだ。

- [gitlab ci cache no matching files : stackoverflow](https://stackoverflow.com/questions/53953122/gitlab-ci-cache-no-matching-files)

たとえば、`cache:paths` に `/root/.cache` を設定しても GitLab は保存してくれない。
そこで、HOME を再設定することで `./.cache` がキャッシュとして使用されるようにしている。


[TOP](#top)
<a id="test-on-merge-request"></a>
### merge-request でテストする

以下の例のように設定することで merge-request でテストが走るようになる。

.gitlab-ci.yml

```yaml
test:
  only:
    - merge_requests

  image: docker:stable

  variables:
    DOCKER_HOST: tcp://docker:2375/
    DOCKER_DRIVER: overlay2
    DOCKER_CONTENT_TRUST: 1
  services:
    - docker:dind

  cache:
    paths:
      - .cache

  before_script:
    - ./bin/install_ci_tools.sh
  script:
    - ./bin/test.sh
```


[TOP](#top)
<a id="test-every-period"></a>
### 定期的にテストする

dockle にベストプラクティスのチェックが追加されたり、新たな脆弱性が trivy で検出されるようになったりするはず。
なので、定期的にこのテストを行いたい。

```yaml
schedule_test:
  only:
    - schedules

  image: docker:stable

  variables:
    DOCKER_HOST: tcp://docker:2375/
    DOCKER_DRIVER: overlay2
    DOCKER_CONTENT_TRUST: 1
  services:
    - docker:dind

  cache:
    paths:
      - .cache

  before_script:
    - ./bin/install_ci_tools.sh
  script:
    - ./bin/test.sh
```

`only` に `schedules` を指定して、スケジュールからの起動でのみ pipeline が走るようにする。
先の `test` の例と異なるのは `only: - schedules` の部分のみだ。
あとは、GitLab の設定画面からスケジュールを追加すれば OK。


[TOP](#top)
<a id="postscript"></a>
### まとめ

dockle と trivy を CI に組み込んでみた。
これで定期的に dockle と trivy によるチェックができるようになった。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [goodwithtech/dockle : GitHub](https://github.com/goodwithtech/dockle)
- [knqyf263/trivy : GitHub](https://github.com/knqyf263/trivy)
- [gitlab ci cache no matching files : stackoverflow](https://stackoverflow.com/questions/53953122/gitlab-ci-cache-no-matching-files)


[TOP](#top)
