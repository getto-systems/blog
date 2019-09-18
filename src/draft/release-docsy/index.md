# Docsy で書いたドキュメントを公開する
<a id="top"></a>

Docsy を使用して書いたドキュメントを S3 + CloudFront で公開する。

###### CONTENTS

1. [S3 + CloudFront で公開する方針](#strategy)
1. [baseURL の設定](#setup-base-url)
1. [ルートコンテンツの作成](#setup-root)
1. [favicon の設定](#setup-favicon)
1. [find-next-version セットアップ](#setup-find-next-version)
1. [permalink 調整](#arrange-permalink)
1. [更新日設定スクリプト](#modify-date)
1. [GitLab Pipeline で S3 にアップロード](#init-submodules-on-gitlab)
1. [Lambda@Edge セットアップ](#setup-lambda-edge)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### SOURCES

- [getto-systems/docs : GitHub](https://github.com/getto-systems/docs)
- [げっとシステム : Tools](https://docs.getto.systems)


<a id="strategy"></a>
### S3 + CloudFront で公開する方針

以下の方針で S3 + CloudFront で公開する。

- バージョンごとに `/x.x.x/*` へデプロイして、そのあとは基本的に変更しない
- `/index.html` と `/x.x.x/*.html` で、最新バージョンにリダイレクトする js を仕込む

これによって、`/x.x.x/*` のファイルは永遠にキャッシュできる。
ただし、新しいバージョンへのリダイレクトは js で行うので、この絡みで過去のファイルの変更が必要になる可能性もある。


[TOP](#top)
<a id="setup-base-url"></a>
### baseURL の設定

内容の確認を、開発時は `/dev/*` で、本番環境では `/x.x.x/*` でアクセスできるようにする必要がある。

このために `baseURL` をうまく設定してやる必要がある。

```toml
baseURL = "https://docs.getto.systems/dev/"
```

baseURL には本番で使用する URL を指定する。
単に `"/dev/"` だけではうまくいかなかった。

この例では末尾が `/dev/` だが、本番の設定ではここは最新のバージョン番号に変更したい。
そこで、デプロイスクリプトで変更することにする。

```bash
sed -i \
  -e 's|baseURL = "https://\([^/]\+\)/dev/"|baseURL = "https://\1/'"$version"'/"|' \
  config.toml
```

これでバージョンごとのパスを使用できる。


[TOP](#top)
<a id="setup-root"></a>
### ルートコンテンツの作成

バージョンごとにデプロイするが、サイトのルートにもコンテンツが必要になる。

`root` ディレクトリを作成して、この中に以下のファイルを作成する。

- index.html

```html
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">

<title>DOCS | GETTO.systems</title>

<script defer src="/js/find-next-version.min.js"></script>
<script defer src="/js/redirect.js"></script>

</head>
<body>

<h1>Documents</h1>

<footer>GETTO systems</footer>
</body>
</html>
```

内容はほとんどないが、js によって最新バージョンにリダイレクトする。
トップページの体裁が気になるなら整えれば良い。

find-next-version.min.js は、以下の手順でインストールする。

```bash
npm install --save-dev find-next-version
cp node_modules/find-next-version/dist/find-next-version.min.js root/js/
```

redirect.js は以下の内容で設置する。

```javascript
(function(info) {
  FindNextVersion.find({ from: info.version, url: FindNextVersion.url.index }).then(function(version) {
    location.href = "/" + version + "/" + info.path + location.search;
  });
})(FindNextVersion.parse_pathname(location.pathname));
```

- location.pathname から現在のバージョンを取得
- `/x.x.x/index.html` が存在するか確認
- 新しいバージョンが見つかったらリダイレクト


[TOP](#top)
<a id="setup-favicon"></a>
### favicon の設定

本番にデプロイするなら favicon も用意したい。
[ドキュメント](https://www.docsy.dev/docs/adding-content/iconsimages/)によれば、[適当なジェネレーター](http://cthedot.de/icongen/)で作成して、`/static/favicons/` に配置すれば良い。

また、`favicon.ico` を以下のパスにもコピーしておく。

- root/favicon.ico
- root/favicons/favicon.ico

これはルートの `index.html` にアクセスすると `/favicon.ico` が要求されるため。
また、`/x.x.x/*.html` にアクセスするとなぜか `/favicons/favicon.ico` が要求されるため。


[TOP](#top)
<a id="setup-find-next-version"></a>
### find-next-version セットアップ

すべての html に、`redirect.js` を仕込みたい。
テンプレートを見ると、`layouts/partials/head-css.html` に仕込むのが良さそう。

このファイルに、以下の内容を追記する。

```html
{{ if eq (getenv "HUGO_ENV") "production" }}
<script src="/js/find-next-version.min.js" defer></script>
<script src="/js/redirect.js" defer></script>
{{ end }}
```

これで、`HUGO_ENV` が `production` である場合に、リダイレクトの処理を行うようになる。

ここで、パスはルートからのパスにする。

本来は `/x.x.x/js/` にしたいところ。
以下のように書くとできそうに見える。

```html
<script src="{{ "js/find-next-version.min.js" }}" defer></script>
```

が、`/x.x.x/docs/docs/` のようにネストしている場合、相対パスとして解決されてうまくいかなかった。


[TOP](#top)
<a id="arrange-permalink"></a>
### permalink 調整

デフォルトではパーマリンクに `:slug` が入っているため、生成されたコンテンツのパスに日本語が含まれてしまう。

S3 にアップロードする際文句を言われるので、この部分を `:filename` にした。


[TOP](#top)
<a id="modify-date"></a>
### 更新日設定スクリプト

config.toml で以下のように設定する。

```toml
enableGitInfo = false
```

こうすると git の情報から最終更新日が設定*されない*。

この設定で最終更新日がうまく設定できれば使ったのだけれど、何かうまくいっていないようなので OFF にした。
（要検証）

そこで、更新日を設定するスクリプトを設置した。

```bash
#!/bin/bash

set_content_date(){
  local file
  local attr
  local date

  for file in $(git grep GETTO_DOCS_CONTENT_DATE | sed 's/:.*//'); do
    if [ "$(git grep -e "^---\$" -n $file | wc -l)" -gt 1 ]; then
      attr=$(git grep -e "^---\$" -n $file | head -2 | tail -1 | cut -d':' -f2)
      date=$(git log -1 --format=%ad --date=short $file)
      sed -i -e "1,$attr s|GETTO_DOCS_CONTENT_DATE|$date|" $file
    fi
  done
}

set_content_date
```

- `---` で区切られている部分の GETTO_DOCS_CONTENT_DATE を git の最終更新日に置換

これで日付部分に `GETTO_DOCS_CONTENT_DATE` と書いておくと、デプロイ時に置換される。


[TOP](#top)
<a id="init-submodules-on-gitlab"></a>
### GitLab Pipeline で S3 にアップロード

まず、`root` ディレクトリの中身はルート直下にアップロードしておく。

```bash
#!/bin/bash

build_main(){
  local version
  local metadata

  export AWS_ACCESS_KEY_ID=<ACCESS-KEY-ID>
  export AWS_SECRET_ACCESS_KEY=<SECRET-ACCESS-KEY>

  metadata=$(node metadata.js)

  cd root

  for file in *; do
    if [ -d $file ]; then
      opt="--recursive"
    else
      opt=""
    fi
    aws s3 cp \
      --acl private \
      --cache-control "public, max-age=86400" \
      --metadata "$metadata" \
      $opt \
      $file s3://DOMAIN/$file
  done
}

build_main
```

本番用にコンテンツを生成するには `hugo` コマンドを実行する。
ここでは、さらに環境変数 `HUGO_ENV` も設定する必要がある。

コンテンツを生成したら S3 にアップロードする。

```bash
#!/bin/bash

deploy_main(){
  local version
  local domain
  local metadata
  local file

  version=$(cat .release-version)

  ./bin/set_content_date.sh

  sed -i \
    -e 's|baseURL = "https://\([^/]\+\)/dev/"|baseURL = "https://\1/'"$version"'/"|' \
    -e 's|GCS-ENGINE-ID|'"$GCS_ENGINE_ID"'|' \
    config.toml

  domain=$(grep "baseURL" config.toml | sed -e 's|.*baseURL = "https://\([^/]\+\)/.*|\1|')

  export HUGO_ENV=production
  hugo -EF -e production

  metadata=$(node metadata.js)

  aws s3 cp \
    --acl private \
    --cache-control "public, max-age=31536000" \
    --metadata "$metadata" \
    --recursive \
    public s3://$domain/$version

  for file in robots.txt sitemap.xml; do
    aws s3 cp \
      --acl private \
      --cache-control "public, max-age=86400" \
      --metadata "$metadata" \
      public/$file s3://$domain/$file
  done
}

deploy_main
```

- `/x.x.x/*` は１年、ルート直下のファイルは１日キャッシュする

S3 のメタデータは以下の内容。

```javascript
const headers = {
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": [
    "default-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "img-src " + [
      "https://www.google.com/cse/static/css/",
      "https://www.google.com/cse/static/images/",
      "https://www.google.com/images/",
      "https://www.googleapis.com/",
      "https://clients1.google.com/",
      "https://ssl.gstatic.com/ui/",
      "'self'",
    ].join(" "),
    "font-src " + [
      "https://fonts.gstatic.com/",
      "'self'",
    ].join(" "),
    "script-src " + [
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/",
      "https://stackpath.bootstrapcdn.com/bootstrap/",
      "https://code.jquery.com/",
      "https://cse.google.com/cse.js",
      "https://cse.google.com/cse/element/",
      "https://cse.google.com/adsense/search/",
      "https://www.google.com/cse/static/element/",
      "'self'",
      "'unsafe-eval'",
      "'sha256-bimIMyRXEP/oybxalWcIAhSYpbLihuUf1RiqrHsg1wA='",
    ].join(" "),
    "style-src " + [
      "https://fonts.googleapis.com/",
      "https://www.google.com/cse/static/element/",
      "https://www.google.com/cse/static/style/look/",
      "'self'",
      "'unsafe-inline'",
    ].join(" "),
  ].join(";"),
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-xss-protection": "1; mode=block",
  "referrer-policy": "same-origin",
};

console.log(JSON.stringify(Object.keys(headers).reduce((acc,key) => {
  acc["header-" + key] = headers[key];
  return acc;
}, {})));
```

- `header-` をつけて追加したいヘッダを設定しておく

このデプロイスクリプトを GitLab の Pipeline で実行する。

GitLab でサブモジュールを init するには、以下の変数を設定しておく必要がある。

```yaml
variables:
  GIT_SUBMODULE_STRATEGY: recursive
```

これで、GitLab の Pipeline でデプロイできる。


[TOP](#top)
<a id="setup-lambda-edge"></a>
### Lambda@Edge セットアップ

S3 + CloudFront でコンテンツを配信する際に、以下の Lambda が必要。

- メタデータからヘッダを追加する
- `*/` へのリクエストを `*/index.html` としてオリジンにリクエストする

response-header.js : Origin Response に設定する。

```javascript
'use strict';

exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    let headers = response.headers;

    Object.keys(headers).forEach((raw) => {
        const lower = raw.toLowerCase();
        const pattern = /^x-amz-meta-header-/;
        if (lower.match(pattern)) {
            const key = lower.replace(pattern, "");
            headers[key] = [{
                key: key,
                value: headers[raw][0].value,
            }];
        }
    });

    return response;
};
```

request-directory-index.js : Origin Request に設定する。

```javascript
'use strict';

exports.handler = async (event) => {
    let request = event.Records[0].cf.request;
    request.uri = request.uri.replace(/\/$/, '/index.html');
    return request;
};
```

CloudFront にこれらの Lambda を設定して完了。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Docsy を使用して書いたドキュメントを S3 + CloudFront で公開する方法をまとめた。

結局、Lambda@Edge が必要なんだな…。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Adding Content : Docsy](https://www.docsy.dev/docs/adding-content/content/)
- [URL Management : Docsy](https://gohugo.io/content-management/urls/)
- [Hugo Deploy : Hugo Docs](https://gohugo.io/hosting-and-deployment/hugo-deploy/)
- [icongen](http://cthedot.de/icongen/)
- [Using Git submodules with GitLab CI : GitLab Docs](https://docs.gitlab.com/ee/ci/git_submodules.html)
- [aws s3 cp : AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/cp.html)


[TOP](#top)
